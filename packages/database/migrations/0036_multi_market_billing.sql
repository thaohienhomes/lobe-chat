-- Migration: Multi-Market Billing System
-- Description: Add PPP pricing and payment gateway configuration tables
-- Date: 2025-01-11
-- Related to: International expansion and multi-market support

-- ============================================================================
-- 1. Create PPP Pricing Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ppp_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"currency" varchar(3) NOT NULL,
	"ppp_multiplier" numeric(5,3) NOT NULL,
	"starter_monthly" integer NOT NULL,
	"starter_yearly" integer NOT NULL,
	"starter_monthly_usd" numeric(8,2) NOT NULL,
	"premium_monthly" integer NOT NULL,
	"premium_yearly" integer NOT NULL,
	"premium_monthly_usd" numeric(8,2) NOT NULL,
	"ultimate_monthly" integer NOT NULL,
	"ultimate_yearly" integer NOT NULL,
	"ultimate_monthly_usd" numeric(8,2) NOT NULL,
	"preferred_payment_gateway" varchar(20) NOT NULL,
	"available_payment_methods" jsonb NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 2. Create Payment Gateway Configs Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS "payment_gateway_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"gateway_name" varchar(50) NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"is_enabled" boolean DEFAULT true,
	"priority" integer DEFAULT 1,
	"config" jsonb NOT NULL,
	"fixed_fee" numeric(8,2) DEFAULT '0',
	"percentage_fee" numeric(5,3) DEFAULT '0',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- ============================================================================
-- 3. Create Indexes
-- ============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "ppp_pricing_country_code_key" ON "ppp_pricing"("country_code");
CREATE UNIQUE INDEX IF NOT EXISTS "payment_gateway_configs_gateway_country_key" ON "payment_gateway_configs"("gateway_name","country_code");

-- ============================================================================
-- 4. Add Comments
-- ============================================================================

COMMENT ON TABLE "ppp_pricing" IS 'PPP (Purchasing Power Parity) pricing for different countries';
COMMENT ON TABLE "payment_gateway_configs" IS 'Payment gateway configurations by country';

COMMENT ON COLUMN "ppp_pricing"."ppp_multiplier" IS 'PPP multiplier relative to US pricing (e.g., 0.35 for India)';
COMMENT ON COLUMN "ppp_pricing"."available_payment_methods" IS 'JSON array of available payment methods for this country';
COMMENT ON COLUMN "payment_gateway_configs"."config" IS 'Gateway-specific configuration (API keys, webhook URLs, etc.)';
COMMENT ON COLUMN "payment_gateway_configs"."priority" IS 'Gateway priority (lower number = higher priority)';
