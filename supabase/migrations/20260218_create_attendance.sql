-- Create ENUM for attendance status
DO $$ BEGIN
    CREATE TYPE attendance_status AS ENUM (
        'present', 'absent', 'half_day', 'on_leave', 'holiday', 'weekend'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    overtime_hours NUMERIC DEFAULT 0,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_employee_date UNIQUE (employee_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policies (Broad access for now, similar to other tables)
CREATE POLICY "Enable read access for all users" ON public.attendance
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON public.attendance
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON public.attendance
    FOR UPDATE USING (true);
