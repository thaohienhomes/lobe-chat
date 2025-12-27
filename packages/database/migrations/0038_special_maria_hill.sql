-- CREATE TABLE "shared_conversations" (
-- 	"id" text PRIMARY KEY NOT NULL,
-- 	"user_id" text,
-- 	"title" text NOT NULL,
-- 	"description" text,
-- 	"avatar" text,
-- 	"background_color" text,
-- 	"tags" jsonb,
-- 	"system_role" text,
-- 	"model" text,
-- 	"provider" text,
-- 	"params" jsonb,
-- 	"chat_config" jsonb,
-- 	"messages" jsonb NOT NULL,
-- 	"is_public" boolean DEFAULT true,
-- 	"view_count" integer DEFAULT 0,
-- 	"fork_count" integer DEFAULT 0,
-- 	"created_at" timestamp DEFAULT now(),
-- 	"updated_at" timestamp DEFAULT now(),
-- 	"accessed_at" timestamp DEFAULT now()
-- );
-- --> statement-breakpoint
CREATE TABLE IF NOT EXISTS "model_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"input_price" real NOT NULL,
	"output_price" real NOT NULL,
	"per_msg_fee" real DEFAULT 0,
	"tier" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'model_pricing_model_id_unique') THEN
		ALTER TABLE "model_pricing" ADD CONSTRAINT "model_pricing_model_id_unique" UNIQUE("model_id");
	END IF;
END $$;
--> statement-breakpoint
-- ALTER TABLE "payments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- ALTER TABLE "subscriptions_multi_market" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- DROP TABLE "payments" CASCADE;--> statement-breakpoint
-- DROP TABLE "subscriptions_multi_market" CASCADE;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ALTER COLUMN "config" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ALTER COLUMN "priority" SET DEFAULT 1;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "currency" SET DATA TYPE varchar(3);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "ppp_multiplier" SET DATA TYPE numeric(5, 3);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "starter_monthly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "starter_yearly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "premium_monthly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "premium_yearly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "ultimate_monthly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "ultimate_yearly" SET DATA TYPE integer;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "starter_monthly_usd" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "premium_monthly_usd" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "ultimate_monthly_usd" SET DATA TYPE numeric(8, 2);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "available_payment_methods" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "preferred_payment_gateway" SET DATA TYPE varchar(20);--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" ALTER COLUMN "preferred_payment_gateway" SET NOT NULL;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ADD COLUMN "gateway_name" varchar(50) NOT NULL;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ADD COLUMN "country_code" varchar(2) NOT NULL;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ADD COLUMN "is_enabled" boolean DEFAULT true;--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ADD COLUMN "fixed_fee" numeric(8, 2) DEFAULT '0';--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" ADD COLUMN "percentage_fee" numeric(5, 3) DEFAULT '0';--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pho_credit_balance') THEN
		ALTER TABLE "users" ADD COLUMN "pho_credit_balance" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'lifetime_spent') THEN
		ALTER TABLE "users" ADD COLUMN "lifetime_spent" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_tier1_usage') THEN
		ALTER TABLE "users" ADD COLUMN "daily_tier1_usage" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_usage_date') THEN
		ALTER TABLE "users" ADD COLUMN "last_usage_date" timestamp with time zone DEFAULT now();
	END IF;
END $$;
-- --> statement-breakpoint
-- CREATE UNIQUE INDEX "payment_gateway_configs_gateway_country_key" ON "payment_gateway_configs" USING btree ("gateway_name","country_code");--> statement-breakpoint
-- CREATE UNIQUE INDEX "ppp_pricing_country_code_key" ON "ppp_pricing" USING btree ("country_code");--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "provider";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "name";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "is_active";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "supported_currencies";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "supported_countries";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "supported_payment_methods";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "transaction_fee_percent";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "transaction_fee_fixed";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "currency";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "min_amount";--> statement-breakpoint
-- ALTER TABLE "payment_gateway_configs" DROP COLUMN "max_amount";--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" DROP COLUMN "gdp_per_capita";--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" DROP COLUMN "purchasing_power_index";--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" DROP COLUMN "effective_from";--> statement-breakpoint
-- ALTER TABLE "ppp_pricing" DROP COLUMN "effective_to";
