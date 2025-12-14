import { auth } from '@clerk/nextjs/server';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { subscriptions, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const FREE_PLANS = new Set(['vn_free', 'gl_starter', 'starter']);

/**
 * Activate a free subscription plan
 * POST /api/subscription/activate-free
 *
 * For free plans (vn_free, gl_starter), we don't need payment.
 * Simply activate the subscription directly.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized', success: false }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;
    // Note: customerEmail and customerName available in body if needed for future use

    // Validate this is a free plan
    if (!planId || !FREE_PLANS.has(planId)) {
      return NextResponse.json(
        {
          message: `Plan "${planId}" is not a free plan. Use payment flow for paid plans.`,
          success: false,
        },
        { status: 400 },
      );
    }

    const db = await getServerDB();
    const now = new Date();

    // Map plan IDs to internal codes
    const planCodeMap: Record<string, string> = {
      gl_starter: 'gl_starter',
      starter: 'vn_free',
      vn_free: 'vn_free',
    };
    const normalizedPlanId = planCodeMap[planId] || planId;

    // 1. Update user's current plan
    await db
      .update(users)
      .set({
        currentPlanId: normalizedPlanId,
        phoPointsBalance: 50_000,
        // Free tier points
pointsResetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), 
        subscriptionStatus: 'ACTIVE', // Next month
        updatedAt: now,
      })
      .where(eq(users.id, userId));

    // 2. Create subscription record (using schema columns from billing.ts)
    await db
      .insert(subscriptions)
      .values({
        billingCycle: 'monthly',
        currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        currentPeriodStart: now,
        id: `sub_free_${userId}_${Date.now()}`,
        paymentProvider: 'free',
        planId: normalizedPlanId === 'vn_free' ? 'free' : 'starter',
        status: 'active',
        userId,
      })
      .onConflictDoNothing();

    console.log(`✅ Free plan activated: ${normalizedPlanId} for user ${userId}`);

    return NextResponse.json({
      message: 'Free plan activated successfully!',
      planId: normalizedPlanId,
      redirectUrl: '/settings/subscription?activated=true',
      success: true,
    });
  } catch (error) {
    console.error('❌ Free plan activation error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to activate free plan',
        success: false,
      },
      { status: 500 },
    );
  }
}
