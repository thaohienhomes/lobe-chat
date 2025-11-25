/**
 * Script to add free subscriptions to existing users who don't have one
 * This is a one-time migration script to fix the subscription issue
 *
 * Run with: tsx scripts/add-free-subscriptions.ts
 */
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

// Use dynamic import to avoid module resolution issues
async function main() {
  const { serverDB } = await import('../packages/database/src/server');
  const { subscriptions, users } = await import('../packages/database/src/schemas');

  console.log('🚀 Starting free subscription migration...');
  console.log('📊 Database driver:', process.env.DATABASE_DRIVER || 'neon');

  try {
    // Get all users
    const allUsers = await serverDB.select({ id: users.id }).from(users);
    console.log(`📊 Found ${allUsers.length} total users`);

    // Get all users who already have subscriptions
    const usersWithSubscriptions = await serverDB
      .select({ userId: subscriptions.userId })
      .from(subscriptions);

    const userIdsWithSubscriptions = usersWithSubscriptions.map((s) => s.userId);
    console.log(`✅ ${userIdsWithSubscriptions.length} users already have subscriptions`);

    // Find users without subscriptions
    const usersWithoutSubscriptions = allUsers.filter(
      (user) => !userIdsWithSubscriptions.includes(user.id),
    );

    console.log(`❌ ${usersWithoutSubscriptions.length} users need free subscriptions`);

    if (usersWithoutSubscriptions.length === 0) {
      console.log('✨ All users already have subscriptions. Nothing to do!');
      return;
    }

    // Create free subscriptions for users without one
    const start = new Date();
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 100); // 100 years = effectively no expiration

    let successCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutSubscriptions) {
      try {
        await serverDB.insert(subscriptions).values({
          billingCycle: 'monthly',
          cancelAtPeriodEnd: false,
          currentPeriodEnd: end,
          currentPeriodStart: start,
          paymentProvider: 'free',
          planId: 'free',
          status: 'active',
          userId: user.id,
        });

        successCount++;
        console.log(`✅ Created free subscription for user: ${user.id}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to create subscription for user ${user.id}:`, error);
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   Total users: ${allUsers.length}`);
    console.log(`   Already had subscriptions: ${userIdsWithSubscriptions.length}`);
    console.log(`   Free subscriptions created: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log('\n✨ Migration complete!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration using top-level await
await main();
console.log('✅ Script completed successfully');
