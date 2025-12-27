/**
 * Get Subscription Status Endpoint
 * Returns the user's subscription status including points balance and tier access
 *
 * GET /api/subscription/trial-status
 *
 * Note: This endpoint is named "trial-status" for backward compatibility,
 * but now returns points-based subscription status instead of message limits.
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import {
  getAllowedTiersForPlan,
  getPlanByCode,
  PLAN_MODEL_ACCESS,
  VN_PLANS,
} from '@/config/pricing';
import { getServerDB } from '@/database/server';
import { pino } from '@/libs/logger';
import { SubscriptionService } from '@/server/services/subscription';

/**
 * Updated response using points-based system
 * Legacy fields are kept for backward compatibility but deprecated
 */
export interface TrialStatusResponse {
  /** @deprecated Use allowedTiers instead */
  allowedModels: string[];
  /** Tiers user can access (1, 2, or 3) */
  allowedTiers: number[];
  /** Whether user can use AI features */
  canUseAI: boolean;
  /** @deprecated Free tier now uses points, not trial */
  isTrialUser: boolean;
  /** @deprecated Use pointsRemaining instead - now returns -1 (unlimited within points) */
  maxMessages: number;
  /** Maximum points per month for this plan */
  maxPoints: number;
  /** @deprecated Use pointsRemaining instead - now returns -1 (unlimited within points) */
  maxTokens: number;
  /** @deprecated Use pointsRemaining instead */
  messagesRemaining: number;
  /** @deprecated Use pointsUsed instead */
  messagesUsed: number;
  /** User's current plan code (e.g., 'vn_free', 'vn_basic', 'vn_pro') */
  planCode: string;
  /** Plan display name */
  planDisplayName: string;
  /** @deprecated Pricing now in src/config/pricing.ts */
  planPricing: Record<string, number>;
  /** Points remaining this month */
  pointsRemaining: number;
  /** Points used this month */
  pointsUsed: number;
  /** @deprecated Use pointsRemaining instead */
  tokensRemaining: number;
  /** @deprecated Use pointsUsed instead */
  tokensUsed: number;
  /** @deprecated Free tier doesn't expire, uses points */
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

    // Get subscription plan
    const plan = await subscriptionService.getSubscriptionPlan(userId);
    const planCode = plan.planId || 'vn_free';

    // Get plan config from centralized pricing
    const planConfig = getPlanByCode(planCode);
    const planAccess = PLAN_MODEL_ACCESS[planCode] || PLAN_MODEL_ACCESS.vn_free;
    const allowedTiers = getAllowedTiersForPlan(planCode);

    // Get points usage (if available)
    // TODO: Integrate with actual points tracking system
    const maxPoints = planConfig?.monthlyPoints || VN_PLANS.vn_free.monthlyPoints;
    const pointsUsed = 0; // TODO: Get from usage tracking
    const pointsRemaining = maxPoints - pointsUsed;

    // Determine if user can use AI
    const canUseAI = pointsRemaining > 0;

    const response: TrialStatusResponse = {
      
      // Legacy fields for backward compatibility (deprecated)
allowedModels: [...planAccess.models],
      
// New points-based fields
allowedTiers,
      
canUseAI,
      
isTrialUser: planCode === 'vn_free' || planCode === 'gl_starter',
      
maxMessages: -1,
      
maxPoints,
      
// Unlimited within points budget
maxTokens: -1,

      
      
// Unlimited within points budget
messagesRemaining: -1,
      

messagesUsed: 0,
      

planCode, 
      
planDisplayName: planConfig?.displayName || 'Phở Không Người Lái', 
      planPricing: {
        premium: VN_PLANS.vn_pro.price,
        starter: VN_PLANS.vn_basic.price,
        ultimate: VN_PLANS.vn_team.price,
      },
      pointsRemaining,
      pointsUsed,
      tokensRemaining: -1,
      tokensUsed: 0,
      trialExpired: false, // Points-based system doesn't expire
    };

    pino.info(
      {
        allowedTiers,
        canUseAI: response.canUseAI,
        planCode,
        pointsRemaining,
        userId,
      },
      'Subscription status retrieved',
    );

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to retrieve subscription status',
    );

    return NextResponse.json(
      { error: 'Failed to retrieve subscription status' },
      { status: 500 },
    );
  }
}

