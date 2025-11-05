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

