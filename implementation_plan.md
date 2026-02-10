# PayEase - Project Implementation Plan

## Overview

This implementation plan is designed to follow the **3-layer agent architecture** defined in `AGENTS.md`. 

**Core Principles for Implementation:**
- **Layer 1 (Directives):** Every major workflow (e.g., "Run Payroll", "Onboard Company") must have a corresponding SOP in `directives/`.
- **Layer 2 (Orchestration):** The agent (you) reads directives to decide actions.
- **Layer 3 (Execution):** deterministic logic is encapsulated in `execution/` scripts or `skills/`.
- **Skill Creation:** Complex, reusable domains (e.g., Tax Logic, Bank Integrations) must be encapsulated as Skills using the `skill-creator` workflow.

---

# Phase 1: MVP (Months 1-3)

## Week 1-2: Project Setup & Agent Architecture

### Agentic Foundation
- [ ] **Directives Setup**: Create initial directives:
    - `directives/deploy_app.md` (Deployment SOP)
    - `directives/db_migration.md` (Database change SOP)
- [ ] **Skill Creation**: Initialize `project-scaffold` skill to handle repo setup.
- [ ] **Execution Scripts**: Create `execution/setup_env.py` for environment consistency.

### Infrastructure
- [ ] Initialize monorepo structure
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Configure development, staging, production environments
- [ ] Setup PostgreSQL database + Redis + AWS S3

### Backend & Frontend Foundation
- [ ] Initialize Node.js/Express (Backend) & React/Vite (Frontend)
- [ ] Configure Auth (JWT), Logging (Sentry), and TailwindCSS

---

## Week 3-4: Employee Management via Skills

### Skills & Directives
- [ ] **Create Skill**: `employee-management`
    - *Scripts*: `import_employees.py` (Excel logic), `validate_employee_data.py`
    - *Reference*: `employee_schema.md`
- [ ] **Directive**: `directives/onboard_employee.md`

### Implementation
- [ ] Create `employees` table schema
- [ ] Implement CRUD APIs and Bulk Import (using skill scripts)
- [ ] Frontend: Employee List, Add/Edit Form, Import Wizard

---

## Week 5-6: Salary Structure & Calculation Engine

### Skills & Directives
- [ ] **Create Skill**: `payroll-engine`
    - *Scripts*: `calculate_salary.py` (Deterministic CTC breakdown), `tax_estimator.py`
    - *Reference*: `statutory_rules.md` (PF/ESI rules)
- [ ] **Directive**: `directives/run_payroll_cycle.md`

### Implementation
- [ ] Create `salary_structures`, `payroll_runs` tables
- [ ] Implement calculation engine (wrapping `payroll-engine` skill logic)
- [ ] Frontend: Salary Config UI, Calculation Preview

---

## Week 7-8: Payslip Generation & Email

### Skills & Directives
- [ ] **Create Skill**: `document-generator`
    - *Scripts*: `generate_pdf.py` (Puppeteer wrapper), `protect_pdf.py`
    - *Assets*: HTML Templates for payslips
- [ ] **Directive**: `directives/distribute_payslips.md`

### Implementation
- [ ] Backend: PDF Generation Service (uses skill), Email Service (SendGrid)
- [ ] Frontend: Preview Modal, Bulk Download

---

## Week 9-10: Dashboard & Onboarding

### Implementation
- [ ] Dashboard API & UI (Stats, Calendar)
- [ ] Onboarding Wizard

---

## Week 11-12: Testing & Beta Launch

### Agentic Verification
- [ ] **Directive**: `directives/test_protocol.md`
- [ ] **Execution**: `execution/run_system_check.py`

### Launch Tasks
- [ ] Unit/Integration Tests & Security Audit
- [ ] Beta User Onboarding

---

### ✅ Phase 1 Confirmation
- [ ] All skills (`employee-management`, `payroll-engine`, `document-generator`) created and valid
- [ ] Directives for key workflows exist
- [ ] 500 beta users, 4.0+ CSAT

**Approval:** _______________ **Date:** _______________

---

# Phase 2: Enhanced (Months 4-6)

## Week 13-14: Attendance Integration

- [ ] **Create Skill**: `time-tracking`
    - *Scripts*: `parse_attendance_logs.py`
- [ ] Backend/Frontend Integration

## Week 15-16: TDS & Tax Calculation

- [ ] **Update Skill**: `payroll-engine` with `tax-calculator` module
    - *Reference*: `income_tax_slabs.md`
- [ ] Implement Tax Declarations & Projections

## Week 17-18: Statutory Compliance

- [ ] **Create Skill**: `compliance-reporter`
    - *Scripts*: `generate_epf_challan.py`, `generate_form16.py`
- [ ] Implement State-wise PT & Compliance Calendar

## Week 19-20: Bank Transfer Files

- [ ] **Create Skill**: `banking-integrator`
    - *Scripts*: `generate_neft_file.py` (Bank-specific formats for SBI, HDFC, etc.)
- [ ] Implement Bulk Payment File Generation

## Week 21-22: Leave Management

- [ ] **Update Skill**: `time-tracking` with Leave Logic
- [ ] Implement Leave Accrual & Requests

## Week 23-24: Testing & Launch

- [ ] Bank File Testing, UAT, Production Deployment

---

### ✅ Phase 2 Confirmation
- [ ] New skills (`compliance-reporter`, `banking-integrator`) active
- [ ] 2,000 active users, 20% conversion

**Approval:** _______________ **Date:** _______________

---

# Phase 3: Scale & Polish (Months 7-9)

## Week 25-28: Mobile Application

- [ ] React Native / Flutter App Development
- [ ] **Directive**: `directives/publish_mobile_app.md`

## Week 29-32: Accounting Integrations

- [ ] **Create Skill**: `accounting-bridge`
    - *Scripts*: `export_tally_xml.py`, `sync_zoho_books.py`
- [ ] Implement Tally, Zoho, QuickBooks Sync

## Week 33-36: Multi-location & Analytics

- [ ] **Update Skills**: Update all skills for Schema/Location awareness
- [ ] Advanced Analytics & Dashboard

---

### ✅ Phase 3 Confirmation
- [ ] Mobile Apps Live, Integrations Active
- [ ] 10,000 users, 50+ NPS

**Approval:** _______________ **Date:** _______________
