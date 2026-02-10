---
title: Company Onboarding
scope: New company setup after signup
trigger: User completes signup and first login
---

# Company Onboarding SOP

## Purpose
Guide new companies through initial setup to ensure they can run their first payroll successfully.

## Prerequisites
- User has completed email verification
- User is logged in for the first time

## Onboarding Steps

### Step 1: Company Profile
**Screen**: Company Info Form

1. Collect required information:
   - Company Name (pre-filled from signup)
   - Registered Address
   - Phone Number
   - PAN Number
   - GST Number (optional)

2. Collect compliance registration numbers:
   - PF Registration Number
   - ESI Registration Number (if applicable)

3. Validation:
   - PAN format: `AAAAA1234A`
   - Phone: 10 digits

### Step 2: Salary Structure Setup
**Screen**: Salary Structure Form

1. Create default salary structure with:
   | Component | Default | Range |
   |-----------|---------|-------|
   | Basic % of CTC | 40% | 30-60% |
   | HRA % of Basic | 50% | 30-60% |
   | Special Allowance | Balance | Auto-calculated |

2. Configure statutory deductions:
   - [x] Enable PF (12% of Basic, max ₹15,000 base)
   - [ ] Enable ESI (if gross ≤ ₹21,000/month)
   - [x] Enable Professional Tax (state-wise)

### Step 3: Add First Employee (Optional)
**Screen**: Quick Add Employee

1. Minimum fields:
   - Employee Name
   - Email
   - Employee ID
   - Annual CTC
   - Joining Date

2. Skip option available - can add employees later

### Step 4: Setup Complete
**Screen**: Success & Next Steps

1. Show completion confirmation
2. Present quick action cards:
   - Import Employees from Excel
   - Run First Payroll
   - View Dashboard
3. Redirect to Dashboard

## Post-Onboarding

### Welcome Email
Send automated email with:
- Account confirmation
- Quick start guide link
- Support contact

### Dashboard State
After onboarding:
- Show "Getting Started" widget if no employees
- Highlight empty states with CTAs

## Component Reference
- `OnboardingWizard.tsx` - Main wizard component
- `AuthContext.tsx` - User/company state
- `Dashboard.tsx` - Post-onboarding landing

## Validation Checklist
- [ ] All 4 steps complete successfully
- [ ] Company record updated in database
- [ ] Default salary structure created
- [ ] User redirected to dashboard
- [ ] Analytics event logged

## Troubleshooting

| Issue | Resolution |
|-------|------------|
| PAN validation fails | Check format: 5 letters, 4 numbers, 1 letter |
| Salary structure not saving | Verify company_id is set |
| Employee creation fails | Check required fields (name, email, ctc, joining_date) |
