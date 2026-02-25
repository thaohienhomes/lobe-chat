/**
 * Create a new Clerk user + activate vn_pro plan (Phở Đặc Biệt)
 * Run: npx tsx scripts/create-user-vn-pro.ts
 */

import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { resolve } from 'node:path';
import { Pool } from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env.vercel.production') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CLERK_SECRET_KEY || !DATABASE_URL) {
    console.error('❌ Missing CLERK_SECRET_KEY or DATABASE_URL');
    process.exit(1);
}

// ── User Details ──────────────────────────────────────
const USER_EMAIL = 'vuthanhhuong120898@gmail.com';
const FIRST_NAME = 'Hường';
const LAST_NAME = 'Vũ Thanh';
const TEMP_PASSWORD = 'PhoChatPro@2026';

// ── Plan: vn_pro (Phở Đặc Biệt) ─────────────────────
const PLAN_ID = 'vn_pro';
const MONTHLY_POINTS = 2_000_000;

function getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

async function main() {
    // ── Step 1: Create user in Clerk ──────────────────
    console.log(`\n👤 Creating user: ${FIRST_NAME} ${LAST_NAME} (${USER_EMAIL})...`);

    const createRes = await fetch('https://api.clerk.com/v1/users', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email_address: [USER_EMAIL],
            first_name: FIRST_NAME,
            last_name: LAST_NAME,
            password: TEMP_PASSWORD,
            skip_password_checks: true,
            public_metadata: {
                planId: PLAN_ID,
                activatedAt: new Date().toISOString(),
                activatedBy: 'admin-script',
            },
        }),
    });

    const user = await createRes.json();

    if (!createRes.ok) {
        // Check if user already exists
        if (user.errors?.[0]?.code === 'form_identifier_exists') {
            console.log('⚠️  User already exists in Clerk. Searching...');
            const searchRes = await fetch(
                `https://api.clerk.com/v1/users?email_address=${USER_EMAIL}`,
                { headers: { 'Authorization': `Bearer ${CLERK_SECRET_KEY}` } }
            );
            const existing = await searchRes.json();
            if (existing.length > 0) {
                console.log(`   Found: ${existing[0].id}`);
                // Update metadata
                await fetch(`https://api.clerk.com/v1/users/${existing[0].id}/metadata`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        public_metadata: {
                            planId: PLAN_ID,
                            activatedAt: new Date().toISOString(),
                            activatedBy: 'admin-script',
                        },
                    }),
                });
                console.log('✅ Clerk metadata updated for existing user');
                await syncDatabase(existing[0].id);
                return;
            }
        }
        console.error('❌ Failed to create user:', JSON.stringify(user, null, 2));
        process.exit(1);
    }

    console.log('✅ User created in Clerk!');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${USER_EMAIL}`);
    console.log(`   Plan: ${PLAN_ID}`);

    // ── Step 2: Sync database ─────────────────────────
    await syncDatabase(user.id);

    // ── Step 3: Summary ───────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Account created successfully!');
    console.log('='.repeat(60));
    console.log(`   📧 Email:    ${USER_EMAIL}`);
    console.log(`   🔑 Password: ${TEMP_PASSWORD}`);
    console.log(`   📦 Plan:     Phở Đặc Biệt (vn_pro)`);
    console.log(`   💰 Points:   ${MONTHLY_POINTS.toLocaleString()}/month`);
    console.log(`   🌐 Login:    https://pho.chat`);
    console.log('='.repeat(60));
    console.log('⚠️  Nhắc user đổi password sau khi đăng nhập lần đầu!');
}

async function syncDatabase(userId: string) {
    console.log('\n💾 Syncing database...');
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const db = drizzle(pool);
        const { users: usersTable } = await import('../packages/database/src/schemas/user');

        const pointsResetDate = getEndOfMonth();

        const dbResult = await db
            .update(usersTable)
            .set({
                currentPlanId: PLAN_ID,
                phoPointsBalance: MONTHLY_POINTS,
                pointsResetDate,
                subscriptionStatus: 'ACTIVE',
            })
            .where(eq(usersTable.id, userId))
            .returning({
                currentPlanId: usersTable.currentPlanId,
                phoPointsBalance: usersTable.phoPointsBalance,
                pointsResetDate: usersTable.pointsResetDate,
            });

        if (dbResult.length > 0) {
            console.log('✅ Database synced!');
            console.log(`   Plan: ${dbResult[0].currentPlanId}`);
            console.log(`   Points: ${dbResult[0].phoPointsBalance?.toLocaleString()}`);
        } else {
            console.warn('⚠️  User not found in DB — will be created on first login.');
        }
    } catch (err) {
        console.error('⚠️  DB sync failed:', err);
        console.log('   Clerk is set. DB will sync on first login.');
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
