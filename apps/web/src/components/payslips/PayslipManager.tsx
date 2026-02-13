import React, { useState, useEffect } from 'react';
import {
    generatePayslipPDF,
    generatePayslipsForRun,
    downloadPayslip,
    type GeneratedPayslip,
    type CompanyInfo
} from '../../lib/documents';
import { getPayrollItems } from '../../lib/payroll';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type PayrollItem = Database['public']['Tables']['payroll_items']['Row'] & {
    employees?: Database['public']['Tables']['employees']['Row'];
};

interface PayslipRecord {
    id: string;
    payroll_item_id: string;
    employee_id: string;
    file_url: string | null;
    file_name: string | null;
    email_sent: boolean;
}

interface PayslipManagerProps {
    payrollRunId: string;
    company: CompanyInfo;
    month: string;
    year: number;
}

export function PayslipManager({ payrollRunId, company, month, year }: PayslipManagerProps) {
    const [items, setItems] = useState<PayrollItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // In-memory blobs for freshly generated payslips
    const [generatedPayslips, setGeneratedPayslips] = useState<Map<string, GeneratedPayslip>>(new Map());

    // DB records of persisted payslips (survive refresh)
    const [payslipRecords, setPayslipRecords] = useState<Map<string, PayslipRecord>>(new Map());

    // Preview modal
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');

    // Email sending
    const [sendingEmail, setSendingEmail] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadItems();
    }, [payrollRunId]);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    async function loadItems() {
        setLoading(true);
        try {
            const data = await getPayrollItems(payrollRunId);
            setItems(data as PayrollItem[]);

            // Load existing payslip records from DB
            const { data: records } = await supabase
                .from('payslips')
                .select('*')
                .in('payroll_item_id', data.map((d: any) => d.id));

            if (records && records.length > 0) {
                const map = new Map<string, PayslipRecord>();
                for (const r of records) {
                    map.set(r.payroll_item_id, r as PayslipRecord);
                }
                setPayslipRecords(map);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payroll items');
        } finally {
            setLoading(false);
        }
    }

    /** Upload payslip blob to Supabase Storage and record in payslips table */
    async function persistPayslip(payslip: GeneratedPayslip, item: PayrollItem) {
        const storagePath = `payslips/${payrollRunId}/${payslip.filename}`;

        // Upload to storage
        const { error: uploadErr } = await supabase.storage
            .from('documents')
            .upload(storagePath, payslip.blob, {
                contentType: 'application/pdf',
                upsert: true,
            });

        if (uploadErr) throw uploadErr;

        // Create signed URL (24h)
        const { data: signedData } = await supabase.storage
            .from('documents')
            .createSignedUrl(storagePath, 86400);

        const fileUrl = signedData?.signedUrl || storagePath;

        // Upsert into payslips table
        const { data: record, error: upsertErr } = await supabase
            .from('payslips')
            .upsert({
                payroll_item_id: item.id,
                employee_id: item.employee_id,
                file_url: storagePath, // store path, not signed URL
                file_name: payslip.filename,
                is_password_protected: true,
            }, { onConflict: 'payroll_item_id' })
            .select()
            .single();

        if (upsertErr) throw upsertErr;

        // Update local state
        if (record) {
            setPayslipRecords(prev => new Map(prev).set(item.id, record as PayslipRecord));
        }
    }

    async function handleGenerateSingle(item: PayrollItem) {
        if (!item.employees) return;

        setGenerating(true);
        setError(null);
        try {
            const payslip = await generatePayslipPDF({
                employee: item.employees,
                payrollItem: item,
                company,
                month,
                year,
                paymentDate: new Date().toLocaleDateString('en-IN'),
            });

            setGeneratedPayslips(prev => new Map(prev).set(item.id, payslip));

            // Persist to storage + DB
            await persistPayslip(payslip, item);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate payslip');
        } finally {
            setGenerating(false);
        }
    }

    async function handleGenerateAll() {
        setGenerating(true);
        setError(null);
        try {
            const payslips = await generatePayslipsForRun(payrollRunId, company);
            const map = new Map<string, GeneratedPayslip>();

            for (let i = 0; i < items.length; i++) {
                if (payslips[i]) {
                    map.set(items[i].id, payslips[i]);
                    // Persist each one
                    await persistPayslip(payslips[i], items[i]);
                }
            }

            setGeneratedPayslips(map);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate payslips');
        } finally {
            setGenerating(false);
        }
    }

    /** Download a payslip: use in-memory blob if available, else fetch from storage */
    async function handleDownload(itemId: string) {
        // Try in-memory first
        const payslip = generatedPayslips.get(itemId);
        if (payslip) {
            downloadPayslip(payslip);
            return;
        }

        // Fetch from storage
        const record = payslipRecords.get(itemId);
        if (!record?.file_url) return;

        try {
            const { data, error: dlErr } = await supabase.storage
                .from('documents')
                .download(record.file_url);

            if (dlErr || !data) throw dlErr || new Error('Download failed');

            const url = URL.createObjectURL(data);
            const a = document.createElement('a');
            a.href = url;
            a.download = record.file_name || 'payslip.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download payslip');
        }
    }

    function handleDownloadAll() {
        const allItemIds = items.filter(i => generatedPayslips.has(i.id) || payslipRecords.has(i.id));
        for (const item of allItemIds) {
            handleDownload(item.id);
        }
    }

    /** Preview a payslip in a modal */
    async function handlePreview(itemId: string) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        // Try in-memory blob first
        const payslip = generatedPayslips.get(itemId);
        if (payslip) {
            const url = URL.createObjectURL(payslip.blob);
            setPreviewUrl(url);
            const item = items.find(i => i.id === itemId);
            setPreviewTitle(item?.employees?.name ? `Payslip — ${item.employees.name}` : 'Payslip Preview');
            return;
        }

        // Fetch from storage
        const record = payslipRecords.get(itemId);
        if (!record?.file_url) return;

        try {
            const { data, error: dlErr } = await supabase.storage
                .from('documents')
                .download(record.file_url);

            if (dlErr || !data) throw dlErr || new Error('Download failed');

            const url = URL.createObjectURL(data);
            setPreviewUrl(url);
            const item = items.find(i => i.id === itemId);
            setPreviewTitle(item?.employees?.name ? `Payslip — ${item.employees.name}` : 'Payslip Preview');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to preview payslip');
        }
    }

    function closePreview() {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setPreviewTitle('');
    }

    async function handleSendEmail(item: PayrollItem) {
        const payslip = generatedPayslips.get(item.id);

        // Need either in-memory blob or storage record
        if (!payslip && !payslipRecords.has(item.id)) {
            setError('Generate the payslip first.');
            return;
        }

        if (!item.employees?.email) {
            setError('Employee has no email address.');
            return;
        }

        setSendingEmail(prev => new Set(prev).add(item.id));
        setError(null);
        setSuccessMsg(null);

        try {
            let base64Content: string;

            if (payslip) {
                // Use in-memory blob
                const reader = new FileReader();
                const b64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(payslip.blob);
                base64Content = await b64Promise;
            } else {
                // Fetch from storage
                const record = payslipRecords.get(item.id)!;
                const { data, error: dlErr } = await supabase.storage
                    .from('documents')
                    .download(record.file_url!);
                if (dlErr || !data) throw dlErr || new Error('Download failed');

                const reader = new FileReader();
                const b64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                });
                reader.readAsDataURL(data);
                base64Content = await b64Promise;
            }

            const filename = payslip?.filename || payslipRecords.get(item.id)?.file_name || 'payslip.pdf';

            const { error: fnError } = await supabase.functions.invoke('send-payslip-email', {
                body: {
                    to: item.employees.email,
                    employeeName: item.employees.name,
                    companyName: company.name,
                    month,
                    year,
                    filename,
                    pdfBase64: base64Content,
                },
            });

            if (fnError) throw fnError;

            // Update email_sent in DB
            const record = payslipRecords.get(item.id);
            if (record) {
                await supabase
                    .from('payslips')
                    .update({ email_sent: true, email_sent_at: new Date().toISOString() })
                    .eq('id', record.id);
            }

            setSuccessMsg(`Payslip emailed to ${item.employees.email}`);
            setTimeout(() => setSuccessMsg(null), 4000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send email.');
        } finally {
            setSendingEmail(prev => {
                const next = new Set(prev);
                next.delete(item.id);
                return next;
            });
        }
    }

    async function handleSendAllEmails() {
        const eligible = items.filter(
            item => (generatedPayslips.has(item.id) || payslipRecords.has(item.id)) && item.employees?.email
        );
        if (eligible.length === 0) {
            setError('No payslips with employee emails found. Generate payslips first.');
            return;
        }
        for (const item of eligible) {
            await handleSendEmail(item);
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    /** Check if a payslip exists for this item (in memory or in DB) */
    function hasPayslip(itemId: string): boolean {
        return generatedPayslips.has(itemId) || payslipRecords.has(itemId);
    }

    const totalGenerated = items.filter(i => hasPayslip(i.id)).length;

    return (
        <div className="payslip-manager">
            <div className="payslip-header">
                <h2>Payslips — {month} {year}</h2>
                <div className="actions" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleGenerateAll}
                        className="btn btn-secondary"
                        disabled={generating}
                    >
                        {generating ? '⏳ Generating...' : '📄 Generate All'}
                    </button>
                    {totalGenerated > 0 && (
                        <>
                            <button onClick={handleDownloadAll} className="btn btn-primary">
                                ⬇ Download All ({totalGenerated})
                            </button>
                            <button
                                onClick={handleSendAllEmails}
                                className="btn btn-primary"
                                style={{ background: '#059669' }}
                            >
                                📧 Email All
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMsg && (
                <div style={{
                    padding: '0.75rem 1rem',
                    background: '#ecfdf5',
                    border: '1px solid #6ee7b7',
                    borderRadius: '8px',
                    color: '#065f46',
                    marginBottom: '1rem',
                }}>
                    ✅ {successMsg}
                </div>
            )}

            {loading && <div className="loading">Loading payroll items...</div>}

            {!loading && (
                <table className="payslip-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Gross</th>
                            <th>Net</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const generated = hasPayslip(item.id);
                            const isSending = sendingEmail.has(item.id);
                            const emailSent = payslipRecords.get(item.id)?.email_sent;
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <div className="employee-info">
                                            <strong>{item.employees?.name || 'Unknown'}</strong>
                                            <span className="email">{item.employees?.email}</span>
                                        </div>
                                    </td>
                                    <td>{formatCurrency(item.gross_salary || 0)}</td>
                                    <td className="net-salary">{formatCurrency(item.net_salary || 0)}</td>
                                    <td>
                                        <span className={`status-badge ${generated ? 'status-generated' : 'status-pending'}`}>
                                            {generated ? '✅ Generated' : '⏳ Pending'}
                                        </span>
                                        {emailSent && (
                                            <span style={{
                                                display: 'inline-block',
                                                marginLeft: '0.5rem',
                                                fontSize: '0.75rem',
                                                color: '#059669',
                                            }}>📧 Sent</span>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {generated ? (
                                                <>
                                                    <button
                                                        onClick={() => handlePreview(item.id)}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        👁 Preview
                                                    </button>
                                                    <button
                                                        onClick={() => handleDownload(item.id)}
                                                        className="btn btn-sm btn-primary"
                                                    >
                                                        ⬇ Download
                                                    </button>
                                                    <button
                                                        onClick={() => handleSendEmail(item)}
                                                        className="btn btn-sm"
                                                        style={{ background: '#059669', color: 'white', border: 'none' }}
                                                        disabled={isSending || !item.employees?.email}
                                                        title={!item.employees?.email ? 'No email address' : 'Send payslip via email'}
                                                    >
                                                        {isSending ? '⏳ Sending...' : '📧 Email'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => handleGenerateSingle(item)}
                                                    className="btn btn-sm"
                                                    disabled={generating}
                                                >
                                                    {generating ? '⏳' : '📄'} Generate
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {/* Password Info */}
            <div className="password-info">
                <h4>📄 PDF Password Format</h4>
                <p>
                    Password = PAN (lowercase) + DOB (DDMMYYYY)<br />
                    Example: For PAN "ABCDE1234F" and DOB "15 Jan 1990" → <code>abcde1234f15011990</code>
                </p>
            </div>

            {/* Preview Modal */}
            {previewUrl && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0,0,0,0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    onClick={closePreview}
                >
                    <div
                        style={{
                            background: 'white',
                            borderRadius: '12px',
                            width: '90%',
                            maxWidth: '800px',
                            height: '85vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1rem 1.5rem',
                            borderBottom: '1px solid #e5e7eb',
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{previewTitle}</h3>
                            <button
                                onClick={closePreview}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                                onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                            >
                                ✕
                            </button>
                        </div>
                        <iframe
                            src={previewUrl}
                            style={{ flex: 1, border: 'none', width: '100%' }}
                            title="Payslip Preview"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default PayslipManager;
