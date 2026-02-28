import {
  AGENT_RUNTIME_ERROR_SET,
  AgentRuntimeErrorType,
  ChatCompletionErrorPayload,
  ModelRuntime,
} from '@lobechat/model-runtime';
import { ChatErrorType } from '@lobechat/types';
import { eq } from 'drizzle-orm';
import console from 'node:console';

import { checkAuth } from '@/app/(backend)/middleware/auth';
import { MODEL_TIERS, getModelTier } from '@/config/pricing';
import { modelPricing } from '@/database/schemas';
import { getServerDB } from '@/database/server';
import { createTraceOptions, initModelRuntimeWithUserPayload } from '@/server/modules/ModelRuntime';
import {
  isCostOptimizationEnabled,
  isIntelligentRoutingEnabled,
  isUsageTrackingEnabled,
} from '@/server/services/FeatureFlags';
import {
  checkTierAccess,
  getUserCreditBalance,
  processModelUsage,
} from '@/server/services/billing/credits';
import { phoGatewayService } from '@/server/services/phoGateway';
import { ChatStreamPayload } from '@/types/openai/chat';
import { createErrorResponse } from '@/utils/errorResponse';
import { getTracePayload } from '@/utils/trace';

export const maxDuration = 300;

// TODO: Re-enable when usage tracking is fully implemented
// async function trackUsageAfterCompletion(params: {
//   costEngine: CostOptimizationEngine;
//   inputTokens: number;
//   model: string;
//   outputTokens: number;
//   provider: string;
//   responseTimeMs: number;
//   sessionId: string;
//   usageTracker: UsageTracker;
//   userId: string;
// }): Promise<void> {
//   try {
//     const cost = params.costEngine.calculateCost({
//       inputTokens: params.inputTokens,
//       model: params.model,
//       outputTokens: params.outputTokens,
//       sessionId: params.sessionId,
//       userId: params.userId,
//     });
//     let complexity: 'simple' | 'medium' | 'complex' = 'simple';
//     if (params.inputTokens > 500) complexity = 'complex';
//     else if (params.inputTokens > 100) complexity = 'medium';
//     await params.usageTracker.trackUsage({
//       costUSD: cost,
//       inputTokens: params.inputTokens,
//       model: params.model,
//       outputTokens: params.outputTokens,
//       provider: params.provider,
//       queryComplexity: complexity,
//       sessionId: params.sessionId,
//     });
//     console.log(`📊 Usage tracked: ${params.model} - ${cost.toFixed(6)} USD`);
//   } catch (error) {
//     console.error('Failed to track usage:', error);
//   }
// }

async function getModelPricing(modelId: string) {
  try {
    const db = await getServerDB();
    // Try to find exact model match
    let pricing = await db.query.modelPricing.findFirst({
      where: eq(modelPricing.modelId, modelId),
    });

    // Fallback? Or return default.
    // Ensure we handle 'gpt-4o' mapping if needed.
    // For now assuming exact match.
    return pricing;
  } catch (e) {
    console.error('Failed to get model pricing:', e);
    return null;
  }
}

// Helper to count tokens from text
// Uses byte length / 3 as approximation for multilingual BPE tokenizers
// (English ~4 chars/token, Vietnamese/CJK ~1.5-2 chars/token, bytes/3 is balanced)
const textEncoder = new TextEncoder();
function countTokens(text: string): number {
  const byteLength = textEncoder.encode(text).length;
  return Math.ceil(byteLength / 3);
}

export const POST = checkAuth(async (req: Request, { params, jwtPayload, createRuntime }) => {
  const { provider } = await params;

  // ... (existing code)

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

  let requestModel = ''; // Hoisted for catch block access

  try {
    // ============  0. Cost Optimization Setup   ============ //
    const costOptimizationEnabled = jwtPayload.userId
      ? isCostOptimizationEnabled(jwtPayload.userId)
      : false;
    const intelligentRoutingEnabled = jwtPayload.userId
      ? isIntelligentRoutingEnabled(jwtPayload.userId)
      : false;
    const usageTrackingEnabled = jwtPayload.userId
      ? isUsageTrackingEnabled(jwtPayload.userId)
      : false;

    // TODO: Re-enable when cost optimization is fully implemented
    // let costEngine: CostOptimizationEngine | undefined;
    // let usageTracker: UsageTracker | undefined;
    // let modelRouter: IntelligentModelRouter | undefined;

    if (costOptimizationEnabled && jwtPayload.userId) {
      try {
        // const serverDB = await getServerDB();
        // costEngine = new CostOptimizationEngine();
        // if (usageTrackingEnabled) {
        //   usageTracker = new UsageTracker(serverDB, jwtPayload.userId);
        // }
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

    // ============  0.5. Credit Check (Pre-flight)   ============ //
    // Check if user has sufficient credits to start the request
    if (jwtPayload.userId) {
      const creditStatus = await getUserCreditBalance(jwtPayload.userId);
      const balance = creditStatus?.balance || 0;

      // Allow small overdraft (e.g. -10k VND) to prevent cutoff mid-sentence
      // But block if significantly negative
      if (balance < -10_000) {
        console.warn(
          `🚫 Blocked request due to negative balance: ${balance} (User: ${jwtPayload.userId})`,
        );
        return createErrorResponse(AgentRuntimeErrorType.InsufficientQuota, {
          error: { message: 'Phở Points không đủ. Vui lòng nạp thêm để tiếp tục.' },
          provider: 'pho-chat',
        });
      }

      console.log(`💰 Credit Check: Balance ${balance} (User: ${jwtPayload.userId})`);
    }

    // ============  1. Parse request & remap provider   ============ //
    const data = (await req.json()) as ChatStreamPayload;
    requestModel = data.model; // Store for catch block access

    // Provider Override: redirect disabled providers (google, openai, etc.)
    // to active ones (vercelaigateway, groq, cerebras).
    // MUST happen BEFORE runtime init — otherwise init tries the original
    // provider's API key (which may not exist).
    const { provider: activeProvider, modelId: activeModelId } = phoGatewayService.remapProvider(
      provider,
      data.model,
    );
    data.model = activeModelId;

    if (activeProvider !== provider) {
      console.log(`[Provider Override] ${provider} → ${activeProvider}, model: ${data.model}`);
    }

    // ============  1.1. Init chat model   ============ //
    console.log(`[Chat API] Initializing model runtime for provider: ${activeProvider}...`);
    let modelRuntime: ModelRuntime;
    if (createRuntime) {
      console.log(`[Chat API] Using custom createRuntime function`);
      modelRuntime = createRuntime(jwtPayload);
    } else {
      console.log(`[Chat API] Using initModelRuntimeWithUserPayload`);
      modelRuntime = await initModelRuntimeWithUserPayload(activeProvider, jwtPayload);
    }
    console.log(`[Chat API] ✅ Model runtime initialized successfully`);

    // ============  2. Tier Access Enforcement   ============ //
    // Check if user's plan allows access to this model tier and daily limits
    let userPlanId = 'vn_free';
    if (jwtPayload.userId) {
      const creditStatus = await getUserCreditBalance(jwtPayload.userId);
      userPlanId = creditStatus?.currentPlanId || 'vn_free';

      // Clerk metadata fallback for promo-activated users (medical_beta, etc.)
      const FREE_PLAN_IDS = new Set(['free', 'trial', 'starter', 'vn_free', 'gl_starter']);
      if (FREE_PLAN_IDS.has(userPlanId.toLowerCase())) {
        try {
          const { clerkClient } = await import('@clerk/nextjs/server');
          const client = await clerkClient();
          const clerkUser = await client.users.getUser(jwtPayload.userId);
          const clerkPlanId = (clerkUser.publicMetadata as any)?.planId;
          if (clerkPlanId && !FREE_PLAN_IDS.has(clerkPlanId.toLowerCase())) {
            userPlanId = clerkPlanId;
            console.log(`[Tier Check] Clerk fallback: plan upgraded to ${userPlanId}`);
          }
        } catch {
          // Clerk lookup failed, continue with DB planId
        }
      }
      const modelTier = getModelTier(data.model);

      console.log(`[Tier Check] Model: ${data.model}, Tier: ${modelTier}, Plan: ${userPlanId}`);

      const tierAccess = await checkTierAccess(jwtPayload.userId, modelTier, userPlanId);

      if (!tierAccess.allowed) {
        // ============ Plugin Auto-Fallback ============
        // When Tier 2/3 quota is exhausted but the request has tool/plugin calls,
        // transparently reroute to Tier 1 so plugins keep working.
        // Use Vercel AI Gateway (Gemini 2.0 Flash) — reliable, supports tools, avoids CF Gateway.
        const hasTools = Array.isArray(data.tools) && data.tools.length > 0;
        if (hasTools && modelTier > 1) {
          const PLUGIN_FALLBACK_MODEL = 'google/gemini-2.0-flash';
          const PLUGIN_FALLBACK_PROVIDER = 'vercelaigateway';
          console.log(
            `🔄 [Plugin Fallback] Tier ${modelTier} quota exceeded for user ${jwtPayload.userId}. ` +
            `Rerouting plugin call from "${data.model}" → "${PLUGIN_FALLBACK_MODEL}" (Tier 1 Vercel+Gemini).`,
          );
          data.model = PLUGIN_FALLBACK_MODEL;
          // Re-init runtime for the fallback provider
          modelRuntime = await initModelRuntimeWithUserPayload(PLUGIN_FALLBACK_PROVIDER, jwtPayload);
        } else {
          console.warn(
            `🚫 Tier access denied: ${tierAccess.reason} (User: ${jwtPayload.userId}, Model: ${data.model})`,
          );
          return createErrorResponse(AgentRuntimeErrorType.InsufficientQuota, {
            error: { message: tierAccess.reason || 'Model này yêu cầu gói cao hơn.' },
            provider: 'pho-chat',
            upgradeUrl: '/settings/subscription',
          });
        }
      }

      // Log remaining usage for non-unlimited tiers
      if (tierAccess.dailyLimit && tierAccess.dailyLimit !== -1) {
        console.log(
          `📊 Tier ${modelTier} usage: ${tierAccess.dailyLimit - (tierAccess.remaining || 0)}/${tierAccess.dailyLimit} (${tierAccess.remaining} remaining)`,
        );
      }
    }

    const tracePayload = getTracePayload(req);

    let traceOptions = {};
    // If user enable trace
    if (tracePayload?.enabled) {
      traceOptions = createTraceOptions(data, { provider, trace: tracePayload });
    }

    // ============  3. Execute Chat Completion (with Phở Gateway Failover)   ============ //
    // Use the ORIGINAL request model ID for failover lookup (not the remapped API-specific ID).
    // e.g. requestModel = 'mercury-coder-small-2-2' (logical ID in logicalModels map),
    //      data.model  = 'mercury-2' (already remapped to InceptionLabs API model name).
    const priorityList = phoGatewayService.resolveProviderList(requestModel, activeProvider);

    console.log(
      `[Chat API] Orchestration: Priority List for ${data.model} (${activeProvider}):`,
      priorityList,
    );

    let lastError: any = null;
    let successfulResponse: Response | null = null;
    let actualProviderUsed = activeProvider;
    let actualModelUsed = data.model;

    for (const [index, entry] of priorityList.entries()) {
      const { provider: targetProvider, modelId: targetModelId } = entry;

      console.log(
        `[Chat API] Attempt ${index + 1}: trying ${targetProvider} with model ${targetModelId}`,
      );

      try {
        // Initialize runtime for this specific provider if different from initial
        let currentRuntime = modelRuntime;
        if (targetProvider !== activeProvider) {
          currentRuntime = await initModelRuntimeWithUserPayload(targetProvider, jwtPayload);
        }

        // Sanitize messages for Gemini-based providers (require non-empty content)
        let sanitizedData = data;
        if (targetProvider === 'vercelaigateway' && targetModelId.startsWith('google/')) {
          const filteredMessages = data.messages?.filter((msg) => {
            if (typeof msg.content === 'string') return msg.content.trim().length > 0;
            if (Array.isArray(msg.content)) return msg.content.length > 0;
            return msg.content !== null && msg.content !== undefined;
          });
          sanitizedData = { ...data, messages: filteredMessages };
        }

        const response = await currentRuntime.chat(
          {
            ...sanitizedData,
            model: targetModelId,
          },
          {
            user: jwtPayload.userId,
            ...traceOptions,
            signal: req.signal,
          },
        );

        if (!response.ok) {
          // If it's a provider error, throw it to trigger catch block for failover
          const errorData = await response
            .clone()
            .json()
            .catch(() => ({}));
          throw {
            message: errorData?.error?.message || response.statusText,
            status: response.status,
            type: AgentRuntimeErrorType.ProviderBizError,
          };
        }

        console.log(`[Chat API] ✅ Attempt ${index + 1} successful with ${targetProvider}`);
        successfulResponse = response;
        actualProviderUsed = targetProvider;
        actualModelUsed = targetModelId;
        break; // Exit loop on success
      } catch (e: any) {
        console.warn(
          `[Chat API] Attempt ${index + 1} failed for ${targetProvider}:`,
          e?.message || e,
        );
        lastError = e;

        // Determine if we should retry
        const isRetryable =
          e?.status === 500 ||
          e?.status === 429 ||
          e?.status === 502 ||
          e?.status === 503 ||
          e?.status === 504 ||
          e?.type === AgentRuntimeErrorType.ProviderBizError ||
          e?.code === 'ECONNRESET';

        if (!isRetryable && index < priorityList.length - 1) {
          console.warn(
            `[Chat API] Error might not be retryable, but continuing failover as safety measure.`,
          );
        }

        if (index === priorityList.length - 1) {
          console.error(`[Chat API] All providers failed. Throwing last error.`);
          throw lastError;
        } else {
          console.warn(`[Chat API] Failover triggered: moving to next provider.`);
        }
      }
    }

    if (!successfulResponse) {
      throw lastError || new Error('All providers failed without a specific error.');
    }

    const response = successfulResponse;

    console.log(`[Chat API] ✅ Chat completion successful`);
    console.log('='.repeat(80));

    // ============  4. Usage Tracking & Credit Deduction   ============ //
    // Fetch pricing for the actual model used
    const pricing = await getModelPricing(actualModelUsed);

    // Resolve correct tier via getModelTier()
    const resolvedTier = getModelTier(actualModelUsed);
    const resolvedTierConfig = MODEL_TIERS[resolvedTier as keyof typeof MODEL_TIERS];

    // Use DB pricing if available, otherwise derive from MODEL_TIERS config
    const activePricing = pricing || {
      id: 'default',
      inputPrice: resolvedTierConfig?.inputCostPer1M ?? 100,
      outputPrice: resolvedTierConfig?.outputCostPer1M ?? 300,
      tier: resolvedTier,
    };

    if (!pricing) {
      console.warn(
        `⚠️ No DB pricing for model ${data.model}, using Tier ${resolvedTier} fallback (${resolvedTierConfig?.tierName}).`,
      );
    }

    if (data.stream && response.body) {
      // STREAMING: Tee the stream to audit usage
      const [stream1, stream2] = response.body.tee();

      // Process audit in background (don't await)
      (async () => {
        try {
          const reader = stream2.getReader();
          let accumulatedText = '';
          const decoder = new TextDecoder();

          for (; ;) {
            const { done, value } = await reader.read();
            if (done) break;
            // Decode chunk. Note: chunks might be partial SSE events.
            // But raw length count is decent proxy for tokens across languages?
            // AI SDK might send 'data: "..."'.
            // We just count everything for now as a rough "usage unit".
            // Better: try to clean it?
            accumulatedText += decoder.decode(value, { stream: true });
          }

          // Calculate tokens
          const outputTokens = countTokens(accumulatedText);
          const inputTokens =
            data.messages?.reduce((acc, msg) => acc + countTokens(String(msg.content || '')), 0) ||
            0;

          // Calculate Cost (per 1M tokens)
          // Cost = (Input * InputPrice + Output * OutputPrice) / 1,000,000
          const inputPrice = activePricing.inputPrice ?? 0;
          const outputPrice = activePricing.outputPrice ?? 0;
          const cost = Math.ceil(
            (inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000,
          );

          console.log(
            `📉 Streaming Usage: ${inputTokens} in / ${outputTokens} out. Cost: ${cost} Credits.`,
          );

          if (cost > 0 && jwtPayload.userId) {
            await processModelUsage(jwtPayload.userId, cost, activePricing.tier || 1);
          }
        } catch (e) {
          console.error('Failed to audits stream:', e);
        }
      })();

      const headers = new Headers(response.headers);
      headers.set('X-Pho-Provider', actualProviderUsed);
      headers.set('X-Pho-Model-ID', actualModelUsed);

      return new Response(stream1, {
        headers,
        status: response.status,
        statusText: response.statusText,
      });
    } else {
      // NON-STREAMING
      try {
        // ... existing tracking logic ...
        // We can reuse the logic here or keep trackUsageAfterCompletion if it's used elsewhere
        // But we must deduct credits.
        const responseClone = response.clone();
        const responseData = await responseClone.json(); // May consume body

        // Wait, response is returned to user. We can't consume it if we don't clone.
        // But ModelRuntime.chat returning Response...
        // If we access .json(), the original response is used?
        // Actually, for non-streaming, we can just intercept.

        // NOTE: The previous code didn't actually read the response for tracking!
        // It used "150" as estimated output tokens.
        // We should try to read it if possible, but cloning might be expensive.

        // Let's stick to estimation or try to read if cheap.
        const content = responseData.choices?.[0]?.message?.content || '';
        const outputTokens = countTokens(content);
        const inputTokens =
          data.messages?.reduce((acc, msg) => acc + countTokens(String(msg.content || '')), 0) || 0;

        const inputPrice = activePricing.inputPrice ?? 0;
        const outputPrice = activePricing.outputPrice ?? 0;
        const cost = Math.ceil((inputTokens * inputPrice + outputTokens * outputPrice) / 1_000_000);

        if (cost > 0 && jwtPayload.userId) {
          await processModelUsage(jwtPayload.userId, cost, activePricing.tier || 1);
          console.log(`📉 Non-Streaming Usage: ${cost} Credits processed.`);
        }

        // Return a new response from the data we read, to ensure stream isn't locked?
        // Or just return the response. Since we cloned, the original might be fine?
        // Response.clone() creates a separate stream.
        // So we can return `response`.
      } catch (e) {
        console.error('Failed to process non-streaming response for credits:', e);
      }
    }

    // Return original response for non-streaming (since we cloned)
    if (!data.stream) {
      const headers = new Headers(response.headers);
      headers.set('X-Pho-Provider', actualProviderUsed);
      headers.set('X-Pho-Model-ID', actualModelUsed);

      return new Response(response.body, {
        headers,
        status: response.status,
        statusText: response.statusText,
      });
    }

    // Should be unreachable as we returned in stream block
    return response;
  } catch (e) {
    console.log('='.repeat(80));
    console.error(`[Chat API] ❌ Error occurred:`, e);

    const { errorType = ChatErrorType.InternalServerError, error: errorContent } =
      e as ChatCompletionErrorPayload;

    const error = errorContent || e;

    const logMethod = AGENT_RUNTIME_ERROR_SET.has(errorType as string) ? 'warn' : 'error';
    // track the error at server side
    console[logMethod](`Route: [${provider}] ${errorType}:`, error);
    console.log('='.repeat(80));

    // In Phở Chat, all API keys are managed server-side.
    // Never expose InvalidProviderAPIKey / NoOpenAIAPIKey to users — remap to
    // ProviderBizError so the client shows a generic error message instead of
    // the inappropriate "Enter custom API key" form.
    const safeErrorType =
      errorType === AgentRuntimeErrorType.InvalidProviderAPIKey ||
        errorType === AgentRuntimeErrorType.NoOpenAIAPIKey
        ? AgentRuntimeErrorType.ProviderBizError
        : errorType;

    // Sanitize vendor errors — hide provider names, API keys, quota details
    const rawMessage =
      typeof error === 'object' && error !== null
        ? (error as any).message || String(error)
        : String(error);

    // Include model name so user knows which model failed
    const modelHint = requestModel ? ` (${requestModel})` : '';

    // Map vendor-specific messages to user-friendly ones
    let sanitizedMessage = `Đã có lỗi xảy ra${modelHint}. Vui lòng thử lại sau.`;
    if (/quota|rate.?limit|exceeded|too many/i.test(rawMessage)) {
      sanitizedMessage = `Model${modelHint} tạm thời không khả dụng. Vui lòng thử model khác hoặc thử lại sau.`;
    } else if (/unauthorized|invalid.*key|api.?key/i.test(rawMessage)) {
      sanitizedMessage = `Lỗi xác thực${modelHint}. Vui lòng thử lại hoặc liên hệ hỗ trợ.`;
    } else if (/timeout|timed?.?out/i.test(rawMessage)) {
      sanitizedMessage = `Yêu cầu quá thời gian${modelHint}. Vui lòng thử lại.`;
    } else if (/not.?found|does not exist/i.test(rawMessage)) {
      sanitizedMessage = `Model${modelHint} hiện không khả dụng. Vui lòng chọn model khác.`;
    }

    return createErrorResponse(safeErrorType, {
      error: { message: sanitizedMessage },
      provider: 'pho-chat',
    });
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
