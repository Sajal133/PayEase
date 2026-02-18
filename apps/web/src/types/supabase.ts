export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            attendance: {
                Row: {
                    check_in: string | null
                    check_out: string | null
                    created_at: string | null
                    date: string
                    employee_id: string
                    id: string
                    status: Database["public"]["Enums"]["attendance_status"]
                    updated_at: string | null
                }
                Insert: {
                    check_in?: string | null
                    check_out?: string | null
                    created_at?: string | null
                    date: string
                    employee_id: string
                    id?: string
                    status: Database["public"]["Enums"]["attendance_status"]
                    updated_at?: string | null
                }
                Update: {
                    check_in?: string | null
                    check_out?: string | null
                    created_at?: string | null
                    date?: string
                    employee_id?: string
                    id?: string
                    status?: Database["public"]["Enums"]["attendance_status"]
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "employees"
                        referencedColumns: ["id"]
                    }
                ]
            }
            companies: {
                Row: {
                    address: string | null
                    created_at: string | null
                    email: string
                    esi_registration: string | null
                    gst_number: string | null
                    id: string
                    logo_url: string | null
                    name: string
                    pan_number: string | null
                    pf_registration: string | null
                    phone: string | null
                    updated_at: string | null
                }
                Insert: {
                    address?: string | null
                    created_at?: string | null
                    email: string
                    esi_registration?: string | null
                    gst_number?: string | null
                    id?: string
                    logo_url?: string | null
                    name: string
                    pan_number?: string | null
                    pf_registration?: string | null
                    phone?: string | null
                    updated_at?: string | null
                }
                Update: {
                    address?: string | null
                    created_at?: string | null
                    email?: string
                    esi_registration?: string | null
                    gst_number?: string | null
                    id?: string
                    logo_url?: string | null
                    name?: string
                    pan_number?: string | null
                    pf_registration?: string | null
                    phone?: string | null
                    updated_at?: string | null
                }
                Relationships: []
            }
            employees: {
                Row: {
                    aadhaar_last_4: string | null
                    bank_account: string | null
                    bank_name: string | null
                    company_id: string
                    created_at: string | null
                    ctc: number
                    date_of_birth: string | null
                    department: string | null
                    designation: string | null
                    email: string
                    employee_id: string | null
                    gender: string | null
                    id: string
                    ifsc_code: string | null
                    joining_date: string
                    name: string
                    pan_number: string | null
                    phone: string | null
                    salary_structure_id: string | null
                    status: string | null
                    updated_at: string | null
                }
                Insert: {
                    aadhaar_last_4?: string | null
                    bank_account?: string | null
                    bank_name?: string | null
                    company_id: string
                    created_at?: string | null
                    ctc: number
                    date_of_birth?: string | null
                    department?: string | null
                    designation?: string | null
                    email: string
                    employee_id?: string | null
                    gender?: string | null
                    id?: string
                    ifsc_code?: string | null
                    joining_date: string
                    name: string
                    pan_number?: string | null
                    phone?: string | null
                    salary_structure_id?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Update: {
                    aadhaar_last_4?: string | null
                    bank_account?: string | null
                    bank_name?: string | null
                    company_id?: string
                    created_at?: string | null
                    ctc?: number
                    date_of_birth?: string | null
                    department?: string | null
                    designation?: string | null
                    email?: string
                    employee_id?: string | null
                    gender?: string | null
                    id?: string
                    ifsc_code?: string | null
                    joining_date?: string
                    name?: string
                    pan_number?: string | null
                    phone?: string | null
                    salary_structure_id?: string | null
                    status?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "employees_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "fk_employees_salary_structure"
                        columns: ["salary_structure_id"]
                        isOneToOne: false
                        referencedRelation: "salary_structures"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payroll_items: {
                Row: {
                    basic: number
                    bonus: number | null
                    created_at: string | null
                    days_absent: number | null
                    days_worked: number | null
                    employee_id: string
                    esi_employee: number | null
                    esi_employer: number | null
                    gross_salary: number
                    hra: number | null
                    id: string
                    lop_days: number | null
                    net_salary: number
                    other_deductions: number | null
                    other_earnings: number | null
                    overtime: number | null
                    payroll_run_id: string
                    pf_employee: number | null
                    pf_employer: number | null
                    professional_tax: number | null
                    special_allowance: number | null
                    tds: number | null
                    total_deductions: number | null
                    updated_at: string | null
                }
                Insert: {
                    basic: number
                    bonus?: number | null
                    created_at?: string | null
                    days_absent?: number | null
                    days_worked?: number | null
                    employee_id: string
                    esi_employee?: number | null
                    esi_employer?: number | null
                    gross_salary: number
                    hra?: number | null
                    id?: string
                    lop_days?: number | null
                    net_salary: number
                    other_deductions?: number | null
                    other_earnings?: number | null
                    overtime?: number | null
                    payroll_run_id: string
                    pf_employee?: number | null
                    pf_employer?: number | null
                    professional_tax?: number | null
                    special_allowance?: number | null
                    tds?: number | null
                    total_deductions?: number | null
                    updated_at?: string | null
                }
                Update: {
                    basic?: number
                    bonus?: number | null
                    created_at?: string | null
                    days_absent?: number | null
                    days_worked?: number | null
                    employee_id?: string
                    esi_employee?: number | null
                    esi_employer?: number | null
                    gross_salary?: number
                    hra?: number | null
                    id?: string
                    lop_days?: number | null
                    net_salary?: number
                    other_deductions?: number | null
                    other_earnings?: number | null
                    overtime?: number | null
                    payroll_run_id?: string
                    pf_employee?: number | null
                    pf_employer?: number | null
                    professional_tax?: number | null
                    special_allowance?: number | null
                    tds?: number | null
                    total_deductions?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "payroll_items_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "employees"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payroll_items_payroll_run_id_fkey"
                        columns: ["payroll_run_id"]
                        isOneToOne: false
                        referencedRelation: "payroll_runs"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payroll_runs: {
                Row: {
                    company_id: string
                    created_at: string | null
                    finalized_at: string | null
                    id: string
                    month: number
                    paid_at: string | null
                    processed_at: string | null
                    status: string | null
                    total_deductions: number | null
                    total_employees: number | null
                    total_gross: number | null
                    total_net: number | null
                    updated_at: string | null
                    year: number
                }
                Insert: {
                    company_id: string
                    created_at?: string | null
                    finalized_at?: string | null
                    id?: string
                    month: number
                    paid_at?: string | null
                    processed_at?: string | null
                    status?: string | null
                    total_deductions?: number | null
                    total_employees?: number | null
                    total_gross?: number | null
                    total_net?: number | null
                    updated_at?: string | null
                    year: number
                }
                Update: {
                    company_id?: string
                    created_at?: string | null
                    finalized_at?: string | null
                    id?: string
                    month?: number
                    paid_at?: string | null
                    processed_at?: string | null
                    status?: string | null
                    total_deductions?: number | null
                    total_employees?: number | null
                    total_gross?: number | null
                    total_net?: number | null
                    updated_at?: string | null
                    year?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "payroll_runs_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payslips: {
                Row: {
                    created_at: string | null
                    download_count: number | null
                    email_opened_at: string | null
                    email_sent: boolean | null
                    email_sent_at: string | null
                    employee_id: string
                    file_name: string | null
                    file_url: string | null
                    id: string
                    is_password_protected: boolean | null
                    last_downloaded_at: string | null
                    payroll_item_id: string
                }
                Insert: {
                    created_at?: string | null
                    download_count?: number | null
                    email_opened_at?: string | null
                    email_sent?: boolean | null
                    email_sent_at?: string | null
                    employee_id: string
                    file_name?: string | null
                    file_url?: string | null
                    id?: string
                    is_password_protected?: boolean | null
                    last_downloaded_at?: string | null
                    payroll_item_id: string
                }
                Update: {
                    created_at?: string | null
                    download_count?: number | null
                    email_opened_at?: string | null
                    email_sent?: boolean | null
                    email_sent_at?: string | null
                    employee_id?: string
                    file_name?: string | null
                    file_url?: string | null
                    id?: string
                    is_password_protected?: boolean | null
                    last_downloaded_at?: string | null
                    payroll_item_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payslips_employee_id_fkey"
                        columns: ["employee_id"]
                        isOneToOne: false
                        referencedRelation: "employees"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payslips_payroll_item_id_fkey"
                        columns: ["payroll_item_id"]
                        isOneToOne: true
                        referencedRelation: "payroll_items"
                        referencedColumns: ["id"]
                    },
                ]
            }
            salary_structures: {
                Row: {
                    basic_percent: number | null
                    company_id: string
                    created_at: string | null
                    description: string | null
                    esi_ceiling: number | null
                    esi_employee_percent: number | null
                    esi_employer_percent: number | null
                    esi_enabled: boolean | null
                    hra_percent: number | null
                    id: string
                    is_default: boolean | null
                    name: string
                    pf_ceiling: number | null
                    pf_enabled: boolean | null
                    pf_percent: number | null
                    special_allowance_percent: number | null
                    updated_at: string | null
                }
                Insert: {
                    basic_percent?: number | null
                    company_id: string
                    created_at?: string | null
                    description?: string | null
                    esi_ceiling?: number | null
                    esi_employee_percent?: number | null
                    esi_employer_percent?: number | null
                    esi_enabled?: boolean | null
                    hra_percent?: number | null
                    id?: string
                    is_default?: boolean | null
                    name: string
                    pf_ceiling?: number | null
                    pf_enabled?: boolean | null
                    pf_percent?: number | null
                    special_allowance_percent?: number | null
                    updated_at?: string | null
                }
                Update: {
                    basic_percent?: number | null
                    company_id?: string
                    created_at?: string | null
                    description?: string | null
                    esi_ceiling?: number | null
                    esi_employee_percent?: number | null
                    esi_employer_percent?: number | null
                    esi_enabled?: boolean | null
                    hra_percent?: number | null
                    id?: string
                    is_default?: boolean | null
                    name?: string
                    pf_ceiling?: number | null
                    pf_enabled?: boolean | null
                    pf_percent?: number | null
                    special_allowance_percent?: number | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "salary_structures_company_id_fkey"
                        columns: ["company_id"]
                        isOneToOne: false
                        referencedRelation: "companies"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            attendance_status: "present" | "absent" | "half_day" | "on_leave" | "holiday" | "weekend"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience type aliases
export type Company = Tables<'companies'>
export type Employee = Tables<'employees'>
export type SalaryStructure = Tables<'salary_structures'>
export type PayrollRun = Tables<'payroll_runs'>
export type PayrollItem = Tables<'payroll_items'>
export type Payslip = Tables<'payslips'>
