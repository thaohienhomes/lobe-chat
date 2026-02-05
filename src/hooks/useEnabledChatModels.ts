import { useMemo } from 'react';

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
 * UPDATED Feb 2026: Now using both Vertex AI and Vercel AI Gateway providers
 * - Vertex AI: Primary provider for Gemini models
 * - Vercel AI Gateway: Fallback with access to Anthropic, OpenAI, DeepSeek, xAI, Meta
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const providers = useMemo((): EnabledProviderWithModels[] => {
    const result: EnabledProviderWithModels[] = [];

    // Add Vertex AI Provider (Primary)
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

    // Add Vercel AI Gateway Provider (Fallback)
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
        name: VercelAIGatewayConfig.name || 'Vercel AI Gateway',
        source: AiProviderSourceEnum.Builtin,
      });
    }

    return result;
  }, []);

  return providers;
};
