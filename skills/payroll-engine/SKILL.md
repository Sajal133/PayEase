---
name: payroll-engine
version: 1.0.0
description: Salary calculation engine with Indian statutory compliance (PF, ESI, PT, TDS)
---

# Payroll Engine Skill

## Purpose
Calculates employee salaries with Indian statutory deductions and generates payroll runs.

## Quick Start

### Calculate Single Employee Salary
```typescript
import { calculateSalary } from '@/lib/payroll';

const breakdown = calculateSalary({
  ctc: 1200000,           // Annual CTC
  basicPercentage: 40,    // Basic = 40% of CTC
  hraPercentage: 50,      // HRA = 50% of Basic
  pfEnabled: true,
  esiEnabled: true,       // Auto-disabled if gross > ₹21,000
});
// Returns: { basic, hra, specialAllowance, pf, esi, pt, netSalary }
```

### Run Monthly Payroll
```typescript
import { runPayroll } from '@/lib/payroll';

const result = await runPayroll({
  company_id: 'uuid',
  month: 'January',
  year: 2024,
});
// Creates payroll_run and payroll_items for all active employees
```

## Statutory Rules (India)

### PF (Provident Fund)
- Employee: 12% of Basic (max ₹1,800/month)
- Employer: 12% of Basic (3.67% EPF + 8.33% EPS)
- Applies if org has 20+ employees OR employee opts in

### ESI (Employee State Insurance)
- Employee: 0.75% of Gross
- Employer: 3.25% of Gross
- **Only if** monthly gross ≤ ₹21,000

### Professional Tax (PT)
- Varies by state
- Karnataka: ₹200/month (if salary > ₹15,000)
- Maharashtra: ₹200/month (₹300 in Feb)

## References
- `references/statutory_rules.md` - Detailed tax rules
- `references/state_pt_rates.md` - State-wise PT rates
