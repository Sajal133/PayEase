# Distribute Payslips SOP

## Purpose
Standard Operating Procedure for generating and distributing payslips after payroll is finalized.

## Prerequisites
- [ ] Payroll run status = "Completed" or "Paid"
- [ ] All employee email addresses verified
- [ ] SMTP/Email service configured

## Timeline
| Day | Action |
|-----|--------|
| 1st or 2nd | Generate payslips |
| 2nd | Review & approve |
| 2nd | Send via email |

---

## Steps

### 1. Navigate to Payslips
1. Go to **Payroll → History**
2. Select the completed payroll run
3. Click **Payslips** tab

### 2. Generate All Payslips
1. Click **"Generate All"**
2. System creates password-protected PDFs
3. Wait for completion (progress shown)

**PDF Password Format:**
```
PAN (lowercase) + DOB (DDMMYYYY)
Example: abcde1234f15011990
```

### 3. Review Sample Payslips
- [ ] Download and verify 3 random payslips
- [ ] Check salary components are correct
- [ ] Verify employee details
- [ ] Confirm password works

### 4. Distribute via Email
1. Click **"Send All"** (or select specific employees)
2. Confirm recipient count
3. System sends emails with PDF attachments

**Email includes:**
- Subject: "Payslip for {Month} {Year} - {Company}"
- Body with password instructions
- PDF attachment

### 5. Monitor Delivery
- [ ] Check email delivery report
- [ ] Note any bounced emails
- [ ] Resend to failed addresses

---

## Alternative: Manual Distribution

If email not configured:
1. Click **"Download All"**
2. Extract ZIP
3. Distribute via secure channel

---

## Troubleshooting

### Employee Not Receiving Email
- Verify email address in employee profile
- Check spam/junk folder
- Resend from Payslips page

### PDF Password Not Working
- Password is case-sensitive (PAN lowercase!)
- DOB format: DDMMYYYY (no slashes)
- Verify PAN and DOB in employee record

### Missing Payslip
- Ensure employee was included in payroll run
- Check employee status was "Active" at run time

---

## Security Notes

> [!WARNING]
> Never share payslip passwords via the same email

> [!CAUTION]
> Do not send unprotected payslips via email
