/**
 * Unit Tests — Payroll Engine
 *
 * Tests the pure calculation functions in payroll.ts:
 *   - calculateSalary()  (CTC → salary breakdown)
 *   - STATUTORY_LIMITS constants
 *   - Professional Tax via calculateSalary with state param
 */
import { describe, it, expect } from 'vitest';
import { calculateSalary, STATUTORY_LIMITS, type SalaryBreakdown } from '../payroll';

// ============================================================================
// Helper
// ============================================================================

function salaryFor(annualCTC: number, overrides: Record<string, any> = {}): SalaryBreakdown {
    return calculateSalary({ annualCTC, ...overrides });
}

// ============================================================================
// Basic Salary Breakdown
// ============================================================================

describe('calculateSalary – basic breakdown', () => {
    it('should compute Basic as 40% of monthly CTC by default', () => {
        const result = salaryFor(600_000);
        expect(result.basic).toBe(Math.round((600_000 / 12) * 0.4));
    });

    it('should compute HRA as 50% of Basic by default', () => {
        const result = salaryFor(600_000);
        expect(result.hra).toBe(Math.round(result.basic * 0.5));
    });

    it('should have grossSalary = basic + hra + specialAllowance', () => {
        const result = salaryFor(600_000);
        expect(result.grossSalary).toBe(result.basic + result.hra + result.specialAllowance);
    });

    it('should have netSalary = grossSalary – totalDeductions', () => {
        const result = salaryFor(600_000);
        expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
    });

    it('should correctly set annualCTC and monthlyCTC', () => {
        const result = salaryFor(1_200_000);
        expect(result.annualCTC).toBe(1_200_000);
        expect(result.monthlyCTC).toBe(100_000);
    });

    it('should respect custom basicPercentage', () => {
        const result = salaryFor(600_000, { basicPercentage: 50 });
        expect(result.basic).toBe(Math.round((600_000 / 12) * 0.5));
    });

    it('should respect custom hraPercentage', () => {
        const result = salaryFor(600_000, { hraPercentage: 40 });
        expect(result.hra).toBe(Math.round(result.basic * 0.4));
    });
});

// ============================================================================
// PF Calculations
// ============================================================================

describe('calculateSalary – Provident Fund', () => {
    it('should calculate employee PF at 12% of basic (capped at ₹15,000 basic)', () => {
        // CTC 6L → basic ≈ 20,000 → pfBasic = min(20000, 15000) = 15000
        const result = salaryFor(600_000);
        const pfBasic = Math.min(result.basic, STATUTORY_LIMITS.PF_BASIC_CAP);
        const expectedPF = Math.min(
            Math.round(pfBasic * STATUTORY_LIMITS.PF_EMPLOYEE_RATE),
            STATUTORY_LIMITS.PF_MAX_EMPLOYEE
        );
        expect(result.employeePF).toBe(expectedPF);
    });

    it('should cap employee PF at ₹1,800/month', () => {
        // High CTC → basic far above ₹15K
        const result = salaryFor(3_000_000);
        expect(result.employeePF).toBeLessThanOrEqual(STATUTORY_LIMITS.PF_MAX_EMPLOYEE);
    });

    it('should calculate employer PF (EPF + EPS rates)', () => {
        const result = salaryFor(600_000);
        const pfBasic = Math.min(result.basic, STATUTORY_LIMITS.PF_BASIC_CAP);
        const expected = Math.round(
            pfBasic * (STATUTORY_LIMITS.PF_EMPLOYER_EPF_RATE + STATUTORY_LIMITS.PF_EMPLOYER_EPS_RATE)
        );
        expect(result.employerPF).toBe(expected);
    });

    it('should skip PF when pfEnabled is false', () => {
        const result = salaryFor(600_000, { pfEnabled: false });
        expect(result.employeePF).toBe(0);
        expect(result.employerPF).toBe(0);
    });
});

// ============================================================================
// ESI Calculations
// ============================================================================

describe('calculateSalary – ESI', () => {
    it('should apply ESI when preliminary gross ≤ ₹21,000', () => {
        // Very low CTC so gross is under ₹21,000 (e.g., ₹2,00,000 CTC)
        const result = salaryFor(200_000);
        const prelimGross = result.basic + result.hra;
        if (prelimGross <= STATUTORY_LIMITS.ESI_GROSS_LIMIT) {
            expect(result.employeeESI).toBeGreaterThan(0);
            expect(result.employerESI).toBeGreaterThan(0);
        }
    });

    it('should NOT apply ESI when preliminary gross > ₹21,000', () => {
        // CTC 6L → monthly ~50K, gross well above ₹21K
        const result = salaryFor(600_000);
        expect(result.employeeESI).toBe(0);
        expect(result.employerESI).toBe(0);
    });

    it('should calculate employee ESI at 0.75%', () => {
        const result = salaryFor(200_000);
        const prelimGross = result.basic + result.hra;
        if (prelimGross <= STATUTORY_LIMITS.ESI_GROSS_LIMIT) {
            expect(result.employeeESI).toBe(Math.round(result.grossSalary * STATUTORY_LIMITS.ESI_EMPLOYEE_RATE));
        }
    });
});

// ============================================================================
// Professional Tax (via state param)
// ============================================================================

describe('calculateSalary – Professional Tax', () => {
    it('should apply ₹200 PT for Karnataka when gross > ₹15,000', () => {
        const result = salaryFor(600_000, { state: 'Karnataka' });
        expect(result.professionalTax).toBe(200);
    });

    it('should apply ₹0 PT for Gujarat (no PT)', () => {
        const result = salaryFor(600_000, { state: 'Gujarat' });
        expect(result.professionalTax).toBe(0);
    });

    it('should apply ₹0 PT for Delhi (no PT)', () => {
        const result = salaryFor(600_000, { state: 'Delhi' });
        expect(result.professionalTax).toBe(0);
    });

    it('should apply ₹200 PT for Maharashtra when gross > ₹10,000', () => {
        const result = salaryFor(600_000, { state: 'Maharashtra' });
        expect(result.professionalTax).toBe(200);
    });

    it('should skip PT when ptEnabled is false', () => {
        const result = salaryFor(600_000, { ptEnabled: false });
        expect(result.professionalTax).toBe(0);
    });

    it('should default to Karnataka PT when state is unknown', () => {
        const known = salaryFor(600_000, { state: 'Karnataka' });
        const unknown = salaryFor(600_000, { state: 'SomeRandomState' });
        expect(unknown.professionalTax).toBe(known.professionalTax);
    });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('calculateSalary – edge cases', () => {
    it('should handle zero CTC', () => {
        const result = salaryFor(0);
        expect(result.basic).toBe(0);
        expect(result.grossSalary).toBe(0);
        expect(result.netSalary).toBe(0);
    });

    it('should ensure specialAllowance is non-negative', () => {
        // Very low CTC where employer contributions might exceed the remaining
        const result = salaryFor(100_000);
        expect(result.specialAllowance).toBeGreaterThanOrEqual(0);
    });

    it('should handle very high CTC (₹1 Cr)', () => {
        const result = salaryFor(10_000_000);
        expect(result.basic).toBeGreaterThan(0);
        expect(result.netSalary).toBeGreaterThan(0);
        expect(result.employeePF).toBeLessThanOrEqual(STATUTORY_LIMITS.PF_MAX_EMPLOYEE);
        expect(result.employeeESI).toBe(0); // gross way above 21K
    });

    it('should have totalDeductions = PF + ESI + PT + TDS', () => {
        const result = salaryFor(600_000);
        const expected = result.employeePF + result.employeeESI + result.professionalTax + result.tds;
        expect(result.totalDeductions).toBe(expected);
    });
});

// ============================================================================
// Attendance & LOP
// ============================================================================

describe('calculateSalary – LOP', () => {
    it('should prorate salary for Loss of Pay', () => {
        const result = calculateSalary({
            annualCTC: 360000, // 30k/month
            lopDays: 1,
            daysInMonth: 30
        });

        // Expected Prorata Factor = 29/30
        // Monthly CTC = 30,000

        // Full Basic = 40% of 30k = 12,000
        // Earned Basic = 12,000 * 29/30 = 11,600
        expect(result.basic).toBe(11600);

        // Full HRA = 50% of 12,000 = 6,000
        // Earned HRA = 6,000 * 29/30 = 5,800
        expect(result.hra).toBe(5800);

        expect(result.paidDays).toBe(29);
        expect(result.lopDays).toBe(1);

        // Ensure gross is reduced (check specific value or just strict inequality)
        // Full Gross = 30,000 - Employer PF (1440) = 28,560.
        // LOP Deduction = 28,560 * 1/30 = 952.
        // Expected Gross = 27,608.
        expect(result.grossSalary).toBeCloseTo(27608, 0);
    });

    it('should handle full month LOP (0 salary)', () => {
        const result = calculateSalary({
            annualCTC: 600000,
            lopDays: 30,
            daysInMonth: 30
        });

        expect(result.basic).toBe(0);
        expect(result.hra).toBe(0);
        expect(result.specialAllowance).toBe(0);
        expect(result.grossSalary).toBe(0);
        expect(result.netSalary).toBe(0);
    });
});
