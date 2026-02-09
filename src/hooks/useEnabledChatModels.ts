import { useMemo } from 'react';

import CerebrasConfig from '@/config/modelProviders/cerebras';
import FireworksAIConfig from '@/config/modelProviders/fireworksai';
import GroqConfig from '@/config/modelProviders/groq';
import PerplexityConfig from '@/config/modelProviders/perplexity';
import TogetherAIConfig from '@/config/modelProviders/togetherai';
import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import { usePostHogFeatureFlags } from '@/hooks/usePostHogFeatureFlags';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';
import { ModelProviderCard } from '@/types/llm';

/**
 * Helper: convert a provider config into an EnabledProviderWithModels entry.
 * Only includes models where `enabled !== false`.
 */
const toProviderEntry = (
  config: ModelProviderCard,
  id: string,
  name: string,
): EnabledProviderWithModels | null => {
  const models = (config.chatModels || []).filter((m) => m.enabled !== false);
  if (models.length === 0) return null;

  return {
    children: models.map((model) => ({
      abilities: {
        functionCall: model.functionCall ?? false,
        reasoning: model.reasoning ?? false,
        vision: model.vision ?? false,
      },
      contextWindowTokens: model.contextWindowTokens,
      displayName: model.displayName || model.id,
      id: model.id,
    })),
    id,
    name,
    source: AiProviderSourceEnum.Builtin,
  };
};

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

    // --- Provider 3: Groq (Tier 1 - Speed, via CF Gateway) ---
    if (isFeatureEnabled('llm-provider-groq')) {
      const entry = toProviderEntry(GroqConfig, 'groq', GroqConfig.name || 'Groq');
      if (entry) result.push(entry);
    }

    // --- Provider 4: Cerebras (Tier 1 - Co-Primary Speed, via CF Gateway) ---
    if (isFeatureEnabled('llm-provider-cerebras')) {
      const entry = toProviderEntry(CerebrasConfig, 'cerebras', CerebrasConfig.name || 'Cerebras');
      if (entry) result.push(entry);
    }

    // --- Provider 5: Fireworks AI (Tier 1 - Fallback, via CF Gateway) ---
    if (isFeatureEnabled('llm-provider-fireworksai')) {
      const entry = toProviderEntry(
        FireworksAIConfig,
        'fireworksai',
        FireworksAIConfig.name || 'Fireworks AI',
      );
      if (entry) result.push(entry);
    }

    // --- Provider 6: Together AI (Tier 2 - Premium, via CF Gateway) ---
    if (isFeatureEnabled('llm-provider-togetherai')) {
      const entry = toProviderEntry(
        TogetherAIConfig,
        'togetherai',
        TogetherAIConfig.name || 'Together AI',
      );
      if (entry) result.push(entry);
    }

    // --- Provider 7: Perplexity (Tier 3 - Research, via CF Gateway) ---
    if (isFeatureEnabled('llm-provider-perplexity')) {
      const entry = toProviderEntry(
        PerplexityConfig,
        'perplexity',
        PerplexityConfig.name || 'Perplexity',
      );
      if (entry) result.push(entry);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isFeatureEnabled]);

  return providers;
};
