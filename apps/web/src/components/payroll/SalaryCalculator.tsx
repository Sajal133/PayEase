import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { calculateSalary, type SalaryBreakdown, STATUTORY_LIMITS } from '../../lib/payroll';

interface SalaryStructure {
    id: string;
    company_id: string;
    name: string;
    description: string | null;
    basic_percent: number | null;
    hra_percent: number | null;
    special_allowance_percent: number | null;
    pf_enabled: boolean;
    pf_percent: number | null;
    pf_ceiling: number | null;
    esi_enabled: boolean;
    esi_employee_percent: number | null;
    esi_employer_percent: number | null;
    esi_ceiling: number | null;
    is_default: boolean;
    created_at: string | null;
}

interface StructureFormData {
    name: string;
    description: string;
    basic_percent: number;
    hra_percent: number;
    pf_enabled: boolean;
    pf_percent: number;
    pf_ceiling: number;
    esi_enabled: boolean;
    is_default: boolean;
}

const DEFAULT_FORM: StructureFormData = {
    name: '',
    description: '',
    basic_percent: 40,
    hra_percent: 50,
    pf_enabled: true,
    pf_percent: 12,
    pf_ceiling: 15000,
    esi_enabled: true,
    is_default: false,
};

export function SalaryCalculator() {
    const { company } = useAuth();

    // Saved structures
    const [structures, setStructures] = useState<SalaryStructure[]>([]);
    const [loadingStructures, setLoadingStructures] = useState(true);

    // Selected structure for calculator
    const [selectedStructure, setSelectedStructure] = useState<SalaryStructure | null>(null);

    // Calculator state
    const [ctc, setCTC] = useState(600000);
    const [basicPercentage, setBasicPercentage] = useState(40);
    const [hraPercentage, setHRAPercentage] = useState(50);
    const [pfEnabled, setPFEnabled] = useState(true);
    const [ptEnabled, setPTEnabled] = useState(true);
    const [state, setState] = useState('Karnataka');

    // Create/edit modal
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<StructureFormData>(DEFAULT_FORM);
    const [formLoading, setFormLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (company?.id) {
            loadStructures();
        }
    }, [company?.id]);

    async function loadStructures() {
        setLoadingStructures(true);
        try {
            const { data, error } = await supabase
                .from('salary_structures')
                .select('*')
                .eq('company_id', company!.id)
                .order('is_default', { ascending: false })
                .order('name');

            if (error) throw error;
            setStructures((data || []) as SalaryStructure[]);

            // Auto-select the default structure
            if (data && data.length > 0 && !selectedStructure) {
                const defaultStruct = data.find(s => s.is_default) || data[0];
                selectStructure(defaultStruct as SalaryStructure);
            }
        } catch (err) {
            console.error('Error loading structures:', err);
        } finally {
            setLoadingStructures(false);
        }
    }

    function selectStructure(structure: SalaryStructure) {
        setSelectedStructure(structure);
        setBasicPercentage(Number(structure.basic_percent));
        setHRAPercentage(Number(structure.hra_percent));
        setPFEnabled(structure.pf_enabled);
    }

    function openCreateForm() {
        setEditingId(null);
        setFormData(DEFAULT_FORM);
        setFormError(null);
        setShowForm(true);
    }

    function openEditForm(structure: SalaryStructure) {
        setEditingId(structure.id);
        setFormData({
            name: structure.name,
            description: structure.description || '',
            basic_percent: Number(structure.basic_percent),
            hra_percent: Number(structure.hra_percent),
            pf_enabled: structure.pf_enabled,
            pf_percent: Number(structure.pf_percent),
            pf_ceiling: Number(structure.pf_ceiling),
            esi_enabled: structure.esi_enabled,
            is_default: structure.is_default,
        });
        setFormError(null);
        setShowForm(true);
    }

    async function handleFormSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!company) return;
        setFormLoading(true);
        setFormError(null);

        try {
            if (formData.is_default) {
                // Unset other defaults
                await supabase
                    .from('salary_structures')
                    .update({ is_default: false })
                    .eq('company_id', company.id)
                    .eq('is_default', true);
            }

            if (editingId) {
                const { error } = await supabase
                    .from('salary_structures')
                    .update({
                        name: formData.name,
                        description: formData.description || null,
                        basic_percent: formData.basic_percent,
                        hra_percent: formData.hra_percent,
                        pf_enabled: formData.pf_enabled,
                        pf_percent: formData.pf_percent,
                        pf_ceiling: formData.pf_ceiling,
                        esi_enabled: formData.esi_enabled,
                        is_default: formData.is_default,
                    })
                    .eq('id', editingId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('salary_structures')
                    .insert({
                        company_id: company.id,
                        name: formData.name,
                        description: formData.description || null,
                        basic_percent: formData.basic_percent,
                        hra_percent: formData.hra_percent,
                        pf_enabled: formData.pf_enabled,
                        pf_percent: formData.pf_percent,
                        pf_ceiling: formData.pf_ceiling,
                        esi_enabled: formData.esi_enabled,
                        is_default: formData.is_default,
                    });
                if (error) throw error;
            }

            setShowForm(false);
            await loadStructures();
        } catch (err) {
            console.error('Save error:', err);
            setFormError(err instanceof Error ? err.message : 'Failed to save structure');
        } finally {
            setFormLoading(false);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this salary structure?')) return;
        try {
            const { error } = await supabase
                .from('salary_structures')
                .delete()
                .eq('id', id);
            if (error) throw error;
            if (selectedStructure?.id === id) setSelectedStructure(null);
            await loadStructures();
        } catch (err) {
            console.error('Delete error:', err);
        }
    }

    const breakdown = calculateSalary({
        annualCTC: ctc,
        basicPercentage,
        hraPercentage,
        pfEnabled,
        ptEnabled,
        state,
    });

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    if (!company) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please complete company onboarding first.</p>
            </div>
        );
    }

    return (
        <div className="salary-calculator">

            {/* ===== Saved Salary Structures Panel ===== */}
            <div className="structures-panel">
                <div className="structures-header">
                    <h2>Salary Structures</h2>
                    <button className="btn btn-primary btn-sm" onClick={openCreateForm}>
                        + New Structure
                    </button>
                </div>

                {loadingStructures && <div className="loading">Loading structures...</div>}

                {!loadingStructures && structures.length === 0 && (
                    <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
                        <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>
                            No salary structures yet. Create one to get started.
                        </p>
                        <button className="btn btn-primary" onClick={openCreateForm}>
                            Create First Structure
                        </button>
                    </div>
                )}

                {!loadingStructures && structures.length > 0 && (
                    <div className="structures-list">
                        {structures.map(s => (
                            <div
                                key={s.id}
                                className={`structure-card ${selectedStructure?.id === s.id ? 'selected' : ''}`}
                                onClick={() => selectStructure(s)}
                            >
                                <div className="structure-card-header">
                                    <span className="structure-name">
                                        {s.name}
                                        {s.is_default && <span className="badge-default">Default</span>}
                                    </span>
                                    <div className="structure-actions" onClick={(e) => e.stopPropagation()}>
                                        <button
                                            className="btn-icon"
                                            title="Edit"
                                            onClick={() => openEditForm(s)}
                                        >
                                            ✏️
                                        </button>
                                        {!s.is_default && (
                                            <button
                                                className="btn-icon"
                                                title="Delete"
                                                onClick={() => handleDelete(s.id)}
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="structure-card-details">
                                    <span>Basic: {Number(s.basic_percent)}%</span>
                                    <span>HRA: {Number(s.hra_percent)}%</span>
                                    <span>PF: {s.pf_enabled ? 'Yes' : 'No'}</span>
                                    <span>ESI: {s.esi_enabled ? 'Yes' : 'No'}</span>
                                </div>
                                {s.description && (
                                    <div className="structure-card-desc">{s.description}</div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ===== Create/Edit Modal ===== */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Salary Structure' : 'New Salary Structure'}</h3>
                            <button className="btn-close" onClick={() => setShowForm(false)}>×</button>
                        </div>

                        {formError && <div className="error-message">{formError}</div>}

                        <form onSubmit={handleFormSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Structure Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g., Standard, Executive, Intern"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Brief description"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Basic % of CTC</label>
                                    <input
                                        type="number"
                                        value={formData.basic_percent}
                                        onChange={(e) => setFormData({ ...formData, basic_percent: Number(e.target.value) })}
                                        min={20}
                                        max={70}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>HRA % of Basic</label>
                                    <input
                                        type="number"
                                        value={formData.hra_percent}
                                        onChange={(e) => setFormData({ ...formData, hra_percent: Number(e.target.value) })}
                                        min={20}
                                        max={70}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.pf_enabled}
                                            onChange={(e) => setFormData({ ...formData, pf_enabled: e.target.checked })}
                                        />
                                        Enable PF Deduction
                                    </label>
                                </div>
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.esi_enabled}
                                            onChange={(e) => setFormData({ ...formData, esi_enabled: e.target.checked })}
                                        />
                                        Enable ESI
                                    </label>
                                </div>
                                <div className="form-group checkbox">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={formData.is_default}
                                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                        />
                                        Set as Default
                                    </label>
                                </div>
                            </div>

                            {formData.pf_enabled && (
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>PF % (Employee)</label>
                                        <input
                                            type="number"
                                            value={formData.pf_percent}
                                            onChange={(e) => setFormData({ ...formData, pf_percent: Number(e.target.value) })}
                                            min={1}
                                            max={20}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>PF Ceiling (₹/month)</label>
                                        <input
                                            type="number"
                                            value={formData.pf_ceiling}
                                            onChange={(e) => setFormData({ ...formData, pf_ceiling: Number(e.target.value) })}
                                            min={0}
                                            step={1000}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formLoading}>
                                    {formLoading ? 'Saving...' : editingId ? 'Update Structure' : 'Create Structure'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ===== Calculator ===== */}
            <div className="calculator-section">
                <h2>Salary Calculator</h2>

                {selectedStructure && (
                    <div className="selected-structure-info">
                        Using structure: <strong>{selectedStructure.name}</strong>
                        {selectedStructure.is_default && <span className="badge-default">Default</span>}
                    </div>
                )}

                {/* Configuration */}
                <div className="calculator-config">
                    <div className="config-row">
                        <div className="config-item">
                            <label htmlFor="ctc">Annual CTC (₹)</label>
                            <input
                                type="number"
                                id="ctc"
                                value={ctc}
                                onChange={(e) => setCTC(Number(e.target.value))}
                                min={0}
                                step={10000}
                            />
                        </div>

                        <div className="config-item">
                            <label htmlFor="basic">Basic % of CTC</label>
                            <input
                                type="number"
                                id="basic"
                                value={basicPercentage}
                                onChange={(e) => setBasicPercentage(Number(e.target.value))}
                                min={30}
                                max={60}
                            />
                        </div>

                        <div className="config-item">
                            <label htmlFor="hra">HRA % of Basic</label>
                            <input
                                type="number"
                                id="hra"
                                value={hraPercentage}
                                onChange={(e) => setHRAPercentage(Number(e.target.value))}
                                min={30}
                                max={60}
                            />
                        </div>
                    </div>

                    <div className="config-row">
                        <div className="config-item checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={pfEnabled}
                                    onChange={(e) => setPFEnabled(e.target.checked)}
                                />
                                PF Enabled
                            </label>
                        </div>

                        <div className="config-item checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={ptEnabled}
                                    onChange={(e) => setPTEnabled(e.target.checked)}
                                />
                                Professional Tax
                            </label>
                        </div>

                        <div className="config-item">
                            <label htmlFor="state">State</label>
                            <select id="state" value={state} onChange={(e) => setState(e.target.value)}>
                                <option value="Karnataka">Karnataka</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Tamil Nadu">Tamil Nadu</option>
                                <option value="Telangana">Telangana</option>
                                <option value="Gujarat">Gujarat</option>
                                <option value="Delhi">Delhi</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Breakdown Display */}
                <div className="salary-breakdown">
                    <div className="breakdown-section earnings">
                        <h3>Earnings</h3>
                        <div className="breakdown-row">
                            <span>Basic Salary</span>
                            <span>{formatCurrency(breakdown.basic)}</span>
                        </div>
                        <div className="breakdown-row">
                            <span>HRA</span>
                            <span>{formatCurrency(breakdown.hra)}</span>
                        </div>
                        <div className="breakdown-row">
                            <span>Special Allowance</span>
                            <span>{formatCurrency(breakdown.specialAllowance)}</span>
                        </div>
                        <div className="breakdown-row total">
                            <span>Gross Salary</span>
                            <span>{formatCurrency(breakdown.grossSalary)}</span>
                        </div>
                    </div>

                    <div className="breakdown-section deductions">
                        <h3>Deductions</h3>
                        <div className="breakdown-row">
                            <span>PF (Employee - 12%)</span>
                            <span className="deduction">-{formatCurrency(breakdown.employeePF)}</span>
                        </div>
                        <div className="breakdown-row">
                            <span>ESI (0.75%){breakdown.grossSalary > STATUTORY_LIMITS.ESI_GROSS_LIMIT && ' - N/A'}</span>
                            <span className="deduction">-{formatCurrency(breakdown.employeeESI)}</span>
                        </div>
                        <div className="breakdown-row">
                            <span>Professional Tax</span>
                            <span className="deduction">-{formatCurrency(breakdown.professionalTax)}</span>
                        </div>
                        <div className="breakdown-row total">
                            <span>Total Deductions</span>
                            <span className="deduction">-{formatCurrency(breakdown.totalDeductions)}</span>
                        </div>
                    </div>

                    <div className="breakdown-section employer">
                        <h3>Employer Contributions</h3>
                        <div className="breakdown-row">
                            <span>PF (Employer - 12%)</span>
                            <span className="contribution">{formatCurrency(breakdown.employerPF)}</span>
                        </div>
                        <div className="breakdown-row">
                            <span>ESI (Employer - 3.25%)</span>
                            <span className="contribution">{formatCurrency(breakdown.employerESI)}</span>
                        </div>
                    </div>

                    <div className="breakdown-section net">
                        <div className="breakdown-row net-salary">
                            <span>Net Monthly Salary</span>
                            <span className="amount">{formatCurrency(breakdown.netSalary)}</span>
                        </div>
                        <div className="breakdown-row annual">
                            <span>Net Annual Salary</span>
                            <span>{formatCurrency(breakdown.netSalary * 12)}</span>
                        </div>
                    </div>
                </div>

                {breakdown.grossSalary > STATUTORY_LIMITS.ESI_GROSS_LIMIT && (
                    <div className="info-note">
                        ESI is not applicable as gross salary exceeds ₹21,000/month
                    </div>
                )}
            </div>
        </div>
    );
}

export default SalaryCalculator;
