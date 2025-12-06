/**
 * Preview Subscription Upgrade/Downgrade Endpoint
 * Calculates prorated amount without processing the change
 * 
 * POST /api/subscription/preview-upgrade - Calculate upgrade preview
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { subscriptions } from '@/database/schemas/billing';
import { eq, and } from 'drizzle-orm';

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

// Plan pricing in VND (free plan has 0 cost)
const PLAN_PRICING: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  premium: { monthly: 129_000, yearly: 1_290_000 },
  starter: { monthly: 39_000, yearly: 390_000 },
  ultimate: { monthly: 349_000, yearly: 3_490_000 },
};

const PLAN_NAMES: Record<string, string> = {
  free: 'Free',
  premium: 'Premium',
  starter: 'Starter',
  ultimate: 'Ultimate',
};

// Plan tier order for determining upgrade vs downgrade
const PLAN_TIERS: Record<string, number> = {
  free: 0,
  starter: 1,
  premium: 2,
  ultimate: 3,
};

/**
 * Calculate prorated amount for plan change preview
 */
function calculateProratedAmount(
  currentPlan: string,
  newPlan: string,
  billingCycle: 'monthly' | 'yearly',
  currentPeriodEnd: Date,
): { daysRemaining: number; proratedAmount: number } {
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  ));
  const totalDays = billingCycle === 'monthly' ? 30 : 365;

  const currentPricing = PLAN_PRICING[currentPlan] || { monthly: 0, yearly: 0 };
  const newPricing = PLAN_PRICING[newPlan] || { monthly: 0, yearly: 0 };
  
  const currentPrice = currentPricing[billingCycle];
  const newPrice = newPricing[billingCycle];

  // Special case: upgrading from free plan - charge full price for new plan
  if (currentPlan === 'free') {
    return { daysRemaining, proratedAmount: newPrice };
  }

  // Calculate daily rates
  const currentDailyRate = currentPrice / totalDays;
  const newDailyRate = newPrice / totalDays;

  // Calculate credit and charge
  const credit = currentDailyRate * daysRemaining;
  const charge = newDailyRate * daysRemaining;

  return { daysRemaining, proratedAmount: Math.round(charge - credit) };
}

/**
 * POST /api/subscription/preview-upgrade
 */
export async function POST(request: NextRequest): Promise<NextResponse<PreviewResponse>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false } as PreviewResponse,
        { status: 401 },
      );
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
    
    const { daysRemaining, proratedAmount } = calculateProratedAmount(
      currentPlanId,
      newPlanId,
      billingCycle,
      subscription.currentPeriodEnd,
    );

    const currentTier = PLAN_TIERS[currentPlanId] || 0;
    const newTier = PLAN_TIERS[newPlanId] || 0;
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
      message: proratedAmount > 0
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to calculate preview', success: false } as PreviewResponse,
      { status: 500 },
    );
  }
}

