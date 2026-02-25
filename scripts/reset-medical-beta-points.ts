/* eslint-disable unicorn/no-process-exit, unicorn/prefer-top-level-await */
/**
 * Reset medical_beta users' Phở Points to 500,000
 *
 * Bug: Sepay webhook was doing `phoPointsBalance += amount` (1 VND = 1 credit)
 * instead of setting to plan's monthlyPoints (500,000).
 *
 * Usage: npx tsx scripts/reset-medical-beta-points.ts
 */

// Must load .env.local BEFORE any other imports
// eslint-disable-next-line import/order
import dotenv from 'dotenv';

import { Pool } from 'pg';

dotenv.config({ override: true, path: '.env.local' });

const POINTS = 500_000;

async function main() {
    const url = process.env.DATABASE_URL;
    if (!url) { console.error('❌ No DATABASE_URL'); process.exit(1); }

    console.log('🔗 Connecting to:', url.replace(/:[^@]+@/, ':***@'));
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });

    try {
        // 1. Find affected users
        const { rows: affected } = await pool.query(
            `SELECT id, email, pho_points_balance FROM users WHERE current_plan_id = 'medical_beta' AND pho_points_balance > $1`,
            [POINTS],
        );

        if (affected.length === 0) {
            console.log('✅ No affected medical_beta users found.');
            return;
        }

        console.log(`\n🔍 Found ${affected.length} user(s) with inflated points:\n`);
        for (const u of affected) {
            console.log(`  - ${u.email}: ${Number(u.pho_points_balance).toLocaleString()} → ${POINTS.toLocaleString()}`);
        }

        // 2. Reset
        const { rowCount } = await pool.query(
            `UPDATE users SET pho_points_balance = $1 WHERE current_plan_id = 'medical_beta' AND pho_points_balance > $1`,
            [POINTS],
        );
        console.log(`\n✅ Reset ${rowCount} user(s) to ${POINTS.toLocaleString()} Phở Points.`);

        // 3. Verify
        const { rows: verify } = await pool.query(
            `SELECT email, pho_points_balance FROM users WHERE current_plan_id = 'medical_beta'`,
        );
        console.log('\n📊 All medical_beta users:');
        for (const u of verify) {
            const pts = Number(u.pho_points_balance);
            console.log(`  ${pts <= POINTS ? '✅' : '⚠️'} ${u.email}: ${pts.toLocaleString()} points`);
        }
    } finally {
        await pool.end();
    }
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
