import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import '../styles/settings.css';

export default function SettingsPage() {
    const { company } = useAuth();
    const [casualLeave, setCasualLeave] = useState(24);
    const [sickLeave, setSickLeave] = useState(6);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (company?.id) {
            loadPolicy();
        }
    }, [company?.id]);

    async function loadPolicy() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('casual_leave_total, sick_leave_total')
                .eq('id', company!.id)
                .single();

            if (error) throw error;
            if (data) {
                setCasualLeave(data.casual_leave_total);
                setSickLeave(data.sick_leave_total);
            }
        } catch (err) {
            console.error('Failed to load leave policy:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setSaveStatus(null);

        try {
            const { error } = await supabase
                .from('companies')
                .update({
                    casual_leave_total: casualLeave,
                    sick_leave_total: sickLeave,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', company!.id);

            if (error) throw error;
            setSaveStatus({ type: 'success', message: '✓ Leave policy saved' });
        } catch (err) {
            setSaveStatus({
                type: 'error',
                message: err instanceof Error ? err.message : 'Failed to save',
            });
        } finally {
            setSaving(false);
        }
    }

    if (!company) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Please complete company onboarding first.</p>
            </div>
        );
    }

    const totalLeave = casualLeave + sickLeave;

    return (
        <div className="settings-page">
            <h1>Settings</h1>
            <p className="settings-subtitle">Manage your company configuration</p>

            {/* Leave Policy Card */}
            <div className="settings-card">
                <div className="settings-card-header">
                    <div className="card-icon leave">🏖️</div>
                    <div>
                        <h2>Leave Policy</h2>
                        <p>Configure annual leave entitlements for your employees</p>
                    </div>
                </div>

                {loading ? (
                    <p style={{ color: 'var(--gray-500)' }}>Loading current policy...</p>
                ) : (
                    <form onSubmit={handleSave} className="settings-form">
                        <div className="settings-form-row">
                            <div className="settings-field">
                                <label>
                                    <span className="label-icon">🏖️</span>
                                    Casual Leave (days/year)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={casualLeave}
                                    onChange={(e) => setCasualLeave(parseInt(e.target.value) || 0)}
                                />
                                <div className="field-hint">
                                    Personal days, vacation, planned time off
                                </div>
                            </div>

                            <div className="settings-field">
                                <label>
                                    <span className="label-icon">🏥</span>
                                    Sick Leave (days/year)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={sickLeave}
                                    onChange={(e) => setSickLeave(parseInt(e.target.value) || 0)}
                                />
                                <div className="field-hint">
                                    Medical leave, health-related absences
                                </div>
                            </div>
                        </div>

                        {/* Inline Summary */}
                        <div className="policy-summary-inline">
                            <div className="summary-item">
                                <span className="summary-value">{casualLeave}</span>
                                <span className="summary-label">Casual Leave</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-item">
                                <span className="summary-value">{sickLeave}</span>
                                <span className="summary-label">Sick Leave</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-item">
                                <span className="summary-value">{totalLeave}</span>
                                <span className="summary-label">Total / Year</span>
                            </div>
                        </div>

                        <div className="settings-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            {saveStatus && (
                                <span className={`save-status ${saveStatus.type}`}>
                                    {saveStatus.message}
                                </span>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
