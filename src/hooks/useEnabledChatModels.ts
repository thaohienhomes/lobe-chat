import { useMemo } from 'react';

import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import VertexAIConfig from '@/config/modelProviders/vertexai';
import { usePostHogFeatureFlags } from '@/hooks/usePostHogFeatureFlags';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Primary providers for Phở Chat (Feb 2026):
 * 1. Vertex AI - Enterprise Gemini access
 * 2. Vercel AI Gateway - Unified access to 100+ models as fallback
 */

/**
 * Hook to get ALL chat models for the model picker
 *
 * UPDATED Feb 2026: Now using both Vertex AI and Vercel AI Gateway providers
 * - Vertex AI: Primary provider for Gemini models
 * - Vercel AI Gateway: Fallback with access to Anthropic, OpenAI, DeepSeek, xAI, Meta
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const { isFeatureEnabled, loading: flagsLoading } = usePostHogFeatureFlags();

  const providers = useMemo((): EnabledProviderWithModels[] => {
    // If flags are still loading, return empty or a safe default
    // For phở.chat, we want to be reactive to flags
    if (flagsLoading) return [];

    const result: EnabledProviderWithModels[] = [];

    // --- Provider 1: Vertex AI (Primary) ---
    // Flag: llm-provider-vertexai
    if (isFeatureEnabled('llm-provider-vertexai')) {
      const vertexModels = VertexAIConfig.chatModels || [];
      if (vertexModels.length > 0) {
        result.push({
          children: vertexModels.map((model) => ({
            abilities: {
              functionCall: model.functionCall ?? false,
              reasoning: model.reasoning ?? false,
              vision: model.vision ?? false,
            },
            contextWindowTokens: model.contextWindowTokens,
            displayName: model.displayName || model.id,
            id: model.id,
          })),
          id: 'vertexai',
          name: VertexAIConfig.name || 'Vertex AI',
          source: AiProviderSourceEnum.Builtin,
        });
      }
    }

    // --- Provider 2: Vercel AI Gateway (Fallback) ---
    // Flag: llm-provider-vercelaigateway
    if (isFeatureEnabled('llm-provider-vercelaigateway')) {
      const vercelModels = VercelAIGatewayConfig.chatModels || [];
      if (vercelModels.length > 0) {
        result.push({
          children: vercelModels
            .filter((model) => {
              // Internal enabled check
              if (model.enabled === false) return false;

              // PostHog granular check for sub-providers (anthropic, openai, etc.)
              // Model IDs are like 'anthropic/claude-sonnet'
              const subProvider = model.id.split('/')[0];
              if (subProvider) {
                return isFeatureEnabled(`llm-provider-${subProvider}`);
              }

              return true;
            })
            .map((model) => ({
              abilities: {
                functionCall: model.functionCall ?? false,
                reasoning: model.reasoning ?? false,
                vision: model.vision ?? false,
              },
              contextWindowTokens: model.contextWindowTokens,
              displayName: model.displayName || model.id,
              id: model.id,
            })),
          id: 'vercelaigateway',
          name: VercelAIGatewayConfig.name || 'Vercel AI Gateway',
          source: AiProviderSourceEnum.Builtin,
        });
      }
    }

    return result;
  }, [flagsLoading, isFeatureEnabled]);

  return providers;
};
