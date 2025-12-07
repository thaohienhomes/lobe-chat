/**
 * Usage Stats API
 *
 * GET /api/subscription/usage-stats
 *
 * Returns user's current Phở Points balance and daily tier usage
 * Based on PRICING_MASTERPLAN.md.md
 */
import { auth } from '@clerk/nextjs/server';
import { and, eq, gte, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { GLOBAL_PLANS, VN_PLANS } from '@/config/pricing';
import { usageLogs, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

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
    const planId = user.currentPlanId || 'vn_free';

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
