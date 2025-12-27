CREATE TABLE IF NOT EXISTS "daily_usage" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"date" varchar(10) NOT NULL,
	"tier1_messages" integer DEFAULT 0,
	"tier2_messages" integer DEFAULT 0,
	"tier3_messages" integer DEFAULT 0,
	"points_used" integer DEFAULT 0,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) NOT NULL,
	"provider" varchar(20) NOT NULL,
	"provider_tx_id" text,
	"plan_code" varchar(50),
	"points_granted" integer DEFAULT 0,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"metadata" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cost_settings' AND column_name = 'monthly_budget_vnd') THEN
		ALTER TABLE "user_cost_settings" ALTER COLUMN "monthly_budget_vnd" SET DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'model_pricing' AND column_name = 'input_price') THEN
		ALTER TABLE "model_pricing" ALTER COLUMN "input_price" SET DEFAULT 0;
		ALTER TABLE "model_pricing" ALTER COLUMN "input_price" DROP NOT NULL;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'model_pricing' AND column_name = 'output_price') THEN
		ALTER TABLE "model_pricing" ALTER COLUMN "output_price" SET DEFAULT 0;
		ALTER TABLE "model_pricing" ALTER COLUMN "output_price" DROP NOT NULL;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'model_pricing' AND column_name = 'tier') THEN
		ALTER TABLE "model_pricing" ALTER COLUMN "tier" SET NOT NULL;
	END IF;
EXCEPTION WHEN others THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_logs' AND column_name = 'points_deducted') THEN
		ALTER TABLE "usage_logs" ADD COLUMN "points_deducted" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usage_logs' AND column_name = 'model_tier') THEN
		ALTER TABLE "usage_logs" ADD COLUMN "model_tier" integer DEFAULT 1;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cost_settings' AND column_name = 'monthly_budget_points') THEN
		ALTER TABLE "user_cost_settings" ADD COLUMN "monthly_budget_points" integer DEFAULT 50000;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_cost_settings' AND column_name = 'daily_budget_points') THEN
		ALTER TABLE "user_cost_settings" ADD COLUMN "daily_budget_points" integer;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pho_points_balance') THEN
		ALTER TABLE "users" ADD COLUMN "pho_points_balance" integer DEFAULT 50000;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'points_reset_date') THEN
		ALTER TABLE "users" ADD COLUMN "points_reset_date" timestamp with time zone;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'current_plan_id') THEN
		ALTER TABLE "users" ADD COLUMN "current_plan_id" text DEFAULT 'vn_free';
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
		ALTER TABLE "users" ADD COLUMN "subscription_status" text DEFAULT 'FREE';
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country_code') THEN
		ALTER TABLE "users" ADD COLUMN "country_code" text;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_tier2_usage') THEN
		ALTER TABLE "users" ADD COLUMN "daily_tier2_usage" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_tier3_usage') THEN
		ALTER TABLE "users" ADD COLUMN "daily_tier3_usage" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'streak_count') THEN
		ALTER TABLE "users" ADD COLUMN "streak_count" integer DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_active_date') THEN
		ALTER TABLE "users" ADD COLUMN "last_active_date" timestamp with time zone;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'model_pricing' AND column_name = 'input_cost_per_1m') THEN
		ALTER TABLE "model_pricing" ADD COLUMN "input_cost_per_1m" real DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'model_pricing' AND column_name = 'output_cost_per_1m') THEN
		ALTER TABLE "model_pricing" ADD COLUMN "output_cost_per_1m" real DEFAULT 0;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'daily_usage_user_id_users_id_fk') THEN
		ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_users_id_fk') THEN
		ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pho_credit_balance') THEN
		ALTER TABLE "users" DROP COLUMN "pho_credit_balance";
	END IF;
EXCEPTION WHEN others THEN NULL;
END $$;