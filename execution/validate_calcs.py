#!/usr/bin/env python3
"""
validate_calcs.py — PayEase Payroll Calculation Validator

Python port of the calculateSalary() logic from payroll.ts.
Runs canonical test cases and validates the output.

Usage:
  python3 execution/validate_calcs.py
"""

import math
import sys

# ── Statutory Constants (must match payroll.ts) ─────────────────────────────

PF_BASIC_CAP = 15_000
PF_EMPLOYEE_RATE = 0.12
PF_EMPLOYER_EPF_RATE = 0.0367
PF_EMPLOYER_EPS_RATE = 0.0833
PF_MAX_EMPLOYEE = 1_800

ESI_GROSS_LIMIT = 21_000
ESI_EMPLOYEE_RATE = 0.0075
ESI_EMPLOYER_RATE = 0.0325

PT_RATES = {
    "Karnataka": lambda s: 200 if s > 15_000 else 0,
    "Maharashtra": lambda s: 200 if s > 10_000 else (175 if s > 7_500 else 0),
    "Tamil Nadu": lambda s: 208 if s > 21_000 else (180 if s > 15_000 else (115 if s > 12_500 else 0)),
    "Gujarat": lambda _: 0,
    "Delhi": lambda _: 0,
}

# ── Calc Engine (Python mirror) ────────────────────────────────────────────

def calculate_salary(
    annual_ctc: float,
    basic_pct: float = 40,
    hra_pct: float = 50,
    pf_enabled: bool = True,
    pt_enabled: bool = True,
    state: str = "Karnataka",
) -> dict:
    monthly_ctc = annual_ctc / 12

    basic = round(monthly_ctc * (basic_pct / 100))
    hra = round(basic * (hra_pct / 100))

    pf_basic = min(basic, PF_BASIC_CAP)
    employer_pf = round(pf_basic * (PF_EMPLOYER_EPF_RATE + PF_EMPLOYER_EPS_RATE)) if pf_enabled else 0

    preliminary_gross = basic + hra
    esi_applicable = preliminary_gross <= ESI_GROSS_LIMIT

    special_allowance = monthly_ctc - basic - hra - employer_pf
    gross_salary = basic + hra + special_allowance

    employer_esi = round(gross_salary * ESI_EMPLOYER_RATE) if esi_applicable else 0

    special_allowance = monthly_ctc - basic - hra - employer_pf - employer_esi
    if special_allowance < 0:
        special_allowance = 0
    gross_salary = basic + hra + special_allowance

    employee_pf = min(round(pf_basic * PF_EMPLOYEE_RATE), PF_MAX_EMPLOYEE) if pf_enabled else 0
    employee_esi = round(gross_salary * ESI_EMPLOYEE_RATE) if esi_applicable else 0

    pt_fn = PT_RATES.get(state, PT_RATES["Karnataka"])
    professional_tax = pt_fn(gross_salary) if pt_enabled else 0

    tds = 0  # Simplified

    total_deductions = employee_pf + employee_esi + professional_tax + tds
    net_salary = gross_salary - total_deductions

    return {
        "basic": basic,
        "hra": hra,
        "special_allowance": special_allowance,
        "gross_salary": gross_salary,
        "employer_pf": employer_pf,
        "employer_esi": employer_esi,
        "employee_pf": employee_pf,
        "employee_esi": employee_esi,
        "professional_tax": professional_tax,
        "tds": tds,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
        "monthly_ctc": monthly_ctc,
    }

# ── Test Cases ──────────────────────────────────────────────────────────────

TEST_CASES = [
    {
        "label": "₹3L CTC (low, ESI applies)",
        "annual_ctc": 300_000,
        "expect": {
            "basic": 10_000,
            "hra": 5_000,
            "employee_pf": 1_200,
            "esi_applies": True,
            "professional_tax": 200,
        },
    },
    {
        "label": "₹6L CTC (standard, no ESI)",
        "annual_ctc": 600_000,
        "expect": {
            "basic": 20_000,
            "hra": 10_000,
            "employee_pf": 1_800,
            "esi_applies": False,
            "professional_tax": 200,
        },
    },
    {
        "label": "₹15L CTC (PF capped)",
        "annual_ctc": 1_500_000,
        "expect": {
            "basic": 50_000,
            "hra": 25_000,
            "employee_pf": 1_800,
            "esi_applies": False,
            "professional_tax": 200,
        },
    },
    {
        "label": "₹30L CTC (high)",
        "annual_ctc": 3_000_000,
        "expect": {
            "basic": 100_000,
            "hra": 50_000,
            "employee_pf": 1_800,
            "esi_applies": False,
            "professional_tax": 200,
        },
    },
]

# ── Runner ──────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  PayEase Payroll Calculation Validator")
    print("=" * 60)

    passed = 0
    failed = 0

    for tc in TEST_CASES:
        label = tc["label"]
        result = calculate_salary(tc["annual_ctc"])
        exp = tc["expect"]
        errors = []

        if result["basic"] != exp["basic"]:
            errors.append(f"basic: got {result['basic']}, expected {exp['basic']}")
        if result["hra"] != exp["hra"]:
            errors.append(f"hra: got {result['hra']}, expected {exp['hra']}")
        if result["employee_pf"] != exp["employee_pf"]:
            errors.append(f"employee_pf: got {result['employee_pf']}, expected {exp['employee_pf']}")
        if result["professional_tax"] != exp["professional_tax"]:
            errors.append(f"PT: got {result['professional_tax']}, expected {exp['professional_tax']}")

        esi_actually_applies = result["employee_esi"] > 0
        if esi_actually_applies != exp["esi_applies"]:
            errors.append(f"ESI: applies={esi_actually_applies}, expected={exp['esi_applies']}")

        # Invariant checks
        if result["gross_salary"] != result["basic"] + result["hra"] + result["special_allowance"]:
            errors.append("INVARIANT: gross ≠ basic + hra + special")
        if result["net_salary"] != result["gross_salary"] - result["total_deductions"]:
            errors.append("INVARIANT: net ≠ gross - deductions")
        if result["net_salary"] < 0:
            errors.append("INVARIANT: net salary is negative")

        if errors:
            print(f"\n  ❌ {label}")
            for e in errors:
                print(f"     → {e}")
            failed += 1
        else:
            print(f"\n  ✅ {label}")
            print(f"     Gross: ₹{result['gross_salary']:,.0f}  Net: ₹{result['net_salary']:,.0f}")
            passed += 1

    print("\n" + "=" * 60)
    print(f"  Results: {passed} passed, {failed} failed")
    print("=" * 60)
    sys.exit(0 if failed == 0 else 1)

if __name__ == "__main__":
    main()
