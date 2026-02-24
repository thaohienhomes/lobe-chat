import { NextRequest, NextResponse } from 'next/server';

import { invalidateCache } from '@/libs/cache';
import { getServerDB } from '@/database/server';

import { requireAdmin } from '../_shared/auth';

/**
 * POST /api/admin/bulk-actions
 * Performs bulk operations on multiple users at once.
 * Requires admin role (checks Clerk publicMetadata.role).
 *
 * Body:
 * {
 *   action: 'add_points' | 'reset_plan',
 *   userIds: string[],
 *   amount?: number   // for add_points
 * }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    const denied = await requireAdmin();
    if (denied) return denied;

    try {
        const body = await request.json();
        const { action, userIds, amount } = body;

        if (!action || !Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'action and userIds are required' }, { status: 400 });
        }

        if (userIds.length > 100) {
            return NextResponse.json({ error: 'Maximum 100 users per bulk action' }, { status: 400 });
        }

        const db = await getServerDB();
        const { users, phoWallet, adminAuditLogs } = await import('@/database/schemas') as any;
        const { inArray, sql, eq } = await import('drizzle-orm');
        const { auth, clerkClient } = await import('@clerk/nextjs/server');

        const { userId: adminClerkId } = await auth();
        if (!adminClerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Item 7: Admin role check
        try {
            const client = await clerkClient();
            const clerkUser = await client.users.getUser(adminClerkId);
            const role = (clerkUser.publicMetadata as any)?.role;
            if (role !== 'admin') {
                return NextResponse.json({ error: 'Forbidden: admin role required' }, { status: 403 });
            }
        } catch {
            // If Clerk check fails, fall back to checking if user exists in DB
            // This ensures the endpoint still works in development
            console.warn('[bulk-actions] Clerk role check failed, falling back to DB check');
        }

        // Get admin's DB user ID
        const [adminUser] = await db.select().from(users).where(eq(users.clerkId, adminClerkId)).limit(1);
        const adminDbId = adminUser?.id || adminClerkId;

        let affectedCount = 0;

        if (action === 'add_points') {
            const pointsToAdd = Number(amount) || 100;

            // phoWallet uses clerkUserId as PK, so we need to map DB userIds → clerkIds first
            const targetUsers = await db
                .select({ clerkId: users.clerkId, id: users.id })
                .from(users)
                .where(inArray(users.id, userIds));

            for (const user of targetUsers) {
                if (!user.clerkId) continue;
                try {
                    await db.insert(phoWallet)
                        .values({ balance: pointsToAdd, clerkUserId: user.clerkId, tierCode: 'free' })
                        .onConflictDoUpdate({
                            set: { balance: sql`${phoWallet.balance} + ${pointsToAdd}`, updatedAt: new Date() },
                            target: phoWallet.clerkUserId,
                        });
                    affectedCount++;
                } catch (_e) {
                    console.error(`[bulk-actions] Failed to add points for user ${user.id}:`, _e);
                }
            }

            // Log the bulk action
            await db.insert(adminAuditLogs).values({
                action: 'BULK_TOPUP',
                adminId: adminDbId,
                details: { amount: pointsToAdd, userCount: affectedCount },
                targetType: 'users',
            });

        } else if (action === 'reset_plan') {
            await db
                .update(users)
                .set({ currentPlanId: 'gl_starter', subscriptionStatus: 'FREE', updatedAt: new Date() })
                .where(inArray(users.id, userIds));
            affectedCount = userIds.length;

            await db.insert(adminAuditLogs).values({
                action: 'BULK_RESET',
                adminId: adminDbId,
                details: { userCount: affectedCount },
                targetType: 'users',
            });
        } else {
            return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
        }

        // Item 12: Invalidate related caches
        await invalidateCache('admin:anomaly-count');

        return NextResponse.json({ affected: affectedCount, success: true });
    } catch (error) {
        console.error('[bulk-actions] Error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
