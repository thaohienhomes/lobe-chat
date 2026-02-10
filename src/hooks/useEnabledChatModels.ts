import { useMemo } from 'react';

import PhoChatConfig from '@/config/modelProviders/phochat';
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
 * Architecture: 2 provider groups only
 * 1. Phở Chat — branded open-source models with multi-provider failover
 * 2. Vercel AI Gateway — closed-source premium models (Gemini, Claude, GPT, etc.)
 *
 * Raw providers (Groq, Cerebras, Together AI, Fireworks AI) are HIDDEN from the picker.
 * They still function as failover targets within phoGatewayService chains.
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const { isFeatureEnabled, ready } = usePostHogFeatureFlags();

  const providers = useMemo((): EnabledProviderWithModels[] => {
    const result: EnabledProviderWithModels[] = [];

    // ─── Group 1: Phở Chat (Primary — branded AI with failover) ───
    // Always visible — no PostHog gate needed (our own brand)
    {
      const entry = toProviderEntry(PhoChatConfig, 'phochat', PhoChatConfig.name || 'Phở Chat');
      if (entry) result.push(entry);
    }

    // ─── Group 2: Vercel AI Gateway (Premium closed-source) ───
    if (isFeatureEnabled('llm-provider-vercelaigateway')) {
      const vercelModels = VercelAIGatewayConfig.chatModels || [];
      if (vercelModels.length > 0) {
        result.push({
          children: vercelModels
            .filter((model) => model.enabled !== false)
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
          name: 'Premium Models',
          source: AiProviderSourceEnum.Builtin,
        });
      }
    }

    // ─── Hidden Providers (failover only, not shown in picker) ───
    // Groq, Cerebras, Together AI, Fireworks AI, Perplexity
    // These still work as failover targets through phoGatewayService

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, isFeatureEnabled]);

  return providers;
};
