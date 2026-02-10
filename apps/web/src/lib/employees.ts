import { supabase } from './supabase';
import type { Employee, InsertTables, UpdateTables } from '../types/supabase';

// ============================================================================
// Employee CRUD Operations
// ============================================================================

export interface GetEmployeesParams {
    company_id: string;
    status?: 'active' | 'inactive' | 'terminated';
    department?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface GetEmployeesResult {
    data: Employee[];
    count: number;
    page: number;
    totalPages: number;
}

/**
 * Get paginated list of employees with filters
 */
export async function getEmployees(params: GetEmployeesParams): Promise<GetEmployeesResult> {
    const { company_id, status, department, search, page = 1, limit = 20 } = params;

    let query = supabase
        .from('employees')
        .select('*', { count: 'exact' })
        .eq('company_id', company_id)
        .order('name', { ascending: true });

    if (status) {
        query = query.eq('status', status);
    }

    if (department) {
        query = query.eq('department', department);
    }

    if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) throw new Error(error.message);

    return {
        data: data || [],
        count: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
    };
}

/**
 * Get a single employee by ID
 */
export async function getEmployee(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw new Error(error.message);
    return data;
}

/**
 * Create a new employee
 */
export async function createEmployee(employee: InsertTables<'employees'>): Promise<Employee> {
    const { data, error } = await supabase
        .from('employees')
        .insert(employee)
        .select()
        .single();

    if (error) {
        const details = error.hint ? ` (${error.hint})` : '';
        throw new Error(`${error.message}${details}`);
    }
    return data;
}

/**
 * Update an existing employee
 */
export async function updateEmployee(id: string, updates: UpdateTables<'employees'>): Promise<Employee> {
    const { data, error } = await supabase
        .from('employees')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        const details = error.hint ? ` (${error.hint})` : '';
        throw new Error(`${error.message}${details}`);
    }
    return data;
}

/**
 * Soft delete an employee (set status to terminated)
 */
export async function deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
        .from('employees')
        .update({ status: 'terminated', updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) throw new Error(error.message);
}

/**
 * Hard delete an employee (permanent)
 */
export async function permanentlyDeleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Bulk create employees (for Excel import)
 */
export async function bulkCreateEmployees(employees: InsertTables<'employees'>[]): Promise<{
    success: Employee[];
    errors: { index: number; error: string }[];
}> {
    const success: Employee[] = [];
    const errors: { index: number; error: string }[] = [];

    for (let i = 0; i < employees.length; i++) {
        try {
            const employee = await createEmployee(employees[i]);
            success.push(employee);
        } catch (err) {
            errors.push({
                index: i,
                error: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    return { success, errors };
}

// ============================================================================
// Statistics & Aggregations
// ============================================================================

/**
 * Get employee statistics for dashboard
 */
export async function getEmployeeStats(company_id: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDepartment: Record<string, number>;
}> {
    const { data, error } = await supabase
        .from('employees')
        .select('status, department')
        .eq('company_id', company_id);

    if (error) throw new Error(error.message);

    const stats = {
        total: data?.length || 0,
        active: data?.filter(e => e.status === 'active').length || 0,
        inactive: data?.filter(e => e.status !== 'active').length || 0,
        byDepartment: {} as Record<string, number>,
    };

    data?.forEach(emp => {
        if (emp.department) {
            stats.byDepartment[emp.department] = (stats.byDepartment[emp.department] || 0) + 1;
        }
    });

    return stats;
}

/**
 * Get unique departments for filter dropdown
 */
export async function getDepartments(company_id: string): Promise<string[]> {
    const { data, error } = await supabase
        .from('employees')
        .select('department')
        .eq('company_id', company_id)
        .not('department', 'is', null);

    if (error) throw new Error(error.message);

    const departments = [...new Set(data?.map(e => e.department).filter(Boolean))];
    return departments as string[];
}
