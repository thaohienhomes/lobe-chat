import isEqual from 'fast-deep-equal';

import { isDeprecatedEdition } from '@/const/version';
import { useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { modelProviderSelectors } from '@/store/user/selectors';
import { EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Hook to get enabled chat models for the current user
 *
 * Currently returns all enabled models from the database.
 * Subscription-based filtering will be implemented in a future phase
 * once model naming conventions are standardized.
 */
export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const enabledList = useUserStore(modelProviderSelectors.modelProviderListForModelSelect, isEqual);
  const enabledChatModelList = useAiInfraStore((s) => s.enabledChatModelList, isEqual);

  if (isDeprecatedEdition) {
    return enabledList;
  }

  return enabledChatModelList || [];
};
