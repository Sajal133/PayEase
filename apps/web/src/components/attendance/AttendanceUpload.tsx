import React, { useState, useRef } from 'react';
import { bulkUpsertAttendance } from '../../lib/attendance';
import { supabase } from '../../lib/supabase';

export function AttendanceUpload({ onSuccess }: { onSuccess?: () => void }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const text = await file.text();
            const rows = text.split('\n');
            const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

            // Expected headers: email, date, status, check_in, check_out
            const getIdx = (name: string) => headers.findIndex(h => h.includes(name));

            const emailIdx = getIdx('email');
            const dateIdx = getIdx('date');
            const statusIdx = getIdx('status');
            const inIdx = getIdx('in');
            const outIdx = getIdx('out');

            if (emailIdx === -1 || dateIdx === -1 || statusIdx === -1) {
                throw new Error('CSV must contain headers: Email, Date, Status');
            }

            // Fetch employees for ID lookup
            const { data: employees } = await supabase
                .from('employees')
                .select('id, email, employee_id');

            if (!employees) throw new Error('Could not fetch employee list for validation');

            const empMap = new Map();
            employees.forEach(e => {
                if (e.email) empMap.set(e.email.toLowerCase(), e.id);
                if (e.employee_id) empMap.set(e.employee_id.toLowerCase(), e.id);
            });

            const parsedRecords = [];
            let skipped = 0;

            for (let i = 1; i < rows.length; i++) {
                const row = rows[i].split(',').map(c => c.trim());
                if (row.length < 3) continue;

                const emailOrId = row[emailIdx]?.toLowerCase();
                const date = row[dateIdx];
                const status = row[statusIdx]?.toLowerCase();

                if (!emailOrId || !date || !status) {
                    skipped++;
                    continue;
                }

                const empId = empMap.get(emailOrId);
                if (!empId) {
                    console.warn(`Employee not found: ${emailOrId}`);
                    skipped++;
                    continue;
                }

                // Parse times
                let checkIn = null;
                let checkOut = null;

                if (inIdx !== -1 && row[inIdx]) {
                    checkIn = `${date}T${row[inIdx]}:00`; // naive ISO assuming HH:MM
                }
                if (outIdx !== -1 && row[outIdx]) {
                    checkOut = `${date}T${row[outIdx]}:00`;
                }

                parsedRecords.push({
                    employee_id: empId,
                    date: date,
                    status: status as any, // validation looser here, DB will strict check enum
                    check_in: checkIn,
                    check_out: checkOut,
                });
            }

            if (parsedRecords.length === 0) {
                throw new Error('No valid records found to import.');
            }

            // Bulk upsert
            await bulkUpsertAttendance(parsedRecords);

            setSuccessMsg(`Successfully imported ${parsedRecords.length} records. (${skipped} skipped)`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            if (onSuccess) onSuccess();

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to process file');
        } finally {
            setUploading(false);
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Import Attendance</h3>

            <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="csv-upload"
                        disabled={uploading}
                    />
                    <label htmlFor="csv-upload" className="cursor-pointer block">
                        <div className="text-gray-500 mb-2">
                            {uploading ? 'Processing...' : 'Click to upload CSV'}
                        </div>
                        <div className="text-xs text-gray-400">
                            Format: Email, Date, Status, In Time, Out Time
                        </div>
                    </label>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
                        {successMsg}
                    </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                    <p className="font-medium">Valid Statuses:</p>
                    <p>present, absent, half_day, leave, holiday, weekend</p>
                </div>
            </div>
        </div>
    );
}
