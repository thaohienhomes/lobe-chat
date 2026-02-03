/**
 * Wallet Tier Sync Utility
 * 
 * Maps subscription plan IDs to wallet tier codes.
 * Used by payment webhooks to keep wallet tier in sync with subscriptions.
 */
import { eq } from 'drizzle-orm';
import type { LobeChatDatabase } from '@/database/type';
import { phoWallet, type WalletTierCode } from '@/database/schemas/wallet';
import { pino } from '@/libs/logger';

/**
 * Map subscription planId to wallet tierCode
 * 
 * VN Plans:
 * - vn_free, gl_starter → 'free'
 * - vn_basic → 'vn_basic' (69k - NO Studio)
 * - vn_creator → 'vn_creator' (199k - HAS Studio)
 * - vn_pro → 'vn_pro' (499k - HAS Studio)
 * 
 * Global Plans (Polar):
 * - lifetime_* → 'global_standard' (HAS Studio)
 */
export function mapPlanIdToTierCode(planId: string): WalletTierCode {
    // Normalize to lowercase for comparison
    const plan = planId.toLowerCase();

    // Free tiers
    if (plan.includes('free') || plan === 'gl_starter') {
        return 'free';
    }

    // VN Basic (69k) - NO Studio access
    if (plan.includes('basic') || plan === 'vn_69k') {
        return 'vn_basic';
    }

    // VN Creator (199k) - HAS Studio access
    if (plan.includes('creator') || plan === 'vn_199k') {
        return 'vn_creator';
    }

    // VN Pro (499k) - HAS Studio access
    if (plan.includes('pro') || plan === 'vn_499k') {
        return 'vn_pro';
    }

    // Global/Lifetime plans - HAS Studio access
    if (plan.includes('lifetime') || plan.includes('global') || plan.includes('standard')) {
        return 'global_standard';
    }

    // Default to free for unrecognized plans
    pino.warn({ planId }, 'Unrecognized plan ID, defaulting to free tier');
    return 'free';
}

/**
 * Sync wallet tier based on subscription plan change
 * 
 * This function is called by payment webhooks after a subscription is activated/updated.
 * It ensures the wallet tier is always in sync with the user's subscription plan.
 */
export async function syncWalletTier(
    db: LobeChatDatabase,
    userId: string,
    planId: string
): Promise<void> {
    const tierCode = mapPlanIdToTierCode(planId);

    try {
        // Check if wallet exists
        const existingWallet = await db
            .select()
            .from(phoWallet)
            .where(eq(phoWallet.clerkUserId, userId))
            .limit(1);

        if (existingWallet && existingWallet.length > 0) {
            // Update existing wallet tier
            await db
                .update(phoWallet)
                .set({
                    tierCode,
                    updatedAt: new Date(),
                })
                .where(eq(phoWallet.clerkUserId, userId));

            pino.info(
                { userId, planId, oldTier: existingWallet[0].tierCode, newTier: tierCode },
                'Wallet tier updated'
            );
        } else {
            // Create new wallet with appropriate tier
            await db.insert(phoWallet).values({
                clerkUserId: userId,
                balance: 0,
                tierCode,
            }).onConflictDoNothing();

            pino.info(
                { userId, planId, tierCode },
                'Wallet created with tier from subscription'
            );
        }
    } catch (error) {
        pino.error(
            { error, userId, planId, tierCode },
            'Failed to sync wallet tier'
        );
        // Don't throw - subscription activation should not fail due to wallet sync
    }
}
