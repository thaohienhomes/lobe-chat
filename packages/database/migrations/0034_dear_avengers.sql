CREATE TABLE "monthly_usage_summary" (
	"user_id" text NOT NULL,
	"month" varchar(7) NOT NULL,
	"total_queries" integer DEFAULT 0,
	"total_tokens" integer DEFAULT 0,
	"total_cost_usd" real DEFAULT 0,
	"total_cost_vnd" real DEFAULT 0,
	"simple_queries" integer DEFAULT 0,
	"medium_queries" integer DEFAULT 0,
	"complex_queries" integer DEFAULT 0,
	"cheap_model_usage" real DEFAULT 0,
	"mid_tier_model_usage" real DEFAULT 0,
	"premium_model_usage" real DEFAULT 0,
	"subscription_tier" varchar(20),
	"budget_limit_vnd" real,
	"budget_used_vnd" real DEFAULT 0,
	"budget_remaining_vnd" real,
	"budget_warnings_sent" integer DEFAULT 0,
	"last_warning_at" timestamp,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "monthly_usage_summary_user_id_month_pk" PRIMARY KEY("user_id","month")
);
--> statement-breakpoint
CREATE TABLE "provider_costs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"input_cost_per_1k" real NOT NULL,
	"output_cost_per_1k" real NOT NULL,
	"effective_from" timestamp NOT NULL,
	"effective_to" timestamp,
	"currency" varchar(3) DEFAULT 'USD',
	"notes" text,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"session_id" text,
	"model" varchar(100) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"total_tokens" integer,
	"cost_usd" real NOT NULL,
	"cost_vnd" real NOT NULL,
	"query_complexity" varchar(20),
	"query_category" varchar(50),
	"response_time_ms" integer,
	"metadata" jsonb,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cost_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"monthly_budget_vnd" real DEFAULT 29000,
	"daily_budget_vnd" real,
	"preferred_models" jsonb,
	"blocked_models" jsonb,
	"enable_cost_optimization" boolean DEFAULT true,
	"max_cost_per_query_vnd" real DEFAULT 100,
	"enable_budget_alerts" boolean DEFAULT true,
	"budget_alert_thresholds" jsonb DEFAULT '{"warning":75,"critical":90,"emergency":95}'::jsonb,
	"email_alerts" boolean DEFAULT true,
	"in_app_alerts" boolean DEFAULT true,
	"accessed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "monthly_usage_summary" ADD CONSTRAINT "monthly_usage_summary_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cost_settings" ADD CONSTRAINT "user_cost_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;