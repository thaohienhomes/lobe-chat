import isEqual from 'fast-deep-equal';
import { useEffect, useState } from 'react';

import { isDeprecatedEdition } from '@/const/version';
import { useAiInfraStore } from '@/store/aiInfra';
import { useUserStore } from '@/store/user';
import { modelProviderSelectors } from '@/store/user/selectors';
import { EnabledProviderWithModels } from '@/types/aiProvider';

/**
 * Hook to get allowed models for user's current subscription plan
 */
const useAllowedModels = () => {
  const [allowedModels, setAllowedModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllowedModels = async () => {
      try {
        const response = await fetch('/api/subscription/models/allowed');
        if (response.ok) {
          const result = await response.json();
          setAllowedModels(result.data?.allowedModels || []);
        }
      } catch (error) {
        console.error('Failed to fetch allowed models:', error);
        // Fallback to empty array on error
        setAllowedModels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllowedModels();
  }, []);

  return { allowedModels, loading };
};

/**
 * Filter enabled models based on user's subscription plan
 */
const filterModelsBySubscription = (
  enabledModels: EnabledProviderWithModels[],
  allowedModels: string[]
): EnabledProviderWithModels[] => {
  if (allowedModels.length === 0) {
    // If no allowed models (error case), return empty array to be safe
    return [];
  }

  return enabledModels
    .map((provider) => ({
      ...provider,
      children: provider.children.filter((model: any) =>
        allowedModels.includes(model.id)
      ),
    }))
    .filter((provider) => provider.children.length > 0); // Remove providers with no allowed models
};

export const useEnabledChatModels = (): EnabledProviderWithModels[] => {
  const enabledList = useUserStore(modelProviderSelectors.modelProviderListForModelSelect, isEqual);
  const enabledChatModelList = useAiInfraStore((s) => s.enabledChatModelList, isEqual);
  const { allowedModels, loading } = useAllowedModels();

  // For deprecated edition, return original behavior
  if (isDeprecatedEdition) {
    return enabledList;
  }

  const baseEnabledModels = enabledChatModelList || [];

  // While loading allowed models, return empty array to prevent showing unauthorized models
  if (loading) {
    return [];
  }

  // Filter models based on subscription plan
  return filterModelsBySubscription(baseEnabledModels, allowedModels);
};
