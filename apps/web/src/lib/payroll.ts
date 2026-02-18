import { supabase } from './supabase';
import type { Database } from '../types/supabase';
import { calculateMonthlyAttendance } from './attendance';

type SalaryStructure = Database['public']['Tables']['salary_structures']['Row'];
type PayrollRun = Database['public']['Tables']['payroll_runs']['Row'];
type PayrollItem = Database['public']['Tables']['payroll_items']['Row'];
type Employee = Database['public']['Tables']['employees']['Row'];

// ============================================================================
// Constants - Indian Statutory Limits
// ============================================================================

export const STATUTORY_LIMITS = {
    PF_BASIC_CAP: 15000,           // PF calculated on max ₹15,000 Basic
    PF_EMPLOYEE_RATE: 0.12,        // 12%
    PF_EMPLOYER_EPF_RATE: 0.0367,  // 3.67%
    PF_EMPLOYER_EPS_RATE: 0.0833,  // 8.33%
    PF_MAX_EMPLOYEE: 1800,         // Max ₹1,800/month

    ESI_GROSS_LIMIT: 21000,        // ESI only if gross ≤ ₹21,000
    ESI_EMPLOYEE_RATE: 0.0075,     // 0.75%
    ESI_EMPLOYER_RATE: 0.0325,     // 3.25%

    PT_DEFAULT: 200,               // Default PT (Karnataka, Maharashtra)
};

// ============================================================================
// Types
// ============================================================================

export interface SalaryBreakdown {
    // Earnings
    basic: number;
    hra: number;
    specialAllowance: number;
    grossSalary: number;

    // Employer Contributions (not deducted from employee)
    employerPF: number;
    employerESI: number;

    // Employee Deductions
    employeePF: number;
    employeeESI: number;
    professionalTax: number;
    tds: number;

    // Net
    totalDeductions: number;
    netSalary: number;

    // CTC
    monthlyCTC: number;
    annualCTC: number;

    // Attendance
    lopDays: number;
    daysInMonth: number;
    paidDays: number;
}

export interface SalaryConfig {
    annualCTC: number;
    basicPercentage?: number;  // Default 40%
    hraPercentage?: number;    // Default 50% of Basic
    pfEnabled?: boolean;       // Default true
    esiEnabled?: boolean;      // Auto-calculated based on gross
    ptEnabled?: boolean;       // Default true
    state?: string;            // For PT calculation
    lopDays?: number;          // Loss of Pay days
    daysInMonth?: number;      // Total days in month (default 30)
}

// ============================================================================
// Salary Calculation Engine
// ============================================================================

/**
 * Calculate monthly salary breakdown from annual CTC
 */
export function calculateSalary(config: SalaryConfig): SalaryBreakdown {
    const {
        annualCTC,
        basicPercentage = 40,
        hraPercentage = 50,
        pfEnabled = true,
        ptEnabled = true,
        esiEnabled = true,
        state = 'Karnataka',
        lopDays = 0,
        daysInMonth = 30,
    } = config;

    // Proration Factor
    // Ensure we don't divide by zero or have negative paid days
    const safeDaysInMonth = Math.max(1, daysInMonth);
    const paidDays = Math.max(0, safeDaysInMonth - Math.max(0, lopDays));
    const prorataFactor = paidDays / safeDaysInMonth;

    const monthlyCTC = annualCTC / 12;

    // Step 1: Calculate Full Monthly Components
    const fullBasic = monthlyCTC * (basicPercentage / 100);
    const fullHRA = fullBasic * (hraPercentage / 100);

    // Step 2: Apply Proration to Earnings
    const basic = Math.round(fullBasic * prorataFactor);
    const hra = Math.round(fullHRA * prorataFactor);

    // Step 3: Calculate Employer Contributions on Earned Basic
    const pfBasic = Math.min(basic, STATUTORY_LIMITS.PF_BASIC_CAP);
    const employerPF = pfEnabled
        ? Math.round(pfBasic * (STATUTORY_LIMITS.PF_EMPLOYER_EPF_RATE + STATUTORY_LIMITS.PF_EMPLOYER_EPS_RATE))
        : 0;

    // Step 4: Calculate Preliminary Gross for components
    // const preliminaryGross = basic + hra; // Deprecated check

    // Step 5: Special Allowance & ESI Logic
    // ESI Eligibility is based on Gross Wages (Basic + HRA + Special + etc)
    // We first estimate Gross assuming NO ESI to check eligibility.
    // Estimated Gross = Prorated CTC - Employer PF

    const proratedMonthlyCTC = monthlyCTC * prorataFactor;
    const estimatedGross = proratedMonthlyCTC - employerPF;

    // Check ESI applicability
    // Note: If estimatedGross > 21000, ESI definitely doesn't apply.
    // If estimatedGross <= 21000, ESI applies, and the actual gross will be slightly lower 
    // due to Employer ESI deduction from CTC.
    const esiApplicable = esiEnabled && (estimatedGross <= STATUTORY_LIMITS.ESI_GROSS_LIMIT);

    // First pass: Calculate breakdown
    let grossSalary: number;
    let specialAllowance: number;
    let employerESI = 0;

    if (esiApplicable) {
        // If ESI applies:
        // MonthlyCTC = Gross + EmployerPF + EmployerESI
        // MonthlyCTC = Gross + EmployerPF + (Gross * 3.25%)
        // MonthlyCTC - EmployerPF = Gross * 1.0325
        // Gross = (MonthlyCTC - EmployerPF) / 1.0325

        grossSalary = Math.round((proratedMonthlyCTC - employerPF) / (1 + STATUTORY_LIMITS.ESI_EMPLOYER_RATE));
        employerESI = Math.round(grossSalary * STATUTORY_LIMITS.ESI_EMPLOYER_RATE);

        // Back-calculate Special Allowance
        // Gross = Basic + HRA + Special
        specialAllowance = grossSalary - basic - hra;
    } else {
        // No ESI
        grossSalary = estimatedGross; // actually needs rounding?
        // Let's recalculate precisely
        specialAllowance = proratedMonthlyCTC - basic - hra - employerPF;
        // Gross is derived
        grossSalary = basic + hra + specialAllowance;
    }

    // Safety check for negative special allowance
    if (specialAllowance < 0) {
        specialAllowance = 0;
        grossSalary = basic + hra + specialAllowance;
        // If special became 0, we might need to recalc Employer ESI if it was applicable, 
        // but let's assume CTC is high enough to cover statutory or we accept the deviation.
    }

    // Step 6: Employee Deductions
    const employeePF = pfEnabled
        ? Math.min(Math.round(pfBasic * STATUTORY_LIMITS.PF_EMPLOYEE_RATE), STATUTORY_LIMITS.PF_MAX_EMPLOYEE)
        : 0;

    const employeeESI = esiApplicable
        ? Math.round(grossSalary * STATUTORY_LIMITS.ESI_EMPLOYEE_RATE)
        : 0;

    const professionalTax = ptEnabled ? getProfessionalTax(grossSalary, state) : 0;

    // TDS calculation is complex, simplified for now
    const tds = 0; // TODO: Implement proper TDS calculation based on declared investments

    // Step 7: Calculate Net Salary
    const totalDeductions = employeePF + employeeESI + professionalTax + tds;
    const netSalary = grossSalary - totalDeductions;

    return {
        basic,
        hra,
        specialAllowance,
        grossSalary,
        employerPF,
        employerESI,
        employeePF,
        employeeESI,
        professionalTax,
        tds,
        totalDeductions,
        netSalary,
        monthlyCTC,
        annualCTC,
        lopDays,
        daysInMonth,
        paidDays,
    };
}

/**
 * Get Professional Tax based on state and salary
 */
function getProfessionalTax(grossSalary: number, state: string): number {
    const PT_RATES: Record<string, (salary: number) => number> = {
        'Karnataka': (s) => s > 15000 ? 200 : 0,
        'Maharashtra': (s) => s > 10000 ? 200 : s > 7500 ? 175 : 0,
        'Tamil Nadu': (s) => s > 21000 ? 208 : s > 15000 ? 180 : s > 12500 ? 115 : 0,
        'Telangana': (s) => s > 15000 ? 200 : 0,
        'Gujarat': () => 0, // No PT in Gujarat
        'Rajasthan': () => 0,
        'Delhi': () => 0,
    };

    const calculator = PT_RATES[state] || PT_RATES['Karnataka'];
    return calculator(grossSalary);
}

// ============================================================================
// Salary Structure CRUD
// ============================================================================

export async function getSalaryStructures(companyId: string): Promise<SalaryStructure[]> {
    const { data, error } = await supabase
        .from('salary_structures')
        .select('*')
        .eq('company_id', companyId)
        .order('name');

    if (error) throw error;
    return data || [];
}

export async function createSalaryStructure(
    structure: Database['public']['Tables']['salary_structures']['Insert']
): Promise<SalaryStructure> {
    const { data, error } = await supabase
        .from('salary_structures')
        .insert(structure)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateSalaryStructure(
    id: string,
    updates: Database['public']['Tables']['salary_structures']['Update']
): Promise<SalaryStructure> {
    const { data, error } = await supabase
        .from('salary_structures')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// ============================================================================
// Payroll Run Operations
// ============================================================================

export interface RunPayrollParams {
    companyId: string;
    month: number;  // 1-12
    year: number;
}

export interface PayrollRunResult {
    payrollRun: PayrollRun;
    items: PayrollItem[];
    summary: {
        totalEmployees: number;
        totalGross: number;
        totalDeductions: number;
        totalNet: number;
    };
}

/**
 * Run payroll for all active employees in a company
 */
export async function runPayroll(params: RunPayrollParams): Promise<PayrollRunResult> {
    const { companyId, month, year } = params;

    // 1. Get all active employees
    const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('company_id', companyId)
        .eq('status', 'active');

    if (empError) throw empError;
    if (!employees || employees.length === 0) {
        throw new Error('No active employees found');
    }

    // 2. Delete any existing payroll run for this month (handles re-runs)
    const { data: existingRuns } = await supabase
        .from('payroll_runs')
        .select('id')
        .eq('company_id', companyId)
        .eq('month', month)
        .eq('year', year);

    if (existingRuns && existingRuns.length > 0) {
        for (const run of existingRuns) {
            await supabase.from('payroll_items').delete().eq('payroll_run_id', run.id);
            await supabase.from('payroll_runs').delete().eq('id', run.id);
        }
    }

    // 3. Create payroll run
    const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .insert({
            company_id: companyId,
            month,
            year,
            status: 'draft',
            total_employees: employees.length,
            total_gross: 0,
            total_deductions: 0,
            total_net: 0,
        })
        .select()
        .single();

    if (runError) throw runError;

    // 4. Calculate and create payroll items for each employee
    const items: PayrollItem[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    try {
        for (const emp of employees) {
            // Fetch attendance for this employee for the payroll month
            const attendance = await calculateMonthlyAttendance(emp.id, month, year);
            const daysInMonth = new Date(year, month, 0).getDate();

            const breakdown = calculateSalary({
                annualCTC: emp.ctc,
                lopDays: attendance.lopDays,
                daysInMonth,
            });

            const { data: item, error: itemError } = await supabase
                .from('payroll_items')
                .insert({
                    payroll_run_id: payrollRun.id,
                    employee_id: emp.id,
                    basic: breakdown.basic,
                    hra: breakdown.hra,
                    special_allowance: breakdown.specialAllowance,
                    gross_salary: breakdown.grossSalary,
                    pf_employee: breakdown.employeePF,
                    pf_employer: breakdown.employerPF,
                    esi_employee: breakdown.employeeESI,
                    esi_employer: breakdown.employerESI,
                    professional_tax: breakdown.professionalTax,
                    tds: breakdown.tds,
                    total_deductions: breakdown.totalDeductions,
                    net_salary: breakdown.netSalary,
                    lop_days: Math.round(breakdown.lopDays),
                    days_worked: Math.round(breakdown.paidDays),
                })
                .select()
                .single();

            if (itemError) throw itemError;
            items.push(item);

            totalGross += breakdown.grossSalary;
            totalDeductions += breakdown.totalDeductions;
            totalNet += breakdown.netSalary;
        }
    } catch (err) {
        // Clean up the partial payroll run so re-runs aren't blocked
        await supabase.from('payroll_items').delete().eq('payroll_run_id', payrollRun.id);
        await supabase.from('payroll_runs').delete().eq('id', payrollRun.id);
        throw err;
    }

    // 5. Update payroll run with totals
    await supabase
        .from('payroll_runs')
        .update({
            total_gross: totalGross,
            total_deductions: totalDeductions,
            total_net: totalNet,
        })
        .eq('id', payrollRun.id);

    return {
        payrollRun: { ...payrollRun, total_gross: totalGross, total_deductions: totalDeductions, total_net: totalNet },
        items,
        summary: {
            totalEmployees: employees.length,
            totalGross,
            totalDeductions,
            totalNet,
        },
    };
}

/**
 * Get payroll runs for a company
 */
export async function getPayrollRuns(companyId: string): Promise<PayrollRun[]> {
    const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('company_id', companyId)
        .order('year', { ascending: false })
        .order('month', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get payroll items for a specific run
 */
export async function getPayrollItems(payrollRunId: string): Promise<PayrollItem[]> {
    const { data, error } = await supabase
        .from('payroll_items')
        .select('*, employees(name, email, employee_id)')
        .eq('payroll_run_id', payrollRunId);

    if (error) throw error;
    return data || [];
}

/**
 * Update payroll run status
 */
export async function updatePayrollStatus(
    payrollRunId: string,
    status: 'draft' | 'processing' | 'finalized' | 'paid'
): Promise<void> {
    const { error } = await supabase
        .from('payroll_runs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', payrollRunId);

    if (error) throw error;
}
