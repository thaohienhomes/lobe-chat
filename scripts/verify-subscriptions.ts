/**
 * Script to verify subscriptions were created correctly
 */
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ override: true });

async function main() {
  const { serverDB } = await import('../packages/database/src/server');
  const { subscriptions, users } = await import('../packages/database/src/schemas');

  console.log('🔍 Verifying subscriptions...\n');

  try {
    // Get all users
    const allUsers = await serverDB.select({ id: users.id }).from(users);
    console.log(`📊 Total users: ${allUsers.length}`);

    // Get all subscriptions
    const allSubscriptions = await serverDB.select().from(subscriptions);
    console.log(`📊 Total subscriptions: ${allSubscriptions.length}\n`);

    // Group subscriptions by plan
    const subscriptionsByPlan = allSubscriptions.reduce(
      (acc, sub) => {
        acc[sub.planId] = (acc[sub.planId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('📊 Subscriptions by plan:');
    Object.entries(subscriptionsByPlan).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count}`);
    });

    // Check for users without subscriptions
    const usersWithSubscriptions = await serverDB
      .select({ userId: subscriptions.userId })
      .from(subscriptions);

    const userIdsWithSubscriptions = usersWithSubscriptions.map((s) => s.userId);
    const usersWithoutSubscriptions = allUsers.filter(
      (user) => !userIdsWithSubscriptions.includes(user.id),
    );

    console.log(`\n✅ Users with subscriptions: ${userIdsWithSubscriptions.length}`);
    console.log(`❌ Users without subscriptions: ${usersWithoutSubscriptions.length}`);

    if (usersWithoutSubscriptions.length > 0) {
      console.log('\n⚠️  Users without subscriptions:');
      usersWithoutSubscriptions.forEach((user) => {
        console.log(`   - ${user.id}`);
      });
    } else {
      console.log('\n✨ All users have subscriptions!');
    }

    // Show sample free subscription
    const freeSub = allSubscriptions.find((s) => s.planId === 'free');
    if (freeSub) {
      console.log('\n📋 Sample free subscription:');
      console.log(`   User ID: ${freeSub.userId}`);
      console.log(`   Plan: ${freeSub.planId}`);
      console.log(`   Status: ${freeSub.status}`);
      console.log(`   Billing Cycle: ${freeSub.billingCycle}`);
      console.log(`   Payment Provider: ${freeSub.paymentProvider}`);
      console.log(`   Period End: ${freeSub.currentPeriodEnd}`);
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run verification using top-level await
await main();
console.log('\n✅ Verification complete');
