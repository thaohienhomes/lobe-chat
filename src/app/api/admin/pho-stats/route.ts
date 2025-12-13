/**
 * Phở Points Admin Stats API
 *
 * GET /api/admin/pho-stats
 *
 * Returns aggregate statistics for the Phở Points system:
 * - Total users by subscription status
 * - Total users by plan
 * - Total Phở Points distributed
 * - Recent transactions summary
 *
 * Requires admin authentication via Clerk.
 */
import { auth } from '@clerk/nextjs/server';
import { count, eq, sql, sum } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { subscriptions, transactions, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

// Admin user IDs that can access this endpoint
const ADMIN_USER_IDS = new Set([
  process.env.ADMIN_USER_ID,
  // Add more admin user IDs here
].filter(Boolean));

export async function GET() {
  try {
    // Check authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (!ADMIN_USER_IDS.has(userId)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const db = await getServerDB();

    // Get user stats by subscription status
    const usersByStatus = await db
      .select({
        count: count(),
        status: users.subscriptionStatus,
      })
      .from(users)
      .groupBy(users.subscriptionStatus);

    // Get user stats by plan
    const usersByPlan = await db
      .select({
        count: count(),
        planId: users.currentPlanId,
      })
      .from(users)
      .groupBy(users.currentPlanId);

    // Get total Phở Points in circulation
    const pointsStats = await db
      .select({
        avgBalance: sql<number>`AVG(${users.phoPointsBalance})`,
        totalBalance: sum(users.phoPointsBalance),
        totalUsers: count(),
      })
      .from(users);

    // Get active subscriptions count
    const activeSubscriptions = await db
      .select({
        count: count(),
      })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    // Get recent transactions summary (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTransactions = await db
      .select({
        count: count(),
        totalAmount: sum(transactions.amount),
      })
      .from(transactions)
      .where(sql`${transactions.createdAt} > ${thirtyDaysAgo}`);

    // Build response
    const stats = {
      generatedAt: new Date().toISOString(),
      phoPoints: {
        avgBalance: Math.round(Number(pointsStats[0]?.avgBalance) || 0),
        totalDistributed: Number(pointsStats[0]?.totalBalance) || 0,
      },
      subscriptions: {
        activeCount: activeSubscriptions[0]?.count || 0,
      },
      transactions: {
        last30Days: {
          count: recentTransactions[0]?.count || 0,
          totalAmount: Number(recentTransactions[0]?.totalAmount) || 0,
        },
      },
      users: {
        byPlan: Object.fromEntries(usersByPlan.map((row) => [row.planId || 'none', row.count])),
        byStatus: Object.fromEntries(
          usersByStatus.map((row) => [row.status || 'unknown', row.count]),
        ),
        total: pointsStats[0]?.totalUsers || 0,
      },
    };

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'private, max-age=60', // Cache for 1 minute
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);

    return NextResponse.json(
      {
        error: 'Failed to fetch stats',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
