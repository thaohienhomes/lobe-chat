/**
 * Get Trial Status Endpoint
 * Returns the user's trial status including remaining messages/tokens
 * 
 * GET /api/subscription/trial-status
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';
import { SubscriptionService } from '@/server/services/subscription';
import { TRIAL_CONFIG, PLAN_PRICING, FREE_TIER_MODELS } from '@/server/services/trial/config';

export interface TrialStatusResponse {
  allowedModels: readonly string[];
  canUseAI: boolean;
  isTrialUser: boolean;
  maxMessages: number;
  maxTokens: number;
  messagesRemaining: number;
  messagesUsed: number;
  planId: string;
  planPricing: typeof PLAN_PRICING;
  tokensRemaining: number;
  tokensUsed: number;
  trialExpired: boolean;
}

export async function GET(): Promise<NextResponse<TrialStatusResponse | { error: string }>> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get database instance
    const db = await getServerDB();
    const subscriptionService = new SubscriptionService(db);

    // Get trial access status
    const trialAccess = await subscriptionService.checkTrialAccess(userId);
    const plan = await subscriptionService.getSubscriptionPlan(userId);

    // Calculate usage
    const messagesUsed = TRIAL_CONFIG.maxMessages - (trialAccess.messagesRemaining ?? TRIAL_CONFIG.maxMessages);
    const tokensUsed = TRIAL_CONFIG.maxTokens - (trialAccess.tokensRemaining ?? TRIAL_CONFIG.maxTokens);

    const response: TrialStatusResponse = {
      allowedModels: FREE_TIER_MODELS,
      canUseAI: trialAccess.allowed,
      isTrialUser: trialAccess.isTrialUser,
      maxMessages: TRIAL_CONFIG.maxMessages,
      maxTokens: TRIAL_CONFIG.maxTokens,
      messagesRemaining: trialAccess.messagesRemaining ?? 0,
      messagesUsed: Math.max(0, messagesUsed),
      planId: plan.planId,
      planPricing: PLAN_PRICING,
      tokensRemaining: trialAccess.tokensRemaining ?? 0,
      tokensUsed: Math.max(0, tokensUsed),
      trialExpired: !trialAccess.allowed && trialAccess.isTrialUser,
    };

    pino.info(
      {
        isTrialUser: response.isTrialUser,
        messagesRemaining: response.messagesRemaining,
        planId: response.planId,
        userId,
      },
      'Trial status retrieved',
    );

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to retrieve trial status',
    );

    return NextResponse.json(
      { error: 'Failed to retrieve trial status' },
      { status: 500 },
    );
  }
}

