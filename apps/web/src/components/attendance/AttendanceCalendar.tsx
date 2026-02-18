import React, { useState, useEffect } from 'react';
import { getAttendance, type AttendanceRecord, type MonthlyAttendanceSummary, calculateMonthlyAttendance } from '../../lib/attendance';
import { useAuth } from '../../contexts/AuthContext';

interface AttendanceCalendarProps {
    employeeId: string;
}

export function AttendanceCalendar({ employeeId }: AttendanceCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const { company } = useAuth(); // Assuming we might need company context later

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12

    useEffect(() => {
        loadData();
    }, [employeeId, year, month]);

    async function loadData() {
        setLoading(true);
        try {
            const [data, stats] = await Promise.all([
                getAttendance(employeeId, month, year),
                calculateMonthlyAttendance(employeeId, month, year)
            ]);
            setRecords(data);
            setSummary(stats);
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
        // 0 = Sunday, 1 = Monday...
        return new Date(y, m - 1, 1).getDay();
    }

    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getStartDayOfWeek(year, month);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    // Helper to get record for a specific day
    function getRecordForDay(day: number) {
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        return records.find(r => r.date === dateStr);
    }

    function renderDay(day: number) {
        const record = getRecordForDay(day);

        let statusClass = 'bg-gray-50'; // Default / Empty
        let statusLabel = '';

        if (record) {
            switch (record.status) {
                case 'present': statusClass = 'bg-green-100 text-green-800 border-green-200'; statusLabel = 'P'; break;
                case 'absent': statusClass = 'bg-red-100 text-red-800 border-red-200'; statusLabel = 'A'; break;
                case 'half_day': statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'; statusLabel = 'HD'; break;
                case 'on_leave': statusClass = 'bg-blue-100 text-blue-800 border-blue-200'; statusLabel = 'L'; break;
                case 'holiday': statusClass = 'bg-purple-100 text-purple-800 border-purple-200'; statusLabel = 'H'; break;
                case 'weekend': statusClass = 'bg-gray-200 text-gray-600 border-gray-300'; statusLabel = 'W'; break;
            }
        } else {
            // Check if weekend
            const d = new Date(year, month - 1, day);
            const dow = d.getDay();
            if (dow === 0 || dow === 6) {
                statusClass = 'bg-gray-100 text-gray-500';
                statusLabel = 'W';
            }
        }

        return (
            <div key={day} className={`p-2 border rounded min-h-[80px] flex flex-col ${statusClass} relative`}>
                <span className="font-semibold text-sm mb-1">{day}</span>
                {statusLabel && (
                    <span className="text-xs font-bold absolute top-2 right-2">{statusLabel}</span>
                )}
                {record?.check_in && (
                    <div className="text-xs mt-auto">
                        <div>In: {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        {record.check_out && <div>Out: {new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                    Attendance — {monthName} {year}
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentDate(new Date(year, month - 2, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        ← Prev
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date(year, month, 1))}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                    >
                        Next →
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                        <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
                        <div className="text-xs text-green-700 font-medium">Present</div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
                        <div className="text-2xl font-bold text-red-600">{summary.absentDays}</div>
                        <div className="text-xs text-red-700 font-medium">Absent</div>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-100 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{summary.halfDays}</div>
                        <div className="text-xs text-yellow-700 font-medium">Half Days</div>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                        <div className="text-2xl font-bold text-blue-600">{summary.leaveDays}</div>
                        <div className="text-xs text-blue-700 font-medium">Leaves</div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 text-center">
                        <div className="text-2xl font-bold text-purple-600">{summary.lopDays}</div>
                        <div className="text-xs text-purple-700 font-medium">LOP Days</div>
                    </div>
                </div>
            )}

            {/* Calendar Grid */}
            {loading ? (
                <div className="h-64 flex items-center justify-center text-gray-400">Loading...</div>
            ) : (
                <div className="grid grid-cols-7 gap-2">
                    {/* Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2 uppercase">
                            {d}
                        </div>
                    ))}

                    {/* Empty cells for start padding */}
                    {Array.from({ length: startDay }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-gray-50 rounded opacity-50"></div>
                    ))}

                    {/* Day cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => renderDay(i + 1))}
                </div>
            )}
        </div>
    );
}
