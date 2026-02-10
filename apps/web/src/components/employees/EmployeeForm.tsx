import React, { useState, useEffect } from 'react';
import { createEmployee, updateEmployee, getEmployee } from '../../lib/employees';
import type { Employee, InsertTables, SalaryStructure } from '../../types/supabase';
import { supabase } from '../../lib/supabase';

interface EmployeeFormProps {
    companyId: string;
    employeeId?: string; // If provided, editing mode
    onSuccess: () => void;
    onCancel: () => void;
}

type FormData = Omit<InsertTables<'employees'>, 'id' | 'created_at' | 'updated_at'>;

export function EmployeeForm({ companyId, employeeId, onSuccess, onCancel }: EmployeeFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [salaryStructures, setSalaryStructures] = useState<SalaryStructure[]>([]);

    const [form, setForm] = useState<FormData>({
        company_id: companyId,
        name: '',
        email: '',
        phone: '',
        date_of_birth: null,
        gender: '',
        pan_number: '',
        aadhaar_last_4: '',
        bank_account: '',
        ifsc_code: '',
        bank_name: '',
        employee_id: '',
        designation: '',
        department: '',
        joining_date: new Date().toISOString().split('T')[0],
        ctc: 0,
        salary_structure_id: null,
        status: 'active',
    });

    const isEditing = !!employeeId;

    useEffect(() => {
        loadSalaryStructures();
        if (employeeId) {
            loadEmployee();
        }
    }, [employeeId]);

    async function loadSalaryStructures() {
        const { data } = await supabase
            .from('salary_structures')
            .select('*')
            .eq('company_id', companyId);
        setSalaryStructures(data || []);
    }

    async function loadEmployee() {
        if (!employeeId) return;
        setLoading(true);
        try {
            const employee = await getEmployee(employeeId);
            if (employee) {
                setForm({
                    company_id: employee.company_id,
                    name: employee.name,
                    email: employee.email,
                    phone: employee.phone || '',
                    date_of_birth: employee.date_of_birth,
                    gender: employee.gender || '',
                    pan_number: employee.pan_number || '',
                    aadhaar_last_4: employee.aadhaar_last_4 || '',
                    bank_account: employee.bank_account || '',
                    ifsc_code: employee.ifsc_code || '',
                    bank_name: employee.bank_name || '',
                    employee_id: employee.employee_id || '',
                    designation: employee.designation || '',
                    department: employee.department || '',
                    joining_date: employee.joining_date,
                    ctc: employee.ctc,
                    salary_structure_id: employee.salary_structure_id,
                    status: employee.status || 'active',
                });
            }
        } catch (err) {
            setError('Failed to load employee');
        } finally {
            setLoading(false);
        }
    }

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
        const { name, value, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value,
        }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Validate
            if (!form.name.trim()) throw new Error('Name is required');
            if (!form.email.trim()) throw new Error('Email is required');
            if (!form.joining_date) throw new Error('Joining date is required');
            if (form.ctc <= 0) throw new Error('CTC must be greater than 0');

            // PAN validation
            if (form.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.pan_number)) {
                throw new Error('Invalid PAN format (e.g., ABCDE1234F)');
            }

            if (isEditing && employeeId) {
                await updateEmployee(employeeId, form);
            } else {
                await createEmployee(form);
            }

            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save employee');
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="employee-form">
            <h2>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>

            {error && <div className="error-message">{error}</div>}

            {/* Personal Information */}
            <fieldset>
                <legend>Personal Information</legend>

                <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phone">Phone</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={form.phone || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="date_of_birth">Date of Birth</label>
                        <input
                            type="date"
                            id="date_of_birth"
                            name="date_of_birth"
                            value={form.date_of_birth || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select id="gender" name="gender" value={form.gender || ''} onChange={handleChange}>
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>
            </fieldset>

            {/* Identity Documents */}
            <fieldset>
                <legend>Identity Documents</legend>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="pan_number">PAN Number</label>
                        <input
                            type="text"
                            id="pan_number"
                            name="pan_number"
                            value={form.pan_number || ''}
                            onChange={handleChange}
                            placeholder="ABCDE1234F"
                            maxLength={10}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="aadhaar_last_4">Aadhaar (Last 4 digits)</label>
                        <input
                            type="text"
                            id="aadhaar_last_4"
                            name="aadhaar_last_4"
                            value={form.aadhaar_last_4 || ''}
                            onChange={handleChange}
                            maxLength={4}
                            pattern="[0-9]{4}"
                        />
                    </div>
                </div>
            </fieldset>

            {/* Bank Details */}
            <fieldset>
                <legend>Bank Details</legend>

                <div className="form-group">
                    <label htmlFor="bank_name">Bank Name</label>
                    <input
                        type="text"
                        id="bank_name"
                        name="bank_name"
                        value={form.bank_name || ''}
                        onChange={handleChange}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="bank_account">Account Number</label>
                        <input
                            type="text"
                            id="bank_account"
                            name="bank_account"
                            value={form.bank_account || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="ifsc_code">IFSC Code</label>
                        <input
                            type="text"
                            id="ifsc_code"
                            name="ifsc_code"
                            value={form.ifsc_code || ''}
                            onChange={handleChange}
                            maxLength={11}
                            style={{ textTransform: 'uppercase' }}
                        />
                    </div>
                </div>
            </fieldset>

            {/* Employment Details */}
            <fieldset>
                <legend>Employment Details</legend>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="employee_id">Employee ID</label>
                        <input
                            type="text"
                            id="employee_id"
                            name="employee_id"
                            value={form.employee_id || ''}
                            onChange={handleChange}
                            placeholder="EMP001"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="joining_date">Joining Date *</label>
                        <input
                            type="date"
                            id="joining_date"
                            name="joining_date"
                            value={form.joining_date}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="department">Department</label>
                        <input
                            type="text"
                            id="department"
                            name="department"
                            value={form.department || ''}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="designation">Designation</label>
                        <input
                            type="text"
                            id="designation"
                            name="designation"
                            value={form.designation || ''}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="ctc">Annual CTC (₹) *</label>
                        <input
                            type="number"
                            id="ctc"
                            name="ctc"
                            value={form.ctc}
                            onChange={handleChange}
                            min={0}
                            step={1000}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="salary_structure_id">Salary Structure</label>
                        <select
                            id="salary_structure_id"
                            name="salary_structure_id"
                            value={form.salary_structure_id || ''}
                            onChange={handleChange}
                        >
                            <option value="">Select Structure</option>
                            {salaryStructures.map(ss => (
                                <option key={ss.id} value={ss.id}>{ss.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select id="status" name="status" value={form.status || 'active'} onChange={handleChange}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="terminated">Terminated</option>
                    </select>
                </div>
            </fieldset>

            {/* Actions */}
            <div className="form-actions">
                <button type="button" onClick={onCancel} className="btn btn-secondary">
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (isEditing ? 'Update Employee' : 'Add Employee')}
                </button>
            </div>
        </form>
    );
}

export default EmployeeForm;
