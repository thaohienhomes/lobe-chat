import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

import { requireAdmin } from '../_shared/auth';

/**
 * POST /api/admin/ensure-tables
 * Creates required admin/feature tables if they don't exist.
 * Replaces the need to run `npx tsx scripts/ensure-admin-tables.ts` manually.
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
 */
export async function POST(): Promise<NextResponse> {
    const denied = await requireAdmin();
    if (denied) return denied;

    const results: { status: string; table: string }[] = [];

    try {
        const db = await getServerDB();

        // 1. webhook_logs
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
        results.push({ status: 'ready', table: 'webhook_logs' });

        // 2. referral_conversions
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
        results.push({ status: 'ready', table: 'referral_conversions' });

        // 3. pho_api_keys
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
        results.push({ status: 'ready', table: 'pho_api_keys' });

        return NextResponse.json({
            message: 'All tables ensured successfully',
            results,
            success: true,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('[ensure-tables] Error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Unknown error',
                results,
                success: false,
            },
            { status: 500 },
        );
    }
}
