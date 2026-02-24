import { NextResponse } from 'next/server';

import { cachedQuery } from '@/libs/cache';
import { getServerDB } from '@/database/server';

/**
 * GET /api/admin/weekly-digest-preview
 * Returns a preview of the weekly email digest data for a given userId.
 * Used by the admin to preview what users would receive.
 *
 * Query params:
 *   userId (required) — the DB user ID
 */
export async function GET(request: Request): Promise<NextResponse> {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId query param is required' }, { status: 400 });
        }

        const digest = await cachedQuery(`digest:${userId}`, 300, async () => {
            const db = await getServerDB();
            const { usageLogs } = await import('@/database/schemas') as any;
            const { eq, gte, sql, desc } = await import('drizzle-orm');

            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

            // Total messages this week
            const [msgResult] = await db
                .select({ count: sql<number>`COUNT(*)` })
                .from(usageLogs)
                .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${sevenDaysAgo}`);

            // Total points this week
            const [ptsResult] = await db
                .select({ total: sql<number>`COALESCE(SUM(${usageLogs.pointsDeducted}), 0)` })
                .from(usageLogs)
                .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${sevenDaysAgo}`);

            // Top 3 models
            const topModels = await db
                .select({
                    messages: sql<number>`COUNT(*)`,
                    model: usageLogs.model,
                })
                .from(usageLogs)
                .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${sevenDaysAgo}`)
                .groupBy(usageLogs.model)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(3);

            // Busiest day
            const busiestDay = await db
                .select({
                    count: sql<number>`COUNT(*)`,
                    day: sql<string>`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM-DD')`,
                })
                .from(usageLogs)
                .where(sql`${usageLogs.userId} = ${userId} AND ${usageLogs.createdAt} >= ${sevenDaysAgo}`)
                .groupBy(sql`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM-DD')`)
                .orderBy(desc(sql`COUNT(*)`))
                .limit(1);

            return {
                busiestDay: busiestDay[0] || null,
                messages: Number(msgResult?.count || 0),
                period: {
                    from: sevenDaysAgo.toISOString().split('T')[0],
                    to: new Date().toISOString().split('T')[0],
                },
                pointsUsed: Number(ptsResult?.total || 0),
                topModels: topModels.map(m => ({
                    messages: Number(m.messages),
                    model: m.model,
                })),
                userId,
            };
        });

        return NextResponse.json(digest);
    } catch (error) {
        console.error('[weekly-digest] Error:', error);
        return NextResponse.json({ error: 'Failed to generate digest' }, { status: 500 });
    }
}
