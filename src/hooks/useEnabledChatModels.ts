import { useMemo } from 'react';

import VertexAIConfig from '@/config/modelProviders/vertexai';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Vertex AI is the primary provider (Feb 2026)
 * Switched from OpenRouter to Vertex AI for enterprise AI access
 */
const ALLOWED_PROVIDER_ID = 'vertexai';

/**
 * Hook to get ALL chat models for the model picker
 *
 * UPDATED Feb 2026: Now using Vertex AI as primary provider
 * Provides access to Gemini, Claude, Llama, DeepSeek, and Mistral models
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  // Build the model list directly from Vertex AI config
  const vertexAIProvider = useMemo((): EnabledProviderWithModels[] => {
    const models = VertexAIConfig.chatModels || [];

    return [
      {
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
        id: ALLOWED_PROVIDER_ID,
        name: VertexAIConfig.name || 'Vertex AI',
        source: AiProviderSourceEnum.Builtin,
      },
    ];
  }, []);

  return vertexAIProvider;
};

