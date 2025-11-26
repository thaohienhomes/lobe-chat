import { LobeChatDatabase } from '@lobechat/database';
import { usageLogs } from '@lobechat/database/schemas';
import { and, eq, gte, sql } from 'drizzle-orm';

import { pino } from '@/libs/logger';

import { SubscriptionService } from '../subscription';
import { 
  TRIAL_CONFIG, 
  TrialStatus, 
  isModelAllowedForTrial, 
  getTrialFallbackModel,
  FREE_TIER_MODELS,
  DEFAULT_FREE_MODEL,
} from './config';

export class TrialService {
  private db: LobeChatDatabase;
  private subscriptionService: SubscriptionService;
  
  constructor(db: LobeChatDatabase) {
    this.db = db;
    this.subscriptionService = new SubscriptionService(db);
  }
  
  /**
   * Get trial status for a free user
   */
  async getTrialStatus(userId: string): Promise<TrialStatus> {
    const subscription = await this.subscriptionService.getActiveSubscription(userId);
    
    // If user has a paid subscription, they're not on trial
    if (subscription && subscription.planId !== 'free') {
      return {
        canUseAI: true,
        isOnTrial: false,
        messagesRemaining: -1, // unlimited
        messagesUsed: 0,
        planId: subscription.planId as TrialStatus['planId'],
        tokensRemaining: -1, // unlimited
        tokensUsed: 0,
        trialExpired: false,
      };
    }
    
    // Get usage stats for free users
    const usage = await this.getTrialUsage(userId);
    
    const messagesRemaining = Math.max(0, TRIAL_CONFIG.maxMessages - usage.messageCount);
    const tokensRemaining = Math.max(0, TRIAL_CONFIG.maxTokens - usage.totalTokens);
    const trialExpired = messagesRemaining <= 0 || tokensRemaining <= 0;
    
    return {
      canUseAI: !trialExpired,
      isOnTrial: true,
      messagesRemaining,
      messagesUsed: usage.messageCount,
      planId: 'free',
      tokensRemaining,
      tokensUsed: usage.totalTokens,
      trialExpired,
    };
  }
  
  /**
   * Check if a free user can send a message
   */
  async canSendMessage(userId: string): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getTrialStatus(userId);
    
    if (!status.isOnTrial) {
      return { allowed: true };
    }
    
    if (status.trialExpired) {
      return {
        allowed: false,
        reason: status.messagesRemaining <= 0
          ? 'Bạn đã sử dụng hết số tin nhắn miễn phí. Nâng cấp để tiếp tục chat.'
          : 'Bạn đã sử dụng hết quota miễn phí. Nâng cấp để tiếp tục chat.',
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

export { TRIAL_CONFIG, FREE_TIER_MODELS, DEFAULT_FREE_MODEL, PLAN_PRICING } from './config';
export type { TrialStatus } from './config';

