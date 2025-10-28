/**
 * Message Calculator Utility
 * Calculates accurate message limits based on MODEL_COSTS and real USD budgets
 * 
 * Based on MESSAGE_LIMITS_ANALYSIS.md calculations
 */

import { MODEL_COSTS } from '@/server/modules/CostOptimization';

export interface MessageCalculation {
  category: 'budget' | 'premium';
  costPerMessage: number;
  messageCount: number;
  model: string;
  modelName: string;
}

export interface PlanBudget {
  monthlyUSD: number;
  monthlyVND: number;
  planId: 'starter' | 'premium' | 'ultimate';
  tokenBudget: number;
}

// Real USD budgets based on new pricing (updated 2025-01-08)
export const PLAN_BUDGETS: Record<string, PlanBudget> = {
  premium: {
    monthlyUSD: 5.34,
    monthlyVND: 129_000,
    planId: 'premium',
    tokenBudget: 15_000_000,
  },
  starter: {
    monthlyUSD: 1.61,
    monthlyVND: 39_000,
    planId: 'starter',
    tokenBudget: 5_000_000,
  },
  ultimate: {
    monthlyUSD: 14.44,
    monthlyVND: 349_000,
    planId: 'ultimate',
    tokenBudget: 35_000_000,
  },
} as const;

// Model configurations with display names and categories
const MODEL_CONFIGS = [
  // Budget Models (High Volume)
  {
    category: 'Budget Models (High Volume)',
    displayName: 'Gemini 1.5 Flash',
    key: 'gemini-1.5-flash',
    priority: 1,
    type: 'budget' as const,
  },
  {
    category: 'Budget Models (High Volume)',
    displayName: 'GPT-4o mini',
    key: 'gpt-4o-mini',
    priority: 2,
    type: 'budget' as const,
  },
  {
    category: 'Budget Models (High Volume)',
    displayName: 'Claude 3 Haiku',
    key: 'claude-3-haiku',
    priority: 3,
    type: 'budget' as const,
  },

  // Premium Models (High Quality)
  {
    category: 'Premium Models (High Quality)',
    displayName: 'Gemini 1.5 Pro',
    key: 'gemini-1.5-pro',
    priority: 1,
    type: 'premium' as const,
  },
  {
    category: 'Premium Models (High Quality)',
    displayName: 'GPT-4o',
    key: 'gpt-4o',
    priority: 2,
    type: 'premium' as const,
  },
  {
    category: 'Premium Models (High Quality)',
    displayName: 'Claude 3.5 Sonnet',
    key: 'claude-3-sonnet',
    priority: 3,
    type: 'premium' as const,
  },
] as const;

/**
 * Calculate cost per message for a specific model
 * Assumption: 400 tokens per message (100 input + 300 output)
 */
export function calculateCostPerMessage(modelKey: string): number {
  const costs = MODEL_COSTS[modelKey as keyof typeof MODEL_COSTS];

  if (!costs) {
    console.warn(`Model costs not found for: ${modelKey}`);
    return 0;
  }

  // Calculate cost: (100 input tokens + 300 output tokens) / 1000 * cost per 1K tokens
  const inputCost = (100 / 1000) * costs.input;
  const outputCost = (300 / 1000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Calculate messages per month for a specific model and plan
 */
export function calculateMessagesForModel(
  modelKey: string,
  planId: 'starter' | 'premium' | 'ultimate'
): number {
  const budget = PLAN_BUDGETS[planId];
  const costPerMessage = calculateCostPerMessage(modelKey);

  if (costPerMessage === 0) {
    return 0;
  }

  return Math.floor(budget.monthlyUSD / costPerMessage);
}

/**
 * Calculate all message limits for a specific plan
 */
export function calculateMessagesForPlan(
  planId: 'starter' | 'premium' | 'ultimate'
): MessageCalculation[] {
  return MODEL_CONFIGS.map(config => {
    const costPerMessage = calculateCostPerMessage(config.key);
    const messagesPerMonth = calculateMessagesForModel(config.key, planId);

    return {
      category: config.type,
      costPerMessage,
      messageCount: messagesPerMonth,
      model: config.key,
      modelName: config.displayName,
    };
  }).sort((a, b) => {
    // Sort by message count (descending)
    return b.messageCount - a.messageCount;
  });
}

/**
 * Get top models for display in UI (limit to avoid clutter)
 */
export function getTopModelsForPlan(
  planId: 'starter' | 'premium' | 'ultimate',
  budgetLimit: number = 3,
  premiumLimit: number = 3
): {
  budgetModels: MessageCalculation[];
  premiumModels: MessageCalculation[];
} {
  const allModels = calculateMessagesForPlan(planId);

  const budgetModels = allModels
    .filter(m => m.category === 'budget')
    .slice(0, budgetLimit);

  const premiumModels = allModels
    .filter(m => m.category === 'premium')
    .slice(0, premiumLimit);

  return { budgetModels, premiumModels };
}

/**
 * Format message count for display
 */
export function formatMessageCount(count: number): string {
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Generate feature text for UI display
 */
export function generateFeatureText(
  model: MessageCalculation
): string {
  const formattedCount = formatMessageCount(model.messageCount);
  return `${model.modelName} - ~${formattedCount} messages`;
}

/**
 * Get plan comparison data for all plans
 */
export function getAllPlanComparisons(): Record<string, {
  budgetModels: MessageCalculation[];
  premiumModels: MessageCalculation[];
}> {
  return {
    premium: getTopModelsForPlan('premium'),
    starter: getTopModelsForPlan('starter'),
    ultimate: getTopModelsForPlan('ultimate'),
  };
}

/**
 * Calculate cost savings compared to competitors
 */
export function calculateCompetitorComparison(planId: 'starter' | 'premium' | 'ultimate') {
  const plan = PLAN_BUDGETS[planId];
  const chatGptPlusUSD = 20; // $20/month
  const claudeProUSD = 20;   // $20/month

  const savings = {
    vsChatGptPlus: Math.round((1 - plan.monthlyUSD / chatGptPlusUSD) * 100),
    vsClaudePro: Math.round((1 - plan.monthlyUSD / claudeProUSD) * 100),
  };

  return savings;
}

/**
 * Validate message calculations against expected values
 * Used for testing and verification
 */
export function validateCalculations(): {
  errors: string[];
  isValid: boolean;
  results: Array<{
    budgetModels: number;
    maxBudgetMessages: number;
    maxPremiumMessages: number;
    planId: string;
    premiumModels: number;
    totalModels: number;
  }>;
} {
  const errors: string[] = [];
  const results = [];

  // Validate each plan
  for (const planId of ['starter', 'premium', 'ultimate'] as const) {
    const allModels = calculateMessagesForPlan(planId);
    const budgetModels = allModels.filter(m => m.category === 'budget');
    const premiumModels = allModels.filter(m => m.category === 'premium');

    const maxBudgetMessages = Math.max(...budgetModels.map(m => m.messageCount));
    const maxPremiumMessages = Math.max(...premiumModels.map(m => m.messageCount));

    results.push({
      budgetModels: budgetModels.length,
      maxBudgetMessages,
      maxPremiumMessages,
      planId,
      premiumModels: premiumModels.length,
      totalModels: allModels.length,
    });

    // Basic validation
    if (allModels.length === 0) {
      errors.push(`${planId}: No models found`);
    }
    if (budgetModels.length === 0) {
      errors.push(`${planId}: No budget models found`);
    }
    if (premiumModels.length === 0) {
      errors.push(`${planId}: No premium models found`);
    }
    if (maxBudgetMessages <= maxPremiumMessages) {
      errors.push(`${planId}: Budget models should have more messages than premium models`);
    }
  }

  return {
    errors,
    isValid: errors.length === 0,
    results,
  };
}

// Export types for use in components
export type { MessageCalculation, PlanBudget };
