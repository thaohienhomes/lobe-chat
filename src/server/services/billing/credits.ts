/**
 * Phở Points Credit Service
 * Updated for PRICING_MASTERPLAN.md.md
 */
import { eq, sql } from 'drizzle-orm';

import { users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

export async function addPhoCredits(userId: string, amount: number) {
  try {
    const db = await getServerDB();
    await db
      .update(users)
      .set({
        lifetimeSpent: sql`${users.lifetimeSpent} + ${amount}`,
        phoPointsBalance: sql`${users.phoPointsBalance} + ${amount}`,
      })
      .where(eq(users.id, userId));

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Credits] Added Phở Points:', { amount, userId });
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to add Phở Points:', {
      amount,
      error: errorMessage,
      userId,
    });
    throw new Error(`Failed to add Phở Points: ${errorMessage}`);
  }
}

export async function getUserCreditBalance(userId: string) {
  try {
    const db = await getServerDB();
    const result = await db
      .select({
        balance: users.phoPointsBalance,
        currentPlanId: users.currentPlanId,
        dailyTier1Usage: users.dailyTier1Usage,
        dailyTier2Usage: users.dailyTier2Usage,
        dailyTier3Usage: users.dailyTier3Usage,
        lastUsageDate: users.lastUsageDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) return null;
    return result[0];
  } catch (e) {
    console.error('❌ Failed to get user credit balance:', e);
    return null;
  }
}

export async function deductPhoCredits(userId: string, amount: number) {
  try {
    const db = await getServerDB();
    await db
      .update(users)
      .set({
        lastUsageDate: new Date(),
        phoPointsBalance: sql`${users.phoPointsBalance} - ${amount}`,
      })
      .where(eq(users.id, userId));

    if (process.env.NODE_ENV !== 'production') {
      console.log('[Credits] Deducted Phở Points:', { amount, userId });
    }
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.error('❌ Failed to deduct Pho credits:', {
      amount,
      error: errorMessage,
      userId,
    });
    // Don't throw here to avoid interrupting the response if possible
  }
}

export async function processModelUsage(userId: string, cost: number, tier: number = 1) {
  try {
    const db = await getServerDB();
    const now = new Date();

    // 1. Get current user stats including all tier usage
    const userRows = await db
      .select({
        dailyTier1Usage: users.dailyTier1Usage,
        dailyTier2Usage: users.dailyTier2Usage,
        dailyTier3Usage: users.dailyTier3Usage,
        lastUsageDate: users.lastUsageDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRows.length === 0) return;
    const user = userRows[0];

    // 2. Check for daily reset (reset at midnight)
    const lastDate = new Date(user.lastUsageDate || 0);
    const isSameDay =
      lastDate.getDate() === now.getDate() &&
      lastDate.getMonth() === now.getMonth() &&
      lastDate.getFullYear() === now.getFullYear();

    // If not same day, reset all tier usage to 0
    let newTier1Usage = isSameDay ? user.dailyTier1Usage || 0 : 0;
    let newTier2Usage = isSameDay ? user.dailyTier2Usage || 0 : 0;
    let newTier3Usage = isSameDay ? user.dailyTier3Usage || 0 : 0;

    // 3. Free Tier Logic (Tier 1 only)
    // Free Tier Limit: 5 requests/day for Tier 1 models
    const FREE_TIER_LIMIT = 5;

    let finalCost = cost;
    let isFree = false;

    // Increment appropriate tier usage
    switch (tier) {
      case 1: {
        if (newTier1Usage < FREE_TIER_LIMIT) {
          finalCost = 0; // Free!
          isFree = true;
        }
        newTier1Usage += 1;

        break;
      }
      case 2: {
        newTier2Usage += 1;

        break;
      }
      case 3: {
        newTier3Usage += 1;

        break;
      }
      // No default
    }

    // 4. Update DB with all tier usage
    await db
      .update(users)
      .set({
        dailyTier1Usage: newTier1Usage,
        dailyTier2Usage: newTier2Usage,
        dailyTier3Usage: newTier3Usage,
        lastUsageDate: now,
        lifetimeSpent: sql`${users.lifetimeSpent} + ${finalCost}`,
        phoPointsBalance: sql`${users.phoPointsBalance} - ${finalCost}`,
      })
      .where(eq(users.id, userId));

    if (process.env.NODE_ENV !== 'production') {
      if (isFree) {
        console.log(
          `[Credits] Free Tier used (${newTier1Usage}/${FREE_TIER_LIMIT}). Cost waived for user ${userId}.`,
        );
      } else if (finalCost > 0) {
        console.log(
          `[Credits] Deducted ${finalCost} Credits (Tier ${tier}). T1=${newTier1Usage}, T2=${newTier2Usage}, T3=${newTier3Usage}. User: ${userId}`,
        );
      }
    }
  } catch (e) {
    console.error('❌ Failed to process model usage:', e);
  }
}

/**
 * Check if user can access a specific model tier based on their plan and daily limits
 * Returns: { allowed: boolean, reason?: string, remaining?: number }
 */
export interface TierAccessResult {
  allowed: boolean;
  dailyLimit?: number;
  reason?: string;
  remaining?: number;
}

export async function checkTierAccess(
  userId: string,
  tier: number,
  planId: string,
): Promise<TierAccessResult> {
  // Import tier access functions from pricing config
  const { canUseTier, getDailyTierLimit } = await import('@/config/pricing');

  // 1. Check if plan allows this tier at all
  if (!canUseTier(planId, tier)) {
    return {
      allowed: false,
      reason: `Gói ${planId} không hỗ trợ Tier ${tier} models. Vui lòng nâng cấp để sử dụng.`,
    };
  }

  // 2. Get daily limit for this tier
  const dailyLimit = getDailyTierLimit(planId, tier);

  // -1 means unlimited
  if (dailyLimit === -1) {
    return { allowed: true, dailyLimit: -1 };
  }

  // 0 means not allowed (already handled by canUseTier, but double-check)
  if (dailyLimit === 0) {
    return {
      allowed: false,
      dailyLimit: 0,
      reason: `Tier ${tier} models không khả dụng cho gói ${planId}.`,
    };
  }

  // 3. Get current usage
  const db = await getServerDB();
  const now = new Date();

  const userRows = await db
    .select({
      dailyTier2Usage: users.dailyTier2Usage,
      dailyTier3Usage: users.dailyTier3Usage,
      lastUsageDate: users.lastUsageDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRows.length === 0) {
    return { allowed: true, dailyLimit, remaining: dailyLimit };
  }

  const user = userRows[0];
  const lastDate = new Date(user.lastUsageDate || 0);
  const isSameDay =
    lastDate.getDate() === now.getDate() &&
    lastDate.getMonth() === now.getMonth() &&
    lastDate.getFullYear() === now.getFullYear();

  // Get current usage for the requested tier
  let currentUsage = 0;
  if (isSameDay) {
    if (tier === 2) currentUsage = user.dailyTier2Usage || 0;
    else if (tier === 3) currentUsage = user.dailyTier3Usage || 0;
  }
  // If not same day, usage has reset to 0

  const remaining = dailyLimit - currentUsage;

  if (remaining <= 0) {
    return {
      allowed: false,
      dailyLimit,
      reason: `Đã hết giới hạn Tier ${tier} hôm nay (${dailyLimit}/${dailyLimit}). Thử lại vào ngày mai hoặc nâng cấp gói.`,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    dailyLimit,
    remaining,
  };
}
