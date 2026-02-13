import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    terminatedEmployees: number;
    lastPayrollAmount: number;
    pendingPayrollRuns: number;
}

export function Dashboard() {
    const { company } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        activeEmployees: 0,
        terminatedEmployees: 0,
        lastPayrollAmount: 0,
        pendingPayrollRuns: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentPayrolls, setRecentPayrolls] = useState<any[]>([]);

    useEffect(() => {
        if (company?.id) {
            loadDashboardData();
        }
    }, [company?.id]);

    async function loadDashboardData() {
        setLoading(true);
        try {
            // Get employee counts
            const { count: totalCount } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company!.id);

            const { count: activeCount } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company!.id)
                .eq('status', 'active');

            const { count: terminatedCount } = await supabase
                .from('employees')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company!.id)
                .eq('status', 'terminated');

            // Get recent payroll runs
            const { data: payrollRuns } = await supabase
                .from('payroll_runs')
                .select('*')
                .eq('company_id', company!.id)
                .order('created_at', { ascending: false })
                .limit(5);

            // Get pending payroll runs
            const { count: pendingCount } = await supabase
                .from('payroll_runs')
                .select('*', { count: 'exact', head: true })
                .eq('company_id', company!.id)
                .in('status', ['draft', 'processing']);

            setStats({
                totalEmployees: totalCount || 0,
                activeEmployees: activeCount || 0,
                terminatedEmployees: terminatedCount || 0,
                lastPayrollAmount: payrollRuns?.[0]?.total_net || 0,
                pendingPayrollRuns: pendingCount || 0,
            });

            setRecentPayrolls(payrollRuns || []);
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back!</h1>
                    <p className="subtitle">{company?.name || 'Your Company'}</p>
                </div>
                <div className="header-actions">
                    <button className="btn btn-primary" onClick={() => window.location.href = '/payroll/run'}>
                        Run Payroll
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon active">✅</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.activeEmployees}</span>
                        <span className="stat-label">Active Employees</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon terminated">🚫</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.terminatedEmployees}</span>
                        <span className="stat-label">Terminated</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon payroll">₹</div>
                    <div className="stat-content">
                        <span className="stat-value">{formatCurrency(stats.lastPayrollAmount)}</span>
                        <span className="stat-label">Last Payroll</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon pending">⏳</div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.pendingPayrollRuns}</span>
                        <span className="stat-label">Pending Runs</span>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <Link to="/employees/add" className="action-card">
                        <span className="action-icon">➕</span>
                        <span className="action-label">Add Employee</span>
                    </Link>
                    <Link to="/payroll/run" className="action-card">
                        <span className="action-icon">💰</span>
                        <span className="action-label">Run Payroll</span>
                    </Link>
                    <Link to="/payslips" className="action-card">
                        <span className="action-icon">📄</span>
                        <span className="action-label">Generate Payslips</span>
                    </Link>
                    <Link to="/employees" className="action-card">
                        <span className="action-icon">👥</span>
                        <span className="action-label">View Employees</span>
                    </Link>
                </div>
            </div>

            {/* Recent Payroll Runs */}
            <div className="recent-payrolls">
                <h2>Recent Payroll Runs</h2>
                {loading && <div className="loading">Loading...</div>}
                {!loading && recentPayrolls.length === 0 && (
                    <div className="empty-state">
                        <p>No payroll runs yet</p>
                        <Link to="/payroll/run" className="btn btn-primary">Run First Payroll</Link>
                    </div>
                )}
                {!loading && recentPayrolls.length > 0 && (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Employees</th>
                                <th>Total Net</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentPayrolls.map(run => (
                                <tr key={run.id}>
                                    <td>{MONTHS[run.month - 1]} {run.year}</td>
                                    <td>{run.total_employees}</td>
                                    <td>{formatCurrency(run.total_net || 0)}</td>
                                    <td>
                                        <span className={`status-badge status-${run.status}`}>
                                            {run.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
