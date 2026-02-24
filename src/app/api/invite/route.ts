import { NextResponse } from 'next/server';

/**
 * GET /api/invite
 * Returns the current user's referral/invite link.
 * The link is simply pho.chat/?ref=<clerkUserId> for now.
 * Future: track conversions in a referral_conversions table.
 */
export async function GET(): Promise<NextResponse> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://pho.chat';
        const referralCode = Buffer.from(userId).toString('base64url').slice(0, 12);
        const inviteUrl = `${baseUrl}/?ref=${referralCode}`;

        return NextResponse.json({
            inviteUrl,
            referralCode,
            userId,
        });
    } catch {
        return NextResponse.json({ error: 'Failed to generate invite link' }, { status: 500 });
    }
}
