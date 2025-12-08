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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ppp_pricing_country_code_key" ON "ppp_pricing"("country_code");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "payment_gateway_configs_gateway_country_key" ON "payment_gateway_configs"("gateway_name","country_code");
