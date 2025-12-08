import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type UsageStats,
  formatPoints,
  getDaysUntilReset,
  getPointsUsagePercent,
  getTierUsagePercent,
  useUsageStats,
} from '../useUsageStats';

// Mock SWR
const mockSWR = vi.fn();
vi.mock('swr', () => ({
  default: (...args: any[]) => mockSWR(...args),
}));

const mockStats: UsageStats = {
  currentPlanId: 'vn_basic',
  dailyTier2Count: 15,
  dailyTier2Limit: 30,
  dailyTier3Count: 5,
  dailyTier3Limit: 50,
  phoPointsBalance: 150_000,
  pointsResetDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  streakDays: 7,
  totalMonthlyPoints: 300_000,
};

describe('useUsageStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return usage stats from API', () => {
    mockSWR.mockReturnValue({
      data: mockStats,
      error: undefined,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useUsageStats());

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should show loading state', () => {
    mockSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useUsageStats());

    expect(result.current.isLoading).toBe(true);
    // stats is null when no data, not undefined
    expect(result.current.stats).toBeNull();
  });

  it('should handle errors', () => {
    const error = new Error('API Error');
    mockSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      mutate: vi.fn(),
    });

    const { result } = renderHook(() => useUsageStats());

    expect(result.current.error).toBe(error);
    // stats is null when no data
    expect(result.current.stats).toBeNull();
  });
});

describe('getPointsUsagePercent', () => {
  it('should calculate usage percentage correctly', () => {
    expect(getPointsUsagePercent(mockStats)).toBe(50);
  });

  it('should return 0 for full balance', () => {
    const fullStats = { ...mockStats, phoPointsBalance: 300_000 };
    expect(getPointsUsagePercent(fullStats)).toBe(0);
  });

  it('should return 100 for empty balance', () => {
    const emptyStats = { ...mockStats, phoPointsBalance: 0 };
    expect(getPointsUsagePercent(emptyStats)).toBe(100);
  });

  it('should handle zero total points', () => {
    const zeroStats = { ...mockStats, totalMonthlyPoints: 0 };
    expect(getPointsUsagePercent(zeroStats)).toBe(0);
  });
});

describe('getTierUsagePercent', () => {
  it('should calculate tier usage percentage correctly', () => {
    expect(getTierUsagePercent(15, 30)).toBe(50);
    expect(getTierUsagePercent(30, 30)).toBe(100);
    expect(getTierUsagePercent(0, 30)).toBe(0);
  });

  // limit=0 means "no access" which returns 100%
  it('should return 100 for no access (0 limit)', () => {
    expect(getTierUsagePercent(10, 0)).toBe(100);
  });

  // limit=-1 means "unlimited" which returns 0%
  it('should return 0 for unlimited (-1 limit)', () => {
    expect(getTierUsagePercent(10, -1)).toBe(0);
  });
});

describe('formatPoints', () => {
  // formatPoints uses toFixed(0) for K, so 1500 -> "2K" (rounded)
  it('should format points with K suffix for thousands', () => {
    expect(formatPoints(2000)).toBe('2K');
    expect(formatPoints(50000)).toBe('50K');
    expect(formatPoints(150000)).toBe('150K');
  });

  // formatPoints uses toFixed(1) for M
  it('should format points with M suffix for millions', () => {
    expect(formatPoints(2000000)).toBe('2.0M');
    expect(formatPoints(1500000)).toBe('1.5M');
  });

  it('should not use suffix for small numbers', () => {
    expect(formatPoints(500)).toBe('500');
    expect(formatPoints(999)).toBe('999');
  });
});

describe('getDaysUntilReset', () => {
  it('should calculate days until reset', () => {
    const futureDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    // May be 10 or 11 depending on time of day
    const days = getDaysUntilReset(futureDate);
    expect(days).toBeGreaterThanOrEqual(10);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('should return 0 for past dates', () => {
    const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(getDaysUntilReset(pastDate)).toBe(0);
  });

  it('should return 0 for null date', () => {
    expect(getDaysUntilReset(null)).toBe(0);
  });
});
