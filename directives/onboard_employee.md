# Employee Onboarding SOP

## Purpose
Standard Operating Procedure for adding new employees to the PayEase system.

## Prerequisites
- [ ] Employee has accepted offer letter
- [ ] HR has collected required documents (PAN, Aadhaar, bank details)
- [ ] Salary structure approved by manager

## Steps

### 1. Collect Information
| Field | Required | Source |
|-------|----------|--------|
| Full Name | Yes | Offer letter |
| Email | Yes | HR/IT |
| PAN Number | Yes | Employee document |
| Aadhaar (last 4) | No | Employee document |
| Bank Account | Yes | Employee document |
| IFSC Code | Yes | Employee document |
| CTC | Yes | Offer letter |
| Department | Yes | HR |
| Designation | Yes | Offer letter |
| Joining Date | Yes | Offer letter |

### 2. Add to System
1. Navigate to **Employees → Add Employee**
2. Fill all required fields
3. Select appropriate **Salary Structure**
4. Click **Save**

### 3. Verify
- [ ] Employee appears in list with "Active" status
- [ ] CTC is correct
- [ ] Department assignment is correct
- [ ] Bank details are masked correctly

### 4. Post-Onboarding
- [ ] Send welcome email (if enabled)
- [ ] Add to next payroll run
- [ ] Verify first salary calculation

## Bulk Import
For onboarding multiple employees:
1. Download Excel template from **Employees → Import**
2. Fill employee data in template
3. Upload and review validation errors
4. Confirm import

## Troubleshooting

### Duplicate Email Error
- Check if employee already exists (may be inactive)
- Use different email if needed

### PAN Validation Failed
- Ensure format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
- All letters must be uppercase

## Rollback
If employee was added incorrectly:
1. Navigate to employee record
2. Click **Edit**
3. Correct details and save
   OR
4. Set status to "Inactive" to hide from active list
