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

    console.log('✅ Added Phở Points:', {
      amount,
      userId,
    });
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
        dailyTier1Usage: users.dailyTier1Usage,
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

    console.log('📉 Deducted Phở Points:', {
      amount,
      userId,
    });
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

    // 1. Get current user stats
    // We select for update logic ideally, but simple select for now
    const userRows = await db
      .select({
        dailyTier1Usage: users.dailyTier1Usage,
        lastUsageDate: users.lastUsageDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userRows.length === 0) return;
    const user = userRows[0];

    // 2. Check for daily reset
    const lastDate = new Date(user.lastUsageDate || 0); // Handle null
    const isSameDay =
      lastDate.getDate() === now.getDate() &&
      lastDate.getMonth() === now.getMonth() &&
      lastDate.getFullYear() === now.getFullYear();

    // If not same day, reset usage to 0
    let newDailyUsage = isSameDay ? user.dailyTier1Usage || 0 : 0;

    // 3. Free Tier Logic (Tier 1 only)
    // Free Tier Limit: 5 requests/day for Tier 1 models
    const FREE_TIER_LIMIT = 5;

    let finalCost = cost;
    let isFree = false;

    if (tier === 1) {
      if (newDailyUsage < FREE_TIER_LIMIT) {
        finalCost = 0; // Free!
        isFree = true;
      }
      newDailyUsage += 1; // Increment usage count
    }

    // 4. Update DB
    // We update balance, lifetime spent, usage stats
    await db
      .update(users)
      .set({
        dailyTier1Usage: newDailyUsage,
        lastUsageDate: now,
        lifetimeSpent: sql`${users.lifetimeSpent} + ${finalCost}`,
        phoPointsBalance: sql`${users.phoPointsBalance} - ${finalCost}`,
      })
      .where(eq(users.id, userId));

    if (isFree) {
      console.log(
        `🎉 Free Tier used (${newDailyUsage}/${FREE_TIER_LIMIT}). Cost waived for user ${userId}.`,
      );
    } else if (finalCost > 0) {
      console.log(
        `📉 Deducted ${finalCost} Credits (Tier ${tier}). Balance updated for user ${userId}.`,
      );
    }
  } catch (e) {
    console.error('❌ Failed to process model usage:', e);
  }
}
