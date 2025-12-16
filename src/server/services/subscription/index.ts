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
   * Get user's active subscription (prioritizes paid plans over free plan)
   */
  getActiveSubscription = async (userId: string) => {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));

    if (result.length === 0) return null;

    // Prioritize paid plans over free plan
    // Sort by: paid plans first, then by most recent period start
    const sortedResults = result.sort((a, b) => {
      // Free plan has lowest priority
      if (a.planId === 'free' && b.planId !== 'free') return 1;
      if (a.planId !== 'free' && b.planId === 'free') return -1;

      // For same priority, prefer more recent subscription
      const aStart = a.currentPeriodStart ? new Date(a.currentPeriodStart).getTime() : 0;
      const bStart = b.currentPeriodStart ? new Date(b.currentPeriodStart).getTime() : 0;
      return bStart - aStart;
    });

    return sortedResults[0];
  };

  /**
   * Check if a plan is a paid plan (not free)
   * Includes both standard plans (starter, premium, ultimate) and VN plans (vn_basic, vn_pro, vn_team)
   */
  private isPaidPlan = (planId: string): boolean => {
    const freePlans = ['free', 'trial'];
    return !freePlans.includes(planId.toLowerCase());
  };

  /**
   * Check if user has an active paid subscription
   */
  hasPaidSubscription = async (userId: string): Promise<boolean> => {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) return false;

    // Check if subscription is paid (not free)
    return this.isPaidPlan(subscription.planId);
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

    // Paid plans always have access (includes VN plans like vn_basic, vn_pro, vn_team)
    if (this.isPaidPlan(subscription.planId)) {
      pino.info({ planId: subscription.planId, userId }, 'User has paid subscription - allowing AI access');
      return true;
    }

    // Free users can access during trial
    const trialAccess = await this.checkTrialAccess(userId);
    return trialAccess.allowed;
  };

  /**
   * Check trial access for free users with detailed information
   * Paid plans (including VN plans) bypass trial limits entirely
   */
  checkTrialAccess = async (userId: string, requestedModel?: string): Promise<TrialAccessResult> => {
    const subscription = await this.getActiveSubscription(userId);

    // Paid users have full access (includes VN plans: vn_basic, vn_pro, vn_team)
    if (subscription && this.isPaidPlan(subscription.planId)) {
      pino.info({ planId: subscription.planId, userId }, 'Paid subscription - bypassing trial limits');
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
      canAccessAI: this.isPaidPlan(subscription.planId),
      currentPeriodEnd: subscription.currentPeriodEnd,
      planId: subscription.planId,
      status: subscription.status,
    };
  };
}
