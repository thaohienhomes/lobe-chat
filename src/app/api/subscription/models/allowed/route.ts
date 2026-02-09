/**
 * Subscription Allowed Models Endpoint
 * Returns models that user can access based on their subscription plan
 *
 * GET /api/subscription/models/allowed - Get allowed models for current user
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

import { pino } from '@/libs/logger';
import { subscriptionModelAccessService } from '@/services/subscription/modelAccess';

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
    // STAGING BYPASS: Allow all models in preview/development environments for testing
    const isPreviewEnv =
      process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'development' ||
      process.env.NODE_ENV === 'development';

    if (isPreviewEnv) {
      pino.info('Preview/Development bypass: returning all tiers');
      return NextResponse.json({
        data: {
          allowedModels: [],
          allowedTiers: [1, 2, 3], // All tiers enabled for staging
          defaultModel: 'gemini-2.0-flash',
          defaultProvider: 'google',
          planCode: 'staging_bypass',
        },
        success: true,
      });
    }

    // Verify authentication
    const { userId } = await auth();

    // If no user, return default free tier models
    if (!userId) {
      const { PLAN_MODEL_ACCESS, getAllowedTiersForPlan } = await import('@/config/pricing');
      const planCode = 'vn_free';

      return NextResponse.json({
        data: {
          allowedModels: PLAN_MODEL_ACCESS.vn_free.models,
          allowedTiers: getAllowedTiersForPlan(planCode),
          dailyLimits: PLAN_MODEL_ACCESS.vn_free.dailyLimits,
          defaultModel: PLAN_MODEL_ACCESS.vn_free.defaultModel,
          defaultProvider: PLAN_MODEL_ACCESS.vn_free.defaultProvider,
          planCode,
        },
        success: true,
      });
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
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));

    // Prioritize paid plans over free plan
    const freePlans = new Set(['free', 'trial']);
    const sortedSubscriptions = allSubscriptions.sort((a, b) => {
      const aIsFree = freePlans.has(a.planId?.toLowerCase() || '');
      const bIsFree = freePlans.has(b.planId?.toLowerCase() || '');
      if (aIsFree && !bIsFree) return 1;
      if (!aIsFree && bIsFree) return -1;
      // For same priority, prefer most recent
      const aStart = a.currentPeriodStart ? new Date(a.currentPeriodStart).getTime() : 0;
      const bStart = b.currentPeriodStart ? new Date(b.currentPeriodStart).getTime() : 0;
      return bStart - aStart;
    });

    let planCode = sortedSubscriptions[0]?.planId || 'vn_free';

    // Clerk metadata fallback for promo-activated users (same pattern as user.ts)
    const FREE_PLAN_IDS = new Set(['free', 'trial', 'starter', 'vn_free', 'gl_starter']);
    if (FREE_PLAN_IDS.has(planCode.toLowerCase())) {
      try {
        const { clerkClient } = await import('@clerk/nextjs/server');
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);
        const clerkPlanId = (clerkUser.publicMetadata as any)?.planId;
        if (clerkPlanId && !FREE_PLAN_IDS.has(clerkPlanId.toLowerCase())) {
          planCode = clerkPlanId;
        }
      } catch {
        // Clerk lookup failed, continue with DB planCode
      }
    }

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
