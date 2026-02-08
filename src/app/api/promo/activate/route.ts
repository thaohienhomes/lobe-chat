import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';

/**
 * Promo Code Activation API
 *
 * Validates a promo code and activates the corresponding plan
 * by updating the user's Clerk publicMetadata.
 *
 * Currently supports:
 * - medical_beta: Phở Chat Medical Beta (999k VNĐ/year)
 */

// Valid promo codes — in production, move to DB or env var
// Format: PHO-MED-2026-XXXX
const VALID_PROMO_CODES: Record<
    string,
    {
        description: string;
        expiresAt?: string; // ISO date
        maxUses?: number;
        planId: string;
    }
> = {
    // Batch 1 codes for Medical Beta launch (Feb 2026)
    'PHO-MED-2026-BETA': {
        description: 'Medical Beta - Founding batch',
        maxUses: 200,
        planId: 'medical_beta',
    },
    'PHO-MED-2026-VIP1': {
        description: 'Medical Beta - VIP batch 1',
        maxUses: 50,
        planId: 'medical_beta',
    },
};

// Track code usage in memory (in production, use DB)
const codeUsageCount: Record<string, number> = {};

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { code } = body as { code: string };

        if (!code || typeof code !== 'string') {
            return NextResponse.json(
                { error: 'Promo code is required' },
                { status: 400 },
            );
        }

        const normalizedCode = code.trim().toUpperCase();
        const promoConfig = VALID_PROMO_CODES[normalizedCode];

        if (!promoConfig) {
            return NextResponse.json(
                { error: 'Mã khuyến mãi không hợp lệ. Vui lòng kiểm tra lại.' },
                { status: 404 },
            );
        }

        // Check expiry
        if (promoConfig.expiresAt && new Date(promoConfig.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: 'Mã khuyến mãi đã hết hạn.' },
                { status: 410 },
            );
        }

        // Check max uses
        if (promoConfig.maxUses) {
            const currentUses = codeUsageCount[normalizedCode] || 0;
            if (currentUses >= promoConfig.maxUses) {
                return NextResponse.json(
                    { error: 'Mã khuyến mãi đã được sử dụng hết.' },
                    { status: 410 },
                );
            }
        }

        // Check if user already has this plan activated
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        const currentPlanId = (user.publicMetadata as Record<string, unknown>)?.planId;

        if (currentPlanId === promoConfig.planId) {
            return NextResponse.json(
                {
                    error: 'Bạn đã kích hoạt gói này rồi!',
                    planId: promoConfig.planId,
                },
                { status: 409 },
            );
        }

        // Activate the plan by updating Clerk metadata
        await client.users.updateUserMetadata(userId, {
            publicMetadata: {
                ...(user.publicMetadata || {}),
                // Keep track of previous plan for potential rollback
                previousPlanId: currentPlanId || 'vn_free',
                // Set the new plan
                planId: promoConfig.planId,
                // Activation tracking
                promoCode: normalizedCode,
                promoActivatedAt: new Date().toISOString(),
                // Medical beta specific flag
                ...(promoConfig.planId === 'medical_beta' ? { medical_beta: true } : {}),
            },
        });

        // Increment usage count
        codeUsageCount[normalizedCode] = (codeUsageCount[normalizedCode] || 0) + 1;

        return NextResponse.json({
            activatedAt: new Date().toISOString(),
            message: '🏥 Chúc mừng! Gói Phở Medical Beta đã được kích hoạt thành công!',
            planId: promoConfig.planId,
            success: true,
        });
    } catch (error) {
        console.error('Promo code activation error:', error);
        return NextResponse.json(
            { error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' },
            { status: 500 },
        );
    }
}

// GET endpoint to check code validity without activating
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json(
            { error: 'Code parameter is required', usage: '/api/promo/activate?code=PHO-MED-2026-BETA' },
            { status: 400 },
        );
    }

    const normalizedCode = code.trim().toUpperCase();
    const promoConfig = VALID_PROMO_CODES[normalizedCode];

    if (!promoConfig) {
        return NextResponse.json({ valid: false });
    }

    const isExpired = promoConfig.expiresAt
        ? new Date(promoConfig.expiresAt) < new Date()
        : false;

    const currentUses = codeUsageCount[normalizedCode] || 0;
    const isMaxedOut = promoConfig.maxUses
        ? currentUses >= promoConfig.maxUses
        : false;

    return NextResponse.json({
        description: promoConfig.description,
        planId: promoConfig.planId,
        valid: !isExpired && !isMaxedOut,
    });
}
