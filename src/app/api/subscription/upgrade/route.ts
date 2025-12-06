/**
 * Subscription Upgrade/Downgrade Endpoint
 * Handles plan changes with prorated charges
 *
 * POST /api/subscription/upgrade - Upgrade or downgrade subscription
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { subscriptions } from '@/database/schemas/billing';
import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';
import { PLAN_TIERS, calculateProratedAmount } from '@/server/services/billing/proration';

interface UpgradeRequest {
  billingCycle: 'monthly' | 'yearly';
  /**
   * If true, skip payment requirement and just update subscription
   * Used for downgrades or when payment is confirmed via webhook
   */
  bypassPayment?: boolean;
  newPlanId: 'starter' | 'premium' | 'ultimate';
  /** Order ID from completed Sepay payment (for upgrade with payment) */
  paymentOrderId?: string;
}

interface UpgradeResponse {
  message: string;
  newSubscription?: {
    billingCycle: string;
    currentPeriodEnd: string;
    id: string;
    planId: string;
  };
  /** If payment is required, contains payment URL to redirect user */
  paymentRequired?: boolean;
  paymentUrl?: string;
  proratedAmount?: number;
  success: boolean;
}

/**
 * POST /api/subscription/upgrade
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: UpgradeRequest = await request.json();
    const { newPlanId, billingCycle } = body;

    if (!newPlanId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields: newPlanId, billingCycle' },
        { status: 400 },
      );
    }

    // Validate plan ID
    if (!['starter', 'premium', 'ultimate'].includes(newPlanId)) {
      return NextResponse.json({ error: 'Invalid plan ID' }, { status: 400 });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // Get database instance
    const db = await getServerDB();

    // Get current subscription
    const currentSubscription = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    if (!currentSubscription || currentSubscription.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscription = currentSubscription[0];

    // Check if upgrading to same plan
    if (subscription.planId === newPlanId && subscription.billingCycle === billingCycle) {
      return NextResponse.json(
        {
          error: 'Already subscribed to this plan',
          message: 'You are already subscribed to this plan',
          success: false,
        },
        { status: 400 },
      );
    }

    // Calculate prorated amount
    const proratedAmount = calculateProratedAmount(
      subscription.planId,
      newPlanId,
      billingCycle,
      subscription.currentPeriodEnd,
    );

    // Determine if this is an upgrade or downgrade based on plan tier
    const currentTier = PLAN_TIERS[subscription.planId] ?? 0;
    const newTier = PLAN_TIERS[newPlanId] ?? 0;
    const isUpgrade = newTier > currentTier;

    pino.info(
      {
        billingCycle,
        currentPlan: subscription.planId,
        isUpgrade,
        newPlan: newPlanId,
        proratedAmount,
        userId,
      },
      'Processing subscription upgrade/downgrade',
    );

    // For upgrades with payment required, create Sepay payment and return payment URL
    // Only proceed with direct update if:
    // - It's a downgrade (proratedAmount <= 0)
    // - Or bypassPayment is true (payment already confirmed via webhook)
    // - Or proratedAmount is 0 (no payment needed)
    if (isUpgrade && proratedAmount > 0 && !body.bypassPayment) {
      // Create Sepay payment for upgrade fee
      const { SepayPaymentGateway, sepayGateway } = await import('@/libs/sepay');
      const { createPaymentRecord } = await import('@/server/services/billing/sepay');

      const orderId = SepayPaymentGateway.generateOrderId('PHO_UPG');
      const description = `pho.chat Upgrade to ${newPlanId} - prorated fee`;

      // Get base URL from request headers
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = host
        ? `${protocol}://${host}`
        : process.env.NEXT_PUBLIC_BASE_URL || 'https://pho.chat';

      const paymentResponse = await sepayGateway.createPayment({
        amount: proratedAmount,
        baseUrl,
        currency: 'VND',
        description,
        orderId,
      });

      if (paymentResponse.success) {
        // Store pending upgrade info in payment record metadata
        await createPaymentRecord({
          amountVnd: proratedAmount,
          billingCycle,
          currency: 'VND',
          orderId,
          planId: newPlanId,
          userId,
        });

        pino.info(
          { orderId, proratedAmount, userId },
          'Upgrade payment created, awaiting payment confirmation',
        );

        return NextResponse.json({
          message: `Payment of ${proratedAmount.toLocaleString()} VND required for upgrade`,
          paymentRequired: true,
          paymentUrl: paymentResponse.paymentUrl,
          proratedAmount,
          success: true,
        } as UpgradeResponse);
      } else {
        return NextResponse.json(
          { error: 'Failed to create payment', message: paymentResponse.message, success: false },
          { status: 500 },
        );
      }
    }

    // Proceed with direct subscription update (downgrade, no payment, or payment confirmed)
    const newPeriodStart = new Date();
    const newPeriodEnd = new Date();
    if (billingCycle === 'monthly') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    const updatedSubscription = await db
      .update(subscriptions)
      .set({
        billingCycle,
        currentPeriodEnd: newPeriodEnd,
        currentPeriodStart: newPeriodStart,
        planId: newPlanId,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    pino.info(
      { newPlan: newPlanId, subscriptionId: subscription.id, userId },
      'Subscription upgraded/downgraded successfully',
    );

    const response: UpgradeResponse = {
      message:
        proratedAmount > 0
          ? `Upgrade successful. Prorated charge: ${proratedAmount.toLocaleString()} VND`
          : proratedAmount < 0
            ? `Downgrade successful. Credit: ${Math.abs(proratedAmount).toLocaleString()} VND`
            : 'Plan changed successfully. No additional charge.',
      newSubscription: {
        billingCycle: updatedSubscription[0].billingCycle,
        currentPeriodEnd: updatedSubscription[0].currentPeriodEnd.toISOString(),
        id: updatedSubscription[0].id,
        planId: updatedSubscription[0].planId,
      },
      paymentRequired: false,
      proratedAmount,
      success: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Subscription upgrade/downgrade failed',
    );

    return NextResponse.json(
      {
        error: 'Failed to process subscription change',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
