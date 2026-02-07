/**
 * Emergency Fix Route for User Subscription
 * Protected with Clerk auth + admin check.
 */
import { NextResponse } from 'next/server';

import { requireAdmin } from '@/app/api/admin/_shared/auth';
import { getServerDB } from '@/database/server';

import { eq } from 'drizzle-orm';

export async function GET() {
    // Admin-only access
    const denied = await requireAdmin();
    if (denied) return denied;

    const email = 'hi@pho.chat';
    const targetPlan = 'lifetime_early_bird';
    const targetPoints = 2_000_000;

    try {
        const db: any = getServerDB();

        const schemas: any = await import('@lobechat/database/schemas');
        const { subscriptions, phoPointsBalances, users } = schemas;

        // 1. Find User
        const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

        if (!user) {
            return NextResponse.json({ email, error: 'User not found' });
        }

        const userId = user.id;

        // 2. Check Current Subscription
        const [currentSub] = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.userId, userId))
            .limit(1);

        // 3. Fix Subscription
        const start = new Date();
        const end = new Date('2099-12-31');

        if (currentSub) {
            await db
                .update(subscriptions)
                .set({
                    billingCycle: 'lifetime',
                    cancelAtPeriodEnd: false,
                    currentPeriodEnd: end,
                    currentPeriodStart: start,
                    paymentProvider: 'polar',
                    planId: targetPlan,
                    status: 'active',
                    updatedAt: new Date(),
                })
                .where(eq(subscriptions.userId, userId));
        } else {
            await db.insert(subscriptions).values({
                billingCycle: 'lifetime',
                cancelAtPeriodEnd: false,
                currentPeriodEnd: end,
                currentPeriodStart: start,
                paymentProvider: 'polar',
                planId: targetPlan,
                status: 'active',
                userId,
            });
        }

        // 4. Fix Pho Points
        const [currentBalance] = await db
            .select()
            .from(phoPointsBalances)
            .where(eq(phoPointsBalances.userId, userId))
            .limit(1);

        if (currentBalance) {
            await db
                .update(phoPointsBalances)
                .set({
                    balance: targetPoints,
                    lastResetAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(eq(phoPointsBalances.userId, userId));
        } else {
            await db.insert(phoPointsBalances).values({
                balance: targetPoints,
                createdAt: new Date(),
                lastResetAt: new Date(),
                updatedAt: new Date(),
                userId,
            });
        }

        return NextResponse.json({
            message: 'User manually activated to Lifetime Deal',
            success: true,
            user: {
                email: user.email,
                id: userId,
                newPlan: targetPlan,
                oldPlan: currentSub?.planId || 'none',
                points: targetPoints,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                details: error instanceof Error ? error.message : String(error),
                error: 'Fix failed',
            },
            { status: 500 },
        );
    }
}
