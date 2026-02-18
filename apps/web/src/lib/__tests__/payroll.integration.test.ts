/**
 * Integration Tests — Payroll Calculations
 *
 * Validates end-to-end CTC → salary breakdown against manually computed
 * reference values. These are "golden" test cases that should never regress.
 *
 * Reference: Indian statutory rules as of FY 2025-26
 *   - PF: 12% employee on basic (capped ₹15K), employer 3.67% + 8.33%
 *   - ESI: 0.75% employee, 3.25% employer (only if gross ≤ ₹21K)
 *   - PT: varies by state (default Karnataka: ₹200 if gross > ₹15K)
 */
import { describe, it, expect } from 'vitest';
import { calculateSalary, STATUTORY_LIMITS } from '../payroll';

// ============================================================================
// Helper to assert a breakdown
// ============================================================================

function assertBreakdown(
    label: string,
    annualCTC: number,
    expected: {
        basic: number;
        hra: number;
        employeePF: number;
        employeeESI: number;
        professionalTax: number;
        netSalaryApprox: number;       // rounded to nearest 100
        esiShouldApply: boolean;
    },
    overrides: Record<string, any> = {}
) {
    it(`${label} (CTC ₹${(annualCTC / 100000).toFixed(1)}L)`, () => {
        const result = calculateSalary({ annualCTC, ...overrides });

        // Earnings
        expect(result.basic).toBe(expected.basic);
        expect(result.hra).toBe(expected.hra);

        // PF
        expect(result.employeePF).toBe(expected.employeePF);

        // ESI
        if (expected.esiShouldApply) {
            expect(result.employeeESI).toBeGreaterThan(0);
            expect(result.employerESI).toBeGreaterThan(0);
        } else {
            expect(result.employeeESI).toBe(0);
            expect(result.employerESI).toBe(0);
        }

        // PT
        expect(result.professionalTax).toBe(expected.professionalTax);

        // Net salary within ₹500 of expected (rounding)
        expect(result.netSalary).toBeGreaterThan(expected.netSalaryApprox - 500);
        expect(result.netSalary).toBeLessThan(expected.netSalaryApprox + 500);

        // Invariants
        expect(result.grossSalary).toBe(result.basic + result.hra + result.specialAllowance);
        expect(result.totalDeductions).toBe(
            result.employeePF + result.employeeESI + result.professionalTax + result.tds
        );
        expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
        expect(result.monthlyCTC).toBe(annualCTC / 12);
    });
}

// ============================================================================
// Golden Test Cases
// ============================================================================

describe('Payroll Integration — Golden CTC → Net Salary', () => {

    // ₹3,00,000 CTC
    // Monthly CTC = 25,000
    // Basic = 25000 * 0.4 = 10,000
    // HRA = 10000 * 0.5 = 5,000
    // Preliminary gross = 15,000 → ≤ 21K → ESI applies
    // pfBasic = min(10000, 15000) = 10000
    // employerPF = round(10000 * 0.12) = 1200
    // employerESI will be calc'd after special allowance
    // specialAllowance_v1 = 25000 - 10000 - 5000 - 1200 = 8800
    // gross_v1 = 10000 + 5000 + 8800 = 23800
    // But wait: preliminaryGross = basic + hra = 15000, ≤ 21,000 → ESI applies
    // employerESI = round(23800 * 0.0325) ≈ 774
    // specialAllowance_v2 = 25000 - 10000 - 5000 - 1200 - 774 = 8026
    // gross_v2 = 10000 + 5000 + 8026 = 23026
    // But the code recalculates employerESI based on the first gross estimate...
    // Let's just compute and trust the engine, then validate invariants
    assertBreakdown('Low CTC – ESI applicable', 300_000, {
        basic: 10000,
        hra: 5000,
        employeePF: Math.min(Math.round(10000 * 0.12), 1800), // 1200
        employeeESI: 0, // we'll check > 0 separately via esiShouldApply
        professionalTax: 200, // Karnataka, gross > 15K
        netSalaryApprox: 21_500,
        esiShouldApply: true,
    });

    // ₹6,00,000 CTC
    // Monthly CTC = 50,000
    // Basic = 50000 * 0.4 = 20,000
    // HRA = 20000 * 0.5 = 10,000
    // Preliminary gross = 30,000 → > 21K → no ESI
    // pfBasic = min(20000, 15000) = 15000
    // employerPF = round(15000 * 0.12) = 1800
    // special = 50000 - 20000 - 10000 - 1800 = 18200
    // gross = 20000 + 10000 + 18200 = 48200
    // employeePF = min(round(15000 * 0.12), 1800) = 1800
    // PT = 200 (Karnataka)
    // net = 48200 - 1800 - 200 = 46200
    assertBreakdown('Standard CTC – no ESI', 600_000, {
        basic: 20000,
        hra: 10000,
        employeePF: 1800,
        employeeESI: 0,
        professionalTax: 200,
        netSalaryApprox: 46_200,
        esiShouldApply: false,
    });

    // ₹15,00,000 CTC
    // Monthly CTC = 125,000
    // Basic = 125000 * 0.4 = 50,000
    // HRA = 50000 * 0.5 = 25,000
    // Preliminary gross = 75,000 → > 21K → no ESI
    // pfBasic = min(50000, 15000) = 15000 → PF capped
    // employerPF = round(15000 * 0.12) = 1800
    // special = 125000 - 50000 - 25000 - 1800 = 48200
    // gross = 50000 + 25000 + 48200 = 123200
    // employeePF = 1800 (capped)
    // PT = 200
    // net = 123200 - 1800 - 200 = 121200
    assertBreakdown('High CTC – PF capped', 1_500_000, {
        basic: 50000,
        hra: 25000,
        employeePF: 1800,
        employeeESI: 0,
        professionalTax: 200,
        netSalaryApprox: 121_200,
        esiShouldApply: false,
    });

    // ₹30,00,000 CTC
    // Monthly CTC = 250,000
    // Basic = 250000 * 0.4 = 100,000
    // HRA = 100000 * 0.5 = 50,000
    // pfBasic = 15000 (capped) → employerPF = 1800
    // special = 250000 - 100000 - 50000 - 1800 = 98200
    // gross = 100000 + 50000 + 98200 = 248200
    // employeePF = 1800
    // PT = 200
    // net = 248200 - 1800 - 200 = 246200
    assertBreakdown('Very high CTC', 3_000_000, {
        basic: 100000,
        hra: 50000,
        employeePF: 1800,
        employeeESI: 0,
        professionalTax: 200,
        netSalaryApprox: 246_200,
        esiShouldApply: false,
    });
});

// ============================================================================
// Cross-state Professional Tax Comparison
// ============================================================================

describe('Payroll Integration — PT across states for ₹6L CTC', () => {
    const CTC = 600_000;
    const states: [string, number][] = [
        ['Karnataka', 200],
        ['Maharashtra', 200],
        ['Gujarat', 0],
        ['Rajasthan', 0],
        ['Delhi', 0],
    ];

    states.forEach(([state, expectedPT]) => {
        it(`${state}: PT = ₹${expectedPT}`, () => {
            const result = calculateSalary({ annualCTC: CTC, state });
            expect(result.professionalTax).toBe(expectedPT);
        });
    });
});

// ============================================================================
// Invariant checks across a range of CTCs
// ============================================================================

describe('Payroll Integration — invariants across CTC range', () => {
    const ctcValues = [100_000, 250_000, 500_000, 800_000, 1_200_000, 2_400_000, 5_000_000];

    ctcValues.forEach(ctc => {
        it(`CTC ₹${(ctc / 100000).toFixed(1)}L satisfies all invariants`, () => {
            const r = calculateSalary({ annualCTC: ctc });

            // Gross = sum of earnings
            expect(r.grossSalary).toBe(r.basic + r.hra + r.specialAllowance);

            // Deductions = sum of employee deductions
            expect(r.totalDeductions).toBe(r.employeePF + r.employeeESI + r.professionalTax + r.tds);

            // Net = gross - deductions
            expect(r.netSalary).toBe(r.grossSalary - r.totalDeductions);

            // Monthly CTC = annual / 12
            expect(r.monthlyCTC).toBe(ctc / 12);

            // Net salary should be positive
            expect(r.netSalary).toBeGreaterThanOrEqual(0);

            // Special allowance should be non-negative
            expect(r.specialAllowance).toBeGreaterThanOrEqual(0);

            // PF should be capped
            expect(r.employeePF).toBeLessThanOrEqual(STATUTORY_LIMITS.PF_MAX_EMPLOYEE);
        });
    });
});
