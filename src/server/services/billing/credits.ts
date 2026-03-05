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
        phoPointsBalance: sql`GREATEST(0, ${users.phoPointsBalance} - ${amount})`,
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
        phoPointsBalance: sql`GREATEST(0, ${users.phoPointsBalance} - ${finalCost})`,
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

    // Sync to Upstash Redis for admin Rate Limit Inspector (fire-and-forget)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const today = new Date().toISOString().slice(0, 10);
      const redisKey = `pho:ratelimit:${userId}:tier${tier}:${today}`;
      fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${redisKey}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
        method: 'POST',
      })
        .then(() => {
          // Set TTL to 48 hours if key is new
          fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${redisKey}/172800`, {
            headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
            method: 'POST',
          }).catch(() => {
            /* silent */
          });
        })
        .catch(() => {
          /* silent */
        });
    }
  } catch (e) {
    console.error('❌ Failed to process model usage:', e);
  }
}

/**
 * Check if user can access Scientific Skills based on their plan
 */
export async function checkScientificSkillsAccess(
  userId: string,
  planId: string,
): Promise<TierAccessResult> {
  const { getScientificSkillsLimit } = await import('@/config/pricing');
  const dailyLimit = getScientificSkillsLimit(planId);

  if (dailyLimit === 0) {
    return {
      allowed: false,
      reason: '🔬 Scientific Skills yêu cầu gói Phở Tái trở lên. Nâng cấp để sử dụng.',
    };
  }
  if (dailyLimit === -1) {
    return { allowed: true, dailyLimit: -1 };
  }

  // Check daily usage via Upstash Redis (preferred) or in-memory fallback
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const today = new Date().toISOString().slice(0, 10);
    const redisKey = `pho:scientific:${userId}:${today}`;
    try {
      const resp = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/${redisKey}`, {
        headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      });
      const data = (await resp.json()) as { result: string | null };
      const currentUsage = data.result ? Number(data.result) : 0;
      const remaining = dailyLimit - currentUsage;

      if (remaining <= 0) {
        return {
          allowed: false,
          dailyLimit,
          reason: `🔬 Bạn đã dùng hết ${dailyLimit} lượt Scientific Skills hôm nay. Nâng cấp để có thêm.`,
          remaining: 0,
        };
      }
      return { allowed: true, dailyLimit, remaining };
    } catch {
      // Fall through to allow on Redis error
      return { allowed: true, dailyLimit };
    }
  }

  // No Redis = allow (fail open)
  return { allowed: true, dailyLimit };
}

/**
 * Increment Scientific Skills usage counter in Redis
 */
export async function incrementScientificSkillsUsage(userId: string): Promise<void> {
  if (!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) return;
  const today = new Date().toISOString().slice(0, 10);
  const redisKey = `pho:scientific:${userId}:${today}`;
  try {
    await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/incr/${redisKey}`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      method: 'POST',
    });
    // Set TTL to 48 hours
    fetch(`${process.env.UPSTASH_REDIS_REST_URL}/expire/${redisKey}/172800`, {
      headers: { Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` },
      method: 'POST',
    }).catch(() => { /* silent */ });
  } catch {
    /* silent */
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
      reason: 'Model này yêu cầu gói cao hơn. Vui lòng nâng cấp để sử dụng.',
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
      reason: 'Model này không khả dụng cho gói hiện tại của bạn.',
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
    // Tier-specific model switch suggestions
    let reason: string;
    if (tier === 3) {
      reason =
        `⚠️ Bạn đã dùng hết ${dailyLimit} lượt Tier 3 hôm nay.\n\n` +
        `💡 Thử các model Tier 2 (không giới hạn hoặc giới hạn cao hơn):\n` +
        `• Claude Sonnet 4.6 — suy luận mạnh, coding xuất sắc\n` +
        `• Gemini 2.5 Pro — 2M context, Google Search\n` +
        `• GPT-5.2 — flagship OpenAI\n\n` +
        `🔄 Hạn mức reset lúc 0:00 mỗi ngày.`;
    } else if (tier === 2) {
      reason =
        `⚠️ Bạn đã dùng hết ${dailyLimit} lượt Tier 2 hôm nay.\n\n` +
        `💡 Thử các model Tier 1 (miễn phí không giới hạn):\n` +
        `• Mercury 2 ⚡ — siêu nhanh 1000+ tok/s\n` +
        `• Gemini 2.0 Flash — đáng tin cậy, multimodal\n` +
        `• Llama 4 Scout — MoE, multi-task mạnh\n` +
        `• Gemma 3 27B — tool calling xuất sắc\n\n` +
        `🔄 Hạn mức reset lúc 0:00 mỗi ngày.`;
    } else {
      reason = `Bạn đã dùng hết hạn mức model hôm nay. Hãy thử lại vào ngày mai.`;
    }

    return {
      allowed: false,
      dailyLimit,
      reason,
      remaining: 0,
    };
  }

  return {
    allowed: true,
    dailyLimit,
    remaining,
  };
}
