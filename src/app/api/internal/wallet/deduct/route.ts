/**
 * Phở Wallet Deduct API
 * POST /api/internal/wallet/deduct
 *
 * Internal API for Phở Studio to deduct credits from user wallets.
 * Secured by shared secret authentication.
 *
 * CRITICAL BUSINESS LOGIC:
 * - 'free' and 'vn_basic' tiers are BLOCKED from 'studio_gen' service
 * - Returns 403 "Upgrade to Creator Plan" for blocked tiers
 */
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { phoWallet, STUDIO_BLOCKED_TIERS } from '@/database/schemas/wallet';
import { pino } from '@/libs/logger';

// Request body schema
interface DeductRequest {
    amount: number;
    service: string;
    user_id: string;
}

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

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // 1. Validate internal secret
        if (!validateInternalSecret(request)) {
            pino.warn('Unauthorized internal API access attempt');
            return NextResponse.json(
                { error: 'Unauthorized', message: 'Invalid or missing internal secret' },
                { status: 401 }
            );
        }

        // 2. Parse and validate request body
        const body: DeductRequest = await request.json();
        const { user_id, amount, service } = body;

        if (!user_id || typeof user_id !== 'string') {
            return NextResponse.json(
                { error: 'Bad Request', message: 'user_id is required' },
                { status: 400 }
            );
        }

        if (!amount || typeof amount !== 'number' || amount <= 0) {
            return NextResponse.json(
                { error: 'Bad Request', message: 'amount must be a positive number' },
                { status: 400 }
            );
        }

        if (!service || typeof service !== 'string') {
            return NextResponse.json(
                { error: 'Bad Request', message: 'service is required' },
                { status: 400 }
            );
        }

        // 3. Get database and fetch wallet
        const db = await getServerDB();
        let wallet = await db
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

                // Fetch the newly created wallet
                const newWallet = await db
                    .select()
                    .from(phoWallet)
                    .where(eq(phoWallet.clerkUserId, user_id))
                    .limit(1);

                if (newWallet && newWallet.length > 0) {
                    wallet = newWallet;
                } else {
                    return NextResponse.json(
                        { error: 'Not Found', message: 'Failed to create wallet for user' },
                        { status: 404 }
                    );
                }
            } catch (createError) {
                pino.error({ error: createError, user_id }, 'Failed to auto-create wallet');
                return NextResponse.json(
                    { error: 'Not Found', message: 'Wallet not found for user' },
                    { status: 404 }
                );
            }
        }

        const userWallet = wallet[0];

        // 4. CRITICAL: Check tier-based access for studio_gen service
        if (service === 'studio_gen') {
            const tierCode = userWallet.tierCode as (typeof STUDIO_BLOCKED_TIERS)[number];
            if (STUDIO_BLOCKED_TIERS.includes(tierCode)) {
                pino.info(
                    { service, tier: tierCode, user_id },
                    'Studio access blocked for tier'
                );
                return NextResponse.json(
                    {
                        code: 'TIER_BLOCKED',
                        current_tier: tierCode,
                        error: 'Forbidden',
                        message: 'Upgrade to Creator Plan',
                    },
                    { status: 403 }
                );
            }
        }

        // 5. Check sufficient balance
        if (userWallet.balance < amount) {
            pino.info(
                { balance: userWallet.balance, requested: amount, user_id },
                'Insufficient balance'
            );
            return NextResponse.json(
                {
                    balance: userWallet.balance,
                    code: 'INSUFFICIENT_BALANCE',
                    error: 'Bad Request',
                    message: 'Insufficient balance',
                    requested: amount,
                },
                { status: 400 }
            );
        }

        // 6. Deduct balance atomically
        const result = await db
            .update(phoWallet)
            .set({
                balance: sql`${phoWallet.balance} - ${amount}`,
                updatedAt: new Date(),
            })
            .where(eq(phoWallet.clerkUserId, user_id))
            .returning({ newBalance: phoWallet.balance });

        const newBalance = result[0]?.newBalance ?? userWallet.balance - amount;

        pino.info(
            { amount, newBalance, service, user_id },
            'Wallet deduction successful'
        );

        return NextResponse.json({
            amount_deducted: amount,
            new_balance: newBalance,
            service,
            success: true,
            user_id,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        pino.error({ error: errorMessage }, 'Wallet deduction failed');

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: 'Failed to process deduction',
            },
            { status: 500 }
        );
    }
}
