-- Add missing user columns for daily tier tracking and credits
-- These may have been skipped during previous deployment migrations (0038/0039)
-- All statements are idempotent (IF NOT EXISTS)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'daily_tier1_usage') THEN
    ALTER TABLE "users" ADD COLUMN "daily_tier1_usage" integer DEFAULT 0;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_usage_date') THEN
    ALTER TABLE "users" ADD COLUMN "last_usage_date" timestamp with time zone DEFAULT now();
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pho_points_balance') THEN
    ALTER TABLE "users" ADD COLUMN "pho_points_balance" integer DEFAULT 50000;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'points_reset_date') THEN
    ALTER TABLE "users" ADD COLUMN "points_reset_date" timestamp with time zone;
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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profession') THEN
    ALTER TABLE "users" ADD COLUMN "profession" text;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'specialization') THEN
    ALTER TABLE "users" ADD COLUMN "specialization" text;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'recommendation_selections') THEN
    ALTER TABLE "users" ADD COLUMN "recommendation_selections" jsonb;
  END IF;
END $$;
