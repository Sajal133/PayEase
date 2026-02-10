# Directive: Database Migration

## Purpose
Standard operating procedure for making database schema changes safely.

## Prerequisites
- PostgreSQL database running
- Migration tool configured (e.g., Prisma, Knex, or TypeORM)
- Backup of current database

## Steps

### 1. Create Migration
```bash
# Generate migration file
npm run db:migration:create -- --name <migration_name>

# Example: Adding employees table
npm run db:migration:create -- --name add_employees_table
```

### 2. Write Migration
Edit the generated migration file:
```sql
-- Up (apply changes)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    -- ... additional columns
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Down (rollback)
DROP TABLE IF EXISTS employees;
```

### 3. Test Migration Locally
```bash
# Apply to local database
npm run db:migrate

# Verify table structure
npm run db:schema:show
```

### 4. Deploy Migration
```bash
# Staging first
npm run db:migrate -- --env staging

# Then production (after staging verification)
npm run db:migrate -- --env production
```

### 5. Verification
- [ ] New tables/columns exist
- [ ] Existing data intact
- [ ] Application connects successfully

## Rollback
```bash
npm run db:migrate:rollback -- --env production
```

## Edge Cases
- **Migration timeout**: Increase transaction timeout for large tables
- **Foreign key conflicts**: Ensure referenced data exists before migration

## Self-Anneal Notes
- (Add learnings from failed migrations here)

## Last Updated
- Date: 2026-02-09
- Author: Agent
