/**
 * Get Current Subscription Endpoint
 * Returns the user's current active subscription
 * 
 * GET /api/subscription/current - Get current subscription
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getServerDB } from '@/database/server';
import { subscriptions } from '@/database/schemas/billing';
import { eq, and } from 'drizzle-orm';
import { pino } from '@/libs/logger';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database instance
    const db = await getServerDB();

    // Get current active subscription
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

    pino.info(
      {
        userId,
        planId: subscription.planId,
        billingCycle: subscription.billingCycle,
      },
      'Current subscription retrieved',
    );

    return NextResponse.json({
      id: subscription.id,
      planId: subscription.planId,
      billingCycle: subscription.billingCycle,
      status: subscription.status,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
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

