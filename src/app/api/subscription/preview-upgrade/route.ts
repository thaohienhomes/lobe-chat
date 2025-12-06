/**
 * Preview Subscription Upgrade/Downgrade Endpoint
 * Calculates prorated amount without processing the change
 *
 * POST /api/subscription/preview-upgrade - Calculate upgrade preview
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { subscriptions } from '@/database/schemas/billing';
import { getServerDB } from '@/database/server';
import {
  PLAN_PRICING,
  PLAN_TIERS,
  calculateDaysRemaining,
  calculateProratedAmount,
} from '@/server/services/billing/proration';

interface PreviewRequest {
  billingCycle: 'monthly' | 'yearly';
  newPlanId: 'starter' | 'premium' | 'ultimate';
}

interface PreviewResponse {
  currentPlan: {
    billingCycle: string;
    name: string;
    planId: string;
    price: number;
  };
  daysRemaining: number;
  error?: string;
  isDowngrade: boolean;
  isUpgrade: boolean;
  message: string;
  newPlan: {
    billingCycle: string;
    name: string;
    planId: string;
    price: number;
  };
  proratedAmount: number;
  success: boolean;
}

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  premium: 'Premium',
  starter: 'Starter',
  ultimate: 'Ultimate',
};

/**
 * POST /api/subscription/preview-upgrade
 */
export async function POST(request: NextRequest): Promise<NextResponse<PreviewResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', success: false } as PreviewResponse, {
        status: 401,
      });
    }

    const body: PreviewRequest = await request.json();
    const { newPlanId, billingCycle } = body;

    if (!newPlanId || !billingCycle) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false } as PreviewResponse,
        { status: 400 },
      );
    }

    const db = await getServerDB();
    const currentSubscription = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    if (!currentSubscription || currentSubscription.length === 0) {
      return NextResponse.json(
        { error: 'No active subscription found', success: false } as PreviewResponse,
        { status: 404 },
      );
    }

    const subscription = currentSubscription[0];
    const currentPlanId = subscription.planId;

    // Calculate days remaining and prorated amount using shared utilities
    const daysRemaining = calculateDaysRemaining(subscription.currentPeriodEnd);
    const proratedAmount = calculateProratedAmount(
      currentPlanId,
      newPlanId,
      billingCycle,
      subscription.currentPeriodEnd,
    );

    const currentTier = PLAN_TIERS[currentPlanId] ?? 0;
    const newTier = PLAN_TIERS[newPlanId] ?? 0;
    const isUpgrade = newTier > currentTier;
    const isDowngrade = newTier < currentTier;

    const currentPricing = PLAN_PRICING[currentPlanId] || { monthly: 0, yearly: 0 };
    const newPricing = PLAN_PRICING[newPlanId] || { monthly: 0, yearly: 0 };

    return NextResponse.json({
      currentPlan: {
        billingCycle: subscription.billingCycle,
        name: PLAN_NAMES[currentPlanId] || currentPlanId,
        planId: currentPlanId,
        price: currentPricing[subscription.billingCycle as 'monthly' | 'yearly'],
      },
      daysRemaining,
      isDowngrade,
      isUpgrade,
      message:
        proratedAmount > 0
          ? `Upgrade fee: ${proratedAmount.toLocaleString()} VND`
          : proratedAmount < 0
            ? `Credit: ${Math.abs(proratedAmount).toLocaleString()} VND`
            : 'No additional charge',
      newPlan: {
        billingCycle,
        name: PLAN_NAMES[newPlanId] || newPlanId,
        planId: newPlanId,
        price: newPricing[billingCycle],
      },
      proratedAmount,
      success: true,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to calculate preview', success: false } as PreviewResponse,
      { status: 500 },
    );
  }
}
