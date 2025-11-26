import {
  AGENT_RUNTIME_ERROR_SET,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import { CostOptimizationEngine, UsageTracker } from '@/server/modules/CostOptimization';
import { IntelligentModelRouter } from '@/server/modules/IntelligentModelRouter';
import { isCostOptimizationEnabled, isIntelligentRoutingEnabled, isUsageTrackingEnabled } from '@/server/services/FeatureFlags';
import { ChatStreamPayload } from '@/types/openai/chat';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';

import { getServerDB } from '@/database/server';

export const maxDuration = 300;

export const POST = checkAuth(async (req: Request, { params, jwtPayload, createRuntime }) => {
  const { provider } = await params;

  // 🔍 DEBUG: Log request info
  console.log('='.repeat(80));
  console.log(`[Chat API] Request received for provider: ${provider}`);
  console.log(`[Chat API] User ID: ${jwtPayload.userId}`);
  console.log(`[Chat API] JWT Payload:`, {
    apiKeyLength: jwtPayload.apiKey?.length || 0,
    baseURL: jwtPayload.baseURL,
    hasApiKey: !!jwtPayload.apiKey,
    hasBaseURL: !!jwtPayload.baseURL,
  });

  try {
    // ============  0. Cost Optimization Setup   ============ //
    const costOptimizationEnabled = jwtPayload.userId ? isCostOptimizationEnabled(jwtPayload.userId) : false;
    const intelligentRoutingEnabled = jwtPayload.userId ? isIntelligentRoutingEnabled(jwtPayload.userId) : false;
    const usageTrackingEnabled = jwtPayload.userId ? isUsageTrackingEnabled(jwtPayload.userId) : false;

    let costEngine: CostOptimizationEngine | undefined;
    let usageTracker: UsageTracker | undefined;
    let modelRouter: IntelligentModelRouter | undefined;

    if (costOptimizationEnabled && jwtPayload.userId) {
      try {
        const serverDB = await getServerDB();
        costEngine = new CostOptimizationEngine();

        if (usageTrackingEnabled) {
          usageTracker = new UsageTracker(serverDB, jwtPayload.userId);
        }

        if (intelligentRoutingEnabled) {
          modelRouter = new IntelligentModelRouter();
        }

        console.log(
          `🎯 Cost optimization enabled for user ${jwtPayload.userId} (routing: ${intelligentRoutingEnabled}, tracking: ${usageTrackingEnabled})`,
        );
      } catch (error) {
        console.warn(
          '⚠️ Cost optimization initialization failed, proceeding without optimization:',
          error,
        );
      }
    }

    // ============  1. init chat model   ============ //
    console.log(`[Chat API] Initializing model runtime...`);
    let modelRuntime: ModelRuntime;
    if (createRuntime) {
      console.log(`[Chat API] Using custom createRuntime function`);
      modelRuntime = createRuntime(jwtPayload);
    } else {
      console.log(`[Chat API] Using initModelRuntimeWithUserPayload`);
      modelRuntime = await initModelRuntimeWithUserPayload(provider, jwtPayload);
    }
    console.log(`[Chat API] ✅ Model runtime initialized successfully`);

    // ============  2. create chat completion   ============ //

    const data = (await req.json()) as ChatStreamPayload;

    // ============  2.1. Cost Optimization & Model Selection   ============ //
    // Disabled for initial deployment - code block intentionally commented out
    // to avoid constant-condition and unused variables lint errors.
    // See git history for the original implementation.

    const tracePayload = getTracePayload(req);

    let traceOptions = {};
    // If user enable trace
    if (tracePayload?.enabled) {
      traceOptions = createTraceOptions(data, { provider, trace: tracePayload });
    }

    // ============  3. Execute Chat Completion   ============ //
    console.log(`[Chat API] Executing chat completion with model: ${data.model}`);
    console.log(`[Chat API] Messages count: ${data.messages?.length || 0}`);

    const response = await modelRuntime.chat(data, {
      user: jwtPayload.userId,
      ...traceOptions,
      signal: req.signal,
    });

    console.log(`[Chat API] ✅ Chat completion successful`);
    console.log('='.repeat(80));

    // ============  4. Track Usage (for non-streaming responses)   ============ //
    if (usageTracker && costEngine && !data.stream) {
      try {
        // For non-streaming responses, we can track usage immediately
        // Note: For streaming responses, usage tracking should be handled in the stream completion
        const inputTokens = data.messages?.reduce((acc, msg) => acc + (msg.content?.length || 0), 0) || 0;
        const estimatedInputTokens = Math.ceil(inputTokens / 4); // Rough estimate: 4 chars per token
        const estimatedOutputTokens = 150; // Default estimate for non-streaming

        await trackUsageAfterCompletion({
          costEngine,
          inputTokens: estimatedInputTokens,
          model: data.model,
          outputTokens: estimatedOutputTokens,
          provider,
          responseTimeMs: 0, // For non-streaming, response time is not critical
          sessionId: (data as any).sessionId || 'unknown',
          usageTracker,
          userId: jwtPayload.userId!,
        });
      } catch (error) {
        console.warn('⚠️ Failed to track usage for non-streaming response:', error);
      }
    }

    return response;
  } catch (e) {
    console.log('='.repeat(80));
    console.error(`[Chat API] ❌ Error occurred:`, e);

    const {
      errorType = ChatErrorType.InternalServerError,
      error: errorContent,
      ...res
    } = e as ChatCompletionErrorPayload;

    const error = errorContent || e;

    const logMethod = AGENT_RUNTIME_ERROR_SET.has(errorType as string) ? 'warn' : 'error';
    // track the error at server side
    console[logMethod](`Route: [${provider}] ${errorType}:`, error);
    console.log('='.repeat(80));

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

// /**
//  * Estimate token count from messages (simplified)
//  */
// function estimateTokens(messages: any[]): number {
//   if (!messages || !Array.isArray(messages)) return 0;
//
//   const totalText = messages
//     .map(m => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content)))
//     .join(' ');
//
//   // Rough estimation: ~4 characters per token
//   return Math.ceil(totalText.length / 4);
// }

/**
 * Track usage after completion
 */
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
      provider: params.provider,
      queryComplexity: complexity,
      sessionId: params.sessionId,
    });

    console.log(`📊 Usage tracked: ${params.model} - ${cost.toFixed(6)} USD (${(cost * 24_167).toFixed(0)} VND)`);
  } catch (error) {
    console.error('Failed to track usage:', error);
  }
}
