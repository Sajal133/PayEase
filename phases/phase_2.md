# Phase 2: Enhanced (Months 4-6)
*PRD Reference: Section 4.2*

## Overview
Extend the MVP with attendance tracking, advanced tax calculations, statutory compliance, bank integrations, and leave management.

---

## Week 13-14: Attendance Integration
*PRD Reference: Section 4.2.1*

### Agentic
- [ ] **Skill**: `time-tracking`
    - Scripts: `parse_attendance_logs.py`
- [ ] **Execution**: `execution/sync_attendance.py`

### Implementation
- [ ] `attendance` table (employee_id, date, status, hours, overtime)
- [ ] Bulk attendance upload API
- [ ] LOP (Loss of Pay) deduction logic
- [ ] Frontend: Calendar view, Bulk entry

---

## Week 15-16: TDS & Tax Calculation
*PRD Reference: Section 4.2.2*

### Agentic
- [ ] **Update Skill**: `payroll-engine` → add `tax-calculator` module
    - Reference: `income_tax_slabs.md`
- [ ] **Directive**: `directives/process_tax_declarations.md`

### Implementation
- [ ] `tax_declarations` table
- [ ] Income tax slab calculation (Old vs New regime)
- [ ] Section 80C, 80D deductions
- [ ] Monthly TDS projection
- [ ] Frontend: Tax declaration form, Regime comparison

---

## Week 17-18: Statutory Compliance
*PRD Reference: Section 4.2.5*

### Agentic
- [ ] **Skill**: `compliance-reporter`
    - Scripts: `generate_epf_challan.py`, `generate_esi_challan.py`, `generate_form16.py`
- [ ] **Directive**: `directives/generate_compliance_reports.md`
- [ ] **Execution**: `execution/validate_challan.py`

### Implementation
- [ ] State-wise PT rules configuration
- [ ] Labour Welfare Fund calculation
- [ ] EPF challan (Form 12A format)
- [ ] ESI challan generation
- [ ] Frontend: Compliance calendar, Payment reminders

---

## Week 19-20: Bank Transfer Files
*PRD Reference: Section 4.2.3*

### Agentic
- [ ] **Skill**: `banking-integrator`
    - Scripts: `generate_neft_file.py`, `generate_rtgs_file.py`
    - Reference: `bank_formats.md` (SBI, HDFC, ICICI, Axis)
- [ ] **Directive**: `directives/process_bank_transfers.md`
- [ ] **Execution**: `execution/validate_bank_file.py`

### Implementation
- [ ] NEFT/RTGS/IMPS file format generators
- [ ] Bank-specific formats
- [ ] Bulk payment instruction file
- [ ] Frontend: Bank file download, Payment status tracking

---

## Week 21-22: Leave Management
*PRD Reference: Section 4.2.4*

### Agentic
- [ ] **Update Skill**: `time-tracking` → add Leave module
- [ ] **Directive**: `directives/manage_leave_requests.md`

### Implementation
- [ ] `leave_balances`, `leave_requests` tables
- [ ] Leave types (CL, SL, PL, etc.)
- [ ] Accrual, carry-forward, encashment logic
- [ ] Frontend: Leave dashboard, Request/Approval flow

---

## Week 23-24: Testing & Launch

- [ ] Integration testing
- [ ] Bank file testing with partner banks
- [ ] User acceptance testing
- [ ] Production deployment

---

## ✅ Phase 2 Confirmation Checklist

- [ ] Skills created: `time-tracking`, `compliance-reporter`, `banking-integrator`
- [ ] Directives created: 4+ new SOPs
- [ ] 2,000 active users
- [ ] 20% free-to-paid conversion
- [ ] Bank files tested with 2+ banks

**Approval:** _______________ **Date:** _______________
