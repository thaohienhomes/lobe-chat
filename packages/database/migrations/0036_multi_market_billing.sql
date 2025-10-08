-- Migration: Multi-Market Billing System
-- Description: Add support for multiple currencies, payment gateways, and PPP pricing
-- Date: 2025-01-08

-- ============================================================================
-- 1. Create new payments table (replaces sepay_payments)
-- ============================================================================

CREATE TABLE IF NOT EXISTS "payments" (
  "id" TEXT PRIMARY KEY,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Subscription details
  "plan_id" VARCHAR(50) NOT NULL,
  "billing_cycle" VARCHAR(20) NOT NULL,
  
  -- Multi-currency support
  "amount" REAL NOT NULL,
  "currency" VARCHAR(10) NOT NULL,
  "amount_usd" REAL NOT NULL,
  
  -- Payment gateway
  "payment_provider" VARCHAR(30) NOT NULL,
  "payment_method" VARCHAR(30),
  
  -- Payment status
  "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
  
  -- Transaction tracking
  "transaction_id" TEXT,
  "external_id" TEXT,
  
  -- Geo and pricing context
  "country_code" VARCHAR(2),
  "ppp_multiplier" REAL,
  
  -- Customer info
  "customer_email" VARCHAR(255),
  "customer_name" VARCHAR(255),
  "customer_phone" VARCHAR(50),
  
  -- Metadata
  "raw_webhook" JSONB,
  "metadata" JSONB,
  
  -- Timestamps
  "paid_at" TIMESTAMPTZ,
  "refunded_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payments_order_id_key" ON "payments"("order_id");
CREATE INDEX IF NOT EXISTS "payments_user_id_idx" ON "payments"("user_id");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
CREATE INDEX IF NOT EXISTS "payments_provider_idx" ON "payments"("payment_provider");
CREATE INDEX IF NOT EXISTS "payments_country_idx" ON "payments"("country_code");

-- ============================================================================
-- 2. Create subscriptions_multi_market table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "subscriptions_multi_market" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  
  -- Plan details
  "plan_id" VARCHAR(50) NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'active',
  "billing_cycle" VARCHAR(20) NOT NULL,
  
  -- Billing period
  "current_period_start" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "current_period_end" TIMESTAMPTZ NOT NULL,
  
  -- Payment details
  "payment_provider" VARCHAR(30) NOT NULL,
  "currency" VARCHAR(10) NOT NULL,
  "amount" REAL NOT NULL,
  "amount_usd" REAL NOT NULL,
  
  -- Geo context
  "country_code" VARCHAR(2),
  "ppp_multiplier" REAL,
  
  -- Subscription management
  "cancel_at_period_end" BOOLEAN DEFAULT FALSE,
  "canceled_at" TIMESTAMPTZ,
  "paused_at" TIMESTAMPTZ,
  
  -- External IDs
  "external_subscription_id" TEXT,
  "external_customer_id" TEXT,
  
  -- Metadata
  "metadata" JSONB,
  
  -- Timestamps
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "subscriptions_multi_market_user_id_idx" ON "subscriptions_multi_market"("user_id");
CREATE INDEX IF NOT EXISTS "subscriptions_multi_market_status_idx" ON "subscriptions_multi_market"("status");

-- ============================================================================
-- 3. Create ppp_pricing table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ppp_pricing" (
  "id" TEXT PRIMARY KEY,
  
  -- Country and currency
  "country_code" VARCHAR(2) NOT NULL,
  "country_name" VARCHAR(100) NOT NULL,
  "currency" VARCHAR(10) NOT NULL,
  
  -- PPP adjustment
  "ppp_multiplier" REAL NOT NULL,
  "gdp_per_capita" REAL,
  "purchasing_power_index" REAL,
  
  -- Plan pricing in local currency
  "starter_monthly" REAL NOT NULL,
  "starter_yearly" REAL NOT NULL,
  "premium_monthly" REAL NOT NULL,
  "premium_yearly" REAL NOT NULL,
  "ultimate_monthly" REAL NOT NULL,
  "ultimate_yearly" REAL NOT NULL,
  
  -- USD equivalents
  "starter_monthly_usd" REAL NOT NULL,
  "premium_monthly_usd" REAL NOT NULL,
  "ultimate_monthly_usd" REAL NOT NULL,
  
  -- Payment methods
  "available_payment_methods" JSONB,
  "preferred_payment_gateway" VARCHAR(30),
  
  -- Status
  "is_active" BOOLEAN DEFAULT TRUE,
  "effective_from" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "effective_to" TIMESTAMPTZ,
  
  -- Timestamps
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "ppp_pricing_country_code_key" ON "ppp_pricing"("country_code");
CREATE INDEX IF NOT EXISTS "ppp_pricing_is_active_idx" ON "ppp_pricing"("is_active");

-- ============================================================================
-- 4. Create payment_gateway_configs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "payment_gateway_configs" (
  "id" TEXT PRIMARY KEY,
  
  -- Gateway details
  "provider" VARCHAR(30) NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  
  -- Supported features
  "supported_currencies" JSONB,
  "supported_countries" JSONB,
  "supported_payment_methods" JSONB,
  
  -- Configuration
  "config" JSONB,
  
  -- Fees and costs
  "transaction_fee_percent" REAL,
  "transaction_fee_fixed" REAL,
  "currency" VARCHAR(10),
  
  -- Priority and routing
  "priority" INTEGER DEFAULT 0,
  "min_amount" REAL,
  "max_amount" REAL,
  
  -- Timestamps
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "payment_gateway_configs_provider_key" ON "payment_gateway_configs"("provider");
CREATE INDEX IF NOT EXISTS "payment_gateway_configs_is_active_idx" ON "payment_gateway_configs"("is_active");

-- ============================================================================
-- 5. Migrate existing data from sepay_payments to payments
-- ============================================================================

-- Insert existing Sepay payments into new payments table
INSERT INTO "payments" (
  "id",
  "order_id",
  "user_id",
  "plan_id",
  "billing_cycle",
  "amount",
  "currency",
  "amount_usd",
  "payment_provider",
  "payment_method",
  "status",
  "transaction_id",
  "country_code",
  "ppp_multiplier",
  "customer_email",
  "raw_webhook",
  "metadata",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "order_id",
  "user_id",
  "plan_id",
  "billing_cycle",
  "amount_vnd"::REAL,
  "currency",
  ("amount_vnd"::REAL / 24167.0), -- Convert VND to USD
  "payment_method",
  'bank_transfer',
  "status",
  "transaction_id",
  'VN', -- Assume all existing payments are from Vietnam
  0.40, -- Vietnam PPP multiplier
  NULL, -- No email in old schema
  "raw_webhook",
  "metadata",
  "created_at",
  "updated_at"
FROM "sepay_payments"
WHERE NOT EXISTS (
  SELECT 1 FROM "payments" WHERE "payments"."order_id" = "sepay_payments"."order_id"
);

-- ============================================================================
-- 6. Migrate existing subscriptions to subscriptions_multi_market
-- ============================================================================

INSERT INTO "subscriptions_multi_market" (
  "id",
  "user_id",
  "plan_id",
  "status",
  "billing_cycle",
  "current_period_start",
  "current_period_end",
  "payment_provider",
  "currency",
  "amount",
  "amount_usd",
  "country_code",
  "ppp_multiplier",
  "cancel_at_period_end",
  "created_at",
  "updated_at"
)
SELECT
  "id",
  "user_id",
  "plan_id",
  "status",
  "billing_cycle",
  "current_period_start",
  "current_period_end",
  "payment_provider",
  'VND',
  CASE
    WHEN "plan_id" = 'starter' AND "billing_cycle" = 'monthly' THEN 29000.0
    WHEN "plan_id" = 'starter' AND "billing_cycle" = 'yearly' THEN 290000.0
    WHEN "plan_id" = 'premium' AND "billing_cycle" = 'monthly' THEN 99000.0
    WHEN "plan_id" = 'premium' AND "billing_cycle" = 'yearly' THEN 990000.0
    WHEN "plan_id" = 'ultimate' AND "billing_cycle" = 'monthly' THEN 289000.0
    WHEN "plan_id" = 'ultimate' AND "billing_cycle" = 'yearly' THEN 2890000.0
    ELSE 0.0
  END,
  CASE
    WHEN "plan_id" = 'starter' AND "billing_cycle" = 'monthly' THEN 1.2
    WHEN "plan_id" = 'starter' AND "billing_cycle" = 'yearly' THEN 12.0
    WHEN "plan_id" = 'premium' AND "billing_cycle" = 'monthly' THEN 4.0
    WHEN "plan_id" = 'premium' AND "billing_cycle" = 'yearly' THEN 40.0
    WHEN "plan_id" = 'ultimate' AND "billing_cycle" = 'monthly' THEN 11.6
    WHEN "plan_id" = 'ultimate' AND "billing_cycle" = 'yearly' THEN 116.0
    ELSE 0.0
  END,
  'VN',
  0.40,
  "cancel_at_period_end",
  "created_at",
  "updated_at"
FROM "subscriptions"
WHERE NOT EXISTS (
  SELECT 1 FROM "subscriptions_multi_market" 
  WHERE "subscriptions_multi_market"."user_id" = "subscriptions"."user_id"
);

-- ============================================================================
-- 7. Insert default PPP pricing data for key markets
-- ============================================================================

INSERT INTO "ppp_pricing" (
  "id", "country_code", "country_name", "currency", "ppp_multiplier",
  "starter_monthly", "starter_yearly", "premium_monthly", "premium_yearly",
  "ultimate_monthly", "ultimate_yearly",
  "starter_monthly_usd", "premium_monthly_usd", "ultimate_monthly_usd",
  "available_payment_methods", "preferred_payment_gateway"
) VALUES
  -- Vietnam
  ('ppp_vn', 'VN', 'Vietnam', 'VND', 0.40,
   11607, 116067, 38690, 386900, 112334, 1123340,
   0.48, 1.60, 4.65,
   '["bank_transfer", "qr_code"]'::jsonb, 'sepay'),
  
  -- India
  ('ppp_in', 'IN', 'India', 'INR', 0.35,
   35, 349, 116, 1163, 337, 3373,
   0.42, 1.40, 4.06,
   '["card", "upi", "netbanking", "wallet"]'::jsonb, 'razorpay'),
  
  -- United States
  ('ppp_us', 'US', 'United States', 'USD', 1.00,
   1.2, 12.0, 4.0, 40.0, 11.6, 116.0,
   1.2, 4.0, 11.6,
   '["card", "ach"]'::jsonb, 'stripe'),
  
  -- Germany
  ('ppp_de', 'DE', 'Germany', 'EUR', 1.00,
   1.10, 11.04, 3.68, 36.80, 10.67, 106.72,
   1.2, 4.0, 11.6,
   '["card", "sepa_debit", "sofort"]'::jsonb, 'stripe'),
  
  -- Brazil
  ('ppp_br', 'BR', 'Brazil', 'BRL', 0.48,
   2.78, 27.84, 9.26, 92.64, 26.88, 268.80,
   0.58, 1.92, 5.57,
   '["card", "boleto"]'::jsonb, 'stripe')
ON CONFLICT ("country_code") DO NOTHING;

-- ============================================================================
-- 8. Insert default payment gateway configurations
-- ============================================================================

INSERT INTO "payment_gateway_configs" (
  "id", "provider", "name", "is_active",
  "supported_currencies", "supported_countries", "supported_payment_methods",
  "transaction_fee_percent", "transaction_fee_fixed", "currency", "priority"
) VALUES
  ('gateway_sepay', 'sepay', 'Sepay (Vietnam Bank Transfer)', TRUE,
   '["VND"]'::jsonb, '["VN"]'::jsonb, '["bank_transfer", "qr_code"]'::jsonb,
   0.0, 0.0, 'VND', 100),
  
  ('gateway_stripe', 'stripe', 'Stripe', TRUE,
   '["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"]'::jsonb,
   '["US", "GB", "DE", "FR", "CA", "AU", "IN"]'::jsonb,
   '["card", "sepa_debit", "ach", "bacs"]'::jsonb,
   2.9, 0.30, 'USD', 80),
  
  ('gateway_razorpay', 'razorpay', 'Razorpay (India)', TRUE,
   '["INR"]'::jsonb, '["IN"]'::jsonb,
   '["card", "upi", "netbanking", "wallet"]'::jsonb,
   2.0, 0.0, 'INR', 100)
ON CONFLICT ("provider") DO NOTHING;

-- ============================================================================
-- 9. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE "payments" IS 'Unified payments table supporting multiple currencies and payment gateways';
COMMENT ON TABLE "ppp_pricing" IS 'PPP (Purchasing Power Parity) pricing for different countries';
COMMENT ON TABLE "payment_gateway_configs" IS 'Configuration for payment gateway routing';
COMMENT ON TABLE "subscriptions_multi_market" IS 'Subscriptions with multi-market support';

