/**
 * Polar.sh Webhook Handler
 *
 * POST /api/payment/polar/webhook
 *
 * Handles webhook events from Polar.sh for Global payments (USD):
 * - checkout.completed - Subscription created
 * - subscription.updated - Subscription status changed
 * - subscription.canceled - Subscription canceled
 * - payment.succeeded - Payment successful
 * - payment.failed - Payment failed
 *
 * Based on PRICING_MASTERPLAN.md.md - Phở Points System
 */
/* eslint-disable @typescript-eslint/no-use-before-define */
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { GLOBAL_PLANS } from '@/config/pricing';
import { subscriptions, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { verifyWebhookSignature } from '@/libs/polar';

// ============================================================================
// POLAR PRODUCT → INTERNAL PLAN MAPPING
// ============================================================================

/**
 * Map Polar product IDs to internal plan codes
 * Configure these in Polar dashboard and set env vars
 */
const POLAR_PRODUCT_TO_PLAN: Record<string, string> = {
  [process.env.POLAR_PRODUCT_STANDARD_ID || 'polar_standard']: 'gl_standard',
  [process.env.POLAR_PRODUCT_PREMIUM_ID || 'polar_premium']: 'gl_premium',
  [process.env.POLAR_PRODUCT_LIFETIME_ID || 'polar_lifetime']: 'gl_lifetime',
};

/**
 * Get internal plan code from Polar product ID
 */
function getPlanFromProductId(productId: string): string | null {
  return POLAR_PRODUCT_TO_PLAN[productId] || null;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Get webhook signature from headers
    const signature = req.headers.get('polar-signature');
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 2. Get raw body for signature verification
    const rawBody = await req.text();

    // 3. Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // 4. Parse webhook payload
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log('Polar webhook received:', type);

    // 5. Handle different event types
    switch (type) {
      case 'checkout.completed': {
        await handleCheckoutCompleted(data);
        break;
      }

      case 'subscription.created': {
        await handleSubscriptionCreated(data);
        break;
      }

      case 'subscription.updated': {
        await handleSubscriptionUpdated(data);
        break;
      }

      case 'subscription.canceled': {
        await handleSubscriptionCanceled(data);
        break;
      }

      case 'payment.succeeded': {
        await handlePaymentSucceeded(data);
        break;
      }

      case 'payment.failed': {
        await handlePaymentFailed(data);
        break;
      }

      default: {
        console.log('Unhandled webhook event type:', type);
      }
    }

    // 6. Return success response
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Polar webhook error:', error);

    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Handle checkout completed event
 * This is triggered when a customer completes a checkout session
 */
async function handleCheckoutCompleted(data: any) {
  const { id, customerId, productId, metadata } = data;
  const userId = metadata?.userId;

  if (!userId) {
    console.error('❌ No userId in checkout metadata');
    return;
  }

  console.log('✅ Checkout completed:', { checkoutId: id, customerId, productId, userId });

  // Get plan from product ID
  const planCode = getPlanFromProductId(productId);
  if (!planCode) {
    console.error('❌ Unknown Polar product ID:', productId);
    return;
  }

  const plan = GLOBAL_PLANS[planCode];
  if (!plan) {
    console.error('❌ Plan not found in config:', planCode);
    return;
  }

  console.log('🎯 Mapping to plan:', { planCode, points: plan.monthlyPoints });

  // Subscription will be created in subscription.created event
  // This is just for logging/tracking the checkout completion
}

/**
 * Handle subscription created event
 * Creates/updates subscription and sets phoPointsBalance
 */
async function handleSubscriptionCreated(data: any) {
  const {
    id: subscriptionId,
    productId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    metadata,
  } = data;

  const userId = metadata?.userId;

  if (!userId) {
    console.error('❌ Missing userId in subscription metadata');
    return;
  }

  // Get plan from product ID
  const planCode = getPlanFromProductId(productId) || metadata?.planId;
  if (!planCode) {
    console.error('❌ Cannot determine plan from product:', productId);
    return;
  }

  const plan = GLOBAL_PLANS[planCode];
  if (!plan) {
    console.error('❌ Plan not found:', planCode);
    return;
  }

  console.log('🎉 Creating subscription:', {
    planCode,
    points: plan.monthlyPoints,
    subscriptionId,
    userId,
  });

  try {
    const db = await getServerDB();

    // Calculate period dates
    const periodStart = currentPeriodStart ? new Date(currentPeriodStart) : new Date();
    const periodEnd = currentPeriodEnd
      ? new Date(currentPeriodEnd)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    // Check for existing subscription
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set({
          billingCycle: 'monthly', // Polar subscriptions default to monthly
          currentPeriodEnd: periodEnd,
          currentPeriodStart: periodStart,
          paymentProvider: 'polar',
          planId: planCode,
          status: mapPolarStatusToDbStatus(status),
        })
        .where(eq(subscriptions.userId, userId));
      console.log('✅ Updated existing subscription');
    } else {
      // Create new subscription
      await db.insert(subscriptions).values({
        billingCycle: 'monthly',
        currentPeriodEnd: periodEnd,
        currentPeriodStart: periodStart,
        paymentProvider: 'polar',
        planId: planCode,
        status: mapPolarStatusToDbStatus(status),
        userId,
      });
      console.log('✅ Created new subscription');
    }

    // Update user's phoPointsBalance and currentPlanId
    await db
      .update(users)
      .set({
        currentPlanId: planCode,
        phoPointsBalance: plan.monthlyPoints,
        pointsResetDate: periodEnd,
        subscriptionStatus: mapPolarStatusToDbStatus(status),
      })
      .where(eq(users.id, userId));

    console.log('✅ Updated user phoPointsBalance:', plan.monthlyPoints);
  } catch (error) {
    console.error('❌ Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription updated event
 * Updates subscription status and period dates
 */
async function handleSubscriptionUpdated(data: any) {
  const {
    id: subscriptionId,
    productId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    metadata,
  } = data;

  const userId = metadata?.userId;

  if (!userId) {
    console.warn('⚠️ No userId in subscription update, trying to find by provider data');
    // TODO: Lookup subscription by Polar subscription ID if needed
    return;
  }

  console.log('🔄 Updating subscription:', { status, subscriptionId, userId });

  try {
    const db = await getServerDB();

    // Get plan from product ID
    const planCode = getPlanFromProductId(productId) || metadata?.planId;

    const updateData: Record<string, any> = {
      cancelAtPeriodEnd: cancelAtPeriodEnd || false,
      status: mapPolarStatusToDbStatus(status),
    };

    if (currentPeriodStart) {
      updateData.currentPeriodStart = new Date(currentPeriodStart);
    }
    if (currentPeriodEnd) {
      updateData.currentPeriodEnd = new Date(currentPeriodEnd);
    }
    if (planCode) {
      updateData.planId = planCode;
    }

    await db.update(subscriptions).set(updateData).where(eq(subscriptions.userId, userId));

    // Also update user status
    await db
      .update(users)
      .set({
        currentPlanId: planCode || undefined,
        subscriptionStatus: mapPolarStatusToDbStatus(status),
      })
      .where(eq(users.id, userId));

    console.log('✅ Subscription updated successfully');
  } catch (error) {
    console.error('❌ Failed to update subscription:', error);
    throw error;
  }
}

/**
 * Handle subscription canceled event
 * Sets subscription to canceled and downgrades to free plan
 */
async function handleSubscriptionCanceled(data: any) {
  const { id: subscriptionId, metadata } = data;
  const userId = metadata?.userId;

  console.log('🚫 Canceling subscription:', { subscriptionId, userId });

  if (!userId) {
    console.warn('⚠️ No userId in subscription cancellation');
    return;
  }

  try {
    const db = await getServerDB();

    // Update subscription status
    await db
      .update(subscriptions)
      .set({
        cancelAtPeriodEnd: true,
        status: 'canceled',
      })
      .where(eq(subscriptions.userId, userId));

    // Downgrade user to free plan
    const freePlan = GLOBAL_PLANS['gl_starter'];
    await db
      .update(users)
      .set({
        currentPlanId: 'gl_starter',
        phoPointsBalance: freePlan?.monthlyPoints || 30_000,
        subscriptionStatus: 'canceled',
      })
      .where(eq(users.id, userId));

    console.log('✅ Subscription canceled, user downgraded to gl_starter');
  } catch (error) {
    console.error('❌ Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * Handle payment succeeded event
 * Logs payment success and could be used for renewal point reset
 */
async function handlePaymentSucceeded(data: any) {
  const { id: paymentId, subscriptionId, amount, currency, metadata } = data;

  const userId = metadata?.userId;

  console.log('💳 Payment succeeded:', {
    amount,
    currency,
    paymentId,
    subscriptionId,
    userId,
  });

  // For subscription renewals, reset phoPointsBalance
  if (userId && subscriptionId) {
    try {
      const db = await getServerDB();

      // Get user's current plan to reset points
      const userResult = await db
        .select({ currentPlanId: users.currentPlanId })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (userResult.length > 0 && userResult[0].currentPlanId) {
        const plan = GLOBAL_PLANS[userResult[0].currentPlanId];
        if (plan) {
          await db
            .update(users)
            .set({
              phoPointsBalance: plan.monthlyPoints,
              pointsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            })
            .where(eq(users.id, userId));

          console.log('✅ Points reset on renewal:', plan.monthlyPoints);
        }
      }
    } catch (error) {
      console.error('❌ Failed to reset points on payment:', error);
    }
  }

  console.log('✅ Payment recorded successfully');
}

/**
 * Handle payment failed event
 * Logs failure and could trigger notifications
 */
async function handlePaymentFailed(data: any) {
  const { id: paymentId, subscriptionId, amount, currency, failureReason, metadata } = data;

  const userId = metadata?.userId;

  console.error('❌ Payment failed:', {
    amount,
    currency,
    failureReason,
    paymentId,
    subscriptionId,
    userId,
  });

  // TODO: Send email notification to user about failed payment
  // TODO: Record failed payment in database for analytics

  console.log('⚠️ Payment failure logged');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map Polar subscription status to database status
 */
function mapPolarStatusToDbStatus(polarStatus: string): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    past_due: 'past_due',
    trialing: 'active',
    unpaid: 'past_due',
  };

  return statusMap[polarStatus] || 'inactive';
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};
