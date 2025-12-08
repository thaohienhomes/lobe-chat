CREATE TABLE "daily_usage" (
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
CREATE TABLE "transactions" (
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
ALTER TABLE "user_cost_settings" ALTER COLUMN "monthly_budget_vnd" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "model_pricing" ALTER COLUMN "input_price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "model_pricing" ALTER COLUMN "input_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "model_pricing" ALTER COLUMN "output_price" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "model_pricing" ALTER COLUMN "output_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "model_pricing" ALTER COLUMN "tier" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD COLUMN "points_deducted" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD COLUMN "model_tier" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "user_cost_settings" ADD COLUMN "monthly_budget_points" integer DEFAULT 50000;--> statement-breakpoint
ALTER TABLE "user_cost_settings" ADD COLUMN "daily_budget_points" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pho_points_balance" integer DEFAULT 50000;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "points_reset_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_plan_id" text DEFAULT 'vn_free';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" text DEFAULT 'FREE';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "country_code" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_tier2_usage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_tier3_usage" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "streak_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_active_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD COLUMN "input_cost_per_1m" real NOT NULL;--> statement-breakpoint
ALTER TABLE "model_pricing" ADD COLUMN "output_cost_per_1m" real NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "pho_credit_balance";