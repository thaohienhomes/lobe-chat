# 🚨 CRITICAL: Manual Migration Required for Production Database

## Problem

Production database is **missing columns** from migration `0037_add_payment_preferences.sql`, causing credit card checkout to fail with error:

```
error: column "preferred_payment_method" does not exist
```

## Why Automatic Migration Failed

Despite having `MIGRATE_ON_BUILD=1` set in Vercel environment, the migration did not run during deployment. Possible reasons:

1. **Build cache** - Vercel may have cached the build and skipped migration step
2. **Migration timing** - Migration file was added after initial deployment
3. **Silent failure** - Migration may have failed without visible error in logs

## Solution: Run Migration Manually

### Option 1: Via Neon Cloud Console (RECOMMENDED)

**Steps:**

1. **Go to Neon Cloud Dashboard**
   - URL: https://console.neon.tech/
   - Login with your account

2. **Select Production Database**
   - Project: `pho.chat` (or your production project name)
   - Database: `neondb` (or your production database name)

3. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Or navigate to: https://console.neon.tech/app/projects/[PROJECT_ID]/branches/[BRANCH_ID]/sql-editor

4. **Copy-Paste Migration SQL**
   - Open file: `packages/database/migrations/0037_add_payment_preferences.sql`
   - Copy ALL content (65 lines)
   - Paste into SQL Editor

5. **Execute SQL**
   - Click "Run" button
   - Wait for completion (~5-10 seconds)

6. **Verify Success**
   - Check for success message: "Query executed successfully"
   - No errors should appear

7. **Verify Columns Exist**
   - Run this verification query:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'subscriptions' 
     AND column_name IN (
       'preferred_payment_method',
       'auto_renewal_enabled',
       'payment_token_id',
       'last_payment_method_update'
     );
   ```
   - **Expected Result**: 4 rows returned

---

### Option 2: Via Local Connection (If you have DATABASE_URL)

**Prerequisites:**
- Production `DATABASE_URL` environment variable
- Local development environment

**Steps:**

1. **Set Production DATABASE_URL**
   ```bash
   # Windows PowerShell
   $env:DATABASE_URL="postgresql://..."
   
   # Linux/Mac
   export DATABASE_URL="postgresql://..."
   ```

2. **Run Migration Script**
   ```bash
   bun run db:migrate
   ```

3. **Verify Success**
   - Look for: `✅ database migration pass.`
   - No errors should appear

---

### Option 3: Via Vercel CLI (Force Re-deployment)

**Prerequisites:**
- Vercel CLI installed: `npm i -g vercel`
- Vercel authentication token

**Steps:**

1. **Login to Vercel**
   ```bash
   vercel login
   ```

2. **Deploy with Migration Flag**
   ```bash
   # Set environment variable and deploy
   MIGRATE_ON_BUILD=1 vercel --prod
   ```

3. **Monitor Build Logs**
   - Watch for migration output in build logs
   - Look for: `✅ database migration pass.`

---

## Migration SQL Content

**File**: `packages/database/migrations/0037_add_payment_preferences.sql`

```sql
-- Migration: Add Payment Method Preferences to Subscriptions
-- Description: Add columns for payment method preference, auto-renewal, and payment token
-- Date: 2025-01-11
-- Related to: Payment Method Update Feature (Issue #1 & #2)

-- ============================================================================
-- 1. Add payment preference columns to subscriptions table
-- ============================================================================

-- Add preferred_payment_method column
ALTER TABLE "subscriptions" 
ADD COLUMN IF NOT EXISTS "preferred_payment_method" VARCHAR(20);

-- Add auto_renewal_enabled column
ALTER TABLE "subscriptions" 
ADD COLUMN IF NOT EXISTS "auto_renewal_enabled" BOOLEAN DEFAULT FALSE;

-- Add payment_token_id column (for Polar.sh payment method token)
ALTER TABLE "subscriptions" 
ADD COLUMN IF NOT EXISTS "payment_token_id" TEXT;

-- Add last_payment_method_update column
ALTER TABLE "subscriptions" 
ADD COLUMN IF NOT EXISTS "last_payment_method_update" TIMESTAMPTZ;

-- ============================================================================
-- 2. Add comments for documentation
-- ============================================================================

COMMENT ON COLUMN "subscriptions"."preferred_payment_method" IS 'User preferred payment method: bank_transfer or credit_card';
COMMENT ON COLUMN "subscriptions"."auto_renewal_enabled" IS 'Whether auto-renewal is enabled for credit card payments';
COMMENT ON COLUMN "subscriptions"."payment_token_id" IS 'Polar.sh payment method token for auto-renewal (credit card only)';
COMMENT ON COLUMN "subscriptions"."last_payment_method_update" IS 'Timestamp of last payment method preference update';

-- ============================================================================
-- 3. Create index for payment method queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS "subscriptions_preferred_payment_method_idx" 
ON "subscriptions"("preferred_payment_method");

CREATE INDEX IF NOT EXISTS "subscriptions_auto_renewal_enabled_idx" 
ON "subscriptions"("auto_renewal_enabled");

-- ============================================================================
-- 4. Set default values for existing subscriptions
-- ============================================================================

-- Set preferred_payment_method to 'bank_transfer' for existing Sepay subscriptions
UPDATE "subscriptions"
SET "preferred_payment_method" = 'bank_transfer',
    "auto_renewal_enabled" = FALSE,
    "last_payment_method_update" = NOW()
WHERE "payment_provider" = 'sepay' 
  AND "preferred_payment_method" IS NULL;

-- Set preferred_payment_method to 'credit_card' for existing Polar subscriptions
UPDATE "subscriptions"
SET "preferred_payment_method" = 'credit_card',
    "auto_renewal_enabled" = FALSE,
    "last_payment_method_update" = NOW()
WHERE "payment_provider" = 'polar' 
  AND "preferred_payment_method" IS NULL;
```

---

## Verification After Migration

### 1. Check Columns Exist

Run this query in Neon Cloud SQL Editor:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND column_name IN (
    'preferred_payment_method',
    'auto_renewal_enabled',
    'payment_token_id',
    'last_payment_method_update'
  )
ORDER BY column_name;
```

**Expected Output:**

| column_name | data_type | is_nullable | column_default |
|-------------|-----------|-------------|----------------|
| auto_renewal_enabled | boolean | YES | false |
| last_payment_method_update | timestamp with time zone | YES | NULL |
| payment_token_id | text | YES | NULL |
| preferred_payment_method | character varying | YES | NULL |

### 2. Check Indexes Created

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'subscriptions'
  AND indexname LIKE '%payment%';
```

**Expected Output:**

| indexname | indexdef |
|-----------|----------|
| subscriptions_preferred_payment_method_idx | CREATE INDEX ... |
| subscriptions_auto_renewal_enabled_idx | CREATE INDEX ... |

### 3. Test Credit Card Checkout

1. Navigate to: https://pho.chat/subscription/plans
2. Select Premium plan
3. Choose Credit Card payment method
4. Enter test card details
5. Click "Pay"
6. **Expected**: Checkout completes successfully (no database error)

---

## Troubleshooting

### Error: "relation 'subscriptions' does not exist"

**Cause**: Wrong database or schema selected

**Solution**: 
- Verify you're connected to production database
- Check schema name (should be `public`)

### Error: "permission denied"

**Cause**: Database user doesn't have ALTER TABLE permission

**Solution**:
- Use database owner account
- Or grant ALTER permission to current user

### Migration Runs But Columns Still Missing

**Cause**: Migration ran on wrong database/branch

**Solution**:
- Verify Neon branch (should be `main` or production branch)
- Check `DATABASE_URL` points to correct database

---

## After Migration Success

1. **Test checkout flow** on https://pho.chat
2. **Monitor Vercel logs** for any remaining errors
3. **Verify no more "column does not exist" errors**
4. **Update this document** with completion status

---

## Status Tracking

- [ ] Migration SQL copied
- [ ] Neon Cloud Console accessed
- [ ] SQL executed successfully
- [ ] Columns verified (4 columns exist)
- [ ] Indexes verified (2 indexes exist)
- [ ] Credit card checkout tested
- [ ] No database errors in logs
- [ ] Migration complete ✅

---

## Contact

If you encounter any issues running this migration, please:

1. **Check Vercel logs** for detailed error messages
2. **Screenshot any errors** from Neon Cloud Console
3. **Share error details** for debugging assistance

---

**IMPORTANT**: This migration is **SAFE** to run multiple times because it uses `IF NOT EXISTS` clauses. If columns already exist, they won't be recreated.

