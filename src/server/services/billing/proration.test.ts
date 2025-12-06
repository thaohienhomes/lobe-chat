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
    it('should have correct pricing for all plans', () => {
      expect(PLAN_PRICING.free).toEqual({ monthly: 0, yearly: 0 });
      expect(PLAN_PRICING.starter).toEqual({ monthly: 39_000, yearly: 390_000 });
      expect(PLAN_PRICING.premium).toEqual({ monthly: 129_000, yearly: 1_290_000 });
      expect(PLAN_PRICING.ultimate).toEqual({ monthly: 349_000, yearly: 3_490_000 });
    });
  });

  describe('PLAN_TIERS', () => {
    it('should have correct tier hierarchy', () => {
      expect(PLAN_TIERS.free).toBe(0);
      expect(PLAN_TIERS.starter).toBe(1);
      expect(PLAN_TIERS.premium).toBe(2);
      expect(PLAN_TIERS.ultimate).toBe(3);
    });
  });

  describe('getPlanChangeType', () => {
    it('should detect upgrade from free to starter', () => {
      const result = getPlanChangeType('free', 'starter');
      expect(result.isUpgrade).toBe(true);
      expect(result.isDowngrade).toBe(false);
    });

    it('should detect upgrade from starter to premium', () => {
      const result = getPlanChangeType('starter', 'premium');
      expect(result.isUpgrade).toBe(true);
      expect(result.isDowngrade).toBe(false);
    });

    it('should detect downgrade from premium to starter', () => {
      const result = getPlanChangeType('premium', 'starter');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(true);
    });

    it('should detect downgrade from ultimate to free', () => {
      const result = getPlanChangeType('ultimate', 'free');
      expect(result.isUpgrade).toBe(false);
      expect(result.isDowngrade).toBe(true);
    });

    it('should handle same plan (no change)', () => {
      const result = getPlanChangeType('premium', 'premium');
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
      const amount = calculateProratedAmount('free', 'starter', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(39_000); // Full starter monthly price
    });

    it('should charge full price when upgrading from free plan (yearly)', () => {
      const amount = calculateProratedAmount('free', 'premium', 'yearly', periodEnd15Days, now);
      expect(amount).toBe(1_290_000); // Full premium yearly price
    });

    it('should calculate positive proration for upgrade (starter to premium)', () => {
      // 15 days remaining out of 30
      // Starter daily: 39000/30 = 1300
      // Premium daily: 129000/30 = 4300
      // Credit: 1300 * 15 = 19500
      // Charge: 4300 * 15 = 64500
      // Prorated: 64500 - 19500 = 45000
      const amount = calculateProratedAmount('starter', 'premium', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(45_000);
    });

    it('should calculate negative proration for downgrade (premium to starter)', () => {
      // 15 days remaining out of 30
      // Premium daily: 129000/30 = 4300
      // Starter daily: 39000/30 = 1300
      // Credit: 4300 * 15 = 64500
      // Charge: 1300 * 15 = 19500
      // Prorated: 19500 - 64500 = -45000
      const amount = calculateProratedAmount('premium', 'starter', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(-45_000);
    });

    it('should return 0 for same plan', () => {
      const amount = calculateProratedAmount('premium', 'premium', 'monthly', periodEnd15Days, now);
      expect(amount).toBe(0);
    });

    it('should handle yearly billing cycle', () => {
      const periodEnd100Days = new Date('2025-04-25'); // ~100 days from Jan 15
      // Starter yearly: 390000/365 ≈ 1068.49
      // Premium yearly: 1290000/365 ≈ 3534.25
      // 100 days remaining
      // Credit: 1068.49 * 100 ≈ 106849
      // Charge: 3534.25 * 100 ≈ 353425
      // Prorated: 353425 - 106849 ≈ 246576
      const amount = calculateProratedAmount('starter', 'premium', 'yearly', periodEnd100Days, now);
      expect(amount).toBeGreaterThan(240_000);
      expect(amount).toBeLessThan(250_000);
    });

    it('should handle unknown plan as free (0 cost)', () => {
      const amount = calculateProratedAmount('unknown_plan', 'starter', 'monthly', periodEnd15Days, now);
      // Unknown plan treated as 0 cost, so charge full prorated starter
      // Starter daily: 39000/30 = 1300
      // Charge: 1300 * 15 = 19500
      expect(amount).toBe(19_500);
    });
  });
});

