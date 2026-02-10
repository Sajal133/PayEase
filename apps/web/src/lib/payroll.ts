import { supabase } from './supabase';
import type { Database } from '../types/supabase';

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
}

export interface SalaryConfig {
    annualCTC: number;
    basicPercentage?: number;  // Default 40%
    hraPercentage?: number;    // Default 50% of Basic
    pfEnabled?: boolean;       // Default true
    esiEnabled?: boolean;      // Auto-calculated based on gross
    ptEnabled?: boolean;       // Default true
    state?: string;            // For PT calculation
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
        state = 'Karnataka',
    } = config;

    const monthlyCTC = annualCTC / 12;

    // Step 1: Calculate Basic
    const basic = Math.round(monthlyCTC * (basicPercentage / 100));

    // Step 2: Calculate HRA (% of Basic)
    const hra = Math.round(basic * (hraPercentage / 100));

    // Step 3: Calculate Employer Contributions
    const pfBasic = Math.min(basic, STATUTORY_LIMITS.PF_BASIC_CAP);
    const employerPF = pfEnabled
        ? Math.round(pfBasic * (STATUTORY_LIMITS.PF_EMPLOYER_EPF_RATE + STATUTORY_LIMITS.PF_EMPLOYER_EPS_RATE))
        : 0;

    // Step 4: Calculate Gross (before ESI check)
    const preliminaryGross = basic + hra;

    // Step 5: Calculate Special Allowance
    // CTC = Basic + HRA + Special + Employer PF + Employer ESI
    // Special = CTC - Basic - HRA - Employer PF - (Employer ESI if applicable)
    const esiApplicable = preliminaryGross <= STATUTORY_LIMITS.ESI_GROSS_LIMIT;

    // First pass: estimate special allowance without ESI
    let specialAllowance = monthlyCTC - basic - hra - employerPF;
    let grossSalary = basic + hra + specialAllowance;

    // Check if ESI should apply now
    const employerESI = esiApplicable
        ? Math.round(grossSalary * STATUTORY_LIMITS.ESI_EMPLOYER_RATE)
        : 0;

    // Recalculate special allowance with ESI
    specialAllowance = monthlyCTC - basic - hra - employerPF - employerESI;
    if (specialAllowance < 0) specialAllowance = 0;
    grossSalary = basic + hra + specialAllowance;

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

    // 2. Create payroll run
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

    // 3. Calculate and create payroll items for each employee
    const items: PayrollItem[] = [];
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const emp of employees) {
        const breakdown = calculateSalary({ annualCTC: emp.ctc });

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
            })
            .select()
            .single();

        if (itemError) throw itemError;
        items.push(item);

        totalGross += breakdown.grossSalary;
        totalDeductions += breakdown.totalDeductions;
        totalNet += breakdown.netSalary;
    }

    // 4. Update payroll run with totals
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
    status: 'draft' | 'processing' | 'completed' | 'paid'
): Promise<void> {
    const { error } = await supabase
        .from('payroll_runs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', payrollRunId);

    if (error) throw error;
}
