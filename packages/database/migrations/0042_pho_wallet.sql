-- Phở Wallet: Central bank for Phở ecosystem
-- Stores credit balances and tier information for cross-service deductions

CREATE TABLE IF NOT EXISTS "pho_wallet" (
	"clerk_user_id" text PRIMARY KEY NOT NULL,
	"balance" integer DEFAULT 0 NOT NULL,
	"tier_code" text DEFAULT 'free' NOT NULL,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Add index for faster balance lookups
CREATE INDEX IF NOT EXISTS "pho_wallet_balance_idx" ON "pho_wallet" ("balance");
--> statement-breakpoint
-- Add index for tier-based queries
CREATE INDEX IF NOT EXISTS "pho_wallet_tier_idx" ON "pho_wallet" ("tier_code");
