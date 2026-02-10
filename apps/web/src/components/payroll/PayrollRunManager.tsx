import React, { useState, useEffect } from 'react';
import {
    runPayroll,
    getPayrollRuns,
    getPayrollItems,
    updatePayrollStatus,
    type PayrollRunResult
} from '../../lib/payroll';
import type { Database } from '../../types/supabase';

type PayrollRun = Database['public']['Tables']['payroll_runs']['Row'];
type PayrollItem = Database['public']['Tables']['payroll_items']['Row'];

interface PayrollRunManagerProps {
    companyId: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export function PayrollRunManager({ companyId }: PayrollRunManagerProps) {
    const [runs, setRuns] = useState<PayrollRun[]>([]);
    const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
    const [items, setItems] = useState<PayrollItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // New payroll form
    const [showNewForm, setShowNewForm] = useState(false);
    const [newMonth, setNewMonth] = useState(new Date().getMonth() + 1);
    const [newYear, setNewYear] = useState(new Date().getFullYear());

    useEffect(() => {
        loadRuns();
    }, [companyId]);

    async function loadRuns() {
        setLoading(true);
        try {
            const data = await getPayrollRuns(companyId);
            setRuns(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payroll runs');
        } finally {
            setLoading(false);
        }
    }

    async function handleRunPayroll() {
        setLoading(true);
        setError(null);
        try {
            const result = await runPayroll({
                companyId,
                month: newMonth,
                year: newYear,
            });
            setRuns([result.payrollRun, ...runs]);
            setShowNewForm(false);
            setSelectedRun(result.payrollRun);
            setItems(result.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to run payroll');
        } finally {
            setLoading(false);
        }
    }

    async function handleViewRun(run: PayrollRun) {
        setSelectedRun(run);
        setLoading(true);
        try {
            const data = await getPayrollItems(run.id);
            setItems(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load payroll items');
        } finally {
            setLoading(false);
        }
    }

    async function handleUpdateStatus(status: 'draft' | 'processing' | 'completed' | 'paid') {
        if (!selectedRun) return;
        try {
            await updatePayrollStatus(selectedRun.id, status);
            setSelectedRun({ ...selectedRun, status });
            setRuns(runs.map(r => r.id === selectedRun.id ? { ...r, status } : r));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update status');
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case 'draft': return 'status-draft';
            case 'processing': return 'status-processing';
            case 'completed': return 'status-completed';
            case 'paid': return 'status-paid';
            default: return '';
        }
    }

    return (
        <div className="payroll-manager">
            <div className="payroll-header">
                <h1>Payroll Runs</h1>
                <button onClick={() => setShowNewForm(true)} className="btn btn-primary">
                    + Run New Payroll
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* New Payroll Form */}
            {showNewForm && (
                <div className="new-payroll-form">
                    <h3>Run Payroll</h3>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Month</label>
                            <select value={newMonth} onChange={(e) => setNewMonth(Number(e.target.value))}>
                                {MONTHS.map((m, i) => (
                                    <option key={m} value={i + 1}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Year</label>
                            <input
                                type="number"
                                value={newYear}
                                onChange={(e) => setNewYear(Number(e.target.value))}
                                min={2020}
                                max={2030}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button onClick={() => setShowNewForm(false)} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleRunPayroll} className="btn btn-primary" disabled={loading}>
                            {loading ? 'Processing...' : 'Run Payroll'}
                        </button>
                    </div>
                </div>
            )}

            {/* Runs List */}
            <div className="payroll-layout">
                <div className="runs-list">
                    <h3>History</h3>
                    {loading && !runs.length && <div className="loading">Loading...</div>}
                    {runs.map(run => (
                        <div
                            key={run.id}
                            className={`run-card ${selectedRun?.id === run.id ? 'selected' : ''}`}
                            onClick={() => handleViewRun(run)}
                        >
                            <div className="run-title">
                                {MONTHS[run.month - 1]} {run.year}
                            </div>
                            <div className="run-meta">
                                <span className={`status-badge ${getStatusColor(run.status || 'draft')}`}>
                                    {run.status}
                                </span>
                                <span>{run.total_employees} employees</span>
                            </div>
                            <div className="run-amount">{formatCurrency(run.total_net || 0)}</div>
                        </div>
                    ))}
                    {!loading && runs.length === 0 && (
                        <div className="no-data">No payroll runs yet</div>
                    )}
                </div>

                {/* Run Details */}
                {selectedRun && (
                    <div className="run-details">
                        <div className="details-header">
                            <h3>{MONTHS[selectedRun.month - 1]} {selectedRun.year}</h3>
                            <div className="status-actions">
                                <select
                                    value={selectedRun.status || 'draft'}
                                    onChange={(e) => handleUpdateStatus(e.target.value as any)}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="processing">Processing</option>
                                    <option value="completed">Completed</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                        </div>

                        <div className="summary-cards">
                            <div className="summary-card">
                                <span className="label">Employees</span>
                                <span className="value">{selectedRun.total_employees}</span>
                            </div>
                            <div className="summary-card">
                                <span className="label">Gross</span>
                                <span className="value">{formatCurrency(selectedRun.total_gross || 0)}</span>
                            </div>
                            <div className="summary-card">
                                <span className="label">Deductions</span>
                                <span className="value deduction">{formatCurrency(selectedRun.total_deductions || 0)}</span>
                            </div>
                            <div className="summary-card highlight">
                                <span className="label">Net Payable</span>
                                <span className="value">{formatCurrency(selectedRun.total_net || 0)}</span>
                            </div>
                        </div>

                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Basic</th>
                                    <th>HRA</th>
                                    <th>Gross</th>
                                    <th>PF</th>
                                    <th>ESI</th>
                                    <th>PT</th>
                                    <th>Net</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => (
                                    <tr key={item.id}>
                                        <td>{(item as any).employees?.name || item.employee_id}</td>
                                        <td>{formatCurrency(item.basic || 0)}</td>
                                        <td>{formatCurrency(item.hra || 0)}</td>
                                        <td>{formatCurrency(item.gross_salary || 0)}</td>
                                        <td className="deduction">{formatCurrency(item.pf_employee || 0)}</td>
                                        <td className="deduction">{formatCurrency(item.esi_employee || 0)}</td>
                                        <td className="deduction">{formatCurrency(item.professional_tax || 0)}</td>
                                        <td className="net">{formatCurrency(item.net_salary || 0)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PayrollRunManager;
