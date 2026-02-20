import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface DashboardStats {
    totalEmployees: number;
    activeEmployees: number;
    terminatedEmployees: number;
    lastPayrollAmount: number;
    pendingPayrollRuns: number;
}

interface LeaveOverview {
    casualTotal: number;
    casualUsed: number;
    sickTotal: number;
    sickUsed: number;
    lopCount: number;
    employeeCount: number;
}

export function Dashboard() {
    const { company } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        totalEmployees: 0,
        activeEmployees: 0,
        terminatedEmployees: 0,
        lastPayrollAmount: 0,
        pendingPayrollRuns: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentPayrolls, setRecentPayrolls] = useState<any[]>([]);
    const [leaveOverview, setLeaveOverview] = useState<LeaveOverview | null>(null);

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

            // Load leave overview
            try {
                const currentYear = new Date().getFullYear();

                // Get company leave policy
                const { data: companyData } = await supabase
                    .from('companies')
                    .select('casual_leave_total, sick_leave_total')
                    .eq('id', company!.id)
                    .single();

                // Get aggregate leave usage across all employees
                const { data: balances } = await supabase
                    .from('leave_balances')
                    .select('casual_total, casual_used, sick_total, sick_used, employee_id')
                    .eq('year', currentYear);

                // Count LOP days from attendance
                const { count: lopCount } = await supabase
                    .from('attendance')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'lop');

                const empCount = balances?.length || 0;
                const clTotal = (companyData?.casual_leave_total || 24) * (activeCount || 0);
                const slTotal = (companyData?.sick_leave_total || 6) * (activeCount || 0);
                const clUsed = balances?.reduce((s, b) => s + (b.casual_used || 0), 0) || 0;
                const slUsed = balances?.reduce((s, b) => s + (b.sick_used || 0), 0) || 0;

                setLeaveOverview({
                    casualTotal: clTotal,
                    casualUsed: clUsed,
                    sickTotal: slTotal,
                    sickUsed: slUsed,
                    lopCount: lopCount || 0,
                    employeeCount: empCount,
                });
            } catch (leaveErr) {
                console.error('Failed to load leave overview:', leaveErr);
            }
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
                    <button className="btn btn-primary" onClick={() => navigate('/payroll')}>
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
                    <Link to="/payroll" className="action-card">
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

            {/* Leave Overview */}
            {leaveOverview && (
                <div className="leave-overview">
                    <h2>Leave Overview <span className="leave-year">{new Date().getFullYear()}</span></h2>
                    <div className="leave-stats-grid">
                        <div className="leave-stat-card">
                            <div className="leave-stat-header">
                                <span className="leave-stat-icon cl">🏖️</span>
                                <span className="leave-stat-title">Casual Leave</span>
                            </div>
                            <div className="leave-progress">
                                <div
                                    className="leave-progress-bar cl"
                                    style={{ width: `${leaveOverview.casualTotal > 0 ? Math.min(100, (leaveOverview.casualUsed / leaveOverview.casualTotal) * 100) : 0}%` }}
                                />
                            </div>
                            <div className="leave-stat-numbers">
                                <span>{leaveOverview.casualUsed} used</span>
                                <span>{leaveOverview.casualTotal} allocated</span>
                            </div>
                        </div>

                        <div className="leave-stat-card">
                            <div className="leave-stat-header">
                                <span className="leave-stat-icon sl">🏥</span>
                                <span className="leave-stat-title">Sick Leave</span>
                            </div>
                            <div className="leave-progress">
                                <div
                                    className="leave-progress-bar sl"
                                    style={{ width: `${leaveOverview.sickTotal > 0 ? Math.min(100, (leaveOverview.sickUsed / leaveOverview.sickTotal) * 100) : 0}%` }}
                                />
                            </div>
                            <div className="leave-stat-numbers">
                                <span>{leaveOverview.sickUsed} used</span>
                                <span>{leaveOverview.sickTotal} allocated</span>
                            </div>
                        </div>

                        <div className="leave-stat-card lop">
                            <div className="leave-stat-header">
                                <span className="leave-stat-icon lop">⚠️</span>
                                <span className="leave-stat-title">Loss of Pay</span>
                            </div>
                            <div className="leave-lop-value">{leaveOverview.lopCount}</div>
                            <div className="leave-stat-numbers">
                                <span>total LOP days</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
