import React, { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation, useParams } from 'react-router-dom';
import { useAuth, ProtectedRoute } from './contexts/AuthContext';

// Pages
import { LoginPage, SignupPage } from './pages/auth';
import EmployeesPage from './pages/EmployeesPage';

// Components
import { Dashboard, PayrollCalendar } from './components/dashboard';
import { SalaryCalculator, PayrollRunManager } from './components/payroll';
import { PayslipManager } from './components/payslips';
import { OnboardingWizard } from './components/onboarding';

// ============================================================================
// Sidebar Navigation
// ============================================================================

function Sidebar() {
    const { user, company, signOut } = useAuth();
    const location = useLocation();

    function isActive(path: string): boolean {
        return location.pathname.startsWith(path);
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <h1>PayEase</h1>
                <span>Payroll Made Simple</span>
            </div>

            <nav className="sidebar-nav">
                <NavLink to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                    <span className="nav-icon">📊</span>
                    Dashboard
                </NavLink>

                <NavLink to="/employees" className={`nav-item ${isActive('/employees') ? 'active' : ''}`}>
                    <span className="nav-icon">👥</span>
                    Employees
                </NavLink>

                <NavLink to="/payroll" className={`nav-item ${isActive('/payroll') ? 'active' : ''}`}>
                    <span className="nav-icon">💰</span>
                    Payroll
                </NavLink>

                <NavLink to="/salary-calculator" className={`nav-item ${isActive('/salary-calculator') ? 'active' : ''}`}>
                    <span className="nav-icon">🧮</span>
                    Salary Calculator
                </NavLink>

                <NavLink to="/payslips" className={`nav-item ${isActive('/payslips') ? 'active' : ''}`}>
                    <span className="nav-icon">📄</span>
                    Payslips
                </NavLink>

                <NavLink to="/calendar" className={`nav-item ${isActive('/calendar') ? 'active' : ''}`}>
                    <span className="nav-icon">📅</span>
                    Calendar
                </NavLink>
            </nav>

            <div className="sidebar-footer">
                <div className="user-info">
                    <div>{company?.name || 'My Company'}</div>
                    <div className="user-email">{user?.email}</div>
                </div>
                <button className="btn btn-sm btn-secondary" onClick={signOut} style={{ marginTop: '0.5rem', width: '100%' }}>
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

// ============================================================================
// Dashboard Page (with calendar)
// ============================================================================

function DashboardPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Dashboard />
            <div style={{ marginTop: '2rem' }}>
                <PayrollCalendar />
            </div>
        </div>
    );
}

// ============================================================================
// Payroll Page
// ============================================================================

function PayrollPage() {
    const { company } = useAuth();

    if (!company) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please complete company onboarding first.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Payroll Management</h1>
            <PayrollRunManager companyId={company.id} />
        </div>
    );
}

// ============================================================================
// Salary Calculator Page
// ============================================================================

function SalaryCalculatorPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Salary Calculator</h1>
            <SalaryCalculator />
        </div>
    );
}

// ============================================================================
// Payslips Page
// ============================================================================

function PayslipsPage() {
    const { company } = useAuth();
    const { runId } = useParams<{ runId: string }>();
    const now = new Date();

    if (!company) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please complete company onboarding first.</p>
            </div>
        );
    }

    if (!runId) {
        return (
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '1rem' }}>Payslip Management</h1>
                <p style={{ color: 'var(--gray-500)' }}>
                    Select a payroll run from the <a href="/payroll">Payroll</a> page to generate payslips.
                </p>
            </div>
        );
    }

    const companyInfo = {
        name: company.name,
        address: company.address || '',
        logo: company.logo_url || undefined,
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <PayslipManager
                payrollRunId={runId}
                company={companyInfo}
                month={now.toLocaleString('en-IN', { month: 'long' })}
                year={now.getFullYear()}
            />
        </div>
    );
}

// ============================================================================
// Calendar Page
// ============================================================================

function CalendarPage() {
    return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '1.5rem' }}>Payroll Calendar</h1>
            <PayrollCalendar />
        </div>
    );
}

// ============================================================================
// App Root
// ============================================================================

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading PayEase...</p>
            </div>
        );
    }

    // Unauthenticated routes
    if (!user) {
        return (
            <Routes>
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/signup" element={<SignupPage />} />
                <Route path="*" element={<Navigate to="/auth/login" replace />} />
            </Routes>
        );
    }

    // Authenticated layout with sidebar
    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/employees/*" element={<EmployeesPage />} />
                    <Route path="/payroll" element={<PayrollPage />} />
                    <Route path="/salary-calculator" element={<SalaryCalculatorPage />} />
                    <Route path="/payslips" element={<PayslipsPage />} />
                    <Route path="/payslips/:runId" element={<PayslipsPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/onboarding" element={<OnboardingWizard />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
