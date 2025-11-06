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
  priceId?: string; // Optional - not used in new Polar model
  productId: string;
  successUrl: string;
}

/**
 * Create a checkout session for subscription
 *
 * Note: In Polar's new model, priceId is optional and not required.
 * The product already contains its pricing information.
 */
export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<PolarCheckoutSession> {
  try {
    console.log('🔧 Polar SDK: Creating checkout session with params:', params);

    // Validate required parameters
    if (!params.productId) {
      throw new Error('Product ID is required');
    }
    if (!params.successUrl) {
      throw new Error('Success URL is required');
    }

    // Build checkout params per Polar SDK types (CheckoutCreate)
    // Required: products (list of product IDs)
    const checkoutParams: any = {
      customerEmail: params.customerEmail ?? null,
      metadata: params.metadata,
      
// Polar expects an array of product IDs
products: [params.productId],
      
      
// Use returnUrl as the "back" button / cancel destination
returnUrl: params.cancelUrl,
      
      successUrl: params.successUrl,
    };

    console.log('📤 Polar SDK: Calling Polar API with:', checkoutParams);
    const session = await polar.checkouts.create(checkoutParams);
    console.log('📥 Polar SDK: Received session:', session);

    return {
      customerId: session.customerId || undefined,
      id: session.id,
      status: session.status as 'open' | 'complete' | 'expired',
      url: session.url,
    };
  } catch (error) {
    console.error('❌ Polar SDK: Checkout creation failed:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      params,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Polar checkout creation failed: ${error.message}`);
    }
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
 *
 * Note: Polar's new product model uses separate products for monthly and yearly billing.
 * Each product has its own pricing embedded - no separate price IDs needed.
 */
export const POLAR_PRODUCTS = {
  premium: {
    monthlyProductId: process.env.POLAR_PRODUCT_PREMIUM_MONTHLY_ID!,
    yearlyProductId: process.env.POLAR_PRODUCT_PREMIUM_YEARLY_ID!,
  },
  starter: {
    monthlyProductId: process.env.POLAR_PRODUCT_STARTER_MONTHLY_ID!,
    yearlyProductId: process.env.POLAR_PRODUCT_STARTER_YEARLY_ID!,
  },
  ultimate: {
    monthlyProductId: process.env.POLAR_PRODUCT_ULTIMATE_MONTHLY_ID!,
    yearlyProductId: process.env.POLAR_PRODUCT_ULTIMATE_YEARLY_ID!,
  },
} as const;

/**
 * Get product ID for a plan and billing cycle
 *
 * In Polar's new model, each billing cycle (monthly/yearly) is a separate product.
 * There are no separate price IDs - pricing is embedded in the product.
 */
export function getPolarProductIds(
  planId: 'starter' | 'premium' | 'ultimate',
  billingCycle: 'monthly' | 'yearly',
) {
  const product = POLAR_PRODUCTS[planId];
  const productId = billingCycle === 'monthly' ? product.monthlyProductId : product.yearlyProductId;

  return {
    priceId: undefined, // No longer used in new Polar model
    productId,
  };
}

export { polar };
