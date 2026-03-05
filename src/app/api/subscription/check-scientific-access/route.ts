/**
 * Check Scientific Skills Access
 * GET /api/subscription/check-scientific-access
 *
 * Returns whether the current user can use Scientific Skills based on their plan.
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { subscriptions } from '@/database/schemas/billing';
import { getServerDB } from '@/database/server';
import {
  checkScientificSkillsAccess,
  incrementScientificSkillsUsage,
} from '@/server/services/billing/credits';

export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ allowed: false, reason: 'Unauthorized' }, { status: 401 });
    }

    const db = await getServerDB();

    // Get user's active subscription to determine plan
    const activeSubscription = await db
      .select({ planId: subscriptions.planId })
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    const planId = activeSubscription[0]?.planId || 'vn_free';

    const result = await checkScientificSkillsAccess(userId, planId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error checking scientific access:', error);
    // Fail open - allow access on error
    return NextResponse.json({ allowed: true });
  }
}

/**
 * POST /api/subscription/check-scientific-access
 * Increment scientific skills usage counter after a successful call.
 */
export async function POST(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false }, { status: 401 });
    }
    await incrementScientificSkillsUsage(userId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
