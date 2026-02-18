import { supabase } from './supabase';
import type { Database } from '../types/supabase';

export type AttendanceRecord = Database['public']['Tables']['attendance']['Row'];
export type AttendanceStatus = Database['public']['Enums']['attendance_status'];

export interface MonthlyAttendanceSummary {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    halfDays: number;
    holidays: number;
    weekends: number;
    lopDays: number; // Loss of Pay days
}

export const ATTENDANCE_STATUSES: AttendanceStatus[] = [
    'present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend'
];

/**
 * Get attendance records for an employee for a specific month
 */
export async function getAttendance(
    employeeId: string,
    month: number,
    year: number
): Promise<AttendanceRecord[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

    if (error) throw error;
    return data || [];
}

/**
 * Calculate attendance summary for payroll
 */
export async function calculateMonthlyAttendance(
    employeeId: string,
    month: number,
    year: number
): Promise<MonthlyAttendanceSummary> {
    const records = await getAttendance(employeeId, month, year);
    const daysInMonth = new Date(year, month, 0).getDate();

    const summary: MonthlyAttendanceSummary = {
        totalDays: daysInMonth,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        halfDays: 0,
        holidays: 0,
        weekends: 0,
        lopDays: 0
    };

    // Create a map for easy lookup
    const recordMap = new Map<string, AttendanceRecord>();
    records.forEach(r => recordMap.set(r.date, r));

    for (let day = 1; day <= daysInMonth; day++) {
        const date = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const record = recordMap.get(date);

        // Default to 'present' if checking mostly, but usually we default to 'absent' or 'weekend' if no record?
        // For now, assume if no record, it needs filling or is treated as absent/holiday depending on policy.
        // Let's assume strict recording: No record = Absent (or we need a default).
        // BUT, system might auto-fill weekends.

        if (!record) {
            // Check if weekend
            const d = new Date(year, month - 1, day);
            const dayOfWeek = d.getDay();
            if (dayOfWeek === 0 || dayOfWeek === 6) { // Sun=0, Sat=6
                summary.weekends++;
            } else {
                summary.absentDays++; // No record = Absent
                summary.lopDays++;
            }
            continue;
        }

        switch (record.status) {
            case 'present':
                summary.presentDays++;
                break;
            case 'absent':
                summary.absentDays++;
                summary.lopDays++;
                break;
            case 'half_day':
                summary.halfDays++;
                summary.lopDays += 0.5;
                summary.presentDays += 0.5;
                break;
            case 'on_leave':
                summary.leaveDays++;
                // Check if paid leave or LOP? 
                // Creating leave management later. For now assume paid leave unless marked absent.
                // If status is 'leave', it's usually authorized paid leave.
                break;
            case 'holiday':
                summary.holidays++;
                break;
            case 'weekend':
                summary.weekends++;
                break;
        }
    }

    return summary;
}

/**
 * Upsert attendance record
 */
export async function upsertAttendance(
    record: Database['public']['Tables']['attendance']['Insert']
) {
    const { data, error } = await supabase
        .from('attendance')
        .upsert(record, { onConflict: 'employee_id,date' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Bulk upsert attendance (for CSV upload)
 */
export async function bulkUpsertAttendance(
    records: Database['public']['Tables']['attendance']['Insert'][]
) {
    const { data, error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'employee_id,date' })
        .select();

    if (error) throw error;
    return data;
}
