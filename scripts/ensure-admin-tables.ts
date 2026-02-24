import { sql } from 'drizzle-orm';

/**
 * Ensure all custom admin/feature tables exist.
 * Run: npx tsx scripts/ensure-admin-tables.ts
 */
async function main() {
  // Load .env
  const dotenv = await import('dotenv');
  dotenv.config({ path: '.env.local' });

  const { getServerDB } = await import('../packages/database/src/server/index');
  const db = await getServerDB();

  console.log('Creating webhook_logs table...');
  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "webhook_logs" (
          "id" text PRIMARY KEY NOT NULL,
          "provider" varchar(20) NOT NULL,
          "event_type" varchar(100) NOT NULL,
          "status" varchar(20) NOT NULL DEFAULT 'received',
          "order_id" text,
          "user_id" text,
          "amount_usd" text,
          "payload" jsonb,
          "error_message" text,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
    `);
  console.log('✅ webhook_logs table ready.');

  console.log('Creating referral_conversions table...');
  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "referral_conversions" (
          "id" text PRIMARY KEY NOT NULL,
          "referrer_clerk_id" text NOT NULL,
          "referred_clerk_id" text NOT NULL,
          "referral_code" text NOT NULL,
          "bonus_awarded" boolean NOT NULL DEFAULT false,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_referral_referrer" ON "referral_conversions" ("referrer_clerk_id");
      CREATE INDEX IF NOT EXISTS "idx_referral_referred" ON "referral_conversions" ("referred_clerk_id");
    `);
  console.log('✅ referral_conversions table ready.');

  console.log('Creating pho_api_keys table...');
  await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "pho_api_keys" (
          "id" text PRIMARY KEY NOT NULL,
          "clerk_user_id" text NOT NULL,
          "label" text NOT NULL DEFAULT 'Default',
          "key_hash" text NOT NULL UNIQUE,
          "key_prefix" text NOT NULL,
          "is_active" boolean NOT NULL DEFAULT true,
          "last_used_at" timestamp with time zone,
          "expires_at" timestamp with time zone,
          "created_at" timestamp with time zone DEFAULT now() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "idx_api_keys_clerk_user" ON "pho_api_keys" ("clerk_user_id");
      CREATE INDEX IF NOT EXISTS "idx_api_keys_hash" ON "pho_api_keys" ("key_hash");
    `);
  console.log('✅ pho_api_keys table ready.');

  console.log('All tables ensured successfully.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
