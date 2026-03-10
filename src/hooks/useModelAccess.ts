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

interface UsageStatsData {
  dailyTier2Count: number;
  dailyTier2Limit: number;
  dailyTier3Count: number;
  dailyTier3Limit: number;
}

const fetchModelAccess = async (): Promise<AllowedModelsData | null> => {
  const response = await fetch('/api/subscription/models/allowed');
  if (!response.ok) return null;
  const data = await response.json();
  if (data.success && data.data) return data.data;
  return null;
};

const fetchUsageStats = async (): Promise<UsageStatsData | null> => {
  try {
    const response = await fetch('/api/subscription/usage-stats');
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

/**
 * Shared hook for model access checks.
 * Uses SWR to deduplicate and cache the /api/subscription/models/allowed call
 * across all components that mount simultaneously.
 *
 * Also fetches daily usage stats to enforce daily quota limits client-side.
 */
export const useModelAccess = () => {
  const { data, isLoading } = useSWR('model-access-allowed', fetchModelAccess, {
    dedupingInterval: 300_000, // 5 minutes — don't refetch within this window
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  const { data: usageStats } = useSWR('model-access-usage-stats', fetchUsageStats, {
    dedupingInterval: 60_000, // 1 minute — usage changes more frequently
    revalidateOnFocus: true,
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
      if (!allowedTiers.includes(tier)) return false;

      // Check daily quota for Tier 2/3
      if (usageStats && tier === 2 && usageStats.dailyTier2Limit > 0) {
        if (usageStats.dailyTier2Count >= usageStats.dailyTier2Limit) return false;
      }
      if (usageStats && tier === 3 && usageStats.dailyTier3Limit > 0) {
        if (usageStats.dailyTier3Count >= usageStats.dailyTier3Limit) return false;
      }

      return true;
    },
    [allowedTiers, usageStats],
  );

  // Check tier access including daily quota
  const canUseTier = useCallback(
    (modelId: string) => {
      const tier = modelId.toLowerCase().includes('auto') ? 0 : getModelTier(modelId);
      if (tier === 0) return true;
      if (!allowedTiers.includes(tier)) return false;

      // Check daily quota for Tier 2/3
      if (usageStats && tier === 2 && usageStats.dailyTier2Limit > 0) {
        if (usageStats.dailyTier2Count >= usageStats.dailyTier2Limit) return false;
      }
      if (usageStats && tier === 3 && usageStats.dailyTier3Limit > 0) {
        if (usageStats.dailyTier3Count >= usageStats.dailyTier3Limit) return false;
      }

      return true;
    },
    [allowedTiers, usageStats],
  );

  const needsUpgrade = useMemo(() => {
    return isGuest || (allowedTiers.length === 1 && allowedTiers[0] === 1);
  }, [allowedTiers, isGuest]);

  return {
    allowedTiers,
    canUseModel,
    canUseTier,
    isGuest,
    loading: isLoading,
    needsUpgrade,
    usageStats,
  };
};
