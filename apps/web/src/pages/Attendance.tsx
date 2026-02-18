import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AttendanceCalendar } from '../components/attendance/AttendanceCalendar';
import { AttendanceUpload } from '../components/attendance/AttendanceUpload';

interface EmployeeSimple {
    id: string;
    name: string;
    employee_id: string | null;
    email: string;
}

export default function AttendancePage() {
    const { company } = useAuth();
    const [employees, setEmployees] = useState<EmployeeSimple[]>([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'calendar' | 'upload'>('calendar');

    useEffect(() => {
        if (company) loadEmployees();
    }, [company]);

    async function loadEmployees() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('employees')
                .select('id, name, employee_id, email')
                .eq('company_id', company!.id)
                .eq('status', 'active')
                .order('name');

            if (error) throw error;
            if (data) {
                setEmployees(data);
                if (data.length > 0 && !selectedEmployeeId) {
                    setSelectedEmployeeId(data[0].id);
                }
            }
        } catch (err) {
            console.error('Failed to load employees:', err);
        } finally {
            setLoading(false);
        }
    }

    if (!company) return <div className="p-8 text-center text-gray-500">Please select a company.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
                    <p className="mt-1 text-sm text-gray-500">Track employee attendance and leave.</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'calendar'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Calendar View
                    </button>
                    <button
                        onClick={() => setViewMode('upload')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'upload'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Bulk Upload
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar: Filters */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Employee Selector (Only relevant for Calendar View) */}
                    {viewMode === 'calendar' && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Employee</label>
                            {loading ? (
                                <div className="animate-pulse h-10 bg-gray-100 rounded"></div>
                            ) : (
                                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                                    {employees.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => setSelectedEmployeeId(emp.id)}
                                            className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${selectedEmployeeId === emp.id
                                                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                : 'hover:bg-gray-50 text-gray-700 border border-transparent'
                                                }`}
                                        >
                                            <div className="font-medium">{emp.name}</div>
                                            <div className="text-xs opacity-70">{emp.employee_id}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {viewMode === 'upload' && (
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
                            <h4 className="font-semibold mb-2">Formatting Guide</h4>
                            <p className="mb-2">Your CSV should have the following headers:</p>
                            <ul className="list-disc ml-4 space-y-1 mb-3 text-xs">
                                <li>Email (or Employee ID)</li>
                                <li>Date (YYYY-MM-DD)</li>
                                <li>Status (present, absent, etc.)</li>
                                <li>In Time (HH:MM) - Optional</li>
                                <li>Out Time (HH:MM) - Optional</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3">
                    {viewMode === 'calendar' ? (
                        selectedEmployeeId ? (
                            <AttendanceCalendar employeeId={selectedEmployeeId} />
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <span className="text-gray-400">Select an employee to view attendance</span>
                            </div>
                        )
                    ) : (
                        <AttendanceUpload onSuccess={() => {
                            // Optional: Could reload data or switch view
                        }} />
                    )}
                </div>
            </div>
        </div>
    );
}
