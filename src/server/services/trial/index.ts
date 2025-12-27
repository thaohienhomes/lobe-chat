import { LobeChatDatabase } from '@lobechat/database';
import { usageLogs } from '@lobechat/database/schemas';
import { eq, sql } from 'drizzle-orm';

import { getAllowedTiersForPlan, VN_PLANS } from '@/config/pricing';
import { pino } from '@/libs/logger';

import { SubscriptionService } from '../subscription';
import {
  DEFAULT_FREE_MODEL,
  FREE_TIER_MODELS,
  getTrialFallbackModel,
  isModelAllowedForTrial,
  TrialStatus,
} from './config';

export class TrialService {
  private db: LobeChatDatabase;
  private subscriptionService: SubscriptionService;

  constructor(db: LobeChatDatabase) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
  }

  /**
   * Get subscription status for a user (points-based system)
   *
   * Note: This replaces the old "trial" concept with a points-based system
   * where free tier has limited points, not message counts.
   */
  async getTrialStatus(userId: string): Promise<TrialStatus> {
    const subscription = await this.subscriptionService.getActiveSubscription(userId);
    const planCode = subscription?.planId || 'vn_free';
    const allowedTiers = getAllowedTiersForPlan(planCode);

    // Check if free plan
    const isFreePlan = planCode === 'vn_free' || planCode === 'gl_starter' || planCode === 'free';

    // Get usage stats
    const usage = await this.getTrialUsage(userId);

    // Get max points for plan
    const maxPoints = VN_PLANS[planCode]?.monthlyPoints || VN_PLANS.vn_free.monthlyPoints;
    const pointsUsed = usage.totalTokens; // Simplified: 1 token = 1 point
    const pointsRemaining = Math.max(0, maxPoints - pointsUsed);

    return {
      allowedTiers,
      canUseAI: pointsRemaining > 0,
      isOnTrial: isFreePlan,
      planId: planCode,
      pointsRemaining,
      pointsUsed,
    };
  }

  /**
   * Check if a user can send a message based on points
   */
  async canSendMessage(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getTrialStatus(userId);

    if (!status.isOnTrial) {
      // Paid users always allowed (within tier restrictions)
      return { allowed: true };
    }

    if (status.pointsRemaining <= 0) {
      return {
        allowed: false,
        reason: 'Bạn đã sử dụng hết Phở Points miễn phí. Nâng cấp để tiếp tục chat.',
      };
    }

    return { allowed: true };
  }

  /**
   * Get usage statistics for trial period
   */
  private async getTrialUsage(userId: string): Promise<{
    messageCount: number;
    totalTokens: number;
  }> {
    try {
      const result = await this.db
        .select({
          messageCount: sql<number>`COUNT(*)::int`,
          totalTokens: sql<number>`COALESCE(SUM(${usageLogs.totalTokens}), 0)::int`,
        })
        .from(usageLogs)
        .where(eq(usageLogs.userId, userId));

      return {
        messageCount: result[0]?.messageCount || 0,
        totalTokens: result[0]?.totalTokens || 0,
      };
    } catch (error) {
      pino.error({ error, userId }, 'Failed to get trial usage');
      return { messageCount: 0, totalTokens: 0 };
    }
  }

  /**
   * Validate and potentially adjust the model for trial users
   */
  validateModelForTrial(
    model: string,
    isTrialUser: boolean
  ): { allowed: boolean; model: string; reason?: string } {
    if (!isTrialUser) {
      return { allowed: true, model };
    }

    if (isModelAllowedForTrial(model)) {
      return { allowed: true, model };
    }

    // Return fallback model for trial users
    return {
      allowed: false,
      model: getTrialFallbackModel(),
      reason: `Model ${model} không khả dụng cho bản dùng thử. Đang sử dụng ${DEFAULT_FREE_MODEL}.`,
    };
  }

  /**
   * Get list of allowed models for trial users
   */
  getAllowedTrialModels(): readonly string[] {
    return FREE_TIER_MODELS;
  }
}

export type { TrialStatus } from './config';
export { DEFAULT_FREE_MODEL, FREE_TIER_MODELS, PLAN_PRICING, TRIAL_CONFIG } from './config';

