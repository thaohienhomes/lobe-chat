/**
 * Test Suite for Message Calculator
 *
 * Tests all message calculation functions to ensure accuracy
 * and consistency with pricing model.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import {
  PLAN_BUDGETS,
  calculateCostPerMessage,
  calculateMessagesForPlan,
  formatMessageCount,
  generateFeatureText,
  getTopModelsForPlan,
  validateCalculations,
} from '../messageCalculator';

describe('Message Calculator', () => {
  describe('calculateCostPerMessage', () => {
    it('should calculate correct cost for GPT-4o mini', () => {
      const cost = calculateCostPerMessage('gpt-4o-mini');
      // 100 input tokens * $0.00015/1K + 300 output tokens * $0.0006/1K
      // = 0.1 * 0.00015 + 0.3 * 0.0006 = 0.000015 + 0.00018 = 0.000195
      expect(cost).toBeCloseTo(0.000195, 6);
    });

    it('should calculate correct cost for Claude 3.5 Sonnet', () => {
      const cost = calculateCostPerMessage('claude-3-sonnet');
      // 100 input tokens * $0.003/1K + 300 output tokens * $0.015/1K
      // = 0.1 * 0.003 + 0.3 * 0.015 = 0.0003 + 0.0045 = 0.0048
      expect(cost).toBeCloseTo(0.0048, 6);
    });

    it('should calculate correct cost for Gemini 1.5 Flash', () => {
      const cost = calculateCostPerMessage('gemini-1.5-flash');
      // 100 input tokens * $0.000075/1K + 300 output tokens * $0.0003/1K
      // = 0.1 * 0.000075 + 0.3 * 0.0003 = 0.0000075 + 0.00009 = 0.0000975
      expect(cost).toBeCloseTo(0.0000975, 7);
    });

    it('should return 0 for unknown model', () => {
      const cost = calculateCostPerMessage('unknown-model');
      expect(cost).toBe(0);
    });
  });

  describe('calculateMessagesForPlan', () => {
    it('should calculate correct messages for vn_free plan (Phở Points system)', () => {
      const messages = calculateMessagesForPlan('vn_free');

      // Find GPT-4o mini in results
      const gpt4oMini = messages.find((m) => m.model === 'gpt-4o-mini');
      expect(gpt4oMini).toBeDefined();

      // vn_free has 50,000 Phở Points
      // GPT-4o mini cost: $0.000195/message * 1000 = 0.195 points per message
      // Expected: 50000 / 0.195 ≈ 256,410 messages
      expect(gpt4oMini!.messageCount).toBeGreaterThan(200_000);
    });

    it('should calculate correct messages for vn_basic plan (Phở Points system)', () => {
      const messages = calculateMessagesForPlan('vn_basic');

      // Find Gemini 1.5 Flash in results
      const geminiFlash = messages.find((m) => m.model === 'gemini-1.5-flash');
      expect(geminiFlash).toBeDefined();

      // vn_basic has 300,000 Phở Points
      // Gemini Flash cost: $0.0000975/message * 1000 = 0.0975 points per message
      // Expected: 300000 / 0.0975 ≈ 3,076,923 messages
      expect(geminiFlash!.messageCount).toBeGreaterThan(3_000_000);
    });

    it('should calculate correct messages for vn_pro plan (Phở Points system)', () => {
      const messages = calculateMessagesForPlan('vn_pro');

      // Find Claude 3.5 Sonnet in results
      const claudeSonnet = messages.find((m) => m.model === 'claude-3-sonnet');
      expect(claudeSonnet).toBeDefined();

      // vn_pro has 2,000,000 Phở Points
      // Claude Sonnet cost: $0.0048/message * 1000 = 4.8 points per message
      // Expected: 2000000 / 4.8 ≈ 416,666 messages
      expect(claudeSonnet!.messageCount).toBeGreaterThan(400_000);
    });

    it('should return all supported models', () => {
      const messages = calculateMessagesForPlan('starter');

      const expectedModels = [
        'gemini-1.5-flash',
        'gpt-4o-mini',
        'claude-3-haiku',
        'gemini-1.5-pro',
        'gpt-4o',
        'claude-3-sonnet',
      ];

      const actualModels = messages.map((m) => m.model);
      expectedModels.forEach((model) => {
        expect(actualModels).toContain(model);
      });
    });

    it('should sort models by message count (descending)', () => {
      const messages = calculateMessagesForPlan('starter');

      for (let i = 1; i < messages.length; i++) {
        expect(messages[i - 1].messageCount).toBeGreaterThanOrEqual(messages[i].messageCount);
      }
    });
  });

  describe('getTopModelsForPlan', () => {
    it('should return correct budget and premium models for Starter', () => {
      const { budgetModels, premiumModels } = getTopModelsForPlan('starter', 3, 3);

      expect(budgetModels).toHaveLength(3);
      expect(premiumModels).toHaveLength(3);

      // Budget models should be cheaper (more messages)
      const budgetModelNames = budgetModels.map((m) => m.model);
      expect(budgetModelNames).toContain('gemini-1.5-flash');
      expect(budgetModelNames).toContain('gpt-4o-mini');
      expect(budgetModelNames).toContain('claude-3-haiku');

      // Premium models should be more expensive (fewer messages)
      const premiumModelNames = premiumModels.map((m) => m.model);
      expect(premiumModelNames).toContain('gemini-1.5-pro');
      expect(premiumModelNames).toContain('gpt-4o');
      expect(premiumModelNames).toContain('claude-3-sonnet');
    });

    it('should respect custom limits', () => {
      const { budgetModels, premiumModels } = getTopModelsForPlan('premium', 2, 1);

      expect(budgetModels).toHaveLength(2);
      expect(premiumModels).toHaveLength(1);
    });

    it('should return models sorted by message count within each category', () => {
      const { budgetModels, premiumModels } = getTopModelsForPlan('ultimate');

      // Budget models should be sorted by message count (descending)
      for (let i = 1; i < budgetModels.length; i++) {
        expect(budgetModels[i - 1].messageCount).toBeGreaterThanOrEqual(
          budgetModels[i].messageCount,
        );
      }

      // Premium models should be sorted by message count (descending)
      for (let i = 1; i < premiumModels.length; i++) {
        expect(premiumModels[i - 1].messageCount).toBeGreaterThanOrEqual(
          premiumModels[i].messageCount,
        );
      }
    });
  });

  describe('formatMessageCount', () => {
    it('should format small numbers correctly', () => {
      expect(formatMessageCount(500)).toBe('500');
      expect(formatMessageCount(999)).toBe('999');
    });

    it('should format thousands correctly', () => {
      expect(formatMessageCount(1000)).toBe('1.0K');
      expect(formatMessageCount(1500)).toBe('1.5K');
      expect(formatMessageCount(8256)).toBe('8.3K');
      expect(formatMessageCount(54769)).toBe('54.8K');
    });

    it('should format millions correctly', () => {
      expect(formatMessageCount(1000000)).toBe('1.0M');
      expect(formatMessageCount(1500000)).toBe('1.5M');
    });

    it('should handle edge cases', () => {
      expect(formatMessageCount(0)).toBe('0');
      expect(formatMessageCount(1)).toBe('1');
      expect(formatMessageCount(999999)).toBe('1000.0K');
    });
  });

  describe('generateFeatureText', () => {
    it('should generate correct feature text', () => {
      const messageCalc = {
        model: 'gpt-4o-mini',
        modelName: 'GPT-4o mini',
        messageCount: 8256,
        costPerMessage: 0.000195,
        category: 'tier1' as const,
        tier: 1,
      };

      const text = generateFeatureText(messageCalc);
      expect(text).toBe('GPT-4o mini - ~8.3K messages');
    });

    it('should handle different models correctly', () => {
      const messageCalc = {
        model: 'claude-3-sonnet',
        modelName: 'Claude 3.5 Sonnet',
        messageCount: 3008,
        costPerMessage: 0.0048,
        category: 'tier2' as const,
        tier: 2,
      };

      const text = generateFeatureText(messageCalc);
      expect(text).toBe('Claude 3.5 Sonnet - ~3.0K messages');
    });
  });

  describe('validateCalculations', () => {
    it('should validate all calculations are reasonable', () => {
      const validation = validateCalculations();

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);

      // Check that all plans have reasonable message counts
      validation.results.forEach((result) => {
        expect(result.totalModels).toBeGreaterThan(0);
        expect(result.budgetModels).toBeGreaterThan(0);
        expect(result.premiumModels).toBeGreaterThan(0);

        // Budget models should have more messages than premium models
        expect(result.maxBudgetMessages).toBeGreaterThan(result.maxPremiumMessages);
      });
    });

    it('should detect if calculations are inconsistent', () => {
      // This test would catch if our calculations become inconsistent
      const starterMessages = calculateMessagesForPlan('starter');
      const premiumMessages = calculateMessagesForPlan('premium');
      const ultimateMessages = calculateMessagesForPlan('ultimate');

      // For the same model, higher tier should have more messages
      const modelToCheck = 'gpt-4o-mini';

      const starterGPT = starterMessages.find((m) => m.model === modelToCheck)!;
      const premiumGPT = premiumMessages.find((m) => m.model === modelToCheck)!;
      const ultimateGPT = ultimateMessages.find((m) => m.model === modelToCheck)!;

      expect(premiumGPT.messageCount).toBeGreaterThan(starterGPT.messageCount);
      expect(ultimateGPT.messageCount).toBeGreaterThan(premiumGPT.messageCount);
    });
  });

  describe('PLAN_BUDGETS', () => {
    it('should have correct budget values for Vietnam plans', () => {
      expect(PLAN_BUDGETS.vn_free.monthlyVND).toBe(0);
      expect(PLAN_BUDGETS.vn_free.monthlyPoints).toBe(50_000);

      expect(PLAN_BUDGETS.vn_basic.monthlyVND).toBe(69_000);
      expect(PLAN_BUDGETS.vn_basic.monthlyPoints).toBe(300_000);

      expect(PLAN_BUDGETS.vn_pro.monthlyVND).toBe(199_000);
      expect(PLAN_BUDGETS.vn_pro.monthlyPoints).toBe(2_000_000);
    });

    it('should have legacy plan mappings', () => {
      // Legacy plans should map to new plans
      expect(PLAN_BUDGETS.starter.monthlyPoints).toBe(50_000);
      expect(PLAN_BUDGETS.premium.monthlyPoints).toBe(300_000);
      expect(PLAN_BUDGETS.ultimate.monthlyPoints).toBe(2_000_000);
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent results across multiple calls', () => {
      const results1 = calculateMessagesForPlan('vn_free');
      const results2 = calculateMessagesForPlan('vn_free');

      expect(results1).toEqual(results2);
    });

    it('should handle all plan types without errors', () => {
      expect(() => calculateMessagesForPlan('vn_free')).not.toThrow();
      expect(() => calculateMessagesForPlan('vn_basic')).not.toThrow();
      expect(() => calculateMessagesForPlan('vn_pro')).not.toThrow();
      // Legacy plans should also work
      expect(() => calculateMessagesForPlan('starter')).not.toThrow();
      expect(() => calculateMessagesForPlan('premium')).not.toThrow();
      expect(() => calculateMessagesForPlan('ultimate')).not.toThrow();
    });

    it('should maintain reasonable ratios between plans (Phở Points system)', () => {
      const vnFree = calculateMessagesForPlan('vn_free');
      const vnBasic = calculateMessagesForPlan('vn_basic');
      const vnPro = calculateMessagesForPlan('vn_pro');

      // vn_basic should have 6x more points than vn_free (300k vs 50k)
      const freeGPT = vnFree.find((m) => m.model === 'gpt-4o-mini')!;
      const basicGPT = vnBasic.find((m) => m.model === 'gpt-4o-mini')!;
      const proGPT = vnPro.find((m) => m.model === 'gpt-4o-mini')!;

      const basicRatio = basicGPT.messageCount / freeGPT.messageCount;
      const proRatio = proGPT.messageCount / freeGPT.messageCount;

      // vn_basic has 6x more points than vn_free
      expect(basicRatio).toBeGreaterThan(5.5);
      expect(basicRatio).toBeLessThan(6.5);

      // vn_pro has 40x more points than vn_free (2M vs 50k)
      expect(proRatio).toBeGreaterThan(38);
      expect(proRatio).toBeLessThan(42);
    });
  });
});
