import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Step = 'company' | 'structure' | 'employee' | 'complete';

interface CompanyData {
    address: string;
    phone: string;
    pf_registration: string;
    esi_registration: string;
    pan_number: string;
}

interface SalaryStructureData {
    name: string;
    basic_percent: number;
    hra_percent: number;
    pf_enabled: boolean;
}

interface EmployeeData {
    name: string;
    email: string;
    employee_id: string;
    ctc: number;
    joining_date: string;
}

export function OnboardingWizard() {
    const { company, updateProfile } = useAuth();
    const [step, setStep] = useState<Step>('company');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [companyData, setCompanyData] = useState<CompanyData>({
        address: company?.address || '',
        phone: company?.phone || '',
        pf_registration: company?.pf_registration || '',
        esi_registration: company?.esi_registration || '',
        pan_number: company?.pan_number || '',
    });

    const [structureData, setStructureData] = useState<SalaryStructureData>({
        name: 'Standard',
        basic_percent: 40,
        hra_percent: 50,
        pf_enabled: true,
    });

    const [employeeData, setEmployeeData] = useState<EmployeeData>({
        name: '',
        email: '',
        employee_id: '',
        ctc: 600000,
        joining_date: new Date().toISOString().split('T')[0],
    });

    async function handleCompanySubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await updateProfile(companyData);
            setStep('structure');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update company');
        } finally {
            setLoading(false);
        }
    }

    async function handleStructureSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: structureError } = await supabase
                .from('salary_structures')
                .insert({
                    company_id: company!.id,
                    name: structureData.name,
                    basic_percent: structureData.basic_percent,
                    hra_percent: structureData.hra_percent,
                    pf_enabled: structureData.pf_enabled,
                    is_default: true,
                });

            if (structureError) throw structureError;
            setStep('employee');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create salary structure');
        } finally {
            setLoading(false);
        }
    }

    async function handleEmployeeSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error: employeeError } = await supabase
                .from('employees')
                .insert({
                    company_id: company!.id,
                    name: employeeData.name,
                    email: employeeData.email,
                    employee_id: employeeData.employee_id,
                    ctc: employeeData.ctc,
                    joining_date: employeeData.joining_date,
                    status: 'active',
                });

            if (employeeError) throw employeeError;
            setStep('complete');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add employee');
        } finally {
            setLoading(false);
        }
    }

    function skipEmployee() {
        setStep('complete');
    }

    function goToDashboard() {
        window.location.href = '/dashboard';
    }

    const steps = [
        { key: 'company', label: 'Company Info', number: 1 },
        { key: 'structure', label: 'Salary Structure', number: 2 },
        { key: 'employee', label: 'First Employee', number: 3 },
        { key: 'complete', label: 'Done', number: 4 },
    ];

    const currentStepIndex = steps.findIndex(s => s.key === step);

    return (
        <div className="onboarding-wizard">
            {/* Progress */}
            <div className="wizard-progress">
                {steps.map((s, i) => (
                    <div key={s.key} className={`progress-step ${i <= currentStepIndex ? 'active' : ''} ${i < currentStepIndex ? 'completed' : ''}`}>
                        <div className="step-number">{i < currentStepIndex ? '✓' : s.number}</div>
                        <div className="step-label">{s.label}</div>
                    </div>
                ))}
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Step 1: Company Info */}
            {step === 'company' && (
                <div className="wizard-step">
                    <h2>Complete Your Company Profile</h2>
                    <p>Add your company details for compliance and payslips</p>

                    <form onSubmit={handleCompanySubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Company Address</label>
                                <textarea
                                    value={companyData.address}
                                    onChange={(e) => setCompanyData({ ...companyData, address: e.target.value })}
                                    rows={3}
                                    placeholder="123 Main Street, City, State, PIN"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={companyData.phone}
                                    onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                            <div className="form-group">
                                <label>PAN Number</label>
                                <input
                                    type="text"
                                    value={companyData.pan_number}
                                    onChange={(e) => setCompanyData({ ...companyData, pan_number: e.target.value.toUpperCase() })}
                                    placeholder="AAAAA1234A"
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>PF Registration Number</label>
                                <input
                                    type="text"
                                    value={companyData.pf_registration}
                                    onChange={(e) => setCompanyData({ ...companyData, pf_registration: e.target.value })}
                                    placeholder="MH/MUM/00000000/000"
                                />
                            </div>
                            <div className="form-group">
                                <label>ESI Registration Number</label>
                                <input
                                    type="text"
                                    value={companyData.esi_registration}
                                    onChange={(e) => setCompanyData({ ...companyData, esi_registration: e.target.value })}
                                    placeholder="00-00-000000-00-000"
                                />
                            </div>
                        </div>

                        <div className="wizard-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Next: Salary Structure'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 2: Salary Structure */}
            {step === 'structure' && (
                <div className="wizard-step">
                    <h2>Set Up Default Salary Structure</h2>
                    <p>Configure how salaries are broken down</p>

                    <form onSubmit={handleStructureSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Structure Name</label>
                                <input
                                    type="text"
                                    value={structureData.name}
                                    onChange={(e) => setStructureData({ ...structureData, name: e.target.value })}
                                    placeholder="Standard"
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Basic % of CTC</label>
                                <input
                                    type="number"
                                    value={structureData.basic_percent}
                                    onChange={(e) => setStructureData({ ...structureData, basic_percent: Number(e.target.value) })}
                                    min={30}
                                    max={60}
                                />
                            </div>
                            <div className="form-group">
                                <label>HRA % of Basic</label>
                                <input
                                    type="number"
                                    value={structureData.hra_percent}
                                    onChange={(e) => setStructureData({ ...structureData, hra_percent: Number(e.target.value) })}
                                    min={30}
                                    max={60}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group checkbox">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={structureData.pf_enabled}
                                        onChange={(e) => setStructureData({ ...structureData, pf_enabled: e.target.checked })}
                                    />
                                    Enable Provident Fund (PF) deduction
                                </label>
                            </div>
                        </div>

                        <div className="wizard-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setStep('company')}>
                                Back
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Next: Add Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: First Employee */}
            {step === 'employee' && (
                <div className="wizard-step">
                    <h2>Add Your First Employee</h2>
                    <p>Add an employee to get started with payroll</p>

                    <form onSubmit={handleEmployeeSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Employee Name</label>
                                <input
                                    type="text"
                                    value={employeeData.name}
                                    onChange={(e) => setEmployeeData({ ...employeeData, name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={employeeData.email}
                                    onChange={(e) => setEmployeeData({ ...employeeData, email: e.target.value })}
                                    placeholder="john@company.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Employee ID</label>
                                <input
                                    type="text"
                                    value={employeeData.employee_id}
                                    onChange={(e) => setEmployeeData({ ...employeeData, employee_id: e.target.value })}
                                    placeholder="EMP001"
                                />
                            </div>
                            <div className="form-group">
                                <label>Annual CTC (₹)</label>
                                <input
                                    type="number"
                                    value={employeeData.ctc}
                                    onChange={(e) => setEmployeeData({ ...employeeData, ctc: Number(e.target.value) })}
                                    min={0}
                                    step={10000}
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Joining Date</label>
                                <input
                                    type="date"
                                    value={employeeData.joining_date}
                                    onChange={(e) => setEmployeeData({ ...employeeData, joining_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="wizard-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setStep('structure')}>
                                Back
                            </button>
                            <button type="button" className="btn btn-ghost" onClick={skipEmployee}>
                                Skip for now
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Adding...' : 'Add Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && (
                <div className="wizard-step complete">
                    <div className="success-icon">🎉</div>
                    <h2>You're All Set!</h2>
                    <p>Your PayEase account is ready. Start managing your payroll with ease.</p>

                    <div className="next-steps">
                        <h3>What's Next?</h3>
                        <ul>
                            <li>📥 Import employees from Excel</li>
                            <li>💰 Run your first payroll</li>
                            <li>📄 Generate payslips</li>
                        </ul>
                    </div>

                    <div className="wizard-actions">
                        <button className="btn btn-primary btn-lg" onClick={goToDashboard}>
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OnboardingWizard;
