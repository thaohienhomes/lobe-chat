/**
 * Subscription Model Activation Endpoint
 * Auto-enables models when user subscribes to a plan
 * 
 * POST /api/subscription/models/activate - Auto-enable models for subscription plan
 */

import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { subscriptionModelAccessService } from '@/services/subscription/modelAccess';
import { pino } from '@/libs/logger';

/**
 * Request body for model activation
 */
interface ActivateModelsRequest {
  planCode: string;
}

/**
 * Response for model activation
 */
interface ActivateModelsResponse {
  data?: {
    defaultModel: string;
    defaultProvider: string;
    enabledModels: string[];
    enabledProviders: string[];
    planCode: string;
  };
  error?: string;
  message?: string;
  success: boolean;
}

/**
 * POST /api/subscription/models/activate
 * Auto-enable models for user's subscription plan
 */
export async function POST(request: NextRequest): Promise<NextResponse<ActivateModelsResponse>> {
  try {
    // Verify authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 },
      );
    }

    // Parse request body
    const body: ActivateModelsRequest = await request.json();
    const { planCode } = body;

    // Validate required fields
    if (!planCode) {
      return NextResponse.json(
        {
          error: 'Missing required field: planCode',
          success: false,
        },
        { status: 400 },
      );
    }

    pino.info(
      {
        planCode,
        userId,
      },
      'Starting model activation for subscription plan',
    );

    // Auto-enable models for the plan
    await subscriptionModelAccessService.autoEnableModelsForPlan(userId, planCode);

    // Get plan details for response
    const { getAllowedModelsForPlan, getDefaultModelForPlan, getRequiredProvidersForPlan } = await import('@/config/pricing');
    
    const enabledModels = getAllowedModelsForPlan(planCode);
    const enabledProviders = getRequiredProvidersForPlan(planCode);
    const defaultModel = getDefaultModelForPlan(planCode);

    pino.info(
      {
        defaultModel: defaultModel.model,
        defaultProvider: defaultModel.provider,
        enabledModels: enabledModels.length,
        enabledProviders: enabledProviders.length,
        planCode,
        userId,
      },
      'Successfully activated models for subscription plan',
    );

    return NextResponse.json({
      data: {
        defaultModel: defaultModel.model,
        defaultProvider: defaultModel.provider,
        enabledModels,
        enabledProviders,
        planCode,
      },
      message: `Successfully activated ${enabledModels.length} models for plan ${planCode}`,
      success: true,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    pino.error(
      {
        error: errorMessage,
      },
      'Failed to activate models for subscription plan',
    );

    return NextResponse.json(
      {
        error: 'Failed to activate models for subscription plan',
        success: false,
      },
      { status: 500 },
    );
  }
}
