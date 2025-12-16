import { and, eq, isNull, lt, or, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { users } from '@/database/schemas/user';
import { getServerDB } from '@/database/server';

/**
 * Cron endpoint to reset Phở Points for Lifetime plan users
 *
 * Per SPECS_BUSINESS.md:
 * - gl_lifetime users get 2,000,000 points reset on the 1st of each month
 * - This cron job runs at 00:00 UTC on the 1st of each month
 *
 * Security:
 * - Requires Authorization header with CRON_SECRET
 * - Vercel automatically adds this header when calling cron endpoints
 *
 * @see https://vercel.com/docs/cron-jobs
 */

const LIFETIME_POINTS_ALLOWANCE = 2_000_000; // 2M points per month
const LIFETIME_PLAN_ID = 'gl_lifetime';

/**
 * Check if a date is in the current month
 */
function isCurrentMonth(date: Date | null): boolean {
  if (!date) return false;
  const now = new Date();
  return (
    date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth()
  );
}

export async function GET(request: NextRequest) {
  console.log('[reset-lifetime-points] Cron job started');

  // Security check: Verify CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[reset-lifetime-points] CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'CRON_SECRET not configured', success: false },
      { status: 403 },
    );
  }

  const authHeader = request.headers.get('Authorization');
  const providedToken = authHeader?.replace('Bearer ', '');

  if (!providedToken || providedToken !== cronSecret) {
    console.error('[reset-lifetime-points] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 });
  }

  try {
    const serverDB = await getServerDB();
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    console.log(
      `[reset-lifetime-points] Checking for ${LIFETIME_PLAN_ID} users needing reset before ${currentMonthStart.toISOString()}`,
    );

    // Find all lifetime users who haven't been reset this month
    // Conditions:
    // 1. currentPlanId = 'gl_lifetime'
    // 2. pointsResetDate is NULL OR pointsResetDate < start of current month
    const usersToReset = await serverDB
      .select({
        currentPoints: users.phoPointsBalance,
        id: users.id,
        lastReset: users.pointsResetDate,
      })
      .from(users)
      .where(
        and(
          eq(users.currentPlanId, LIFETIME_PLAN_ID),
          or(isNull(users.pointsResetDate), lt(users.pointsResetDate, currentMonthStart)),
        ),
      );

    console.log(`[reset-lifetime-points] Found ${usersToReset.length} users to reset`);

    if (usersToReset.length === 0) {
      return NextResponse.json({
        message: 'No users need points reset',
        resetCount: 0,
        success: true,
        timestamp: now.toISOString(),
      });
    }

    // Batch update all eligible users
    const userIds = usersToReset.map((u) => u.id);

    const result = await serverDB
      .update(users)
      .set({
        phoPointsBalance: LIFETIME_POINTS_ALLOWANCE,
        pointsResetDate: now,
        updatedAt: now,
      })
      .where(sql`${users.id} = ANY(${userIds})`);

    console.log(`[reset-lifetime-points] Reset complete for ${usersToReset.length} users`);

    // Log details for monitoring
    for (const user of usersToReset) {
      console.log(
        `[reset-lifetime-points] User ${user.id}: ${user.currentPoints} → ${LIFETIME_POINTS_ALLOWANCE} points`,
      );
    }

    return NextResponse.json({
      details: usersToReset.map((u) => ({
        previousBalance: u.currentPoints,
        userId: u.id,
      })),
      newBalance: LIFETIME_POINTS_ALLOWANCE,
      resetCount: usersToReset.length,
      success: true,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('[reset-lifetime-points] Database error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown database error',
        success: false,
      },
      { status: 500 },
    );
  }
}

