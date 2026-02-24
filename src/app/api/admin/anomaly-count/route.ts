import { NextResponse } from 'next/server';

import { cachedQuery } from '@/libs/cache';
import { getServerDB } from '@/database/server';

import { requireAdmin } from '../_shared/auth';

/**
 * GET /api/admin/anomaly-count
 * Returns the number of detected anomalies (desynced plans, negative points, stuck payments).
 * Used by the Admin Sidebar to show a notification badge.
 * Cached for 60 seconds to reduce DB load.
 */
export async function GET(): Promise<NextResponse> {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const count = await cachedQuery('admin:anomaly-count', 60, async () => {
            const db = await getServerDB();
            // Item 1: Use phoWallet (not phoPointsBalances which doesn't exist)
            const { users, phoWallet, sepayPayments } = await import('@/database/schemas') as any;
            const { lt, eq, and, gte, sql } = await import('drizzle-orm');

            let anomalyCount = 0;

            // 1. Count users with active plans but FREE status
            try {
                const desynced = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(users)
                    .where(
                        and(
                            sql`${users.currentPlanId} NOT IN ('gl_starter', 'vn_free')`,
                            eq(users.subscriptionStatus, 'FREE'),
                        )
                    );
                anomalyCount += Number(desynced[0]?.count || 0);
            } catch { /* non-fatal */ }

            // 2. Count wallets with negative balance
            try {
                const negativeBalance = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(phoWallet)
                    .where(lt(phoWallet.balance, 0));
                anomalyCount += Number(negativeBalance[0]?.count || 0);
            } catch { /* non-fatal */ }

            // 3. Count Sepay payments stuck in pending for > 2 hours
            try {
                const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
                const stuckPayments = await db
                    .select({ count: sql<number>`COUNT(*)` })
                    .from(sepayPayments)
                    .where(
                        and(
                            eq(sepayPayments.status, 'pending'),
                            gte(sepayPayments.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)),
                            lt(sepayPayments.createdAt, twoHoursAgo),
                        )
                    );
                anomalyCount += Number(stuckPayments[0]?.count || 0);
            } catch { /* non-fatal */ }

            return anomalyCount;
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error('[anomaly-count] Error:', error);
        return NextResponse.json({ count: 0 });
    }
}
