/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * @deprecated This service is NOT used in the runtime pipeline.
 * Credit deduction is handled by `@/server/services/billing/credits.ts`
 * which is called from `webapi/chat/[provider]/route.ts`.
 *
 * This file is kept for reference but should be removed in a future cleanup.
 *
 * Phở Points Service (LEGACY)
 * Based on PRICING_MASTERPLAN.md.md
 *
 * Handles:
 * - Balance checking before LLM requests
 * - Points deduction after successful requests
 * - Tier-based access control
 * - Daily usage limits
 * - Fallback to Tier 1 when points depleted
 *
 * Note: Some parameters are reserved for future token-based cost calculation
 */
import { eq, sql } from 'drizzle-orm';

import { getModelPointsCost, getModelTier } from '@/config/pricing';
import { VND_PRICING_TIERS } from '@/server/modules/CostOptimization';

export interface PhoPointsCheckResult {
  allowed: boolean;
  currentBalance: number;
  dailyTier2Remaining?: number;
  dailyTier3Remaining?: number;
  estimatedCost: number;
  fallbackModel?: string;
  reason?: string;
  tier: number;
}

export interface PhoPointsDeductionResult {
  newBalance: number;
  pointsDeducted: number;
  success: boolean;
}

/**
 * Check if user can use a specific model
 * Implements Task A from PRICING_MASTERPLAN.md.md
 * @param _estimatedTokens - Reserved for future token-based cost calculation
 */
export async function checkPhoPointsBalance(
  db: any,
  userId: string,
  modelName: string,
  _estimatedTokens: number = 1000,
): Promise<PhoPointsCheckResult> {
  const tier = getModelTier(modelName);
  const pointsCost = getModelPointsCost(modelName);

  const user = await db.query.users.findFirst({
    columns: {
      currentPlanId: true,
      dailyTier2Usage: true,
      dailyTier3Usage: true,
      phoPointsBalance: true,
    },
    where: (users: any, { eq }: any) => eq(users.id, userId),
  });

  if (!user) {
    return {
      allowed: false,
      currentBalance: 0,
      estimatedCost: pointsCost,
      reason: 'User not found',
      tier,
    };
  }

  const balance = user.phoPointsBalance || 50_000;
  const planId = user.currentPlanId || 'vn_free';
  const planConfig = VND_PRICING_TIERS[planId as keyof typeof VND_PRICING_TIERS];

  // Tier 1 models are always allowed (soft limit)
  if (tier === 1) {
    return { allowed: true, currentBalance: balance, estimatedCost: pointsCost, tier };
  }

  const dailyTier2Limit = planConfig?.dailyTier2Limit ?? 0;
  const dailyTier3Limit = planConfig?.dailyTier3Limit ?? 0;
  const dailyTier2Usage = user.dailyTier2Usage || 0;
  const dailyTier3Usage = user.dailyTier3Usage || 0;

  // Check Tier 2 access
  if (tier === 2) {
    if (dailyTier2Limit === 0) {
      return {
        allowed: false,
        currentBalance: balance,
        estimatedCost: pointsCost,
        fallbackModel: 'gemini-2.0-flash',
        reason: 'Tier 2 not available. Upgrade to Phở Tái.',
        tier,
      };
    }
    if (dailyTier2Limit !== -1 && dailyTier2Usage >= dailyTier2Limit) {
      return {
        allowed: false,
        currentBalance: balance,
        dailyTier2Remaining: 0,
        estimatedCost: pointsCost,
        fallbackModel: 'gpt-4o-mini',
        reason: `Daily Tier 2 limit reached (${dailyTier2Limit}/day).`,
        tier,
      };
    }
  }

  // Check Tier 3 access
  if (tier === 3) {
    if (dailyTier3Limit === 0) {
      return {
        allowed: false,
        currentBalance: balance,
        estimatedCost: pointsCost,
        fallbackModel: 'gemini-2.5-flash',
        reason: 'Tier 3 not available. Upgrade to Phở Đặc Biệt.',
        tier,
      };
    }
    if (dailyTier3Limit !== -1 && dailyTier3Usage >= dailyTier3Limit) {
      return {
        allowed: false,
        currentBalance: balance,
        dailyTier3Remaining: 0,
        estimatedCost: pointsCost,
        fallbackModel: 'gpt-4o',
        reason: `Daily Tier 3 limit reached (${dailyTier3Limit}/day).`,
        tier,
      };
    }
  }

  // Check points balance
  if (balance < pointsCost) {
    const fallback = tier === 3 ? 'gemini-2.5-flash' : 'gemini-2.0-flash';
    return {
      allowed: false,
      currentBalance: balance,
      estimatedCost: pointsCost,
      fallbackModel: fallback,
      reason: 'Insufficient Phở Points.',
      tier,
    };
  }

  return {
    allowed: true,
    currentBalance: balance,
    dailyTier2Remaining: dailyTier2Limit === -1 ? -1 : dailyTier2Limit - dailyTier2Usage,
    dailyTier3Remaining: dailyTier3Limit === -1 ? -1 : dailyTier3Limit - dailyTier3Usage,
    estimatedCost: pointsCost,
    tier,
  };
}

/**
 * Deduct Phở Points after successful LLM request
 * @param _actualTokens - Reserved for future token-based cost calculation
 */
export async function deductPhoPoints(
  db: any,
  userId: string,
  modelName: string,
  _actualTokens: number,
): Promise<PhoPointsDeductionResult> {
  const tier = getModelTier(modelName);
  const pointsCost = getModelPointsCost(modelName);

  try {
    const updateData: any = {
      phoPointsBalance: sql`GREATEST(0, pho_points_balance - ${pointsCost})`,
    };
    if (tier === 2) updateData.dailyTier2Usage = sql`daily_tier2_usage + 1`;
    if (tier === 3) updateData.dailyTier3Usage = sql`daily_tier3_usage + 1`;

    const result = await db
      .update(db.schema.users)
      .set(updateData)
      .where(eq(db.schema.users.id, userId))
      .returning({ phoPointsBalance: db.schema.users.phoPointsBalance });

    return {
      newBalance: result[0]?.phoPointsBalance ?? 0,
      pointsDeducted: pointsCost,
      success: true,
    };
  } catch (error) {
    console.error('[PhoPoints] Deduction failed:', error);
    return { newBalance: 0, pointsDeducted: 0, success: false };
  }
}

/**
 * Get user's current Phở Points status
 */
export async function getPhoPointsStatus(db: any, userId: string) {
  const user = await db.query.users.findFirst({
    columns: {
      currentPlanId: true,
      dailyTier2Usage: true,
      dailyTier3Usage: true,
      phoPointsBalance: true,
      pointsResetDate: true,
      streakCount: true,
    },
    where: (users: any, { eq }: any) => eq(users.id, userId),
  });

  if (!user) return null;

  const planId = user.currentPlanId || 'vn_free';
  const planConfig = VND_PRICING_TIERS[planId as keyof typeof VND_PRICING_TIERS];

  return {
    balance: user.phoPointsBalance || 50_000,
    dailyTier2Limit: planConfig?.dailyTier2Limit ?? 0,
    dailyTier2Usage: user.dailyTier2Usage || 0,
    dailyTier3Limit: planConfig?.dailyTier3Limit ?? 0,
    dailyTier3Usage: user.dailyTier3Usage || 0,
    monthlyPoints: planConfig?.monthlyPoints ?? 50_000,
    nextReset: user.pointsResetDate,
    planId,
    planName: planConfig?.displayName ?? 'Phở Không Người Lái',
    streakCount: user.streakCount || 0,
  };
}
