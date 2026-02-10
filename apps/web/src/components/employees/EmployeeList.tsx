import React, { useState, useEffect } from 'react';
import { getEmployees, deleteEmployee, getDepartments, type GetEmployeesResult } from '../../lib/employees';
import type { Employee } from '../../types/supabase';

interface EmployeeListProps {
    companyId: string;
    onEdit: (employee: Employee) => void;
    onAdd: () => void;
}

export function EmployeeList({ companyId, onEdit, onAdd }: EmployeeListProps) {
    const [employees, setEmployees] = useState<GetEmployeesResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState<'active' | 'inactive' | 'terminated' | ''>('active');
    const [department, setDepartment] = useState('');
    const [departments, setDepartments] = useState<string[]>([]);
    const [page, setPage] = useState(1);

    useEffect(() => {
        loadDepartments();
    }, [companyId]);

    useEffect(() => {
        loadEmployees();
    }, [companyId, search, status, department, page]);

    async function loadDepartments() {
        try {
            const depts = await getDepartments(companyId);
            setDepartments(depts);
        } catch (err) {
            console.error('Failed to load departments:', err);
        }
    }

    async function loadEmployees() {
        setLoading(true);
        setError(null);
        try {
            const result = await getEmployees({
                company_id: companyId,
                status: status || undefined,
                department: department || undefined,
                search: search || undefined,
                page,
                limit: 20,
            });
            setEmployees(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load employees');
        } finally {
            setLoading(false);
        }
    }

    async function handleDelete(employee: Employee) {
        if (!confirm(`Are you sure you want to deactivate ${employee.name}?`)) return;

        try {
            await deleteEmployee(employee.id);
            loadEmployees();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete employee');
        }
    }

    function formatCurrency(amount: number): string {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    }

    return (
        <div className="employee-list">
            {/* Header */}
            <div className="employee-list-header">
                <h1>Employees</h1>
                <button onClick={onAdd} className="btn btn-primary">
                    + Add Employee
                </button>
            </div>

            {/* Filters */}
            <div className="employee-filters">
                <input
                    type="text"
                    placeholder="Search by name, email, or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />

                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="terminated">Terminated</option>
                </select>

                <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Departments</option>
                    {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            {/* Error */}
            {error && <div className="error-message">{error}</div>}

            {/* Loading */}
            {loading && <div className="loading">Loading employees...</div>}

            {/* Table */}
            {!loading && employees && (
                <>
                    <table className="employee-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Designation</th>
                                <th>CTC</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.data.map(emp => (
                                <tr key={emp.id}>
                                    <td>{emp.employee_id || '-'}</td>
                                    <td>{emp.name}</td>
                                    <td>{emp.email}</td>
                                    <td>{emp.department || '-'}</td>
                                    <td>{emp.designation || '-'}</td>
                                    <td>{formatCurrency(emp.ctc)}</td>
                                    <td>
                                        <span className={`status-badge status-${emp.status}`}>
                                            {emp.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button onClick={() => onEdit(emp)} className="btn btn-sm">
                                            Edit
                                        </button>
                                        <button onClick={() => handleDelete(emp)} className="btn btn-sm btn-danger">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {employees.data.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="no-data">
                                        No employees found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination">
                        <span>
                            Showing {employees.data.length} of {employees.count} employees
                        </span>
                        <div className="pagination-controls">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {employees.totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(employees.totalPages, p + 1))}
                                disabled={page === employees.totalPages}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default EmployeeList;
