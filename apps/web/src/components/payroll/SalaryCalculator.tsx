import React, { useState } from 'react';
import { calculateSalary, type SalaryBreakdown, STATUTORY_LIMITS } from '../../lib/payroll';

interface SalaryCalculatorProps {
    initialCTC?: number;
}

export function SalaryCalculator({ initialCTC = 600000 }: SalaryCalculatorProps) {
    const [ctc, setCTC] = useState(initialCTC);
    const [basicPercentage, setBasicPercentage] = useState(40);
    const [hraPercentage, setHRAPercentage] = useState(50);
    const [pfEnabled, setPFEnabled] = useState(true);
    const [ptEnabled, setPTEnabled] = useState(true);
    const [state, setState] = useState('Karnataka');

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

    return (
        <div className="salary-calculator">
            <h2>Salary Calculator</h2>

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

            {/* Info Note */}
            {breakdown.grossSalary > STATUTORY_LIMITS.ESI_GROSS_LIMIT && (
                <div className="info-note">
                    ESI is not applicable as gross salary exceeds ₹21,000/month
                </div>
            )}
        </div>
    );
}

export default SalaryCalculator;
