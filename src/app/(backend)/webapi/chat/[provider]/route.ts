import {
  AGENT_RUNTIME_ERROR_SET,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
// Disabled for initial deployment
// import { CostOptimizationEngine, UsageTracker, VND_PRICING_TIERS } from '@/server/modules/CostOptimization';
// import { IntelligentModelRouter } from '@/server/modules/IntelligentModelRouter';
// import { isCostOptimizationEnabled, isIntelligentRoutingEnabled, isUsageTrackingEnabled } from '@/server/services/FeatureFlags';
import { ChatStreamPayload } from '@/types/openai/chat';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';
// import { getServerDB } from '@lobechat/database/core/db-adaptor'; // Disabled for initial deployment

export const maxDuration = 300;

export const POST = checkAuth(async (req: Request, { params, jwtPayload, createRuntime }) => {
  const { provider } = await params;

  try {
    // ============  0. Cost Optimization Setup   ============ //
    // Disabled for initial deployment
    const costOptimizationEnabled = false; // jwtPayload.userId ? isCostOptimizationEnabled(jwtPayload.userId) : false;
    const intelligentRoutingEnabled = false; // jwtPayload.userId ? isIntelligentRoutingEnabled(jwtPayload.userId) : false;
    const usageTrackingEnabled = false; // jwtPayload.userId ? isUsageTrackingEnabled(jwtPayload.userId) : false;

    // let costEngine: CostOptimizationEngine | undefined;
    // let usageTracker: UsageTracker | undefined;
    // let modelRouter: IntelligentModelRouter | undefined;
    let originalModel: string | undefined;
    let optimizedModel: string | undefined;

    if (costOptimizationEnabled && jwtPayload.userId) {
      try {
        // const serverDB = await getServerDB(); // Disabled for initial deployment
        // costEngine = new CostOptimizationEngine(); // Disabled for initial deployment

        if (usageTrackingEnabled) {
          // usageTracker = new UsageTracker(serverDB, jwtPayload.userId); // Disabled for initial deployment
        }

        if (intelligentRoutingEnabled) {
          // modelRouter = new IntelligentModelRouter(); // Disabled for initial deployment
        }

        console.log(`🎯 Cost optimization enabled for user ${jwtPayload.userId} (routing: ${intelligentRoutingEnabled}, tracking: ${usageTrackingEnabled})`);
      } catch (error) {
        console.warn('⚠️ Cost optimization initialization failed, proceeding without optimization:', error);
      }
    }

    // ============  1. init chat model   ============ //
    let modelRuntime: ModelRuntime;
    if (createRuntime) {
      modelRuntime = createRuntime(jwtPayload);
    } else {
      modelRuntime = await initModelRuntimeWithUserPayload(provider, jwtPayload);
    }

    // ============  2. create chat completion   ============ //

    const data = (await req.json()) as ChatStreamPayload;
    originalModel = data.model;

    // ============  2.1. Cost Optimization & Model Selection   ============ //
    // Disabled for initial deployment - will be enabled after database migration
    // Disabled cost optimization for deployment
    if (false) {
      try {
        // Get user's subscription tier and remaining budget
        // const userSubscription = await getUserSubscriptionTier(jwtPayload.userId, usageTracker);
        // const remainingBudget = await usageTracker.getRemainingBudget(userSubscription);

        // Check budget before proceeding
        if (remainingBudget <= 0) {
          return new Response(
            JSON.stringify({
              budgetExceeded: true,
              error: 'Đã hết ngân sách tháng này. Vui lòng nâng cấp gói hoặc chờ chu kỳ mới.',
              // errorType: ChatErrorType.InsufficientQuota,
              remainingBudgetVND: remainingBudget,
            }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 402
            }
          );
        }

        // Get last user message for complexity analysis
        const lastMessage = data.messages.at(-1)?.content || '';

        // Get optimal model recommendation
        /*
        const routingResult = await modelRouter.routeRequest({
          features: {
            requiresFunctionCalling: !!(data.tools as any) && (data.tools as any).length > 0,
            requiresStreaming: data.stream !== false,
            requiresVision: data.messages.some(m => (m as any).files && (m as any).files.length > 0),
          },
          query: lastMessage,
          remainingBudgetVND: remainingBudget,
          sessionId: (data as any).sessionId || 'default',
          subscriptionTier: userSubscription,
          userId: jwtPayload.userId,
        });

        // Override model if cost optimization suggests a better option
        if (routingResult.selectedModel !== originalModel) {
          optimizedModel = routingResult.selectedModel;
          (data as any).model = optimizedModel;
          console.log(`🎯 Model optimized: ${originalModel} → ${optimizedModel} (${routingResult.reasoning})`);
        }

        // Log budget warning if applicable
        if (routingResult.budgetWarning) {
          console.warn(`💰 Budget warning for user ${jwtPayload.userId}: ${routingResult.budgetWarning}`);
        }
        */

      } catch (error) {
        console.warn('⚠️ Cost optimization failed, using original model:', error);
      }
    }

    const tracePayload = getTracePayload(req);

    let traceOptions = {};
    // If user enable trace
    if (tracePayload?.enabled) {
      traceOptions = createTraceOptions(data, { provider, trace: tracePayload });
    }

    // ============  3. Execute Chat Completion   ============ //
    const startTime = Date.now();

    const response = await modelRuntime.chat(data, {
      user: jwtPayload.userId,
      ...traceOptions,
      signal: req.signal,
    });

    // ============  4. Track Usage (for non-streaming responses)   ============ //
    // Disabled usage tracking for deployment
    if (false) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      // Note: For streaming responses, usage tracking should be handled by the streaming handler
      // This is a simplified version for non-streaming responses
      try {
        /*
        await trackUsageAfterCompletion({
          costEngine,
          inputTokens: estimateTokens(data.messages),
          model: optimizedModel || originalModel || data.model,
          outputTokens: 100,
          provider,
          // Placeholder - should be calculated from actual response
          responseTimeMs,
          sessionId: (data as any).sessionId || 'default',
          usageTracker,
          userId: jwtPayload.userId,
        });
        */
      } catch (error) {
        console.warn('⚠️ Usage tracking failed:', error);
      }
    }

    return response;
  } catch (e) {
    const {
      errorType = ChatErrorType.InternalServerError,
      error: errorContent,
      ...res
    } = e as ChatCompletionErrorPayload;

    const error = errorContent || e;

    const logMethod = AGENT_RUNTIME_ERROR_SET.has(errorType as string) ? 'warn' : 'error';
    // track the error at server side
    console[logMethod](`Route: [${provider}] ${errorType}:`, error);

    return createErrorResponse(errorType, { error, ...res, provider });
  }
});

// ============  Helper Functions for Cost Optimization   ============ //

/**
 * Get user's subscription tier from database or default to starter
 */
/*
async function getUserSubscriptionTier(
  userId: string,
  usageTracker: UsageTracker
): Promise<keyof typeof VND_PRICING_TIERS> {
  try {
    // Try to get from monthly usage summary first
    const serverDB = await getServerDB();
    const summary = await serverDB.execute(`
      SELECT subscription_tier
      FROM monthly_usage_summary
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [userId]);

    if (summary.length > 0 && summary[0].subscription_tier) {
      return summary[0].subscription_tier as keyof typeof VND_PRICING_TIERS;
    }

    // Fallback to user cost settings
    const settings = await serverDB.execute(`
      SELECT monthly_budget_vnd
      FROM user_cost_settings
      WHERE user_id = $1
    `, [userId]);

    if (settings.length > 0) {
      const budget = settings[0].monthly_budget_vnd;
      if (budget <= 29_000) return 'starter';
      if (budget <= 58_000) return 'premium';
      return 'ultimate';
    }

    // Default to starter tier
    return 'starter';
  } catch (error) {
    console.warn('Failed to get subscription tier, defaulting to starter:', error);
    return 'starter';
  }
}
*/

/**
 * Estimate token count from messages (simplified)
 */
function estimateTokens(messages: any[]): number {
  if (!messages || !Array.isArray(messages)) return 0;

  const totalText = messages
    .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
    .join(' ');

  // Rough estimation: ~4 characters per token
  return Math.ceil(totalText.length / 4);
}

/**
 * Track usage after completion
 */
/*
async function trackUsageAfterCompletion(params: {
  costEngine: CostOptimizationEngine;
  inputTokens: number;
  model: string;
  outputTokens: number;
  provider: string;
  responseTimeMs: number;
  sessionId: string;
  usageTracker: UsageTracker;
  userId: string;
}): Promise<void> {
  try {
    const cost = params.costEngine.calculateCost({
      inputTokens: params.inputTokens,
      model: params.model,
      outputTokens: params.outputTokens,
      sessionId: params.sessionId,
      userId: params.userId,
    });

    // Determine query complexity based on input tokens
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (params.inputTokens > 500) complexity = 'complex';
    else if (params.inputTokens > 100) complexity = 'medium';

    await params.usageTracker.trackUsage({
      costUSD: cost,
      inputTokens: params.inputTokens,
      model: params.model,
      outputTokens: params.outputTokens,
      queryComplexity: complexity,
      sessionId: params.sessionId,
    });

    console.log(`📊 Usage tracked: ${params.model} - ${cost.toFixed(6)} USD (${(cost * 24_167).toFixed(0)} VND)`);
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}
*/
