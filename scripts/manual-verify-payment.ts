/**
 * Manual Payment Verification Script
 * 
 * This script manually verifies a payment with Sepay API and activates the subscription
 * Use this when webhook fails to process automatically
 * 
 * Usage: bun run scripts/manual-verify-payment.ts <orderId>
 * Example: bun run scripts/manual-verify-payment.ts PHO_SUB_1762224720829_JKA788
 */

import { eq } from 'drizzle-orm';
import { getServerDB } from '../packages/database/src/core/db-adaptor';
import { sepayPayments, subscriptions } from '../packages/database/src/schemas';

// Sepay API configuration
const SEPAY_API_URL = process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1';
const SEPAY_SECRET_KEY = process.env.SEPAY_SECRET_KEY;

interface SepayPaymentResponse {
  orderId: string;
  transactionId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  paymentMethod: string;
  timestamp: string;
  maskedCardNumber?: string;
}

/**
 * Query Sepay API to get payment status
 */
async function querySepayPaymentStatus(orderId: string): Promise<SepayPaymentResponse | null> {
  if (!SEPAY_SECRET_KEY) {
    console.error('❌ SEPAY_SECRET_KEY is not configured');
    console.log('💡 Set SEPAY_SECRET_KEY in your environment variables');
    return null;
  }

  try {
    console.log(`🔍 Querying Sepay API for payment: ${orderId}`);

    const response = await fetch(`${SEPAY_API_URL}/payments/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SEPAY_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ Sepay API error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return null;
    }

    const data = await response.json();
    console.log('✅ Sepay API response:', JSON.stringify(data, null, 2));

    return data;
  } catch (error) {
    console.error('❌ Failed to query Sepay API:', error);
    return null;
  }
}

/**
 * Update payment record in database
 */
async function updatePaymentRecord(
  orderId: string,
  transactionId: string,
  status: 'success' | 'failed' | 'pending',
  rawWebhook: any
) {
  try {
    const db = await getServerDB();

    console.log(`📝 Updating payment record: ${orderId}`);

    const result = await db
      .update(sepayPayments)
      .set({
        status,
        transactionId,
        rawWebhook,
        updatedAt: new Date(),
      })
      .where(eq(sepayPayments.orderId, orderId))
      .returning();

    if (result.length === 0) {
      console.error('❌ Payment record not found in database');
      return false;
    }

    console.log('✅ Payment record updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to update payment record:', error);
    return false;
  }
}

/**
 * Activate user subscription
 */
async function activateSubscription(userId: string, planId: string, billingCycle: string) {
  try {
    const db = await getServerDB();

    console.log(`🎯 Activating subscription for user: ${userId}`);

    // Calculate subscription dates
    const now = new Date();
    const nextBillingDate = new Date(now);

    if (billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Check if subscription already exists
    const existingSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existingSubscriptions.length > 0) {
      // Update existing subscription
      console.log('📝 Updating existing subscription');

      await db
        .update(subscriptions)
        .set({
          planId,
          billingCycle,
          status: 'active',
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
          updatedAt: now,
        })
        .where(eq(subscriptions.userId, userId));
    } else {
      // Create new subscription
      console.log('📝 Creating new subscription');

      await db.insert(subscriptions).values({
        id: `sub_${Date.now()}`,
        userId,
        planId,
        billingCycle,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: nextBillingDate,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log('✅ Subscription activated successfully');
    console.log(`   Plan: ${planId}`);
    console.log(`   Billing Cycle: ${billingCycle}`);
    console.log(`   Next Billing Date: ${nextBillingDate.toISOString()}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to activate subscription:', error);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyAndActivatePayment(orderId: string) {
  console.log('🚀 Starting manual payment verification');
  console.log('━'.repeat(80));
  console.log(`OrderId: ${orderId}`);
  console.log('━'.repeat(80));

  try {
    const db = await getServerDB();

    // Step 1: Get payment record from database
    console.log('\n📊 Step 1: Fetching payment record from database...');
    const paymentRows = await db
      .select()
      .from(sepayPayments)
      .where(eq(sepayPayments.orderId, orderId))
      .limit(1);

    if (paymentRows.length === 0) {
      console.error('❌ Payment record not found in database');
      return;
    }

    const payment = paymentRows[0];
    console.log('✅ Payment record found:');
    console.log(`   User ID: ${payment.userId}`);
    console.log(`   Plan: ${payment.planId}`);
    console.log(`   Amount: ${payment.amountVnd} VND`);
    console.log(`   Current Status: ${payment.status}`);

    // Step 2: Query Sepay API for actual payment status
    console.log('\n🔍 Step 2: Querying Sepay API for payment status...');
    const sepayResponse = await querySepayPaymentStatus(orderId);

    if (!sepayResponse) {
      console.error('❌ Failed to get payment status from Sepay API');
      console.log('\n💡 Manual verification required:');
      console.log('   1. Log in to https://my.sepay.vn/');
      console.log('   2. Check payment status for OrderId:', orderId);
      console.log('   3. If payment is successful, run this script with --force flag');
      return;
    }

    // Step 3: Update payment record
    console.log('\n📝 Step 3: Updating payment record in database...');
    const updateSuccess = await updatePaymentRecord(
      orderId,
      sepayResponse.transactionId,
      sepayResponse.status,
      sepayResponse
    );

    if (!updateSuccess) {
      console.error('❌ Failed to update payment record');
      return;
    }

    // Step 4: Activate subscription if payment is successful
    if (sepayResponse.status === 'success') {
      console.log('\n🎯 Step 4: Activating subscription...');
      const activationSuccess = await activateSubscription(
        payment.userId,
        payment.planId,
        payment.billingCycle
      );

      if (!activationSuccess) {
        console.error('❌ Failed to activate subscription');
        return;
      }

      console.log('\n━'.repeat(80));
      console.log('🎉 SUCCESS! Payment verified and subscription activated');
      console.log('━'.repeat(80));
      console.log(`✅ Payment Status: ${sepayResponse.status}`);
      console.log(`✅ Transaction ID: ${sepayResponse.transactionId}`);
      console.log(`✅ Subscription: ACTIVE`);
      console.log(`✅ User ID: ${payment.userId}`);
      console.log('\n💡 Next Steps:');
      console.log('   1. Notify user that subscription is now active');
      console.log('   2. User can refresh the payment page to see success status');
      console.log('   3. Monitor logs to ensure no further issues');
    } else if (sepayResponse.status === 'failed') {
      console.log('\n━'.repeat(80));
      console.log('❌ Payment FAILED according to Sepay');
      console.log('━'.repeat(80));
      console.log('💡 Next Steps:');
      console.log('   1. Contact user to retry payment');
      console.log('   2. Investigate why payment failed');
      console.log('   3. Check Sepay dashboard for error details');
    } else {
      console.log('\n━'.repeat(80));
      console.log('⏳ Payment still PENDING according to Sepay');
      console.log('━'.repeat(80));
      console.log('💡 Next Steps:');
      console.log('   1. Wait for user to complete payment');
      console.log('   2. Check Sepay dashboard for payment status');
      console.log('   3. Run this script again later');
    }

  } catch (error) {
    console.error('❌ Error during verification:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

// Get orderId from command line arguments
const orderId = process.argv[2];

if (!orderId) {
  console.error('❌ Usage: bun run scripts/manual-verify-payment.ts <orderId>');
  console.error('Example: bun run scripts/manual-verify-payment.ts PHO_SUB_1762224720829_JKA788');
  throw new Error('Missing orderId argument');
}

await verifyAndActivatePayment(orderId);

