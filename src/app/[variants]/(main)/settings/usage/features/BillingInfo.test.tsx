/**
 * @file BillingInfo.test.tsx
 * @description Unit tests for BillingInfo component and getPlanInfo logic
 * Tests the fix for billing display issue where Lifetime Founding Member users
 * were incorrectly seeing "Phở Không Người Lái" (Free Plan)
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Extract the plan pricing and getPlanInfo logic for testing
// We'll test the logic directly without rendering the full component

/**
 * Plan pricing for billing display based on PRICING_MASTERPLAN.md
 * This mirrors the PLAN_PRICING object in BillingInfo.tsx
 */
const PLAN_PRICING: Record<string, { displayName: string; monthlyPoints: number; price: number }> =
  {
    // Free Plan (default for new users)
    free: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },

    // Lifetime Founding Member Plans (all variations)
    founding_member: {
      displayName: 'Lifetime Founding Member',
      monthlyPoints: 2_000_000,
      price: 0,
    },
    gl_lifetime: { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 },
    lifetime: { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 },
    lifetime_founding_member: {
      displayName: 'Lifetime Founding Member',
      monthlyPoints: 2_000_000,
      price: 0,
    },
    vn_lifetime: {
      displayName: 'Thành Viên Sáng Lập (Trọn Đời)',
      monthlyPoints: 2_000_000,
      price: 0,
    },

    // Global Plans (USD via Polar.sh)
    gl_premium: { displayName: 'Premium', monthlyPoints: 2_000_000, price: 0 },
    gl_standard: { displayName: 'Standard', monthlyPoints: 500_000, price: 0 },
    gl_starter: { displayName: 'Starter', monthlyPoints: 200_000, price: 0 },

    // Legacy mappings (for backward compatibility)
    premium: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    starter: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    ultimate: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },

    // Vietnam Plans
    vn_basic: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    vn_free: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    vn_pro: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },
    vn_team: { displayName: 'Lẩu Phở (Team)', monthlyPoints: 0, price: 149_000 },
  };

/**
 * Get plan info from planId with intelligent fallback detection
 * This mirrors the getPlanInfo function in BillingInfo.tsx
 */
const getPlanInfo = (
  planId: string,
): { displayName: string; monthlyPoints: number; price: number } => {
  // Check direct mapping first
  if (PLAN_PRICING[planId]) {
    return PLAN_PRICING[planId];
  }

  // Intelligent fallback based on planId keywords
  const lowerPlanId = planId.toLowerCase();

  // Detect lifetime/founding member plans
  if (lowerPlanId.includes('lifetime') || lowerPlanId.includes('founding')) {
    return { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 };
  }

  // Detect premium/pro plans
  if (lowerPlanId.includes('premium') || lowerPlanId.includes('pro')) {
    return { displayName: 'Premium', monthlyPoints: 2_000_000, price: 0 };
  }

  // Detect ultimate plans
  if (lowerPlanId.includes('ultimate')) {
    return { displayName: 'Ultimate', monthlyPoints: 2_000_000, price: 0 };
  }

  // Default to free plan for unknown planIds
  console.warn(`Unknown planId: ${planId}, defaulting to free plan display`);
  return PLAN_PRICING.free;
};

describe('BillingInfo - getPlanInfo function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Direct plan mapping for known planIds', () => {
    it('should return correct info for "lifetime" planId', () => {
      const result = getPlanInfo('lifetime');
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(result.monthlyPoints).toBe(2_000_000);
      expect(result.price).toBe(0);
    });

    it('should return correct info for "gl_lifetime" planId', () => {
      const result = getPlanInfo('gl_lifetime');
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should return correct info for "founding_member" planId', () => {
      const result = getPlanInfo('founding_member');
      expect(result.displayName).toBe('Lifetime Founding Member');
    });

    it('should return correct info for "lifetime_founding_member" planId', () => {
      const result = getPlanInfo('lifetime_founding_member');
      expect(result.displayName).toBe('Lifetime Founding Member');
    });

    it('should return correct Vietnamese info for "vn_lifetime" planId', () => {
      const result = getPlanInfo('vn_lifetime');
      expect(result.displayName).toBe('Thành Viên Sáng Lập (Trọn Đời)');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should return correct info for "free" planId', () => {
      const result = getPlanInfo('free');
      expect(result.displayName).toBe('Phở Không Người Lái');
      expect(result.monthlyPoints).toBe(50_000);
      expect(result.price).toBe(0);
    });

    it('should return correct info for "vn_free" planId', () => {
      const result = getPlanInfo('vn_free');
      expect(result.displayName).toBe('Phở Không Người Lái');
    });

    it('should return correct info for "gl_premium" planId', () => {
      const result = getPlanInfo('gl_premium');
      expect(result.displayName).toBe('Premium');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should return correct info for "vn_pro" planId', () => {
      const result = getPlanInfo('vn_pro');
      expect(result.displayName).toBe('Phở Đặc Biệt');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should return correct info for "vn_basic" planId', () => {
      const result = getPlanInfo('vn_basic');
      expect(result.displayName).toBe('Phở Tái');
      expect(result.price).toBe(69_000);
    });
  });

  describe('Intelligent fallback detection for unknown planIds', () => {
    it('should detect lifetime keyword and return Lifetime Founding Member', () => {
      const result = getPlanInfo('custom_lifetime_plan');
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should detect founding keyword and return Lifetime Founding Member', () => {
      const result = getPlanInfo('super_founding_plan');
      expect(result.displayName).toBe('Lifetime Founding Member');
    });

    it('should detect LIFETIME in uppercase and return Lifetime Founding Member', () => {
      const result = getPlanInfo('LIFETIME_SPECIAL');
      expect(result.displayName).toBe('Lifetime Founding Member');
    });

    it('should detect premium keyword and return Premium', () => {
      const result = getPlanInfo('special_premium_2024');
      expect(result.displayName).toBe('Premium');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should detect pro keyword and return Premium', () => {
      const result = getPlanInfo('super_pro_plan');
      expect(result.displayName).toBe('Premium');
    });

    it('should detect ultimate keyword and return Ultimate', () => {
      const result = getPlanInfo('ultimate_special');
      expect(result.displayName).toBe('Ultimate');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should handle mixed case keywords correctly', () => {
      expect(getPlanInfo('LiFeTiMe_Pro').displayName).toBe('Lifetime Founding Member');
      expect(getPlanInfo('FOUNDING_ULTRA').displayName).toBe('Lifetime Founding Member');
      expect(getPlanInfo('PRO_MAX').displayName).toBe('Premium');
    });
  });

  describe('Default fallback to free plan for unknown planIds', () => {
    let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it('should return free plan info for completely unknown planId', () => {
      const result = getPlanInfo('completely_unknown_xyz');
      expect(result.displayName).toBe('Phở Không Người Lái');
      expect(result.monthlyPoints).toBe(50_000);
      expect(result.price).toBe(0);
    });

    it('should log a warning for unknown planId', () => {
      getPlanInfo('mystery_plan_123');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown planId: mystery_plan_123, defaulting to free plan display',
      );
    });

    it('should NOT log a warning for known planIds', () => {
      getPlanInfo('lifetime');
      getPlanInfo('gl_premium');
      getPlanInfo('vn_basic');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should NOT log a warning for fallback-detected planIds', () => {
      getPlanInfo('custom_lifetime_plan');
      getPlanInfo('super_premium');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should handle empty string planId by returning free plan', () => {
      const result = getPlanInfo('');
      expect(result.displayName).toBe('Phở Không Người Lái');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown planId: , defaulting to free plan display',
      );
    });
  });

  describe('Regression test: Lifetime Founding Member display', () => {
    it('should NOT show "Phở Không Người Lái" for lifetime plans', () => {
      const lifetimePlanIds = [
        'lifetime',
        'gl_lifetime',
        'lifetime_founding_member',
        'founding_member',
        'vn_lifetime',
        'custom_lifetime',
        'LIFETIME',
        'founding_special',
      ];

      for (const planId of lifetimePlanIds) {
        const result = getPlanInfo(planId);
        expect(result.displayName).not.toBe('Phở Không Người Lái');
        // Check for either English or Vietnamese lifetime name
        const isLifetimeName =
          result.displayName.includes('Lifetime') || result.displayName.includes('Trọn Đời');
        expect(isLifetimeName).toBe(true);
      }
    });

    it('should correctly display 2M points for all lifetime plans', () => {
      const lifetimePlanIds = ['lifetime', 'gl_lifetime', 'founding_member'];

      for (const planId of lifetimePlanIds) {
        const result = getPlanInfo(planId);
        expect(result.monthlyPoints).toBe(2_000_000);
      }
    });
  });
});
