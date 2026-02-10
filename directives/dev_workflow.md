# Directive: Development Workflow

## Purpose
Standard development process for PayEase feature implementation.

## Branch Strategy
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/<name>` - Feature branches
- `fix/<name>` - Bug fix branches

## Steps

### 1. Start New Feature
```bash
# Update local main
git checkout main && git pull

# Create feature branch
git checkout -b feature/<feature-name>
```

### 2. Development Loop
```bash
# Start development servers
npm run dev          # Frontend (Vite)
npm run dev:api      # Backend (Express)

# Run tests in watch mode
npm run test:watch
```

### 3. Code Standards
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Types**: `npm run typecheck`

### 4. Commit Conventions
```
feat: add employee management API
fix: correct PF calculation for max limit
docs: update README with setup instructions
refactor: extract salary calculation to service
test: add integration tests for payroll
```

### 5. Create Pull Request
```bash
git push -u origin feature/<feature-name>
```

PR Requirements:
- [ ] Tests passing
- [ ] No lint errors
- [ ] PR description complete
- [ ] Reviewer assigned

### 6. Code Review
- Address review comments
- Request re-review after changes

### 7. Merge
After approval:
```bash
# Squash merge to develop
git checkout develop && git merge --squash feature/<name>
```

## Environment Setup

### Required Tools
- Node.js 18+
- PostgreSQL 14+
- Redis 7+

### Initial Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with local values

# Run migrations
npm run db:migrate

# Seed data (optional)
npm run db:seed
```

## Last Updated
- Date: 2026-02-09
- Author: Agent
