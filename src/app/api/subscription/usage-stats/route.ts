/**
 * Usage Stats API
 *
 * GET /api/subscription/usage-stats
 *
 * Returns user's current Phở Points balance and daily tier usage
 * Based on PRICING_MASTERPLAN.md.md
 *
 * IMPORTANT: Plan detection logic must be consistent with /api/subscription/current
 * to avoid displaying different plans in different parts of the UI.
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { GLOBAL_PLANS, VN_PLANS } from '@/config/pricing';
import { usageLogs, users } from '@/database/schemas';
import { subscriptions } from '@/database/schemas/billing';
import { getServerDB } from '@/database/server';

// Constants for plan prioritization (same as in /api/subscription/current)
const FREE_PLAN_IDS = new Set(['free', 'trial', 'starter', 'vn_free', 'gl_starter']);
const LIFETIME_KEYWORDS = ['lifetime', 'founding'];

/**
 * Get the user's effective plan ID by checking subscriptions table first
 * This ensures consistency with /api/subscription/current (BillingInfo)
 */
async function getEffectivePlanId(
  db: ReturnType<typeof getServerDB> extends Promise<infer T> ? T : never,
  userId: string,
  fallbackPlanId: string,
): Promise<string> {
  // Get ALL active subscriptions for the user (to properly prioritize)
  const activeSubscriptions = await db
    .select({
      currentPeriodStart: subscriptions.currentPeriodStart,
      planId: subscriptions.planId,
    })
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));

  if (!activeSubscriptions || activeSubscriptions.length === 0) {
    // No active subscription in subscriptions table, use fallback from users table
    return fallbackPlanId;
  }

  // Prioritize paid/lifetime plans over free plan (same logic as /api/subscription/current)
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

  return sortedSubscriptions[0].planId;
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getServerDB();

    // Get user data
    const userResult = await db
      .select({
        currentPlanId: users.currentPlanId,
        phoPointsBalance: users.phoPointsBalance,
        pointsResetDate: users.pointsResetDate,
        streakCount: users.streakCount,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userResult.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // Get effective plan ID - prioritizes subscriptions table for consistency with BillingInfo
    const fallbackPlanId = user.currentPlanId || 'vn_free';
    let planId = await getEffectivePlanId(db, userId, fallbackPlanId);

    // Override with Clerk publicMetadata.planId if it's a non-free plan
    // This handles promo-activated users who have planId in Clerk but no DB subscription
    if (planId === fallbackPlanId && (planId === 'vn_free' || planId === 'starter' || planId === 'free')) {
      const { clerkClient } = await import('@clerk/nextjs/server');
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const clerkPlanId = (clerkUser.publicMetadata as any)?.planId;
        if (clerkPlanId && clerkPlanId !== 'free' && clerkPlanId !== 'vn_free') {
          planId = clerkPlanId;
        }
      } catch {
        // Clerk lookup failed, continue with DB planId
      }
    }

    // Get plan config
    const plan = VN_PLANS[planId] || GLOBAL_PLANS[planId] || VN_PLANS.vn_free;

    // Get today's usage from usageLogs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usageResult = await db
      .select({
        tier2Count: sql<number>`COALESCE(SUM(CASE WHEN ${usageLogs.modelTier} = 2 THEN 1 ELSE 0 END), 0)`,
        tier3Count: sql<number>`COALESCE(SUM(CASE WHEN ${usageLogs.modelTier} = 3 THEN 1 ELSE 0 END), 0)`,
      })
      .from(usageLogs)
      .where(and(eq(usageLogs.userId, userId), gte(usageLogs.createdAt, today)));

    const usage = usageResult[0] || { tier2Count: 0, tier3Count: 0 };

    return NextResponse.json({
      currentPlanId: planId,
      dailyTier2Count: Number(usage.tier2Count),
      dailyTier2Limit: plan.dailyTier2Limit ?? 0,
      dailyTier3Count: Number(usage.tier3Count),
      dailyTier3Limit: plan.dailyTier3Limit ?? 0,
      phoPointsBalance: user.phoPointsBalance ?? 50_000,
      pointsResetDate: user.pointsResetDate?.toISOString() ?? null,
      streakDays: user.streakCount ?? 0,
      totalMonthlyPoints: plan.monthlyPoints,
    });
  } catch (error) {
    console.error('Usage stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch usage stats' }, { status: 500 });
  }
}
