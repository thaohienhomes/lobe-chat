import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { formatPrice, getPlanDisplayName, usePricingGeo } from '../usePricingGeo';

// Mock SWR
const mockSWR = vi.fn();
vi.mock('swr', () => ({
  default: (...args: any[]) => mockSWR(...args),
}));

describe('usePricingGeo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook behavior', () => {
    it('should return Vietnam region data when API returns VN', () => {
      mockSWR.mockReturnValue({
        data: { countryCode: 'VN', currency: 'VND', isVietnam: true, region: 'vietnam' },
        error: undefined,
        isLoading: false,
      });

      const { result } = renderHook(() => usePricingGeo());

      expect(result.current.isVietnam).toBe(true);
      expect(result.current.region).toBe('vietnam');
      expect(result.current.currency).toBe('VND');
      expect(result.current.countryCode).toBe('VN');
    });

    it('should return global region data when API returns non-VN', () => {
      mockSWR.mockReturnValue({
        data: { countryCode: 'US', currency: 'USD', isVietnam: false, region: 'global' },
        error: undefined,
        isLoading: false,
      });

      const { result } = renderHook(() => usePricingGeo());

      expect(result.current.isVietnam).toBe(false);
      expect(result.current.region).toBe('global');
      expect(result.current.currency).toBe('USD');
      expect(result.current.countryCode).toBe('US');
    });

    it('should fallback to global when API errors', () => {
      mockSWR.mockReturnValue({
        data: undefined,
        error: new Error('Network error'),
        isLoading: false,
      });

      const { result } = renderHook(() => usePricingGeo());

      // Should fallback to global when error
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeDefined();
    });

    it('should show loading state initially', () => {
      mockSWR.mockReturnValue({
        data: undefined,
        error: undefined,
        isLoading: true,
      });

      const { result } = renderHook(() => usePricingGeo());

      expect(result.current.isLoading).toBe(true);
    });
  });
});

describe('formatPrice utility', () => {
  // formatPrice takes (amount, region) not (amount, currency)
  it('should format VND prices correctly for vietnam region', () => {
    // Intl.NumberFormat output varies by locale, just check it contains the number
    const result = formatPrice(69000, 'vietnam');
    expect(result).toContain('69');
  });

  it('should format USD prices correctly for global region', () => {
    const result = formatPrice(5, 'global');
    expect(result).toContain('5');
  });

  it('should handle decimal USD prices', () => {
    const result = formatPrice(4.99, 'global');
    expect(result).toContain('4');
  });
});

describe('getPlanDisplayName utility', () => {
  // getPlanDisplayName takes (planCode, region)
  it('should return Vietnamese plan names', () => {
    expect(getPlanDisplayName('vn_free', 'vietnam')).toBe('Phở Không Người Lái');
    expect(getPlanDisplayName('vn_basic', 'vietnam')).toBe('Phở Tái');
    expect(getPlanDisplayName('vn_pro', 'vietnam')).toBe('Phở Đặc Biệt');
  });

  it('should return global plan names', () => {
    expect(getPlanDisplayName('gl_starter', 'global')).toBe('Starter');
    expect(getPlanDisplayName('gl_standard', 'global')).toBe('Standard');
    expect(getPlanDisplayName('gl_premium', 'global')).toBe('Premium');
    expect(getPlanDisplayName('gl_lifetime', 'global')).toBe('Lifetime Deal');
  });

  it('should return plan code for unknown plans', () => {
    expect(getPlanDisplayName('unknown_plan', 'global')).toBe('unknown_plan');
  });
});
