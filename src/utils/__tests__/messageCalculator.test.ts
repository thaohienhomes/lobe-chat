/**
 * Test Suite for Message Calculator
 * 
 * Tests all message calculation functions to ensure accuracy
 * and consistency with pricing model.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateCostPerMessage,
  calculateMessagesForPlan,
  getTopModelsForPlan,
  formatMessageCount,
  generateFeatureText,
  validateCalculations,
  PLAN_BUDGETS,
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
    it('should calculate correct messages for Starter plan', () => {
      const messages = calculateMessagesForPlan('starter');

      // Find GPT-4o mini in results
      const gpt4oMini = messages.find(m => m.model === 'gpt-4o-mini');
      expect(gpt4oMini).toBeDefined();

      // Starter budget: $1.61, GPT-4o mini cost: $0.000195/message
      // Expected: 1.61 / 0.000195 ≈ 8,256 messages
      expect(gpt4oMini!.messageCount).toBeCloseTo(8256, -2); // Within 100 messages
    });

    it('should calculate correct messages for Premium plan', () => {
      const messages = calculateMessagesForPlan('premium');

      // Find Gemini 1.5 Flash in results
      const geminiFlash = messages.find(m => m.model === 'gemini-1.5-flash');
      expect(geminiFlash).toBeDefined();

      // Premium budget: $5.34, Gemini Flash cost: $0.0000975/message
      // Expected: 5.34 / 0.0000975 ≈ 54,769 messages
      expect(geminiFlash!.messageCount).toBeCloseTo(54769, -2);
    });

    it('should calculate correct messages for Ultimate plan', () => {
      const messages = calculateMessagesForPlan('ultimate');

      // Find Claude 3.5 Sonnet in results
      const claudeSonnet = messages.find(m => m.model === 'claude-3-sonnet');
      expect(claudeSonnet).toBeDefined();

      // Ultimate budget: $14.44, Claude Sonnet cost: $0.0048/message
      // Expected: 14.44 / 0.0048 ≈ 3,008 messages
      expect(claudeSonnet!.messageCount).toBeCloseTo(3008, -1);
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

      const actualModels = messages.map(m => m.model);
      expectedModels.forEach(model => {
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
      const budgetModelNames = budgetModels.map(m => m.model);
      expect(budgetModelNames).toContain('gemini-1.5-flash');
      expect(budgetModelNames).toContain('gpt-4o-mini');
      expect(budgetModelNames).toContain('claude-3-haiku');

      // Premium models should be more expensive (fewer messages)
      const premiumModelNames = premiumModels.map(m => m.model);
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
        expect(budgetModels[i - 1].messageCount).toBeGreaterThanOrEqual(budgetModels[i].messageCount);
      }

      // Premium models should be sorted by message count (descending)
      for (let i = 1; i < premiumModels.length; i++) {
        expect(premiumModels[i - 1].messageCount).toBeGreaterThanOrEqual(premiumModels[i].messageCount);
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
        category: 'budget' as const,
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
        category: 'premium' as const,
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
      validation.results.forEach(result => {
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

      const starterGPT = starterMessages.find(m => m.model === modelToCheck)!;
      const premiumGPT = premiumMessages.find(m => m.model === modelToCheck)!;
      const ultimateGPT = ultimateMessages.find(m => m.model === modelToCheck)!;

      expect(premiumGPT.messageCount).toBeGreaterThan(starterGPT.messageCount);
      expect(ultimateGPT.messageCount).toBeGreaterThan(premiumGPT.messageCount);
    });
  });

  describe('PLAN_BUDGETS', () => {
    it('should have correct budget values', () => {
      expect(PLAN_BUDGETS.starter.monthlyVND).toBe(39_000);
      expect(PLAN_BUDGETS.starter.monthlyUSD).toBeCloseTo(1.61, 2);
      expect(PLAN_BUDGETS.starter.tokenBudget).toBe(5_000_000);

      expect(PLAN_BUDGETS.premium.monthlyVND).toBe(129_000);
      expect(PLAN_BUDGETS.premium.monthlyUSD).toBeCloseTo(5.34, 2);
      expect(PLAN_BUDGETS.premium.tokenBudget).toBe(15_000_000);

      expect(PLAN_BUDGETS.ultimate.monthlyVND).toBe(349_000);
      expect(PLAN_BUDGETS.ultimate.monthlyUSD).toBeCloseTo(14.44, 2);
      expect(PLAN_BUDGETS.ultimate.tokenBudget).toBe(35_000_000);
    });

    it('should have reasonable USD to VND conversion rates', () => {
      // Check that all plans have reasonable exchange rates (around 24,000 VND per USD)
      Object.values(PLAN_BUDGETS).forEach(plan => {
        const planRate = plan.monthlyVND / plan.monthlyUSD;
        expect(planRate).toBeGreaterThan(20000); // At least 20,000 VND per USD
        expect(planRate).toBeLessThan(30000); // At most 30,000 VND per USD
      });
    });
  });

  describe('Integration Tests', () => {
    it('should produce consistent results across multiple calls', () => {
      const results1 = calculateMessagesForPlan('starter');
      const results2 = calculateMessagesForPlan('starter');

      expect(results1).toEqual(results2);
    });

    it('should handle all plan types without errors', () => {
      expect(() => calculateMessagesForPlan('starter')).not.toThrow();
      expect(() => calculateMessagesForPlan('premium')).not.toThrow();
      expect(() => calculateMessagesForPlan('ultimate')).not.toThrow();
    });

    it('should maintain reasonable ratios between plans', () => {
      const starter = calculateMessagesForPlan('starter');
      const premium = calculateMessagesForPlan('premium');
      const ultimate = calculateMessagesForPlan('ultimate');

      // Premium should have roughly 3x more messages than Starter
      const starterGPT = starter.find(m => m.model === 'gpt-4o-mini')!;
      const premiumGPT = premium.find(m => m.model === 'gpt-4o-mini')!;
      const ultimateGPT = ultimate.find(m => m.model === 'gpt-4o-mini')!;

      const premiumRatio = premiumGPT.messageCount / starterGPT.messageCount;
      const ultimateRatio = ultimateGPT.messageCount / starterGPT.messageCount;

      expect(premiumRatio).toBeGreaterThan(2.5);
      expect(premiumRatio).toBeLessThan(4.0);

      expect(ultimateRatio).toBeGreaterThan(7.0);
      expect(ultimateRatio).toBeLessThan(10.0);
    });
  });
});
