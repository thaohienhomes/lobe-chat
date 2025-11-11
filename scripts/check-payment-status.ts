/**
 * Script to check payment status in the database
 * Usage: bun run scripts/check-payment-status.ts <orderId>
 */

import { eq } from 'drizzle-orm';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { sepayPayments, subscriptions } from '../packages/database/src/schemas';

async function checkPaymentStatus(orderId: string) {
  console.log('🔍 Checking payment status for OrderId:', orderId);
  console.log('━'.repeat(80));

  try {
    const db = await getServerDB();

    // Query payment record
    console.log('\n📊 Querying sepay_payments table...');
    const paymentRows = await db
      .select()
      .from(sepayPayments)
      .where(eq(sepayPayments.orderId, orderId))
      .limit(1);

    if (paymentRows.length === 0) {
      console.log('❌ Payment record NOT FOUND in database');
      console.log('\n💡 Possible reasons:');
      console.log('   1. Payment was never created (frontend error)');
      console.log('   2. OrderId is incorrect');
      console.log('   3. Database connection issue');
      return;
    }

    const payment = paymentRows[0];
    console.log('✅ Payment record FOUND:');
    console.log(JSON.stringify(payment, null, 2));

    // Query related subscription
    console.log('\n📊 Querying subscriptions table...');
    const subscriptionRows = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, payment.userId))
      .limit(5);

    if (subscriptionRows.length === 0) {
      console.log('⚠️ No subscription found for user:', payment.userId);
    } else {
      console.log(`✅ Found ${subscriptionRows.length} subscription(s) for user:`, payment.userId);
      subscriptionRows.forEach((sub, index) => {
        console.log(`\nSubscription ${index + 1}:`);
        console.log(JSON.stringify(sub, null, 2));
      });
    }

    // Analysis
    console.log('\n━'.repeat(80));
    console.log('📋 ANALYSIS:');
    console.log('━'.repeat(80));
    console.log(`Payment Status: ${payment.status}`);
    console.log(`Transaction ID: ${payment.transactionId || 'N/A'}`);
    console.log(`Amount: ${payment.amountVnd} VND`);
    console.log(`Plan: ${payment.planId}`);
    console.log(`Billing Cycle: ${payment.billingCycle}`);
    console.log(`Created At: ${payment.createdAt}`);
    console.log(`Updated At: ${payment.updatedAt}`);

    if (payment.status === 'pending') {
      console.log('\n⚠️ ISSUE IDENTIFIED:');
      console.log('   Payment is still in PENDING status');
      console.log('   This means the webhook was NOT processed successfully');
      console.log('\n💡 Next Steps:');
      console.log('   1. Check Sepay dashboard for webhook delivery logs');
      console.log('   2. Check Vercel logs for webhook POST requests');
      console.log('   3. Manually verify payment if needed');
    } else if (payment.status === 'success') {
      console.log('\n✅ Payment is SUCCESSFUL');
      console.log('   Webhook was processed correctly');

      // Check if subscription was activated
      const activeSubscription = subscriptionRows.find(
        sub => sub.status === 'active' && sub.planId === payment.planId
      );

      if (activeSubscription) {
        console.log('   ✅ Subscription is ACTIVE');
      } else {
        console.log('   ⚠️ Subscription is NOT active (possible issue)');
      }
    } else if (payment.status === 'failed') {
      console.log('\n❌ Payment FAILED');
      console.log('   Check raw_webhook for error details');
    }

    if (payment.rawWebhook) {
      console.log('\n📦 Raw Webhook Data:');
      console.log(JSON.stringify(payment.rawWebhook, null, 2));
    }

  } catch (error) {
    console.error('❌ Error checking payment status:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Get orderId from command line arguments
const orderId = process.argv[2];

if (!orderId) {
  console.error('❌ Usage: bun run scripts/check-payment-status.ts <orderId>');
  console.error('Example: bun run scripts/check-payment-status.ts PHO_SUB_1762224720829_JKA788');
  throw new Error('Missing orderId argument');
}

await checkPaymentStatus(orderId);

