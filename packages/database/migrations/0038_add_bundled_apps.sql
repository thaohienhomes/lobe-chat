CREATE TABLE "payment_gateway_configs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" varchar(30) NOT NULL,
	"name" varchar(100) NOT NULL,
	"is_active" boolean DEFAULT true,
	"supported_currencies" jsonb,
	"supported_countries" jsonb,
	"supported_payment_methods" jsonb,
	"config" jsonb,
	"transaction_fee_percent" real,
	"transaction_fee_fixed" real,
	"currency" varchar(10),
	"priority" integer DEFAULT 0,
	"min_amount" real,
	"max_amount" real,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" varchar(50) NOT NULL,
	"billing_cycle" varchar(20) NOT NULL,
	"amount" real NOT NULL,
	"currency" varchar(10) NOT NULL,
	"amount_usd" real NOT NULL,
	"payment_provider" varchar(30) NOT NULL,
	"payment_method" varchar(30),
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"transaction_id" text,
	"external_id" text,
	"country_code" varchar(2),
	"ppp_multiplier" real,
	"customer_email" varchar(255),
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"raw_webhook" jsonb,
	"metadata" jsonb,
	"paid_at" timestamp with time zone,
	"refunded_at" timestamp with time zone,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ppp_pricing" (
	"id" text PRIMARY KEY NOT NULL,
	"country_code" varchar(2) NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"ppp_multiplier" real NOT NULL,
	"gdp_per_capita" real,
	"purchasing_power_index" real,
	"starter_monthly" real NOT NULL,
	"starter_yearly" real NOT NULL,
	"premium_monthly" real NOT NULL,
	"premium_yearly" real NOT NULL,
	"ultimate_monthly" real NOT NULL,
	"ultimate_yearly" real NOT NULL,
	"starter_monthly_usd" real NOT NULL,
	"premium_monthly_usd" real NOT NULL,
	"ultimate_monthly_usd" real NOT NULL,
	"available_payment_methods" jsonb,
	"preferred_payment_gateway" varchar(30),
	"is_active" boolean DEFAULT true,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions_multi_market" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"plan_id" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"billing_cycle" varchar(20) NOT NULL,
	"current_period_start" timestamp with time zone DEFAULT now() NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"payment_provider" varchar(30) NOT NULL,
	"currency" varchar(10) NOT NULL,
	"amount" real NOT NULL,
	"amount_usd" real NOT NULL,
	"country_code" varchar(2),
	"ppp_multiplier" real,
	"cancel_at_period_end" boolean DEFAULT false,
	"canceled_at" timestamp with time zone,
	"paused_at" timestamp with time zone,
	"external_subscription_id" text,
	"external_customer_id" text,
	"metadata" jsonb,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bundled_apps" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"avatar" text,
	"background_color" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"system_role" text NOT NULL,
	"config" jsonb,
	"chat_config" jsonb,
	"opening_message" text,
	"opening_questions" jsonb,
	"is_public" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"category" varchar(50),
	"usage_count" jsonb DEFAULT '0'::jsonb,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_cost_settings" ALTER COLUMN "monthly_budget_vnd" SET DEFAULT 39000;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "preferred_payment_method" varchar(20);--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "auto_renewal_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "payment_token_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "last_payment_method_update" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions_multi_market" ADD CONSTRAINT "subscriptions_multi_market_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "payments_order_id_key" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_status_idx" ON "payments" USING btree ("status");