/**
 * Subscription Allowed Models Endpoint
 * Returns models that user can access based on their subscription plan
 * 
 * GET /api/subscription/models/allowed - Get allowed models for current user
 */

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { subscriptionModelAccessService } from '@/services/subscription/modelAccess';
import { pino } from '@/libs/logger';

/**
 * Response for allowed models
 */
interface AllowedModelsResponse {
  data?: {
    allowedModels: string[];
    allowedTiers: number[];
    dailyLimits?: Record<string, number>;
    defaultModel: string;
    defaultProvider: string;
    planCode: string;
  };
  error?: string;
  success: boolean;
}

/**
 * GET /api/subscription/models/allowed
 * Get allowed models for user's current subscription plan
 */
export async function GET(): Promise<NextResponse<AllowedModelsResponse>> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    pino.info(
      {
        userId,
      },
      'Fetching allowed models for user',
    );

    // Get allowed models for user
    const allowedModels = await subscriptionModelAccessService.getAllowedModelsForUser(userId);
    const defaultModel = await subscriptionModelAccessService.getDefaultModelForUser(userId);

    // Get user's current subscription to determine plan
    const { serverDB } = await import('@/database/server');
    const { subscriptions } = await import('@/database/schemas/billing');
    const { eq, and } = await import('drizzle-orm');

    const db = await serverDB;
    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active'),
        ),
      );

    // Prioritize paid plans over free plan
    const freePlans = ['free', 'trial'];
    const sortedSubscriptions = allSubscriptions.sort((a, b) => {
      const aIsFree = freePlans.includes(a.planId?.toLowerCase() || '');
      const bIsFree = freePlans.includes(b.planId?.toLowerCase() || '');
      if (aIsFree && !bIsFree) return 1;
      if (!aIsFree && bIsFree) return -1;
      // For same priority, prefer most recent
      const aStart = a.currentPeriodStart ? new Date(a.currentPeriodStart).getTime() : 0;
      const bStart = b.currentPeriodStart ? new Date(b.currentPeriodStart).getTime() : 0;
      return bStart - aStart;
    });

    const planCode = sortedSubscriptions[0]?.planId || 'vn_free';

    // Get plan details
    const { PLAN_MODEL_ACCESS, getAllowedTiersForPlan } = await import('@/config/pricing');
    const planAccess = PLAN_MODEL_ACCESS[planCode];
    const allowedTiers = getAllowedTiersForPlan(planCode);

    pino.info(
      {
        allowedModels: allowedModels.length,
        allowedTiers,
        defaultModel: defaultModel.model,
        defaultProvider: defaultModel.provider,
        planCode,
        userId,
      },
      'Successfully fetched allowed models for user',
    );

    return NextResponse.json({
      data: {
        allowedModels,
        allowedTiers,
        dailyLimits: planAccess?.dailyLimits,
        defaultModel: defaultModel.model,
        defaultProvider: defaultModel.provider,
        planCode,
      },
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to fetch allowed models for user',
    );

    return NextResponse.json(
      {
        error: 'Failed to fetch allowed models',
        success: false,
      },
      { status: 500 },
    );
  }
}
