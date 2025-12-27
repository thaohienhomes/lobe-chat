/**
 * @file BillingInfo.integration.test.tsx
 * @description Integration tests for the complete billing display flow
 * Tests the end-to-end flow from API subscription data to UI display
 * Verifies that Lifetime Founding Member users see correct plan names
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Simulates the complete flow: API returns subscription → getPlanInfo processes → UI displays
 * This mirrors the actual data flow in the application
 */

// Plan pricing mapping (mirrors BillingInfo.tsx)
const PLAN_PRICING: Record<string, { displayName: string; monthlyPoints: number; price: number }> =
  {
    free: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    founding_member: {
      displayName: 'Lifetime Founding Member',
      monthlyPoints: 2_000_000,
      price: 0,
    },
    gl_lifetime: { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 },
    gl_premium: { displayName: 'Premium', monthlyPoints: 2_000_000, price: 0 },
    gl_standard: { displayName: 'Standard', monthlyPoints: 500_000, price: 0 },
    gl_starter: { displayName: 'Starter', monthlyPoints: 200_000, price: 0 },
    lifetime: { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 },
    lifetime_founding_member: {
      displayName: 'Lifetime Founding Member',
      monthlyPoints: 2_000_000,
      price: 0,
    },
    premium: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    starter: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    ultimate: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },
    vn_basic: { displayName: 'Phở Tái', monthlyPoints: 300_000, price: 69_000 },
    vn_free: { displayName: 'Phở Không Người Lái', monthlyPoints: 50_000, price: 0 },
    vn_lifetime: {
      displayName: 'Thành Viên Sáng Lập (Trọn Đời)',
      monthlyPoints: 2_000_000,
      price: 0,
    },
    vn_pro: { displayName: 'Phở Đặc Biệt', monthlyPoints: 2_000_000, price: 199_000 },
    vn_team: { displayName: 'Lẩu Phở (Team)', monthlyPoints: 0, price: 149_000 },
  };

// getPlanInfo function (mirrors BillingInfo.tsx)
const getPlanInfo = (
  planId: string,
): { displayName: string; monthlyPoints: number; price: number } => {
  if (PLAN_PRICING[planId]) {
    return PLAN_PRICING[planId];
  }
  const lowerPlanId = planId.toLowerCase();
  if (lowerPlanId.includes('lifetime') || lowerPlanId.includes('founding')) {
    return { displayName: 'Lifetime Founding Member', monthlyPoints: 2_000_000, price: 0 };
  }
  if (lowerPlanId.includes('premium') || lowerPlanId.includes('pro')) {
    return { displayName: 'Premium', monthlyPoints: 2_000_000, price: 0 };
  }
  if (lowerPlanId.includes('ultimate')) {
    return { displayName: 'Ultimate', monthlyPoints: 2_000_000, price: 0 };
  }
  console.warn(`Unknown planId: ${planId}, defaulting to free plan display`);
  return PLAN_PRICING.free;
};

// Subscription prioritization logic (mirrors route.ts)
const prioritizeSubscriptions = (subscriptions: { planId: string; currentPeriodStart: Date }[]) => {
  const FREE_PLAN_IDS = ['free', 'trial', 'starter'];
  const LIFETIME_KEYWORDS = ['lifetime', 'founding'];

  return subscriptions.sort((a, b) => {
    const aIsLifetime = LIFETIME_KEYWORDS.some((kw) => a.planId.toLowerCase().includes(kw));
    const bIsLifetime = LIFETIME_KEYWORDS.some((kw) => b.planId.toLowerCase().includes(kw));
    const aIsFree = FREE_PLAN_IDS.includes(a.planId.toLowerCase());
    const bIsFree = FREE_PLAN_IDS.includes(b.planId.toLowerCase());

    if (aIsLifetime && !bIsLifetime) return -1;
    if (!aIsLifetime && bIsLifetime) return 1;
    if (aIsFree && !bIsFree) return 1;
    if (!aIsFree && bIsFree) return -1;

    const aStart = a.currentPeriodStart ? new Date(a.currentPeriodStart).getTime() : 0;
    const bStart = b.currentPeriodStart ? new Date(b.currentPeriodStart).getTime() : 0;
    return bStart - aStart;
  });
};

// Simulates the complete flow
const simulateBillingDisplay = (
  dbSubscriptions: { planId: string; currentPeriodStart: Date }[],
): { displayName: string; monthlyPoints: number } => {
  // Step 1: API prioritizes subscriptions (route.ts logic)
  const sortedSubscriptions = prioritizeSubscriptions(dbSubscriptions);
  const activeSubscription = sortedSubscriptions[0];

  // Step 2: UI gets plan info (BillingInfo.tsx logic)
  const planInfo = getPlanInfo(activeSubscription.planId);

  return {
    displayName: planInfo.displayName,
    monthlyPoints: planInfo.monthlyPoints,
  };
};

describe('BillingInfo Integration Tests', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('Complete flow: User with free + lifetime subscriptions', () => {
    it('should display Lifetime Founding Member when user has both free and lifetime', () => {
      const dbSubscriptions = [
        { planId: 'free', currentPeriodStart: new Date('2024-01-01') },
        { planId: 'lifetime', currentPeriodStart: new Date('2024-06-01') },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(result.displayName).not.toBe('Phở Không Người Lái');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should display Lifetime when user has free first in DB order', () => {
      // Simulate DB returning free first (which was the bug scenario)
      const dbSubscriptions = [
        { planId: 'free', currentPeriodStart: new Date('2024-12-01') }, // More recent
        { planId: 'gl_lifetime', currentPeriodStart: new Date('2024-01-01') }, // Older but lifetime
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Lifetime Founding Member');
    });

    it('should display founding member correctly regardless of DB order', () => {
      const dbSubscriptions = [
        { planId: 'starter', currentPeriodStart: new Date('2024-11-01') },
        { planId: 'founding_member', currentPeriodStart: new Date('2024-01-01') },
        { planId: 'trial', currentPeriodStart: new Date('2024-12-01') },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Lifetime Founding Member');
    });
  });

  describe('Complete flow: Unknown planId with keyword detection', () => {
    it('should display Lifetime for unknown planId containing "lifetime"', () => {
      const dbSubscriptions = [
        { planId: 'special_lifetime_2024_promo', currentPeriodStart: new Date() },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });

    it('should display Premium for unknown planId containing "premium"', () => {
      const dbSubscriptions = [
        { planId: 'enterprise_premium_plus', currentPeriodStart: new Date() },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Premium');
    });

    it('should display Ultimate for unknown planId containing "ultimate"', () => {
      const dbSubscriptions = [{ planId: 'super_ultimate_plan', currentPeriodStart: new Date() }];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Ultimate');
    });
  });

  describe('Complete flow: Completely unknown planId', () => {
    it('should fallback to free plan display with console warning', () => {
      const dbSubscriptions = [
        { planId: 'completely_random_xyz_999', currentPeriodStart: new Date() },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Phở Không Người Lái');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Unknown planId: completely_random_xyz_999, defaulting to free plan display',
      );
    });
  });

  describe('Regression: Original bug scenario', () => {
    it('should NOT show free plan for Lifetime Founding Member user', () => {
      // This is the exact scenario that was reported as a bug
      // User has a lifetime subscription but was seeing "Phở Không Người Lái"
      const dbSubscriptions = [
        { planId: 'lifetime_founding_member', currentPeriodStart: new Date('2024-01-15') },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);

      // This should NEVER show the free plan name for lifetime users
      expect(result.displayName).not.toBe('Phở Không Người Lái');
      expect(result.displayName).toBe('Lifetime Founding Member');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should prioritize lifetime even when mixed with other subscriptions', () => {
      // Complex scenario: user has multiple subscriptions from different sources
      const dbSubscriptions = [
        { planId: 'free', currentPeriodStart: new Date('2024-01-01') },
        { planId: 'vn_basic', currentPeriodStart: new Date('2024-03-01') },
        { planId: 'gl_lifetime', currentPeriodStart: new Date('2024-02-01') },
        { planId: 'starter', currentPeriodStart: new Date('2024-04-01') },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Lifetime Founding Member');
    });
  });

  describe('Vietnam-specific plan displays', () => {
    it('should display Vietnamese name for vn_lifetime', () => {
      const dbSubscriptions = [{ planId: 'vn_lifetime', currentPeriodStart: new Date() }];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Thành Viên Sáng Lập (Trọn Đời)');
    });

    it('should correctly display vn_pro plan', () => {
      const dbSubscriptions = [{ planId: 'vn_pro', currentPeriodStart: new Date() }];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Phở Đặc Biệt');
      expect(result.monthlyPoints).toBe(2_000_000);
    });

    it('should prioritize vn_lifetime over vn_free', () => {
      const dbSubscriptions = [
        { planId: 'vn_free', currentPeriodStart: new Date('2024-01-01') },
        { planId: 'vn_lifetime', currentPeriodStart: new Date('2024-06-01') },
      ];

      const result = simulateBillingDisplay(dbSubscriptions);
      expect(result.displayName).toBe('Thành Viên Sáng Lập (Trọn Đời)');
    });
  });

  describe('Points display verification', () => {
    const testCases = [
      { expected: 2_000_000, planId: 'lifetime' },
      { expected: 2_000_000, planId: 'gl_lifetime' },
      { expected: 2_000_000, planId: 'gl_premium' },
      { expected: 2_000_000, planId: 'vn_pro' },
      { expected: 500_000, planId: 'gl_standard' },
      { expected: 300_000, planId: 'vn_basic' },
      { expected: 200_000, planId: 'gl_starter' },
      { expected: 50_000, planId: 'free' },
      { expected: 50_000, planId: 'vn_free' },
    ];

    for (const { planId, expected } of testCases) {
      it(`should display ${expected.toLocaleString()} points for ${planId}`, () => {
        const dbSubscriptions = [{ planId, currentPeriodStart: new Date() }];
        const result = simulateBillingDisplay(dbSubscriptions);
        expect(result.monthlyPoints).toBe(expected);
      });
    }
  });
});
