# Phase 1: MVP (Months 1-3)
*PRD Reference: Section 4.1*

## Overview
Build the core payroll processing system enabling small businesses to manage employees, calculate salaries, and generate payslips.

> [!NOTE]
> **Architecture Decision:** Using Supabase (PostgreSQL + Auth + Storage + Edge Functions) instead of separate Express.js backend. This simplifies the stack and accelerates development.

---

## Week 1-2: Project Setup & Agent Architecture

### Agentic Foundation
- [x] **Directives**:
    - `directives/deploy_app.md` (Deployment SOP)
    - `directives/db_migration.md` (Database changes)
    - `directives/dev_workflow.md` (Development process)
- [x] **Skill**: `project-scaffold` (repo setup automation)
- [x] **Execution**: `execution/setup_env.py`, `execution/check_deps.py`

### Infrastructure
- [x] Initialize monorepo structure
- [x] Setup CI/CD pipeline (GitHub Actions) ✅
- [ ] Configure dev/staging/prod environments - *Deferred*
- [x] Setup Supabase (PostgreSQL + Auth + Storage)

### Backend & Frontend
- [x] ~~Node.js/Express backend~~ → Using Supabase Direct Client
- [x] React/Vite frontend structure
- [x] Auth integration (Supabase Auth) ✅
- [x] Logging (Sentry) ✅
- [x] TailwindCSS / Custom CSS

---

## Week 3-4: Employee Management ✅
*PRD Reference: Section 4.1.1*

### Agentic
- [x] **Skill**: `employee-management`
    - TypeScript: `apps/web/src/lib/employees.ts` (CRUD operations)
    - ~~Python scripts~~ → Not needed, using TypeScript
- [x] **Directive**: `directives/onboard_employee.md`

### Implementation
- [x] `employees` table schema (Supabase with RLS)
- [x] CRUD Operations via Supabase client:
    - `getEmployees()` - List with search, filter, pagination
    - `getEmployee()` - Single employee
    - `createEmployee()` - Add new
    - `updateEmployee()` - Edit existing
    - `deleteEmployee()` - Soft delete
    - `bulkCreateEmployees()` - For Excel import
- [ ] Import Wizard UI - *Optional, backend ready*
- [x] Frontend Components:
    - `EmployeeList.tsx` - List view with filters
    - `EmployeeForm.tsx` - Add/Edit form
    - `EmployeesPage.tsx` - Page orchestration
    - `employees.css` - Styling

---

## Week 5-6: Salary Calculation ✅
*PRD Reference: Section 4.1.2, 4.1.3*

### Agentic
- [x] **Skill**: `payroll-engine`
    - TypeScript: `apps/web/src/lib/payroll.ts`
    - Reference: `skills/payroll-engine/references/statutory_rules.md`
- [x] **Directive**: `directives/run_payroll_cycle.md`

### Implementation
- [x] `salary_structures` table (exists in Supabase)
- [x] `payroll_runs`, `payroll_items` tables (exists in Supabase)
- [x] Calculation engine:
    ```
    CTC → Basic (40-50%) → HRA (40-50% of Basic)
        → Special Allowance (remaining)
        → PF (12% of Basic, max ₹1,800)
        → ESI (0.75% if gross ≤ ₹21,000)
    ```
- [x] Frontend: `SalaryCalculator.tsx`, `PayrollRunManager.tsx`

---

## Week 7-8: Payslip & Email ✅
*PRD Reference: Section 4.1.4*

### Agentic
- [x] **Skill**: `document-generator`
    - Scripts: PDF generation (`documents.ts`), password protection
    - Assets: `payslip_template.html`
- [x] **Directive**: `directives/distribute_payslips.md`

### Implementation
- [x] PDF generation (jsPDF)
- [x] Password protection (PAN + DOB)
- [x] Email service (`email.ts` via Supabase Edge Functions)
- [x] Frontend: `PayslipManager.tsx` (Preview, Bulk Download)

---

## Week 9-10: Dashboard & Onboarding ✅
*PRD Reference: Section 4.1.5, Section 5.3*

### Agentic
- [x] **Directive**: `directives/company_onboarding.md`

### Implementation
- [x] Supabase Auth integration (`AuthContext.tsx`)
- [x] Dashboard (`Dashboard.tsx` - stats, pending actions)
- [x] 4-step onboarding wizard (`OnboardingWizard.tsx`)
- [x] Monthly calendar view (`PayrollCalendar.tsx`)

---

## Week 11-12: Testing & Beta Launch ✅

### Agentic
- [x] **Directive**: `directives/test_protocol.md`
- [x] **Execution**: `execution/run_system_check.py`, `execution/validate_calcs.py`

### Launch Tasks
- [x] CI/CD pipeline (GitHub Actions) — `.github/workflows/ci.yml`, `deploy.yml`
- [x] Sentry logging integration — `@sentry/react` in `main.tsx`
- [x] Unit tests — 63 tests across 3 files (payroll, documents, integration)
- [x] Integration tests for payroll calculations — 4 golden CTC test cases + invariant checks
- [ ] CA validation of statutory calculations — *Requires external CA review*
- [ ] Security audit — *Requires external review*
- [ ] Beta: 500 users — *Requires marketing/onboarding effort*

---

## ✅ Phase 1 Confirmation Checklist

- [x] Skills created: `employee-management`, `payroll-engine`, `document-generator`
- [x] Directives created: 6 SOPs
    - `deploy_app.md`
    - `db_migration.md`
    - `dev_workflow.md`
    - `onboard_employee.md`
    - `run_payroll_cycle.md`
    - `distribute_payslips.md`
    - `company_onboarding.md`
- [ ] 500 beta users onboarded
- [ ] 4.0+ CSAT from beta feedback
- [ ] CA sign-off on calculations

**Approval:** _______________ **Date:** _______________
