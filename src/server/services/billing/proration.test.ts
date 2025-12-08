import { describe, expect, it } from 'vitest';

import {
  PLAN_PRICING,
  PLAN_TIERS,
  calculateDaysRemaining,
  calculateProratedAmount,
  getPlanChangeType,
} from './proration';

describe('proration utilities', () => {
  describe('PLAN_PRICING', () => {
    it('should have correct pricing for all plans (Phở Points system)', () => {
      // Free/Starter tier (legacy mapping)
      expect(PLAN_PRICING.free).toEqual({ monthly: 0, monthlyPoints: 50_000, yearly: 0 });
      expect(PLAN_PRICING.starter).toEqual({ monthly: 0, monthlyPoints: 50_000, yearly: 0 });

      // Premium tier (maps to vn_basic)
      expect(PLAN_PRICING.premium).toEqual({
        monthly: 69_000,
        monthlyPoints: 300_000,
        yearly: 690_000,
      });

      // Ultimate tier (maps to vn_pro)
      expect(PLAN_PRICING.ultimate).toEqual({
        monthly: 199_000,
        monthlyPoints: 2_000_000,
        yearly: 1_990_000,
      });

      // Vietnam Plans
      expect(PLAN_PRICING.vn_free).toEqual({ monthly: 0, monthlyPoints: 50_000, yearly: 0 });
      expect(PLAN_PRICING.vn_basic).toEqual({
        monthly: 69_000,
        monthlyPoints: 300_000,
        yearly: 690_000,
      });
      expect(PLAN_PRICING.vn_pro).toEqual({
        monthly: 199_000,
        monthlyPoints: 2_000_000,
        yearly: 1_990_000,
      });
    });
  });

  describe('PLAN_TIERS', () => {
    it('should have correct tier hierarchy (Phở Points system)', () => {
      // Legacy mappings
      expect(PLAN_TIERS.free).toBe(0);
      expect(PLAN_TIERS.starter).toBe(0); // Starter maps to free tier
      expect(PLAN_TIERS.premium).toBe(1); // Premium maps to vn_basic
      expect(PLAN_TIERS.ultimate).toBe(2); // Ultimate maps to vn_pro

      // Vietnam Plans
      expect(PLAN_TIERS.vn_free).toBe(0);
      expect(PLAN_TIERS.vn_basic).toBe(1);
      expect(PLAN_TIERS.vn_pro).toBe(2);
      expect(PLAN_TIERS.vn_team).toBe(3);
    });
  });

  describe('getPlanChangeType', () => {
    it('should detect upgrade from vn_free to vn_basic', () => {
      const result = getPlanChangeType('vn_free', 'vn_basic');
      expect(result.isUpgrade).toBe(true);
      expect(result.isDowngrade).toBe(false);
    });

    it('should detect upgrade from vn_basic to vn_pro', () => {
      const result = getPlanChangeType('vn_basic', 'vn_pro');
      expect(result.isUpgrade).toBe(true);
      expect(result.isDowngrade).toBe(false);
    });

    it('should detect downgrade from vn_pro to vn_basic', () => {
      const result = getPlanChangeType('vn_pro', 'vn_basic');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(true);
    });

    it('should detect downgrade from vn_pro to vn_free', () => {
      const result = getPlanChangeType('vn_pro', 'vn_free');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(true);
    });

    it('should handle same plan (no change)', () => {
      const result = getPlanChangeType('vn_basic', 'vn_basic');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(false);
    });

    it('should handle legacy plan mappings', () => {
      // free and starter are both tier 0
      const result = getPlanChangeType('free', 'starter');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(false);
    });
  });

  describe('calculateDaysRemaining', () => {
    it('should calculate days remaining correctly', () => {
      const now = new Date('2025-01-15');
      const periodEnd = new Date('2025-01-30');
      expect(calculateDaysRemaining(periodEnd, now)).toBe(15);
    });

    it('should return 0 for past period end', () => {
      const now = new Date('2025-01-15');
      const periodEnd = new Date('2025-01-10');
      expect(calculateDaysRemaining(periodEnd, now)).toBe(0);
    });
  });

  describe('calculateProratedAmount', () => {
    const now = new Date('2025-01-15');
    const periodEnd15Days = new Date('2025-01-30'); // 15 days remaining

    it('should charge full price when upgrading from free plan (monthly)', () => {
      const amount = calculateProratedAmount('free', 'vn_basic', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(69_000); // Full vn_basic monthly price
    });

    it('should charge full price when upgrading from free plan (yearly)', () => {
      const amount = calculateProratedAmount('free', 'vn_pro', 'yearly', periodEnd15Days, now);
      expect(amount).toBe(1_990_000); // Full vn_pro yearly price
    });

    it('should calculate positive proration for upgrade (vn_basic to vn_pro)', () => {
      // 15 days remaining out of 30
      // vn_basic daily: 69000/30 = 2300
      // vn_pro daily: 199000/30 = 6633.33
      // Credit: 2300 * 15 = 34500
      // Charge: 6633.33 * 15 = 99500
      // Prorated: 99500 - 34500 = 65000
      const amount = calculateProratedAmount('vn_basic', 'vn_pro', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(65_000);
    });

    it('should calculate negative proration for downgrade (vn_pro to vn_basic)', () => {
      // 15 days remaining out of 30
      // vn_pro daily: 199000/30 = 6633.33
      // vn_basic daily: 69000/30 = 2300
      // Credit: 6633.33 * 15 = 99500
      // Charge: 2300 * 15 = 34500
      // Prorated: 34500 - 99500 = -65000
      const amount = calculateProratedAmount('vn_pro', 'vn_basic', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(-65_000);
    });

    it('should return 0 for same plan', () => {
      const amount = calculateProratedAmount(
        'vn_basic',
        'vn_basic',
        'monthly',
        periodEnd15Days,
        now,
      );
      expect(amount).toBe(0);
    });

    it('should handle yearly billing cycle', () => {
      const periodEnd100Days = new Date('2025-04-25'); // ~100 days from Jan 15
      // vn_basic yearly: 690000/365 ≈ 1890.41
      // vn_pro yearly: 1990000/365 ≈ 5452.05
      // 100 days remaining
      // Credit: 1890.41 * 100 ≈ 189041
      // Charge: 5452.05 * 100 ≈ 545205
      // Prorated: 545205 - 189041 ≈ 356164
      const amount = calculateProratedAmount('vn_basic', 'vn_pro', 'yearly', periodEnd100Days, now);
      expect(amount).toBeGreaterThan(350_000);
      expect(amount).toBeLessThan(360_000);
    });

    it('should handle unknown plan as free (0 cost)', () => {
      const amount = calculateProratedAmount(
        'unknown_plan',
        'vn_basic',
        'monthly',
        periodEnd15Days,
        now,
      );
      // Unknown plan treated as 0 cost, so charge full prorated vn_basic
      // vn_basic daily: 69000/30 = 2300
      // Charge: 2300 * 15 = 34500
      expect(amount).toBe(34_500);
    });
  });
});
