/**
 * Polar.sh Payment Gateway Integration
 * Merchant of Record for international payments
 * 
 * Features:
 * - Automatic tax handling (VAT, GST, etc.)
 * - Global payment methods (card, PayPal, etc.)
 * - Subscription management
 * - Customer portal
 * 
 * Docs: https://docs.polar.sh
 */

import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: process.env.POLAR_SERVER || 'production', // 'production' | 'sandbox'
});

export interface PolarCheckoutSession {
  id: string;
  url: string;
  customerId?: string;
  status: 'open' | 'complete' | 'expired';
}

export interface PolarSubscription {
  id: string;
  customerId: string;
  productId: string;
  priceId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface CreateCheckoutParams {
  productId: string;
  priceId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams
): Promise<PolarCheckoutSession> {
  try {
    const session = await polar.checkouts.create({
      productId: params.productId,
      priceId: params.priceId,
      customerEmail: params.customerEmail,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: params.metadata,
    });

    return {
      id: session.id,
      url: session.url,
      customerId: session.customerId,
      status: session.status as 'open' | 'complete' | 'expired',
    };
  } catch (error) {
    console.error('Polar checkout creation failed:', error);
    throw new Error('Failed to create Polar checkout session');
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<PolarSubscription | null> {
  try {
    const subscription = await polar.subscriptions.get(subscriptionId);

    if (!subscription) return null;

    return {
      id: subscription.id,
      customerId: subscription.customerId,
      productId: subscription.productId,
      priceId: subscription.priceId,
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
      currentPeriodStart: new Date(subscription.currentPeriodStart),
      currentPeriodEnd: new Date(subscription.currentPeriodEnd),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
    };
  } catch (error) {
    console.error('Failed to get Polar subscription:', error);
    return null;
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await polar.subscriptions.cancel(subscriptionId);
    return true;
  } catch (error) {
    console.error('Failed to cancel Polar subscription:', error);
    return false;
  }
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(subscriptionId: string): Promise<boolean> {
  try {
    await polar.subscriptions.update(subscriptionId, {
      cancelAtPeriodEnd: false,
    });
    return true;
  } catch (error) {
    console.error('Failed to reactivate Polar subscription:', error);
    return false;
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    return polar.webhooks.verify(payload, signature, secret);
  } catch (error) {
    console.error('Webhook verification failed:', error);
    return false;
  }
}

/**
 * Get customer portal URL
 */
export async function getCustomerPortalUrl(customerId: string): Promise<string | null> {
  try {
    const portal = await polar.customers.createPortalSession(customerId);
    return portal.url;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    return null;
  }
}

/**
 * Polar Product IDs (configure these in Polar dashboard)
 */
export const POLAR_PRODUCTS = {
  starter: {
    productId: process.env.POLAR_PRODUCT_STARTER_ID!,
    monthlyPriceId: process.env.POLAR_PRICE_STARTER_MONTHLY_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_STARTER_YEARLY_ID!,
  },
  premium: {
    productId: process.env.POLAR_PRODUCT_PREMIUM_ID!,
    monthlyPriceId: process.env.POLAR_PRICE_PREMIUM_MONTHLY_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_PREMIUM_YEARLY_ID!,
  },
  ultimate: {
    productId: process.env.POLAR_PRODUCT_ULTIMATE_ID!,
    monthlyPriceId: process.env.POLAR_PRICE_ULTIMATE_MONTHLY_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_ULTIMATE_YEARLY_ID!,
  },
} as const;

/**
 * Get product and price IDs for a plan
 */
export function getPolarProductIds(planId: 'starter' | 'premium' | 'ultimate', billingCycle: 'monthly' | 'yearly') {
  const product = POLAR_PRODUCTS[planId];
  const priceId = billingCycle === 'monthly' ? product.monthlyPriceId : product.yearlyPriceId;

  return {
    productId: product.productId,
    priceId,
  };
}

export { polar };

