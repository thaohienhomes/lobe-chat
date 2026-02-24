/**
 * Quick script to activate medical_beta plan for testing
 * Run: npx tsx scripts/activate-medical-beta.ts
 *
 * This script:
 * 1. Sets Clerk publicMetadata (planId, medical_beta flag)
 * 2. Syncs the database (currentPlanId, phoPointsBalance, pointsResetDate)
 * 3. Sends a welcome email
 */

import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { resolve } from 'node:path';
import { Pool } from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env.vercel.production') });

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CLERK_SECRET_KEY) {
    console.error('❌ CLERK_SECRET_KEY not found in .env.local');
    process.exit(1);
}

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
}

// Medical Beta plan constants
const MEDICAL_BETA_MONTHLY_POINTS = 500_000;

/**
 * Calculate end of current month for points reset date
 */
function getEndOfMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

async function main() {
    // Step 1: List recent users to find yours
    console.log('🔍 Fetching recent users...\n');

    const res = await fetch('https://api.clerk.com/v1/users?limit=10&order_by=-created_at', {
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
        },
    });

    const users = await res.json();

    if (!Array.isArray(users)) {
        console.error('❌ Failed to fetch users:', users);
        process.exit(1);
    }

    console.log('📋 Recent users:');
    users.forEach((u: any, i: number) => {
        const email = u.email_addresses?.[0]?.email_address || 'N/A';
        const name = [u.first_name, u.last_name].filter(Boolean).join(' ') || 'N/A';
        const currentPlan = u.public_metadata?.planId || 'free';
        console.log(`  ${i + 1}. ${name} (${email}) — plan: ${currentPlan} — id: ${u.id}`);
    });

    // Step 2: Get user ID from command line arg or prompt
    const targetUserId = process.argv[2];

    if (!targetUserId) {
        console.log('\n⚠️  Usage: npx tsx scripts/activate-medical-beta.ts <USER_ID>');
        console.log('   Copy the user ID from the list above and re-run');
        process.exit(0);
    }

    // Step 3: Activate medical_beta in Clerk
    console.log(`\n🏥 Activating medical_beta for user: ${targetUserId}...`);

    const updateRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}/metadata`, {
        body: JSON.stringify({
            public_metadata: {
                medical_beta: true,
                planId: 'medical_beta',
                promoActivatedAt: new Date().toISOString(),
                promoCode: 'BYPASS-TEST',
            },
        }),
        headers: {
            'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
        },
        method: 'PATCH',
    });

    const result = await updateRes.json();

    if (!updateRes.ok) {
        console.error('❌ Failed to update Clerk metadata:', result);
        process.exit(1);
    }

    console.log('✅ Clerk metadata updated!');
    console.log(`   User: ${result.first_name} ${result.last_name}`);
    console.log(`   Email: ${result.email_addresses?.[0]?.email_address}`);
    console.log(`   Plan: ${result.public_metadata?.planId}`);

    // Step 4: Sync database — set currentPlanId, phoPointsBalance, pointsResetDate
    console.log('\n💾 Syncing database...');
    const pool = new Pool({ connectionString: DATABASE_URL });
    try {
        const db = drizzle(pool);
        // Import the users schema dynamically
        const { users: usersTable } = await import('../packages/database/src/schemas/user');

        const pointsResetDate = getEndOfMonth();

        const dbResult = await db
            .update(usersTable)
            .set({
                currentPlanId: 'medical_beta',
                phoPointsBalance: MEDICAL_BETA_MONTHLY_POINTS,
                pointsResetDate,
                subscriptionStatus: 'ACTIVE',
            })
            .where(eq(usersTable.id, targetUserId))
            .returning({
                currentPlanId: usersTable.currentPlanId,
                phoPointsBalance: usersTable.phoPointsBalance,
                pointsResetDate: usersTable.pointsResetDate,
            });

        if (dbResult.length > 0) {
            const updated = dbResult[0];
            console.log('✅ Database synced!');
            console.log(`   currentPlanId: ${updated.currentPlanId}`);
            console.log(`   phoPointsBalance: ${updated.phoPointsBalance?.toLocaleString()}`);
            console.log(`   pointsResetDate: ${updated.pointsResetDate?.toISOString()}`);
        } else {
            console.warn('⚠️ User not found in database — they may not have logged in yet.');
            console.warn('   The Clerk metadata is set, so when they log in the system will create their record.');
        }
    } catch (dbErr) {
        console.error('⚠️ Database sync failed:', dbErr);
        console.error('   Clerk metadata was updated successfully. DB can be synced manually later.');
    } finally {
        await pool.end();
    }

    // Step 5: Send Welcome Email
    const userEmail = result.email_addresses?.[0]?.email_address;
    if (userEmail) {
        console.log(`\n📧 Sending welcome email to: ${userEmail}...`);
        try {
            const { EmailService } = await import('../src/libs/email/index');
            const { generateMedicalBetaEmail } = await import('../src/libs/email/templates/medical-beta');

            const emailRes = await EmailService.send({
                html: generateMedicalBetaEmail(result.first_name || 'Member'),
                subject: '🏥 Welcome to Phở Medical Beta!',
                text: 'Welcome to Phở Medical Beta! Your account has been upgraded.',
                to: userEmail,
            });

            if (emailRes.success) {
                console.log('✅ Welcome email sent successfully!');
            } else {
                console.error('⚠️ Failed to send email:', emailRes.error);
            }
        } catch (emailErr) {
            console.error('⚠️ Error initializing email service:', emailErr);
        }
    }

    console.log('\n🔄 Refresh pho.chat (Ctrl+Shift+R) to see changes!');
}

main().catch(console.error);
