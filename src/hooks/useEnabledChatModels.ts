import isEqual from 'fast-deep-equal';
import { useMemo } from 'react';

import { isDeprecatedEdition } from '@/const/version';
import { useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { modelProviderSelectors } from '@/store/user/selectors';
import { EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * OpenRouter is the ONLY allowed provider per SPECS_BUSINESS.md
 * This ensures all chat requests go through our billing/points system
 */
const ALLOWED_PROVIDER_ID = 'openrouter';

/**
 * Hook to get enabled chat models for the current user
 *
 * IMPORTANT: Per SPECS_BUSINESS.md, only OpenRouter models are shown.
 * This ensures:
 * 1. All chat requests are routed through OpenRouter API
 * 2. Phở Points deduction logic works correctly
 * 3. We don't need OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const enabledList = useUserStore(modelProviderSelectors.modelProviderListForModelSelect, isEqual);
  const enabledChatModelList = useAiInfraStore((s) => s.enabledChatModelList, isEqual);

  // Filter to show only OpenRouter provider
  const filteredList = useMemo(() => {
    if (isDeprecatedEdition) {
      // For deprecated edition, filter from user store
      return enabledList.filter((provider) => provider.id === ALLOWED_PROVIDER_ID);
    }

    // For modern edition, filter from AI infra store
    const list = enabledChatModelList || [];
    return list.filter((provider) => provider.id === ALLOWED_PROVIDER_ID);
  }, [enabledList, enabledChatModelList]);

  return filteredList;
};
