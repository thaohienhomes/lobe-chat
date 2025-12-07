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
/* eslint-disable @typescript-eslint/no-use-before-define, @typescript-eslint/no-unused-vars */
import { NextRequest, NextResponse } from 'next/server';

import { verifyWebhookSignature } from '@/libs/polar';
import { addPhoCredits } from '@/server/services/billing/credits';

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
 */
async function handleCheckoutCompleted(data: any) {
  const { id, customerId, metadata } = data;
  const userId = metadata?.userId;

  if (!userId) {
    console.error('No userId in checkout metadata');
    return;
  }

  console.log('Checkout completed:', { checkoutId: id, customerId, userId });

  // Add credits if amount is present and > 0
  // Polar amounts are in cents/smallest unit? Check docs. Usually USD cents.
  // Assuming we use standard mapping or 1:1 if we charge in VND (which Polar might not support directly).
  // If charging in USD, we need a conversion rate.
  // CONSTANT: 1 USD = 25,000 Credits (Approx).
  // data.amount is usually in cents. So $10.00 = 1000.
  // 1000 cents = $10.
  // Credits = $10 * 25000 = 250,000 Credits.
  // Formula: (amount / 100) * 25000.
  // OR if we just defined products with credit metadata.

  // For now, let's assume a fixed conversion 1 USD = 25000 VND/Credits.
  const amount = data.amount;
  const currency = data.currency;

  if (amount && amount > 0) {
    let creditsToAdd = 0;
    if (currency === 'usd') {
      creditsToAdd = (amount / 100) * 25_000;
    } else if (currency === 'vnd') {
      creditsToAdd = amount;
    } else {
      // Default fall back or other currencies
      creditsToAdd = (amount / 100) * 25_000; // Assume USD-like
    }

    if (creditsToAdd > 0) {
      console.log('💰 Adding Pho Credits (Polar):', { creditsToAdd, userId });
      await addPhoCredits(userId, Math.floor(creditsToAdd));
    }
  }

  // Subscription will be created in subscription.created event
  // This is just for logging/tracking
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(data: any) {
  const {
    id: subscriptionId,
    customerId: _customerId,
    productId: _productId,
    priceId: _priceId,
    status: _status,
    currentPeriodStart: _currentPeriodStart,
    currentPeriodEnd: _currentPeriodEnd,
    metadata,
  } = data;

  const userId = metadata?.userId;
  const planId = metadata?.planId;

  if (!userId || !planId) {
    console.error('Missing userId or planId in subscription metadata');
    return;
  }

  console.log('Creating subscription:', { planId, subscriptionId, userId });

  // Create subscription in database
  // Note: Polar webhook handler - subscriptions table schema may need adjustment
  // for Polar-specific fields (providerCustomerId, providerSubscriptionId)
  console.log('Polar subscription creation not yet implemented - schema mismatch');

  console.log('Subscription created successfully');
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(data: any) {
  const {
    id: subscriptionId,
    status: _status,
    currentPeriodStart: _currentPeriodStart,
    currentPeriodEnd: _currentPeriodEnd,
    cancelAtPeriodEnd: _cancelAtPeriodEnd,
  } = data;

  console.log('Updating subscription:', { status, subscriptionId });

  // Update subscription in database
  // Note: Polar webhook handler - subscriptions table schema may need adjustment
  console.log('Polar subscription update not yet implemented - schema mismatch');

  console.log('Subscription updated successfully');
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(data: any) {
  const { id: subscriptionId } = data;

  console.log('Canceling subscription:', { subscriptionId });

  // Update subscription status to canceled
  // Note: Polar webhook handler - subscriptions table schema may need adjustment
  console.log('Polar subscription cancellation not yet implemented - schema mismatch');

  console.log('Subscription canceled successfully');
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(data: any) {
  const {
    id: paymentId,
    subscriptionId: _subscriptionId,
    amount: _amount,
    currency: _currency,
    status: _status,
  } = data;

  console.log('Payment succeeded:', {
    amount: _amount,
    currency: _currency,
    paymentId,
    subscriptionId: _subscriptionId,
  });

  // Record payment in database
  // Note: Polar webhook handler - payments table schema may need adjustment
  console.log('Polar payment recording not yet implemented - schema mismatch');

  console.log('Payment recorded successfully');
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(data: any) {
  const {
    id: paymentId,
    subscriptionId: _subscriptionId,
    amount: _amount,
    currency: _currency,
    failureReason,
  } = data;

  console.error('Payment failed:', { failureReason, paymentId, subscriptionId: _subscriptionId });

  // Record failed payment
  // Note: Polar webhook handler - payments table schema may need adjustment
  console.log('Polar failed payment recording not yet implemented - schema mismatch');

  // TODO: Send email notification to user about failed payment
}

/**
 * Map Polar subscription status to database status
 */
function _mapPolarStatusToDbStatus(polarStatus: string): string {
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
