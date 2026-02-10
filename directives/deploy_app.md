# Directive: Deploy Application

## Purpose
Standard operating procedure for deploying PayEase to staging and production environments.

## Prerequisites
- All tests passing (`npm test`)
- Code reviewed and merged to `main` branch
- Environment variables configured

## Steps

### 1. Pre-deployment Checks
```bash
# Run tests
npm run test

# Build production bundle
npm run build

# Verify build output
ls -la dist/
```

### 2. Deploy to Staging
```bash
# Deploy via GitHub Actions (automatic on merge to main)
# Or manual deployment:
./execution/deploy.py --env staging
```

### 3. Staging Verification
- [ ] Health check endpoint responds: `GET /api/health`
- [ ] Login flow works
- [ ] Sample payroll calculation succeeds
- [ ] Payslip PDF generates correctly

### 4. Deploy to Production
```bash
# Trigger production deployment
./execution/deploy.py --env production
```

### 5. Post-deployment
- [ ] Monitor error rates (Sentry)
- [ ] Check application logs
- [ ] Verify database connectivity

## Rollback
If issues detected:
```bash
./execution/deploy.py --env production --rollback
```

## Edge Cases
- **Database migration fails**: Check migration logs, manually rollback if needed
- **Build fails**: Check npm dependencies, clear cache with `npm ci`

## Last Updated
- Date: 2026-02-09
- Author: Agent
