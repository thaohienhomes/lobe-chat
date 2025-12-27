/**
 * Get Current Subscription Endpoint
 * Returns the user's current active subscription
 *
 * GET /api/subscription/current - Get current subscription
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { subscriptions } from '@/database/schemas/billing';
import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';

export async function GET(): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database instance
    const db = await getServerDB();

    // Get ALL active subscriptions for the user (to properly prioritize)
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Prioritize paid/lifetime plans over free plan
    // Sort by: lifetime plans first, then other paid plans, then free plan
    const FREE_PLAN_IDS = new Set(['free', 'trial', 'starter', 'vn_free', 'gl_starter']);
    const LIFETIME_KEYWORDS = ['lifetime', 'founding'];

    const sortedSubscriptions = activeSubscriptions.sort((a, b) => {
      const aIsLifetime = LIFETIME_KEYWORDS.some((kw) => a.planId.toLowerCase().includes(kw));
      const bIsLifetime = LIFETIME_KEYWORDS.some((kw) => b.planId.toLowerCase().includes(kw));
      const aIsFree = FREE_PLAN_IDS.has(a.planId.toLowerCase());
      const bIsFree = FREE_PLAN_IDS.has(b.planId.toLowerCase());

      // Lifetime plans have highest priority
      if (aIsLifetime && !bIsLifetime) return -1;
      if (!aIsLifetime && bIsLifetime) return 1;

      // Free plans have lowest priority
      if (aIsFree && !bIsFree) return 1;
      if (!aIsFree && bIsFree) return -1;

      // For same priority, prefer more recent subscription
      const aStart = a.currentPeriodStart ? new Date(a.currentPeriodStart).getTime() : 0;
      const bStart = b.currentPeriodStart ? new Date(b.currentPeriodStart).getTime() : 0;
      return bStart - aStart;
    });

    const subscription = sortedSubscriptions[0];

    pino.info(
      {
        billingCycle: subscription.billingCycle,
        planId: subscription.planId,
        userId,
      },
      'Current subscription retrieved',
    );

    return NextResponse.json({
      billingCycle: subscription.billingCycle,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      id: subscription.id,
      planId: subscription.planId,
      status: subscription.status,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to retrieve current subscription',
    );

    return NextResponse.json(
      {
        error: 'Failed to retrieve subscription',
        message: errorMessage,
      },
      { status: 500 },
    );
  }
}
