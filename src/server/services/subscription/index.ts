import { LobeChatDatabase } from '@lobechat/database';
import { subscriptions, usageLogs } from '@lobechat/database/schemas';
import { and, eq, sql } from 'drizzle-orm';

import { pino } from '@/libs/logger';

import { TRIAL_CONFIG, FREE_TIER_MODELS, isModelAllowedForTrial, getTrialFallbackModel } from '../trial/config';

export interface CreateSubscriptionParams {
  billingCycle?: 'monthly' | 'yearly';
  paymentProvider?: 'sepay' | 'polar' | 'free';
  planId: 'free' | 'starter' | 'premium' | 'ultimate';
  userId: string;
}

export interface TrialAccessResult {
  allowed: boolean;
  isTrialUser: boolean;
  messagesRemaining?: number;
  model?: string;
  modelAdjusted?: boolean;
  reason?: string;
  tokensRemaining?: number;
}

export class SubscriptionService {
  private db: LobeChatDatabase;

  constructor(db: LobeChatDatabase) {
    this.db = db;
  }

  /**
   * Create a free subscription for new users
   */
  createFreeSubscription = async (userId: string) => {
    try {
      // Check if user already has a subscription
      const existing = await this.db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

      if (existing.length > 0) {
        pino.info({ userId }, 'User already has a subscription, skipping creation');
        return { message: 'Subscription already exists', success: false };
      }

      // Create free subscription (no expiration)
      const start = new Date();
      const end = new Date(start);
      end.setFullYear(end.getFullYear() + 100); // 100 years = effectively no expiration

      await this.db.insert(subscriptions).values({
        billingCycle: 'monthly',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: end,
        currentPeriodStart: start,
        paymentProvider: 'free',
        planId: 'free',
        status: 'active',
        userId,
      });

      pino.info({ userId }, 'Free subscription created for new user');
      return { message: 'Free subscription created', success: true };
    } catch (error) {
      pino.error({ error, userId }, 'Failed to create free subscription');
      throw error;
    }
  };

  /**
   * Get user's active subscription
   */
  getActiveSubscription = async (userId: string) => {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1);

    return result.length > 0 ? result[0] : null;
  };

  /**
   * Check if user has an active paid subscription
   */
  hasPaidSubscription = async (userId: string): Promise<boolean> => {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) return false;

    // Check if subscription is paid (not free)
    return subscription.planId !== 'free';
  };

  /**
   * Check if user can access AI models
   * Free users can access AI models during their trial period
   */
  canAccessAIModels = async (userId: string): Promise<boolean> => {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      pino.warn({ userId }, 'User has no subscription - denying AI model access');
      return false;
    }

    // Paid plans always have access
    if (subscription.planId !== 'free') {
      return true;
    }

    // Free users can access during trial
    const trialAccess = await this.checkTrialAccess(userId);
    return trialAccess.allowed;
  };

  /**
   * Check trial access for free users with detailed information
   */
  checkTrialAccess = async (userId: string, requestedModel?: string): Promise<TrialAccessResult> => {
    const subscription = await this.getActiveSubscription(userId);

    // Paid users have full access
    if (subscription && subscription.planId !== 'free') {
      return {
        allowed: true,
        isTrialUser: false,
        model: requestedModel,
      };
    }

    // Get trial usage for free users
    const usage = await this.getTrialUsage(userId);
    const messagesRemaining = Math.max(0, TRIAL_CONFIG.maxMessages - usage.messageCount);
    const tokensRemaining = Math.max(0, TRIAL_CONFIG.maxTokens - usage.totalTokens);

    // Check if trial is expired
    if (messagesRemaining <= 0) {
      pino.warn({ messagesUsed: usage.messageCount, userId }, 'Trial message limit reached');
      return {
        allowed: false,
        isTrialUser: true,
        messagesRemaining: 0,
        reason: 'Bạn đã sử dụng hết 10 tin nhắn miễn phí. Nâng cấp để tiếp tục chat với AI.',
        tokensRemaining,
      };
    }

    if (tokensRemaining <= 0) {
      pino.warn({ tokensUsed: usage.totalTokens, userId }, 'Trial token limit reached');
      return {
        allowed: false,
        isTrialUser: true,
        messagesRemaining,
        reason: 'Bạn đã sử dụng hết quota miễn phí. Nâng cấp để tiếp tục chat với AI.',
        tokensRemaining: 0,
      };
    }

    // Validate model for trial users
    let finalModel = requestedModel;
    let modelAdjusted = false;

    if (requestedModel && !isModelAllowedForTrial(requestedModel)) {
      finalModel = getTrialFallbackModel();
      modelAdjusted = true;
      pino.info({ originalModel: requestedModel, userId }, 'Model adjusted for trial user');
    }

    return {
      allowed: true,
      isTrialUser: true,
      messagesRemaining,
      model: finalModel,
      modelAdjusted,
      tokensRemaining,
    };
  };

  /**
   * Get trial usage statistics
   */
  private getTrialUsage = async (userId: string): Promise<{
    messageCount: number;
    totalTokens: number;
  }> => {
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
      pino.error({ error, userId }, 'Failed to get trial usage, allowing access');
      return { messageCount: 0, totalTokens: 0 };
    }
  };

  /**
   * Get allowed models for trial users
   */
  getAllowedTrialModels = (): readonly string[] => {
    return FREE_TIER_MODELS;
  };

  /**
   * Get user's subscription plan details
   */
  getSubscriptionPlan = async (userId: string) => {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      return {
        canAccessAI: false,
        planId: 'free',
        status: 'none',
      };
    }

    return {
      billingCycle: subscription.billingCycle,
      canAccessAI: subscription.planId !== 'free',
      currentPeriodEnd: subscription.currentPeriodEnd,
      planId: subscription.planId,
      status: subscription.status,
    };
  };
}
