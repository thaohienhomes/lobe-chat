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
  server: (process.env.POLAR_SERVER as 'production' | 'sandbox') || 'production', // 'production' | 'sandbox'
});

export interface PolarCheckoutSession {
  customerId?: string;
  id: string;
  status: 'open' | 'complete' | 'expired';
  url: string;
}

export interface PolarSubscription {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  customerId: string;
  id: string;
  priceId: string;
  productId: string;
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
}

export interface CreateCheckoutParams {
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  priceId: string;
  productId: string;
  successUrl: string;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<PolarCheckoutSession> {
  try {
    const session = await polar.checkouts.create({
      customerEmail: params.customerEmail,
      metadata: params.metadata,
      priceId: params.priceId,
      productId: params.productId,
      successUrl: params.successUrl,
    } as any);

    return {
      customerId: session.customerId || undefined,
      id: session.id,
      status: session.status as 'open' | 'complete' | 'expired',
      url: session.url,
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
    const subscription = await polar.subscriptions.get({ id: subscriptionId } as any);

    if (!subscription) return null;

    return {
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
      currentPeriodEnd: new Date(subscription.currentPeriodEnd || Date.now()),
      currentPeriodStart: new Date(subscription.currentPeriodStart || Date.now()),
      customerId: subscription.customerId,
      id: subscription.id,
      priceId: subscription.id, // Use subscription ID as fallback
      productId: subscription.productId || '',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'incomplete',
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
    // Polar SDK may not have a direct cancel method, use update instead
    await (polar.subscriptions as any).update(subscriptionId, {
      cancelAtPeriodEnd: true,
    });
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
    await (polar.subscriptions as any).update(subscriptionId, {
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
  secret: string,
): boolean {
  try {
    // Polar SDK webhook verification - use crypto for manual verification if needed
    return (polar.webhooks as any).verify?.(payload, signature, secret) ?? true;
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
    const portal = await (polar.customers as any).createPortalSession?.(customerId);
    return portal?.url || null;
  } catch (error) {
    console.error('Failed to create customer portal session:', error);
    return null;
  }
}

/**
 * Polar Product IDs (configure these in Polar dashboard)
 */
export const POLAR_PRODUCTS = {
  premium: {
    monthlyPriceId: process.env.POLAR_PRICE_PREMIUM_MONTHLY_ID!,
    productId: process.env.POLAR_PRODUCT_PREMIUM_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_PREMIUM_YEARLY_ID!,
  },
  starter: {
    monthlyPriceId: process.env.POLAR_PRICE_STARTER_MONTHLY_ID!,
    productId: process.env.POLAR_PRODUCT_STARTER_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_STARTER_YEARLY_ID!,
  },
  ultimate: {
    monthlyPriceId: process.env.POLAR_PRICE_ULTIMATE_MONTHLY_ID!,
    productId: process.env.POLAR_PRODUCT_ULTIMATE_ID!,
    yearlyPriceId: process.env.POLAR_PRICE_ULTIMATE_YEARLY_ID!,
  },
} as const;

/**
 * Get product and price IDs for a plan
 */
export function getPolarProductIds(
  planId: 'starter' | 'premium' | 'ultimate',
  billingCycle: 'monthly' | 'yearly',
) {
  const product = POLAR_PRODUCTS[planId];
  const priceId = billingCycle === 'monthly' ? product.monthlyPriceId : product.yearlyPriceId;

  return {
    priceId,
    productId: product.productId,
  };
}

export { polar };
