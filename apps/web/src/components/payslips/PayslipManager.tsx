import React, { useState, useEffect } from 'react';
import {
    generatePayslipPDF,
    generatePayslipsForRun,
    downloadPayslip,
    type GeneratedPayslip,
    type CompanyInfo
} from '../../lib/documents';
import { getPayrollItems } from '../../lib/payroll';
import type { Database } from '../../types/supabase';

type PayrollItem = Database['public']['Tables']['payroll_items']['Row'] & {
    employees?: Database['public']['Tables']['employees']['Row'];
};

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
    const [generatedPayslips, setGeneratedPayslips] = useState<Map<string, GeneratedPayslip>>(new Map());
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadItems();
    }, [payrollRunId]);

    async function loadItems() {
        setLoading(true);
        try {
            const data = await getPayrollItems(payrollRunId);
            setItems(data as PayrollItem[]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payroll items');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerateSingle(item: PayrollItem) {
        if (!item.employees) return;

        setGenerating(true);
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate payslip');
        } finally {
            setGenerating(false);
        }
    }

    async function handleGenerateAll() {
        setGenerating(true);
        try {
            const payslips = await generatePayslipsForRun(payrollRunId, company);
            const map = new Map<string, GeneratedPayslip>();
            items.forEach((item, index) => {
                if (payslips[index]) {
                    map.set(item.id, payslips[index]);
                }
            });
            setGeneratedPayslips(map);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate payslips');
        } finally {
            setGenerating(false);
        }
    }

    function handleDownload(itemId: string) {
        const payslip = generatedPayslips.get(itemId);
        if (payslip) {
            downloadPayslip(payslip);
        }
    }

    function handleDownloadAll() {
        generatedPayslips.forEach(payslip => {
            downloadPayslip(payslip);
        });
    }

    function toggleSelect(itemId: string) {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    }

    function toggleSelectAll() {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(i => i.id)));
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="payslip-manager">
            <div className="payslip-header">
                <h2>Payslips - {month} {year}</h2>
                <div className="actions">
                    <button
                        onClick={handleGenerateAll}
                        className="btn btn-secondary"
                        disabled={generating}
                    >
                        {generating ? 'Generating...' : 'Generate All'}
                    </button>
                    {generatedPayslips.size > 0 && (
                        <button onClick={handleDownloadAll} className="btn btn-primary">
                            Download All ({generatedPayslips.size})
                        </button>
                    )}
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading && <div className="loading">Loading payroll items...</div>}

            {!loading && (
                <table className="payslip-table">
                    <thead>
                        <tr>
                            <th>
                                <input
                                    type="checkbox"
                                    checked={selectedItems.size === items.length}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th>Employee</th>
                            <th>Gross</th>
                            <th>Net</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => {
                            const hasPayslip = generatedPayslips.has(item.id);
                            return (
                                <tr key={item.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.has(item.id)}
                                            onChange={() => toggleSelect(item.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="employee-info">
                                            <strong>{item.employees?.name || 'Unknown'}</strong>
                                            <span className="email">{item.employees?.email}</span>
                                        </div>
                                    </td>
                                    <td>{formatCurrency(item.gross_salary || 0)}</td>
                                    <td className="net-salary">{formatCurrency(item.net_salary || 0)}</td>
                                    <td>
                                        <span className={`status-badge ${hasPayslip ? 'status-generated' : 'status-pending'}`}>
                                            {hasPayslip ? 'Generated' : 'Pending'}
                                        </span>
                                    </td>
                                    <td>
                                        {hasPayslip ? (
                                            <>
                                                <button
                                                    onClick={() => handleDownload(item.id)}
                                                    className="btn btn-sm btn-primary"
                                                >
                                                    Download
                                                </button>
                                                <button className="btn btn-sm btn-secondary">
                                                    Preview
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateSingle(item)}
                                                className="btn btn-sm"
                                                disabled={generating}
                                            >
                                                Generate
                                            </button>
                                        )}
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
        </div>
    );
}

export default PayslipManager;
