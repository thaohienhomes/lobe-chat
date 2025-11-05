/**
 * Subscription Upgrade/Downgrade Endpoint
 * Handles plan changes with prorated charges
 * 
 * POST /api/subscription/upgrade - Upgrade or downgrade subscription
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { subscriptions } from '@/database/schemas/billing';
import { eq, and } from 'drizzle-orm';
import { pino } from '@/libs/logger';

interface UpgradeRequest {
  billingCycle: 'monthly' | 'yearly';
  newPlanId: 'starter' | 'premium' | 'ultimate';
}

interface UpgradeResponse {
  message: string;
  newSubscription?: {
    billingCycle: string;
    currentPeriodEnd: string;
    id: string;
    planId: string;
  };
  proratedAmount?: number;
  success: boolean;
}

// Plan pricing in VND
const PLAN_PRICING = {
  premium: { monthly: 129_000, yearly: 1_290_000 },
  starter: { monthly: 39_000, yearly: 390_000 },
  ultimate: { monthly: 349_000, yearly: 3_490_000 },
};

/**
 * Calculate prorated amount for plan change
 */
function calculateProratedAmount(
  currentPlan: string,
  newPlan: string,
  billingCycle: 'monthly' | 'yearly',
  currentPeriodEnd: Date,
): number {
  const now = new Date();
  const daysRemaining = Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalDays = billingCycle === 'monthly' ? 30 : 365;

  const currentPrice = PLAN_PRICING[currentPlan as keyof typeof PLAN_PRICING][billingCycle];
  const newPrice = PLAN_PRICING[newPlan as keyof typeof PLAN_PRICING][billingCycle];

  // Calculate daily rates
  const currentDailyRate = currentPrice / totalDays;
  const newDailyRate = newPrice / totalDays;

  // Calculate credit for remaining days on current plan
  const credit = currentDailyRate * daysRemaining;

  // Calculate charge for new plan for remaining days
  const charge = newDailyRate * daysRemaining;

  // Prorated amount (positive = charge, negative = credit)
  return Math.round(charge - credit);
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
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 },
      );
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 },
      );
    }

    // Get database instance
    const db = await getServerDB();

    // Get current subscription
    const currentSubscription = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
        ),
      )
      .limit(1);

    if (!currentSubscription || currentSubscription.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 },
      );
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

    pino.info(
      {
        billingCycle,
        currentPlan: subscription.planId,
        newPlan: newPlanId,
        proratedAmount,
        userId,
      },
      'Processing subscription upgrade/downgrade',
    );

    // Calculate new period end
    const newPeriodStart = new Date();
    const newPeriodEnd = new Date();
    if (billingCycle === 'monthly') {
      newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);
    } else {
      newPeriodEnd.setFullYear(newPeriodEnd.getFullYear() + 1);
    }

    // Update subscription
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
      {
        newPlan: newPlanId,
        subscriptionId: subscription.id,
        userId,
      },
      'Subscription upgraded/downgraded successfully',
    );

    const response: UpgradeResponse = {
      message: proratedAmount > 0
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

