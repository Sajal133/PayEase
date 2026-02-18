---
title: Test Protocol
version: 1.0
last_updated: 2026-02-18
---

# Test Protocol

Standard operating procedure for running and maintaining tests in PayEase.

## 1. Running Tests

### Unit & Integration Tests (Vitest)
```bash
# Run all tests once
npm run test --workspace=apps/web -- run

# Run in watch mode (development)
npm run test --workspace=apps/web

# Run a specific file
npx vitest run src/lib/__tests__/payroll.test.ts --config vitest.config.ts
```

### Coverage Report
```bash
# Generate coverage (text + HTML + LCOV)
npx vitest run --coverage --config vitest.config.ts
# Open HTML report
open coverage/index.html
```

**Coverage target:** ≥80% on `src/lib/payroll.ts` and `src/lib/documents.ts` utilities.

### Python Validation Scripts
```bash
# System health check (Supabase connectivity, tables, RLS)
python3 execution/run_system_check.py

# Payroll calculation validator
python3 execution/validate_calcs.py
```

## 2. When to Run Tests

| Trigger | What to Run |
|---|---|
| Before every PR | Full test suite (`vitest run`) |
| After payroll engine changes | `payroll.test.ts` + `payroll.integration.test.ts` |
| After document/utility changes | `documents.test.ts` |
| Before deployment | Full suite + `validate_calcs.py` + `run_system_check.py` |
| After DB migration | `run_system_check.py` |

## 3. Adding New Tests

### For pure functions (no Supabase dependency)
1. Create test file in `src/lib/__tests__/<module>.test.ts`
2. Import the function directly
3. Use `describe` / `it` / `expect` from Vitest
4. Follow the existing naming pattern

### For Supabase-dependent functions
1. Mock `supabase` using `vi.mock('../supabase')`
2. Use `vi.fn()` to stub `.from().select()` chains
3. Test the business logic, not the Supabase SDK

### For integration/golden tests
1. Add to `payroll.integration.test.ts`
2. Manually compute the expected values first
3. Document the calculation in comments

## 4. CI Integration

Tests run automatically on every push/PR via GitHub Actions (`.github/workflows/ci.yml`). The CI pipeline will:
1. Install dependencies
2. Type-check (`tsc --noEmit`)
3. Run all tests (`vitest run`)
4. Build (`vite build`)

A failing test will block the PR from merging.

## 5. Self-Anneal

When a test fails unexpectedly:
1. Read the error message and stack trace
2. Determine if the failure is in the test or the code
3. Fix the root cause
4. Update this directive if you discover new edge cases or testing patterns
