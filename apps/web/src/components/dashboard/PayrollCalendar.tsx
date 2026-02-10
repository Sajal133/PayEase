import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PayrollEvent {
    id: string;
    type: 'payroll_run' | 'payslip' | 'reminder';
    title: string;
    date: Date;
    status?: string;
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function PayrollCalendar() {
    const { company } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<PayrollEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    useEffect(() => {
        if (company?.id) {
            loadEvents();
        }
    }, [company?.id, currentMonth, currentYear]);

    async function loadEvents() {
        setLoading(true);
        try {
            // Get payroll runs for this month
            const { data: payrollRuns } = await supabase
                .from('payroll_runs')
                .select('*')
                .eq('company_id', company!.id)
                .eq('year', currentYear)
                .eq('month', currentMonth + 1);

            const calendarEvents: PayrollEvent[] = [];

            // Add payroll run events
            payrollRuns?.forEach(run => {
                if (run.processed_at) {
                    calendarEvents.push({
                        id: run.id,
                        type: 'payroll_run',
                        title: 'Payroll Processed',
                        date: new Date(run.processed_at),
                        status: run.status ?? undefined,
                    });
                }
                if (run.paid_at) {
                    calendarEvents.push({
                        id: `${run.id}-paid`,
                        type: 'payroll_run',
                        title: 'Salaries Paid',
                        date: new Date(run.paid_at),
                        status: 'paid',
                    });
                }
            });

            // Add recurring reminders (1st, 7th, 15th of month)
            const reminderDays = [
                { day: 1, title: 'Month Start - Collect Attendance' },
                { day: 7, title: 'PF/ESI Filing Due' },
                { day: 15, title: 'Mid-month Review' },
            ];

            reminderDays.forEach(({ day, title }) => {
                const reminderDate = new Date(currentYear, currentMonth, day);
                if (reminderDate.getMonth() === currentMonth) {
                    calendarEvents.push({
                        id: `reminder-${day}`,
                        type: 'reminder',
                        title,
                        date: reminderDate,
                    });
                }
            });

            setEvents(calendarEvents);
        } catch (error) {
            console.error('Error loading calendar events:', error);
        } finally {
            setLoading(false);
        }
    }

    function navigateMonth(delta: number) {
        setCurrentDate(new Date(currentYear, currentMonth + delta, 1));
    }

    function getDaysInMonth(): (number | null)[] {
        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        const days: (number | null)[] = [];

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(i);
        }

        return days;
    }

    function getEventsForDay(day: number): PayrollEvent[] {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === day &&
                eventDate.getMonth() === currentMonth &&
                eventDate.getFullYear() === currentYear;
        });
    }

    function isToday(day: number): boolean {
        const today = new Date();
        return day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();
    }

    const days = getDaysInMonth();

    return (
        <div className="payroll-calendar">
            <div className="calendar-header">
                <button className="btn btn-icon" onClick={() => navigateMonth(-1)}>
                    ←
                </button>
                <h2>{MONTHS[currentMonth]} {currentYear}</h2>
                <button className="btn btn-icon" onClick={() => navigateMonth(1)}>
                    →
                </button>
            </div>

            <div className="calendar-grid">
                {/* Day headers */}
                {DAYS.map(day => (
                    <div key={day} className="calendar-day-header">{day}</div>
                ))}

                {/* Calendar days */}
                {days.map((day, index) => (
                    <div
                        key={index}
                        className={`calendar-day ${day ? '' : 'empty'} ${day && isToday(day) ? 'today' : ''}`}
                    >
                        {day && (
                            <>
                                <span className="day-number">{day}</span>
                                <div className="day-events">
                                    {getEventsForDay(day).map(event => (
                                        <div
                                            key={event.id}
                                            className={`event-pill event-${event.type}`}
                                            title={event.title}
                                        >
                                            {event.title}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <span className="legend-dot payroll"></span>
                    <span>Payroll Run</span>
                </div>
                <div className="legend-item">
                    <span className="legend-dot reminder"></span>
                    <span>Reminder</span>
                </div>
            </div>

            {loading && <div className="calendar-loading">Loading events...</div>}
        </div>
    );
}

export default PayrollCalendar;
