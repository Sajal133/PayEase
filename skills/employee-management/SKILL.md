---
name: employee-management
version: 1.0.0
description: Employee CRUD operations, import/export, and management workflows
---

# Employee Management Skill

## Purpose
Handles all employee-related operations including CRUD, bulk import from Excel, and employee onboarding workflows.

## Quick Start

### Add an Employee
```typescript
import { createEmployee } from '@/lib/employees';

const employee = await createEmployee({
  company_id: 'uuid',
  name: 'John Doe',
  email: 'john@company.com',
  joining_date: '2024-01-15',
  ctc: 1200000,
  department: 'Engineering'
});
```

### List Employees
```typescript
import { getEmployees } from '@/lib/employees';

const { data, count } = await getEmployees({
  company_id: 'uuid',
  status: 'active',
  department: 'Engineering',
  search: 'john',
  page: 1,
  limit: 20
});
```

## Resources

### Scripts
- `scripts/validate_employee.py` - Validates employee data before import
- `scripts/import_excel.py` - Bulk import from Excel/CSV

### References
- `references/employee_fields.md` - Field definitions and validations

## Workflows

### Employee Onboarding
1. Add employee via form or Excel import
2. System validates PAN format, email uniqueness
3. Assign salary structure
4. Send welcome email (optional)

### Bulk Import
1. Download template Excel
2. Fill employee data
3. Upload and validate
4. Review errors/warnings
5. Confirm import
