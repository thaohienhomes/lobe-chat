/**
 * Polar.sh Webhook Handler
 * 
 * POST /api/payment/polar/webhook
 * 
 * Handles webhook events from Polar.sh:
 * - checkout.completed - Subscription created
 * - subscription.updated - Subscription status changed
 * - subscription.canceled - Subscription canceled
 * - payment.succeeded - Payment successful
 * - payment.failed - Payment failed
 */

import { NextRequest, NextResponse } from 'next/server';

import { serverDB } from '@/database/server';
import { verifyWebhookSignature } from '@/libs/polar';

export async function POST(req: NextRequest) {
  try {
    // 1. Get webhook signature from headers
    const signature = req.headers.get('polar-signature');
    const webhookSecret = process.env.POLAR_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      console.error('Missing webhook signature or secret');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // 2. Get raw body for signature verification
    const rawBody = await req.text();

    // 3. Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // 4. Parse webhook payload
    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log('Polar webhook received:', type);

    // 5. Handle different event types
    switch (type) {
      case 'checkout.completed':
        await handleCheckoutCompleted(data);
        break;

      case 'subscription.created':
        await handleSubscriptionCreated(data);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(data);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(data);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(data);
        break;

      case 'payment.failed':
        await handlePaymentFailed(data);
        break;

      default:
        console.log('Unhandled webhook event type:', type);
    }

    // 6. Return success response
    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Polar webhook error:', error);

    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Handle checkout completed event
 */
async function handleCheckoutCompleted(data: any) {
  const { id, customerId, metadata } = data;
  const userId = metadata?.userId;

  if (!userId) {
    console.error('No userId in checkout metadata');
    return;
  }

  console.log('Checkout completed:', { checkoutId: id, userId, customerId });

  // Subscription will be created in subscription.created event
  // This is just for logging/tracking
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(data: any) {
  const {
    id: subscriptionId,
    customerId,
    productId,
    priceId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    metadata,
  } = data;

  const userId = metadata?.userId;
  const planId = metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing userId or planId in subscription metadata');
    return;
  }

  console.log('Creating subscription:', { subscriptionId, userId, planId });

  // Create subscription in database
  await serverDB.insert('subscriptions', {
    userId,
    planId,
    status: 'active',
    provider: 'polar',
    providerSubscriptionId: subscriptionId,
    providerCustomerId: customerId,
    currentPeriodStart: new Date(currentPeriodStart),
    currentPeriodEnd: new Date(currentPeriodEnd),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('Subscription created successfully');
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(data: any) {
  const {
    id: subscriptionId,
    status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd,
  } = data;

  console.log('Updating subscription:', { subscriptionId, status });

  // Update subscription in database
  await serverDB.update('subscriptions', {
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: mapPolarStatusToDbStatus(status),
      currentPeriodStart: new Date(currentPeriodStart),
      currentPeriodEnd: new Date(currentPeriodEnd),
      cancelAtPeriodEnd: cancelAtPeriodEnd || false,
      updatedAt: new Date(),
    },
  });

  console.log('Subscription updated successfully');
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(data: any) {
  const { id: subscriptionId } = data;

  console.log('Canceling subscription:', { subscriptionId });

  // Update subscription status to canceled
  await serverDB.update('subscriptions', {
    where: { providerSubscriptionId: subscriptionId },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('Subscription canceled successfully');
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(data: any) {
  const {
    id: paymentId,
    subscriptionId,
    amount,
    currency,
    status,
  } = data;

  console.log('Payment succeeded:', { paymentId, subscriptionId, amount, currency });

  // Record payment in database
  await serverDB.insert('payments', {
    subscriptionId,
    provider: 'polar',
    providerPaymentId: paymentId,
    amount,
    currency,
    status: 'succeeded',
    paidAt: new Date(),
    createdAt: new Date(),
  });

  console.log('Payment recorded successfully');
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(data: any) {
  const {
    id: paymentId,
    subscriptionId,
    amount,
    currency,
    failureReason,
  } = data;

  console.error('Payment failed:', { paymentId, subscriptionId, failureReason });

  // Record failed payment
  await serverDB.insert('payments', {
    subscriptionId,
    provider: 'polar',
    providerPaymentId: paymentId,
    amount,
    currency,
    status: 'failed',
    failureReason,
    createdAt: new Date(),
  });

  // TODO: Send email notification to user about failed payment
}

/**
 * Map Polar subscription status to database status
 */
function mapPolarStatusToDbStatus(polarStatus: string): string {
  const statusMap: Record<string, string> = {
    'active': 'active',
    'canceled': 'canceled',
    'past_due': 'past_due',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
    'trialing': 'active',
    'unpaid': 'past_due',
  };

  return statusMap[polarStatus] || 'inactive';
}

// Disable body parsing for webhook signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

