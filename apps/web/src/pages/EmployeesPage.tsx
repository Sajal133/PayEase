import React, { useState } from 'react';
import { EmployeeList, EmployeeForm } from '../components/employees';
import type { Employee } from '../types/supabase';
import '../styles/employees.css';

// TODO: Get from auth context after implementing Supabase Auth
const DEMO_COMPANY_ID = 'demo-company-id';

type View = 'list' | 'add' | 'edit';

export function EmployeesPage() {
    const [view, setView] = useState<View>('list');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    function handleEdit(employee: Employee) {
        setSelectedEmployee(employee);
        setView('edit');
    }

    function handleAdd() {
        setSelectedEmployee(null);
        setView('add');
    }

    function handleSuccess() {
        setView('list');
        setSelectedEmployee(null);
    }

    function handleCancel() {
        setView('list');
        setSelectedEmployee(null);
    }

    if (view === 'add' || view === 'edit') {
        return (
            <EmployeeForm
                companyId={DEMO_COMPANY_ID}
                employeeId={selectedEmployee?.id}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <EmployeeList
            companyId={DEMO_COMPANY_ID}
            onEdit={handleEdit}
            onAdd={handleAdd}
        />
    );
}

export default EmployeesPage;
