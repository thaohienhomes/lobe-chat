import { useMemo } from 'react';

import OpenRouterConfig from '@/config/modelProviders/openrouter';
import { AiProviderSourceEnum, EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * OpenRouter is the ONLY allowed provider per SPECS_BUSINESS.md
 * This ensures all chat requests go through our billing/points system
 */
const ALLOWED_PROVIDER_ID = 'openrouter';

/**
 * Hook to get ALL chat models for the model picker
 *
 * IMPORTANT: Per SPECS_BUSINESS.md and BATCH 4 requirements:
 * 1. Only OpenRouter models are shown (all chat routes through OpenRouter)
 * 2. ALL models are returned regardless of tier access
 * 3. Tier-based restrictions are handled in the UI layer (ModelSelect component)
 *    with visual indicators (lock icons, greyed out) for inaccessible models
 * 4. This ensures both authenticated and guest users see the full model catalog
 *
 * The model access control flow:
 * - This hook: Returns ALL OpenRouter models
 * - ModelSelect/useModelAccess: Fetches user's allowed tiers from API
 * - ModelSelect UI: Renders models with disabled state + lock icon for restricted tiers
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  // Build the model list directly from OpenRouter config
  // This ensures ALL models are visible regardless of backend "enabled" flags
  const openRouterProvider = useMemo((): EnabledProviderWithModels[] => {
    const models = OpenRouterConfig.chatModels || [];

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
        name: OpenRouterConfig.name || 'OpenRouter',
        source: AiProviderSourceEnum.Builtin,
      },
    ];
  }, []);

  return openRouterProvider;
};
