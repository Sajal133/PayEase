# Run Payroll Cycle SOP

## Purpose
Standard Operating Procedure for running monthly payroll for all active employees.

## Prerequisites
- [ ] All employees have valid salary records
- [ ] Attendance data finalized (if applicable)
- [ ] Salary adjustments/arrears entered
- [ ] Previous month's payroll closed

## Timeline
| Day | Action |
|-----|--------|
| 25th | Review attendance & adjustments |
| 28th | Run payroll (draft) |
| 30th | Verify & approve payroll |
| 1st | Process bank transfers |
| 2nd | Send payslips |

---

## Steps

### 1. Pre-Payroll Checks
```
- Navigate to Payroll → Run Payroll
- Select Month and Year
- System shows: Active employees count
```

**Verify before proceeding:**
- [ ] Employee count matches expected
- [ ] No pending salary structure changes
- [ ] All new joiners added

### 2. Run Payroll (Draft)
1. Click **"Run Payroll"**
2. System calculates for each employee:
   | Component | Calculation |
   |-----------|-------------|
   | Basic | CTC × Basic% |
   | HRA | Basic × HRA% |
   | Special Allowance | CTC - Basic - HRA - Employer PF/ESI |
   | PF (Employee) | min(Basic × 12%, ₹1,800) |
   | ESI (Employee) | Gross × 0.75% (if Gross ≤ ₹21,000) |
   | PT | State-specific rate |
3. Status: **Draft**

### 3. Review & Verify
- [ ] Spot-check 5 random employees
- [ ] Verify new joiners (pro-rata if applicable)
- [ ] Check terminated employees excluded
- [ ] Validate totals against budget

### 4. Approve Payroll
1. Change status to **"Processing"**
2. Finance team reviews totals
3. Change status to **"Completed"**

### 5. Bank Transfer
1. Export bank transfer file (CSV/NEFT format)
2. Upload to banking portal
3. Get payment confirmation
4. Update status to **"Paid"**

### 6. Distribute Payslips
1. Navigate to **Payslips → Generate**
2. Select the payroll run
3. Generate password-protected PDFs
4. Send via email

---

## Troubleshooting

### Employee Missing from Payroll
- Check employee status is "Active"
- Verify joining date is before payroll month
- Check if CTC is set

### Wrong Salary Amount
- Review salary structure assignment
- Check CTC is correct
- Recalculate manually to verify

### ESI Not Deducted
- ESI only applies if gross ≤ ₹21,000
- System auto-excludes high earners

---

## Rollback
If payroll was run incorrectly:
1. Delete the payroll run (only if status = Draft)
2. Fix underlying data
3. Re-run payroll

> [!CAUTION]
> Cannot delete payroll runs with status "Completed" or "Paid"
