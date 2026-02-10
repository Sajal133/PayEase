# Indian Statutory Payroll Rules

## Salary Components

### Basic Salary
- Typically 40-50% of CTC
- Foundation for all statutory calculations
- Cannot be less than minimum wage (state-specific)

### HRA (House Rent Allowance)
- Typically 40-50% of Basic
- Tax exemption based on:
  - Actual HRA received
  - Rent paid - 10% of Basic
  - 50% of Basic (metro) / 40% (non-metro)

### Special Allowance
- Remaining after Basic + HRA
- Fully taxable

---

## Statutory Deductions

### PF (Provident Fund)
| Component | Rate | Cap |
|-----------|------|-----|
| Employee EPF | 12% of Basic | ₹1,800/month (Basic cap ₹15,000) |
| Employer EPF | 3.67% of Basic | ₹550/month |
| Employer EPS | 8.33% of Basic | ₹1,250/month |

**Applicability:**
- Mandatory for establishments with 20+ employees
- Voluntary for smaller orgs
- New employees with Basic > ₹15,000 can opt out

### ESI (Employee State Insurance)
| Component | Rate | Gross Limit |
|-----------|------|-------------|
| Employee | 0.75% | ≤ ₹21,000/month |
| Employer | 3.25% | ≤ ₹21,000/month |

**Benefits:** Medical, disability, maternity, unemployment

### Professional Tax (PT)
State-wise deduction, capped at ₹2,500/year.

| State | Monthly Rate |
|-------|--------------|
| Karnataka | ₹200 (if > ₹15,000) |
| Maharashtra | ₹200 (₹300 in Feb) |
| Tamil Nadu | ₹0 - ₹208 based on slab |
| Telangana | ₹200 (if > ₹15,000) |
| Gujarat | ₹0 (no PT) |

---

## TDS (Tax Deducted at Source)

### Old Regime (FY 2024-25)
| Income Slab | Rate |
|-------------|------|
| Up to ₹2,50,000 | 0% |
| ₹2,50,001 - ₹5,00,000 | 5% |
| ₹5,00,001 - ₹10,00,000 | 20% |
| Above ₹10,00,000 | 30% |

### New Regime (FY 2024-25)
| Income Slab | Rate |
|-------------|------|
| Up to ₹3,00,000 | 0% |
| ₹3,00,001 - ₹6,00,000 | 5% |
| ₹6,00,001 - ₹9,00,000 | 10% |
| ₹9,00,001 - ₹12,00,000 | 15% |
| ₹12,00,001 - ₹15,00,000 | 20% |
| Above ₹15,00,000 | 30% |

---

## Calculation Formula

```
Monthly CTC = Annual CTC / 12

Basic = Monthly CTC × Basic%
HRA = Basic × HRA%
Special Allowance = Monthly CTC - Basic - HRA - Employer PF - Employer ESI

Gross = Basic + HRA + Special Allowance

Deductions:
  PF Employee = min(Basic × 12%, 1800)
  ESI Employee = Gross ≤ 21000 ? Gross × 0.75% : 0
  PT = State-specific rate

Net Salary = Gross - PF - ESI - PT - TDS
```
