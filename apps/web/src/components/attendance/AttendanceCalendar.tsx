import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    getAttendance,
    upsertAttendance,
    deleteAttendance,
    type AttendanceRecord,
    type AttendanceStatus,
    type MonthlyAttendanceSummary,
    calculateMonthlyAttendance,
} from '../../lib/attendance';
import { getOrCreateLeaveBalance, recalculateLeaveUsage, type LeaveBalance } from '../../lib/leaves';
import '../../styles/attendance.css';

interface AttendanceCalendarProps {
    employeeId: string;
}

type PopupPosition = { top: number; left: number };

export function AttendanceCalendar({ employeeId }: AttendanceCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
    const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Popup state
    const [popupDay, setPopupDay] = useState<number | null>(null);
    const [popupPos, setPopupPos] = useState<PopupPosition>({ top: 0, left: 0 });

    // Toast state
    const [toast, setToast] = useState<string | null>(null);
    const [toastExiting, setToastExiting] = useState(false);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const calendarRef = useRef<HTMLDivElement>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    useEffect(() => {
        loadData();
    }, [employeeId, year, month]);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setPopupDay(null);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [data, stats, balance] = await Promise.all([
                getAttendance(employeeId, month, year),
                calculateMonthlyAttendance(employeeId, month, year),
                getOrCreateLeaveBalance(employeeId, year),
            ]);
            setRecords(data);
            setSummary(stats);
            setLeaveBalance(balance);
        } catch (err) {
            console.error('Failed to load attendance:', err);
        } finally {
            setLoading(false);
        }
    }

    function getDaysInMonth(y: number, m: number) {
        return new Date(y, m, 0).getDate();
    }

    function getStartDayOfWeek(y: number, m: number) {
        return new Date(y, m - 1, 1).getDay();
    }

    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getStartDayOfWeek(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    function getDateStr(day: number) {
        return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }

    function getRecordForDay(day: number) {
        const dateStr = getDateStr(day);
        return records.find((r) => r.date === dateStr);
    }

    const showToast = useCallback((message: string) => {
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        setToastExiting(false);
        setToast(message);
        toastTimerRef.current = setTimeout(() => {
            setToastExiting(true);
            setTimeout(() => setToast(null), 200);
        }, 2000);
    }, []);

    function handleDayClick(day: number, e: React.MouseEvent<HTMLDivElement>) {
        if (saving) return;
        const cellRect = e.currentTarget.getBoundingClientRect();
        const calRect = calendarRef.current?.getBoundingClientRect();
        if (!calRect) return;

        let top = cellRect.bottom - calRect.top + 4;
        let left = cellRect.left - calRect.left;
        if (left + 180 > calRect.width) left = calRect.width - 185;
        if (top + 280 > calRect.height) top = cellRect.top - calRect.top - 280;

        setPopupPos({ top, left });
        setPopupDay(popupDay === day ? null : day);
    }

    /**
     * Mark attendance with a specific status and leave_type.
     * If status is on_leave or half_day, leave_type must be 'casual' or 'sick'.
     */
    async function handleMark(day: number, status: AttendanceStatus, leaveType: string | null = null) {
        setSaving(true);
        setPopupDay(null);
        try {
            const dateStr = getDateStr(day);
            await upsertAttendance({
                employee_id: employeeId,
                date: dateStr,
                status,
                leave_type: leaveType,
            } as any); // leave_type is in the DB + types
            // Recalculate leave balance if leave-related
            if (status === 'on_leave' || status === 'half_day') {
                await recalculateLeaveUsage(employeeId, year);
            }
            await loadData();

            const labels: Record<string, string> = {
                present: 'Present',
                on_leave: leaveType === 'sick' ? 'Sick Leave' : 'Casual Leave',
                half_day: leaveType === 'sick' ? 'Half Day (Sick)' : 'Half Day (Casual)',
                lop: 'Loss of Pay',
            };
            showToast(`✓ Marked ${labels[status] || status} for ${dateStr}`);
        } catch (err) {
            console.error('Failed to save attendance:', err);
            showToast('✗ Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    async function handleRemove(day: number) {
        setSaving(true);
        setPopupDay(null);
        try {
            const dateStr = getDateStr(day);
            const existingRecord = getRecordForDay(day);
            await deleteAttendance(employeeId, dateStr);
            if (existingRecord?.status === 'on_leave' || existingRecord?.status === 'half_day') {
                await recalculateLeaveUsage(employeeId, year);
            }
            await loadData();
            showToast(`✓ Removed attendance record for ${dateStr}`);
        } catch (err) {
            console.error('Failed to delete attendance:', err);
            showToast('✗ Failed to remove. Please try again.');
        } finally {
            setSaving(false);
        }
    }

    // Leave balance computations
    const casualRemaining = leaveBalance ? leaveBalance.casual_total - leaveBalance.casual_used : 0;
    const sickRemaining = leaveBalance ? leaveBalance.sick_total - leaveBalance.sick_used : 0;
    const totalRemaining = casualRemaining + sickRemaining;

    function renderDay(day: number) {
        const record = getRecordForDay(day);
        const isPopupOpen = popupDay === day;

        let statusClass = 'bg-gray-50';
        let statusLabel = '';

        if (record) {
            switch (record.status) {
                case 'present':
                    statusClass = 'bg-green-100 text-green-800 border-green-200';
                    statusLabel = 'P';
                    break;
                case 'absent':
                    statusClass = 'bg-red-100 text-red-800 border-red-200';
                    statusLabel = 'A';
                    break;
                case 'half_day':
                    statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-200';
                    statusLabel = record.leave_type === 'sick' ? 'HD-S' : 'HD-C';
                    break;
                case 'on_leave':
                    statusClass = record.leave_type === 'sick'
                        ? 'bg-teal-100 text-teal-800 border-teal-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200';
                    statusLabel = record.leave_type === 'sick' ? 'SL' : 'CL';
                    break;
                case 'lop':
                    statusClass = 'bg-orange-100 text-orange-800 border-orange-200';
                    statusLabel = 'LOP';
                    break;
                case 'holiday':
                    statusClass = 'bg-purple-100 text-purple-800 border-purple-200';
                    statusLabel = 'H';
                    break;
                case 'weekend':
                    statusClass = 'bg-gray-200 text-gray-600 border-gray-300';
                    statusLabel = 'W';
                    break;
            }
        } else {
            const d = new Date(year, month - 1, day);
            const dow = d.getDay();
            if (dow === 0 || dow === 6) {
                statusClass = 'bg-gray-100 text-gray-500';
                statusLabel = 'W';
            }
        }

        return (
            <div
                key={day}
                onClick={(e) => handleDayClick(day, e)}
                className={`attendance-day-cell p-2 border rounded min-h-[80px] flex flex-col ${statusClass} relative ${isPopupOpen ? 'active-cell' : ''}`}
            >
                <span className="font-semibold text-sm mb-1">{day}</span>
                {statusLabel && (
                    <span className="text-xs font-bold absolute top-2 right-2">{statusLabel}</span>
                )}
                {record?.check_in && (
                    <div className="text-xs mt-auto">
                        <div>In: {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {record.check_out && (
                            <div>Out: {new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        )}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative" ref={calendarRef}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                        Attendance — {monthName} {year}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Click any day to mark attendance</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentDate(new Date(year, month - 2, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">← Prev</button>
                    <button onClick={() => setCurrentDate(new Date(year, month, 1))} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600">Next →</button>
                </div>
            </div>

            {/* Leave Balance Bar */}
            {leaveBalance && (
                <div className="leave-balance-bar">
                    <div className="balance-item">
                        🏖️ Casual:
                        <span className="balance-value">{leaveBalance.casual_used}/{leaveBalance.casual_total}</span> used
                    </div>
                    <div className="balance-divider" />
                    <div className="balance-item">
                        🏥 Sick:
                        <span className="balance-value">{leaveBalance.sick_used}/{leaveBalance.sick_total}</span> used
                    </div>
                    <div className="balance-divider" />
                    <div className="balance-item">
                        📋 Remaining:
                        <span className="balance-value" style={{ color: totalRemaining <= 3 ? '#dc2626' : undefined }}>
                            {totalRemaining}
                        </span> days
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
                        <div className="text-xs text-green-700 font-medium">Present</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.leaveDays}</div>
                        <div className="text-xs text-blue-700 font-medium">On Leave</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{summary.halfDays}</div>
                        <div className="text-xs text-yellow-700 font-medium">Half Days</div>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 text-center">
                        <div className="text-2xl font-bold text-orange-600">{summary.lopDays}</div>
                        <div className="text-xs text-orange-700 font-medium">LOP Days</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                        <div className="text-2xl font-bold text-purple-600">{summary.holidays}</div>
                        <div className="text-xs text-purple-700 font-medium">Holidays</div>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2 uppercase">{d}</div>
                    ))}
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50 rounded opacity-50"></div>
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => renderDay(i + 1))}
                </div>
            )}

            {/* Status Popup */}
            {popupDay !== null && (
                <>
                    <div className="attendance-popup-backdrop" onClick={() => setPopupDay(null)} />
                    <div className="attendance-popup" style={{ top: popupPos.top, left: popupPos.left }}>
                        <div className="attendance-popup-header">{getDateStr(popupDay)}</div>

                        <button className="attendance-popup-option opt-present" onClick={() => handleMark(popupDay, 'present')}>
                            <span className="status-dot" /> ✅ Present
                        </button>

                        <div className="attendance-popup-divider" />

                        <button className="attendance-popup-option opt-on-leave" onClick={() => handleMark(popupDay, 'on_leave', 'casual')}>
                            <span className="status-dot" /> 🏖️ Casual Leave
                        </button>
                        <button className="attendance-popup-option opt-sick-leave" onClick={() => handleMark(popupDay, 'on_leave', 'sick')}>
                            <span className="status-dot" /> 🏥 Sick Leave
                        </button>

                        <div className="attendance-popup-divider" />

                        <button className="attendance-popup-option opt-half-day" onClick={() => handleMark(popupDay, 'half_day', 'casual')}>
                            <span className="status-dot" /> 🕐 Half Day (CL)
                        </button>
                        <button className="attendance-popup-option opt-half-day-sick" onClick={() => handleMark(popupDay, 'half_day', 'sick')}>
                            <span className="status-dot" /> 🕐 Half Day (SL)
                        </button>

                        <div className="attendance-popup-divider" />

                        <button className="attendance-popup-option opt-lop" onClick={() => handleMark(popupDay, 'lop')}>
                            <span className="status-dot" /> 💸 Loss of Pay
                        </button>

                        {getRecordForDay(popupDay) && (
                            <>
                                <div className="attendance-popup-divider" />
                                <button className="attendance-popup-option opt-remove" onClick={() => handleRemove(popupDay)}>
                                    <span className="status-dot" /> 🗑️ Remove
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}

            {/* Toast */}
            {toast && (
                <div className={`attendance-toast ${toastExiting ? 'toast-exit' : ''}`}>{toast}</div>
            )}
        </div>
    );
}
