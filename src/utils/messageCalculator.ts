/**
 * Message Calculator Utility
 * Calculates message limits based on Phở Points system
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
import {
  MODEL_COSTS,
} from '@/server/modules/CostOptimization';

export interface MessageCalculation {
  category: 'tier1' | 'tier2' | 'tier3';
  costPerMessage: number;
  messageCount: number;
  model: string;
  modelName: string;
  tier: number;
}

export interface PlanBudget {
  dailyTier2Limit: number;
  dailyTier3Limit: number;
  monthlyPoints: number;
  monthlyVND: number;
  planId: string;
}

/**
 * Plan budgets based on PRICING_MASTERPLAN.md.md
 * Using Phở Points system
 */
export const PLAN_BUDGETS: Record<string, PlanBudget> = {
  
  // Legacy mappings (for backward compatibility)
premium: {
    dailyTier2Limit: 30,
    dailyTier3Limit: 0,
    monthlyPoints: 300_000,
    monthlyVND: 69_000,
    planId: 'vn_basic',
  },
  

starter: {
    dailyTier2Limit: 0,
    dailyTier3Limit: 0,
    monthlyPoints: 50_000,
    monthlyVND: 0,
    planId: 'vn_free',
  },
  

ultimate: {
    dailyTier2Limit: -1,
    dailyTier3Limit: 50,
    monthlyPoints: 2_000_000,
    monthlyVND: 199_000,
    planId: 'vn_pro',
  },
  
// Vietnam Plans
vn_basic: {
    dailyTier2Limit: 30,
    dailyTier3Limit: 0,
    monthlyPoints: 300_000,
    monthlyVND: 69_000,
    planId: 'vn_basic',
  },

  
  vn_free: {
    dailyTier2Limit: 0,
    dailyTier3Limit: 0,
    monthlyPoints: 50_000,
    monthlyVND: 0,
    planId: 'vn_free',
  },
  vn_pro: {
    dailyTier2Limit: -1, // Unlimited
    dailyTier3Limit: 50,
    monthlyPoints: 2_000_000,
    monthlyVND: 199_000,
    planId: 'vn_pro',
  },
  vn_team: {
    dailyTier2Limit: -1,
    dailyTier3Limit: -1,
    monthlyPoints: 0, // Pooled
    monthlyVND: 149_000,
    planId: 'vn_team',
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
export function calculateMessagesForModel(modelKey: string, planId: string): number {
  const budget = PLAN_BUDGETS[planId];
  if (!budget) return 0;

  const costPerMessage = calculateCostPerMessage(modelKey);

  if (costPerMessage === 0) {
    return 0;
  }

  // Use monthlyPoints for Phở Points system
  return Math.floor(budget.monthlyPoints / (costPerMessage * 1000));
}

/**
 * Calculate all message limits for a specific plan
 * Updated for Phở Points system
 */
export function calculateMessagesForPlan(planId: string): MessageCalculation[] {
  return MODEL_CONFIGS.map((config) => {
    const costPerMessage = calculateCostPerMessage(config.key);
    const messagesPerMonth = calculateMessagesForModel(config.key, planId);
    const tier = config.type === 'budget' ? 1 : 2;
    const category: 'tier1' | 'tier2' | 'tier3' = config.type === 'budget' ? 'tier1' : 'tier2';

    return {
      category,
      costPerMessage,
      messageCount: messagesPerMonth,
      model: config.key,
      modelName: config.displayName,
      tier,
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
  planId: string,
  tier1Limit: number = 3,
  tier2Limit: number = 3,
): {
  budgetModels: MessageCalculation[];
  premiumModels: MessageCalculation[];
} {
  const allModels = calculateMessagesForPlan(planId);

  const budgetModels = allModels.filter((m) => m.category === 'tier1').slice(0, tier1Limit);

  const premiumModels = allModels.filter((m) => m.category === 'tier2').slice(0, tier2Limit);

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
export function generateFeatureText(model: MessageCalculation): string {
  const formattedCount = formatMessageCount(model.messageCount);
  return `${model.modelName} - ~${formattedCount} messages`;
}

/**
 * Get plan comparison data for all plans
 */
export function getAllPlanComparisons(): Record<
  string,
  {
    budgetModels: MessageCalculation[];
    premiumModels: MessageCalculation[];
  }
> {
  return {
    premium: getTopModelsForPlan('premium'),
    starter: getTopModelsForPlan('starter'),
    ultimate: getTopModelsForPlan('ultimate'),
  };
}

/**
 * Calculate cost savings compared to competitors
 */
export function calculateCompetitorComparison(planId: string) {
  const plan = PLAN_BUDGETS[planId];
  if (!plan) return { vsChatGptPlus: 0, vsClaudePro: 0 };

  const chatGptPlusUSD = 20; // $20/month
  const claudeProUSD = 20; // $20/month

  // Convert VND to USD (approximate rate)
  const planUSD = plan.monthlyVND / 24_000;

  const savings = {
    vsChatGptPlus: Math.round((1 - planUSD / chatGptPlusUSD) * 100),
    vsClaudePro: Math.round((1 - planUSD / claudeProUSD) * 100),
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
  for (const planId of ['vn_free', 'vn_basic', 'vn_pro'] as const) {
    const allModels = calculateMessagesForPlan(planId);
    const budgetModels = allModels.filter((m) => m.category === 'tier1');
    const premiumModels = allModels.filter((m) => m.category === 'tier2');

    const maxBudgetMessages = Math.max(...budgetModels.map((m) => m.messageCount));
    const maxPremiumMessages = Math.max(...premiumModels.map((m) => m.messageCount));

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
