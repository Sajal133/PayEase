import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type LeaveBalance = Database['public']['Tables']['leave_balances']['Row'];

/**
 * Get leave balance for an employee for a given year.
 * Auto-creates a row with defaults (24 CL, 6 SL) if none exists.
 */
export async function getOrCreateLeaveBalance(
    employeeId: string,
    year: number
): Promise<LeaveBalance> {
    const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', year)
        .maybeSingle();

    if (error) throw error;

    if (data) return data;

    // Auto-create with defaults
    const { data: created, error: createErr } = await supabase
        .from('leave_balances')
        .insert({ employee_id: employeeId, year })
        .select()
        .single();

    if (createErr) throw createErr;
    return created;
}

/**
 * Get leave balance (read-only, returns null if not found).
 */
export async function getLeaveBalance(
    employeeId: string,
    year: number
): Promise<LeaveBalance | null> {
    const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('year', year)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Recalculate leave usage from actual attendance records for the year.
 * Uses `leave_type` column to differentiate casual vs sick leave.
 * - on_leave with leave_type='casual' → casual_used += 1
 * - on_leave with leave_type='sick' → sick_used += 1
 * - half_day with leave_type='casual' → casual_used += 0.5
 * - half_day with leave_type='sick' → sick_used += 0.5
 */
export async function recalculateLeaveUsage(
    employeeId: string,
    year: number
): Promise<LeaveBalance> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const { data: records, error: fetchErr } = await supabase
        .from('attendance')
        .select('status, leave_type, date')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['on_leave', 'half_day']);

    if (fetchErr) throw fetchErr;

    let casualUsed = 0;
    let sickUsed = 0;

    for (const r of records || []) {
        const increment = r.status === 'on_leave' ? 1 : 0.5; // half_day = 0.5
        if (r.leave_type === 'sick') {
            sickUsed += increment;
        } else {
            // Default to casual if leave_type is null or 'casual'
            casualUsed += increment;
        }
    }

    // Ensure balance row exists
    const balance = await getOrCreateLeaveBalance(employeeId, year);

    // Update with recalculated values
    const { data: updated, error: updateErr } = await supabase
        .from('leave_balances')
        .update({
            casual_used: casualUsed,
            sick_used: sickUsed,
            updated_at: new Date().toISOString(),
        })
        .eq('id', balance.id)
        .select()
        .single();

    if (updateErr) throw updateErr;
    return updated;
}
