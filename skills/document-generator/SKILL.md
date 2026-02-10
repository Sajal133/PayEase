---
name: document-generator
version: 1.0.0
description: PDF payslip generation with password protection and email distribution
---

# Document Generator Skill

## Purpose
Generates password-protected PDF payslips and handles email distribution to employees.

## Quick Start

### Generate Single Payslip
```typescript
import { generatePayslip } from '@/lib/documents';

const pdfBlob = await generatePayslip({
  employee: { name: 'John Doe', pan: 'ABCDE1234F', dob: '1990-01-15' },
  company: { name: 'Acme Corp', address: '...' },
  payrollItem: { basic: 50000, hra: 25000, ... },
  month: 'January',
  year: 2024,
});
```

### Bulk Generate & Email
```typescript
import { distributePayslips } from '@/lib/documents';

await distributePayslips({
  payrollRunId: 'uuid',
  sendEmail: true,
});
```

## PDF Password Format
Password = PAN (lowercase) + DOB (DDMMYYYY)
Example: `abcde1234f15011990`

## Assets
- `assets/payslip_template.html` - HTML template for PDF rendering

## Email Templates
- Subject: "Payslip for {Month} {Year} - {Company Name}"
- Attachment: `Payslip_{Month}_{Year}_{EmployeeName}.pdf`
