import { useEffect, useMemo, useState } from 'react';

import VercelAIGatewayConfig from '@/config/modelProviders/vercelaigateway';
import VertexAIConfig from '@/config/modelProviders/vertexai';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Primary providers for Phở Chat (Feb 2026):
 * 1. Vertex AI - Enterprise Gemini access
 * 2. Vercel AI Gateway - Unified access to 100+ models as fallback
 */

/**
 * Hook to get ALL chat models for the model picker
 *
 * Uses server-side PostHog flag evaluation via /api/config/llm-providers.
 * FAIL-OPEN: Shows all models by default until flags are loaded,
 * and if the API fails, all models remain visible.
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  // Flag state: null = loading (show all), Record = loaded
  const [providerFlags, setProviderFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchFlags = async () => {
      try {
        const res = await fetch('/api/config/llm-providers');
        if (!res.ok) return; // fail-open: keep showing all
        const data = await res.json();
        if (!cancelled && data.providers) {
          setProviderFlags(data.providers);
        }
      } catch {
        // fail-open: keep showing all models
      }
    };

    fetchFlags();

    return () => {
      cancelled = true;
    };
  }, []);

  // Helper: check if a flag is enabled (fail-open when flags not loaded)
  const isEnabled = (flagKey: string): boolean => {
    if (!providerFlags) return true; // Not loaded yet → show all
    if (!(flagKey in providerFlags)) return true; // Flag not defined → show
    return providerFlags[flagKey];
  };

  const providers = useMemo((): EnabledProviderWithModels[] => {
    const result: EnabledProviderWithModels[] = [];

    // --- Provider 1: Vertex AI (Primary) ---
    if (isEnabled('llm-provider-vertexai')) {
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
    if (isEnabled('llm-provider-vercelaigateway')) {
      const vercelModels = VercelAIGatewayConfig.chatModels || [];
      if (vercelModels.length > 0) {
        result.push({
          children: vercelModels
            .filter((model) => {
              if (model.enabled === false) return false;

              // Granular sub-provider check (e.g., anthropic/claude-sonnet → llm-provider-anthropic)
              const subProvider = model.id.split('/')[0];
              if (subProvider) {
                return isEnabled(`llm-provider-${subProvider}`);
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
  }, [providerFlags]);

  return providers;
};
