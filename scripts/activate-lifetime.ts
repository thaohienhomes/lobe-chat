/* eslint-disable unicorn/no-process-exit, unicorn/prefer-top-level-await */
/**
 * Script: Activate any Lifetime Deal plan for a specific user
 * Usage: npx tsx scripts/activate-lifetime.ts <USER_ID> <PLAN_ID> [EMAIL]
 *
 * Supported plans: lifetime_standard, lifetime_early_bird, lifetime_last_call
 *
 * This script:
 * 1. Sets Clerk publicMetadata (planId, lifetimeDeal flag)
 * 2. Syncs Neon DB (currentPlanId, phoPointsBalance, pointsResetDate, subscriptionStatus)
 * 3. Sends a welcome email via Resend
 */
import dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { resolve } from 'node:path';
import { Pool } from 'pg';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

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

// Supported lifetime plans and their points allocation
const LIFETIME_PLANS: Record<string, number> = {
  lifetime_early_bird: 2_000_000,
  lifetime_last_call: 2_000_000,
  lifetime_standard: 2_000_000,
};

function getEndOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
}

async function main() {
  const targetUserId = process.argv[2];
  const planId = process.argv[3] || 'lifetime_standard';
  const targetEmail = process.argv[4]; // Optional override email

  if (!targetUserId) {
    console.log('⚠️  Usage: npx tsx scripts/activate-lifetime.ts <USER_ID> <PLAN_ID> [EMAIL]');
    console.log('   Plans: lifetime_standard, lifetime_early_bird, lifetime_last_call');
    process.exit(0);
  }

  if (!LIFETIME_PLANS[planId]) {
    console.error(`❌ Unknown plan: ${planId}`);
    console.error('   Supported plans:', Object.keys(LIFETIME_PLANS).join(', '));
    process.exit(1);
  }

  const monthlyPoints = LIFETIME_PLANS[planId];

  console.log(`\n🎫 Activating ${planId} for user: ${targetUserId}...`);

  // Step 1: Update Clerk metadata
  console.log('\n📋 Step 1: Updating Clerk publicMetadata...');
  const updateRes = await fetch(`https://api.clerk.com/v1/users/${targetUserId}/metadata`, {
    body: JSON.stringify({
      public_metadata: {
        lifetimeDeal: true,
        planId,
        promoActivatedAt: new Date().toISOString(),
        promoCode: 'MANUAL-ACTIVATION',
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

  const userName = [result.first_name, result.last_name].filter(Boolean).join(' ') || 'Member';
  const userEmail = targetEmail || result.email_addresses?.[0]?.email_address;

  console.log('✅ Clerk metadata updated!');
  console.log(`   User: ${userName}`);
  console.log(`   Email: ${userEmail}`);
  console.log(`   Plan: ${result.public_metadata?.planId}`);

  // Step 2: Sync Neon database
  console.log('\n💾 Step 2: Syncing Neon database...');
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const db = drizzle(pool);
    const { users: usersTable } = await import('../packages/database/src/schemas/user');

    const pointsResetDate = getEndOfMonth();

    const dbResult = await db
      .update(usersTable)
      .set({
        currentPlanId: planId,
        phoPointsBalance: monthlyPoints,
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
      console.log('✅ Neon DB synced!');
      console.log(`   currentPlanId: ${updated.currentPlanId}`);
      console.log(`   phoPointsBalance: ${updated.phoPointsBalance?.toLocaleString()}`);
      console.log(`   pointsResetDate: ${updated.pointsResetDate?.toISOString()}`);
    } else {
      console.warn('⚠️ User not found in database — they may not have logged in yet.');
      console.warn(
        '   The Clerk metadata is set, so when they log in the system will create their record.',
      );
    }
  } catch (dbErr) {
    console.error('⚠️ Database sync failed:', dbErr);
    console.error('   Clerk metadata was updated successfully. DB can be synced manually later.');
  } finally {
    await pool.end();
  }

  // Step 3: Send Welcome Email
  if (userEmail) {
    console.log(`\n📧 Step 3: Sending welcome email to: ${userEmail}...`);
    try {
      const { sendWelcomeEmail } = await import('../src/libs/email/index');

      const emailRes = await sendWelcomeEmail({
        email: userEmail,
        name: userName,
        planId,
      });

      if (emailRes.success) {
        console.log(`✅ Welcome email sent successfully! (ID: ${emailRes.emailId})`);
      } else {
        console.error('⚠️ Failed to send email:', emailRes.error);
      }
    } catch (emailErr) {
      console.error('⚠️ Error initializing email service:', emailErr);
    }
  } else {
    console.warn('⚠️ No email address found. Skipping welcome email.');
  }

  // Summary
  console.log('\n============================================================');
  console.log(`${planId.toUpperCase()} ACTIVATION SUMMARY`);
  console.log('============================================================');
  console.log(`User ID:    ${targetUserId}`);
  console.log(`User Name:  ${userName}`);
  console.log(`Email:      ${userEmail || 'N/A'}`);
  console.log(`Plan:       ${planId}`);
  console.log(`Points:     ${monthlyPoints.toLocaleString()}/month`);
  console.log(`Status:     ACTIVE`);
  console.log('============================================================');
  console.log('\n🔄 User should refresh pho.chat (Ctrl+Shift+R) to see changes!');
}

main().catch(console.error);
