/**
 * Phở Wallet Status API
 * GET /api/internal/wallet/status
 *
 * Internal API for Phở Studio to check user wallet status and eligibility.
 * Secured by shared secret authentication.
 */
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { phoWallet, STUDIO_BLOCKED_TIERS, WalletTierCode } from '@/database/schemas/wallet';
import { pino } from '@/libs/logger';

// Validate shared secret for internal API calls
function validateInternalSecret(request: NextRequest): boolean {
    const secret = request.headers.get('x-internal-secret');
    const expectedSecret = process.env.PHO_INTERNAL_API_SECRET;

    if (!expectedSecret) {
        pino.error('PHO_INTERNAL_API_SECRET is not configured');
        return false;
    }

    return secret === expectedSecret;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. Validate internal secret
        if (!validateInternalSecret(request)) {
            pino.warn('Unauthorized internal API access attempt');
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid or missing internal secret' },
                { status: 401 }
            );
        }

        // 2. Get user_id from query params
        const { searchParams } = new URL(request.url);
        const user_id = searchParams.get('user_id');

        if (!user_id) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'user_id query parameter is required' },
                { status: 400 }
            );
        }

        // 3. Get database and fetch wallet
        const db = await getServerDB();
        const wallet = await db
            .select()
            .from(phoWallet)
            .where(eq(phoWallet.clerkUserId, user_id))
            .limit(1);

        if (!wallet || wallet.length === 0) {
            // Auto-create wallet for existing users who don't have one yet
            pino.info({ user_id }, 'Wallet not found, auto-creating with free tier');
            try {
                await db.insert(phoWallet).values({
                    balance: 0,
                    clerkUserId: user_id,
                    tierCode: 'free',
                }).onConflictDoNothing();

                // Return default free tier response for newly created wallet
                return NextResponse.json({
                    _auto_created: true,
                    balance: 0,
                    can_use_studio: false,
                    tier: 'free',
                });
            } catch (createError) {
                pino.error({ error: createError, user_id }, 'Failed to auto-create wallet');
                return NextResponse.json(
                    { error: 'Not Found', message: 'Wallet not found for user' },
                    { status: 404 }
                );
            }
        }

        const userWallet = wallet[0];
        const tierCode = userWallet.tierCode as WalletTierCode;

        // Determine if user can use studio based on tier
        const canUseStudio = !STUDIO_BLOCKED_TIERS.includes(tierCode as (typeof STUDIO_BLOCKED_TIERS)[number]);

        pino.info(
            { balance: userWallet.balance, canUseStudio, tier: tierCode, user_id },
            'Wallet status retrieved'
        );

        return NextResponse.json({
            balance: userWallet.balance,
            can_use_studio: canUseStudio,
            tier: tierCode,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        pino.error({ error: errorMessage }, 'Failed to retrieve wallet status');

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: 'Failed to retrieve wallet status',
            },
            { status: 500 }
        );
    }
}
