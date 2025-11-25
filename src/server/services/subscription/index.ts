import { LobeChatDatabase } from '@lobechat/database';
import { subscriptions } from '@lobechat/database/schemas';
import { and, eq } from 'drizzle-orm';

import { pino } from '@/libs/logger';

export interface CreateSubscriptionParams {
  billingCycle?: 'monthly' | 'yearly';
  paymentProvider?: 'sepay' | 'polar' | 'free';
  planId: 'free' | 'starter' | 'premium' | 'ultimate';
  userId: string;
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
   * Free users should NOT be able to access AI models
   */
  canAccessAIModels = async (userId: string): Promise<boolean> => {
    const subscription = await this.getActiveSubscription(userId);

    if (!subscription) {
      pino.warn({ userId }, 'User has no subscription - denying AI model access');
      return false;
    }

    // Only paid plans can access AI models
    const canAccess = subscription.planId !== 'free';

    if (!canAccess) {
      pino.warn(
        { planId: subscription.planId, userId },
        'Free plan user attempting to access AI models',
      );
    }

    return canAccess;
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
