import { useCallback, useMemo } from 'react';
import useSWR from 'swr';

import { getModelTier } from '@/config/pricing';

interface AllowedModelsData {
  allowedModels: string[];
  allowedTiers: number[];
  dailyLimits?: Record<string, number>;
  defaultModel: string;
  defaultProvider: string;
  planCode: string;
}

const fetchModelAccess = async (): Promise<AllowedModelsData | null> => {
  const response = await fetch('/api/subscription/models/allowed');
  if (!response.ok) return null;
  const data = await response.json();
  if (data.success && data.data) return data.data;
  return null;
};

/**
 * Shared hook for model access checks.
 * Uses SWR to deduplicate and cache the /api/subscription/models/allowed call
 * across all components that mount simultaneously.
 */
export const useModelAccess = () => {
  const { data, isLoading } = useSWR('model-access-allowed', fetchModelAccess, {
    dedupingInterval: 300_000, // 5 minutes — don't refetch within this window
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const allowedTiers = data?.allowedTiers ?? [1];
  const isGuest = !data;

  const canUseModel = useCallback(
    (modelId: string) => {
      if (modelId.toLowerCase().includes('auto')) {
        return allowedTiers.includes(2);
      }
      const tier = getModelTier(modelId);
      return allowedTiers.includes(tier);
    },
    [allowedTiers],
  );

  // Simpler version: just check tier number
  const canUseTier = useCallback(
    (modelId: string) => {
      const tier = modelId.toLowerCase().includes('auto') ? 0 : getModelTier(modelId);
      return tier === 0 || allowedTiers.includes(tier);
    },
    [allowedTiers],
  );

  const needsUpgrade = useMemo(() => {
    return isGuest || (allowedTiers.length === 1 && allowedTiers[0] === 1);
  }, [allowedTiers, isGuest]);

  return { allowedTiers, canUseModel, canUseTier, isGuest, loading: isLoading, needsUpgrade };
};
