import { NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

/**
 * POST /api/referral/track
 * Called during signup to record a referral conversion.
 *
 * Body: { referralCode: string }
 *
 * This endpoint:
 * 1. Decodes the referral code to find the referrer
 * 2. Creates a referral_conversions record
 * 3. Awards bonus points to both referrer and referred user (future)
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: referredClerkId } = await auth();

        if (!referredClerkId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { referralCode } = body;

        if (!referralCode || typeof referralCode !== 'string') {
            return NextResponse.json({ error: 'referralCode is required' }, { status: 400 });
        }

        // Decode referral code to get referrer's Clerk ID
        let referrerClerkId: string;
        try {
            referrerClerkId = Buffer.from(referralCode, 'base64url').toString();
        } catch {
            return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
        }

        // Don't allow self-referral
        if (referrerClerkId === referredClerkId) {
            return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 });
        }

        const db = await getServerDB();
        const { referralConversions } = await import('@/database/schemas') as any;
        const { eq, and } = await import('drizzle-orm');

        // Check if this referral already exists
        const existing = await db
            .select()
            .from(referralConversions)
            .where(
                and(
                    eq(referralConversions.referrerClerkId, referrerClerkId),
                    eq(referralConversions.referredClerkId, referredClerkId),
                )
            )
            .limit(1);

        if (existing.length > 0) {
            return NextResponse.json({ message: 'Referral already recorded', success: true });
        }

        // Record the conversion
        await db.insert(referralConversions).values({
            referralCode,
            referredClerkId,
            referrerClerkId,
        });

        // Future: Award bonus Phở Points to both users
        // await awardReferralBonus(referrerClerkId, referredClerkId);

        return NextResponse.json({ message: 'Referral recorded successfully', success: true });
    } catch (error) {
        console.error('[referral/track] Error:', error);
        return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
    }
}
