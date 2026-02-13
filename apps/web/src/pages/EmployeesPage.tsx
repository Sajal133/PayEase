import React, { useState } from 'react';
import { EmployeeList, EmployeeForm } from '../components/employees';
import { useAuth } from '../contexts/AuthContext';
import type { Employee } from '../types/supabase';
import '../styles/employees.css';

type View = 'list' | 'add' | 'edit';

export function EmployeesPage() {
    const { company, loading } = useAuth();
    const [view, setView] = useState<View>('list');
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="employees-page">
                <p>No company found. Please complete onboarding first.</p>
            </div>
        );
    }

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
                companyId={company.id}
                employeeId={selectedEmployee?.id}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
            />
        );
    }

    return (
        <EmployeeList
            companyId={company.id}
            onEdit={handleEdit}
            onAdd={handleAdd}
        />
    );
}

export default EmployeesPage;
