import dotenv from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'node:path';

import fs from 'node:fs';

const envConfig = dotenv.parse(fs.readFileSync(resolve(process.cwd(), '.env.local')));
const DATABASE_URL = envConfig.DATABASE_URL;

async function main() {
    console.log('Connecting to database...');
    // pg driver automatically reads all PG* variables from process.env implicitly overriding the connection string
    delete process.env.PGPASSWORD;
    delete process.env.PGHOST;
    delete process.env.PGUSER;
    delete process.env.PGDATABASE;

    const pool = new Pool({ connectionString: DATABASE_URL, ssl: true });
    const targetUserId = 'user_39z7h2rxWTOFlxR63ziEZPyyREa';

    // Calculate end of month
    const now = new Date();
    const pointsResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const MEDICAL_BETA_MONTHLY_POINTS = 500_000;

    try {
        const res = await pool.query(`
            UPDATE "users" 
            SET 
                "current_plan_id" = 'medical_beta',
                "pho_points_balance" = $1,
                "points_reset_date" = $2,
                "subscription_status" = 'ACTIVE'
            WHERE "id" = $3
            RETURNING "id", "current_plan_id", "subscription_status";
        `, [MEDICAL_BETA_MONTHLY_POINTS, pointsResetDate, targetUserId]);

        if (res.rowCount > 0) {
            console.log('✅ Database updated successfully:', res.rows[0]);
        } else {
            console.warn('⚠️ User not found in database.');
        }
    } catch (e) {
        console.error('❌ Database update failed:', e);
    } finally {
        await pool.end();
    }
}

main().catch(console.error);
