import { useMemo } from 'react';

import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import VertexAIConfig from '@/config/modelProviders/vertexai';
import { usePostHogFeatureFlags } from '@/hooks/usePostHogFeatureFlags';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Hook to get all chat models for the model picker.
 *
 * Uses client-side PostHog feature flags to filter providers.
 * FAIL-OPEN: Shows all models by default until flags are loaded.
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const { isFeatureEnabled, ready } = usePostHogFeatureFlags();

  const providers = useMemo((): EnabledProviderWithModels[] => {
    const result: EnabledProviderWithModels[] = [];

    // --- Provider 1: Vertex AI (Primary) ---
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
    if (isFeatureEnabled('llm-provider-vercelaigateway')) {
      const vercelModels = VercelAIGatewayConfig.chatModels || [];
      if (vercelModels.length > 0) {
        result.push({
          children: vercelModels
            .filter((model) => {
              if (model.enabled === false) return false;

              // Sub-provider check: anthropic/claude-sonnet → llm-provider-anthropic
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isFeatureEnabled]);

  return providers;
};
