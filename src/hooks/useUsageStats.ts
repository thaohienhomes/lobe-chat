/**
 * Hook to fetch user's current usage statistics
 * Based on PRICING_MASTERPLAN.md.md Phở Points system
 *
 * Provides:
 * - Current Phở Points balance
 * - Daily Tier 2/Tier 3 usage counts
 * - Plan limits and reset dates
 */
import useSWR from 'swr';

// ============================================================================
// TYPES
// ============================================================================

export interface UsageStats {
  // Points
  currentPlanId: string;
  // Daily Tier Usage
  dailyTier2Count: number;
  dailyTier2Limit: number;
  // -1 = unlimited
  dailyTier3Count: number;

  dailyTier3Limit: number;
  phoPointsBalance: number; 
  pointsResetDate: string | null;
  // -1 = unlimited
// Gamification
  streakDays: number; 

  totalMonthlyPoints: number;
}

export interface UseUsageStatsResult {
  error: Error | undefined;
  isLoading: boolean;
  mutate: () => void;
  stats: UsageStats | null;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async (url: string): Promise<UsageStats> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch usage stats');
  }
  return response.json();
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get user's current usage statistics
 *
 * @example
 * ```tsx
 * const { stats, isLoading } = useUsageStats();
 *
 * return (
 *   <div>
 *     <p>Points: {stats?.phoPointsBalance.toLocaleString()}</p>
 *     <p>Tier 2 today: {stats?.dailyTier2Count}/{stats?.dailyTier2Limit}</p>
 *   </div>
 * );
 * ```
 */
export function useUsageStats(): UseUsageStatsResult {
  const { data, error, isLoading, mutate } = useSWR<UsageStats>(
    '/api/subscription/usage-stats',
    fetcher,
    {
      // Refresh every 30 seconds for real-time updates
      refreshInterval: 30_000,
      revalidateOnFocus: true,
    },
  );

  return {
    error,
    isLoading,
    mutate,
    stats: data || null,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate percentage of points used
 */
export function getPointsUsagePercent(stats: UsageStats): number {
  if (stats.totalMonthlyPoints === 0) return 0;
  const used = stats.totalMonthlyPoints - stats.phoPointsBalance;
  return Math.min(100, Math.max(0, (used / stats.totalMonthlyPoints) * 100));
}

/**
 * Calculate percentage of daily tier usage
 */
export function getTierUsagePercent(count: number, limit: number): number {
  if (limit === -1) return 0; // Unlimited
  if (limit === 0) return 100; // No access
  return Math.min(100, Math.max(0, (count / limit) * 100));
}

/**
 * Format points for display
 */
export function formatPoints(points: number): string {
  if (points >= 1_000_000) {
    return `${(points / 1_000_000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(0)}K`;
  }
  return points.toString();
}

/**
 * Get days until points reset
 */
export function getDaysUntilReset(resetDate: string | null): number {
  if (!resetDate) return 0;
  const reset = new Date(resetDate);
  const now = new Date();
  const diff = reset.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default useUsageStats;
