/**
 * Cost Optimization System for Phở Chat
 * Based on PRICING_MASTERPLAN.md.md
 *
 * Uses "Phở Points" hidden credit system for usage tracking
 */

// Re-export for backward compatibility

/* eslint-disable sort-keys-fix/sort-keys-fix */
// Cost per 1K tokens in USD (for internal cost tracking)
// Keys are grouped by tier for readability
export const MODEL_COSTS = {
  // Tier 1: Budget models (5 points/msg)
  'claude-3-haiku': { input: 0.000_25, output: 0.001_25, tier: 1 },
  'deepseek-chat': { input: 0.000_14, output: 0.000_28, tier: 1 },
  'gemini-1.5-flash': { input: 0.000_075, output: 0.0003, tier: 1 },
  'gemini-2.0-flash': { input: 0.0001, output: 0.0004, tier: 1 },
  'gpt-4o-mini': { input: 0.000_15, output: 0.0006, tier: 1 },
  'qwen-turbo': { input: 0.0001, output: 0.0003, tier: 1 },

  // Tier 2: Standard models (150 points/msg)
  'claude-3-5-sonnet': { input: 0.003, output: 0.015, tier: 2 },
  'claude-3-sonnet': { input: 0.003, output: 0.015, tier: 2 },
  'deepseek-reasoner': { input: 0.0014, output: 0.0028, tier: 2 },
  'gemini-1.5-pro': { input: 0.001_25, output: 0.005, tier: 2 },
  'gemini-2.5-pro': { input: 0.001_25, output: 0.01, tier: 2 },
  'gpt-4.1': { input: 0.002, output: 0.008, tier: 2 },
  'gpt-4o': { input: 0.0025, output: 0.01, tier: 2 },

  // Tier 3: Premium models (1000 points/msg)
  'claude-3-opus': { input: 0.015, output: 0.075, tier: 3 },
  'gpt-4-turbo': { input: 0.01, output: 0.03, tier: 3 },
  'o1': { input: 0.015, output: 0.06, tier: 3 },
  'o1-pro': { input: 0.15, output: 0.6, tier: 3 },
  'o3': { input: 0.02, output: 0.08, tier: 3 },
} as const;
/* eslint-enable sort-keys-fix/sort-keys-fix */

/**
 * Vietnam Plans Pricing (Phở Points system)
 * Based on PRICING_MASTERPLAN.md.md
 */
export const VND_PRICING_TIERS = {
  // Legacy mappings (for backward compatibility)
  premium: {
    dailyTier2Limit: 30,
    dailyTier3Limit: 0,
    displayName: 'Phở Tái',
    monthlyPoints: 300_000,
    monthlyVND: 69_000,
  },

  starter: {
    dailyTier2Limit: 0,
    dailyTier3Limit: 0,
    displayName: 'Phở Không Người Lái',
    monthlyPoints: 50_000,
    monthlyVND: 0,
  },

  ultimate: {
    dailyTier2Limit: -1,
    dailyTier3Limit: 50,
    displayName: 'Phở Đặc Biệt',
    monthlyPoints: 2_000_000,
    monthlyVND: 199_000,
  },

  // Basic tier (Student)
  vn_basic: {
    dailyTier2Limit: 30,
    dailyTier3Limit: 0,
    displayName: 'Phở Tái',
    monthlyPoints: 300_000,
    monthlyVND: 69_000,
  },

  // Free tier
  vn_free: {
    dailyTier2Limit: 0,
    dailyTier3Limit: 0,
    displayName: 'Phở Không Người Lái',
    monthlyPoints: 50_000,
    monthlyVND: 0,
  },

  // Pro tier
  vn_pro: {
    dailyTier2Limit: -1, // Unlimited
    dailyTier3Limit: 50,
    displayName: 'Phở Đặc Biệt',
    monthlyPoints: 2_000_000,
    monthlyVND: 199_000,
  },
  // Team tier
  vn_team: {
    dailyTier2Limit: -1,
    dailyTier3Limit: -1,
    displayName: 'Lẩu Phở (Team)',
    monthlyPoints: 0, // Pooled
    monthlyVND: 149_000, // per user
  },
} as const;

/**
 * Global Plans Pricing (USD via Polar.sh)
 */
export const USD_PRICING_TIERS = {
  gl_lifetime: {
    displayName: 'Founding Member (Lifetime)',
    monthlyPoints: 2_000_000, // Reset monthly via cron job
    monthlyUSD: 149, // One-time
  },
  gl_premium: {
    displayName: 'Premium',
    monthlyPoints: 2_000_000,
    monthlyUSD: 19.9,
  },
  gl_standard: {
    displayName: 'Standard',
    monthlyPoints: 500_000,
    monthlyUSD: 9.9,
  },
  gl_starter: {
    displayName: 'Starter',
    monthlyPoints: 30_000,
    monthlyUSD: 0,
  },
} as const;

export interface CostCalculationRequest {
  inputTokens: number;
  model: string;
  outputTokens: number;
  sessionId: string;
  userId: string;
}

export interface CostOptimizationResult {
  budgetWarning?: string;
  estimatedCostUSD: number;
  estimatedCostVND: number;
  recommendedModel: string;
  remainingBudgetVND: number;
}

export class CostOptimizationEngine {
  private readonly USD_TO_VND_RATE = 24_167; // Current exchange rate

  /**
   * Calculate cost for a specific model and token usage
   */
  calculateCost(request: CostCalculationRequest): number {
    const modelCost = MODEL_COSTS[request.model as keyof typeof MODEL_COSTS];
    if (!modelCost) {
      throw new Error(`Unknown model: ${request.model}`);
    }

    const inputCostUSD = (request.inputTokens / 1000) * modelCost.input;
    const outputCostUSD = (request.outputTokens / 1000) * modelCost.output;

    return inputCostUSD + outputCostUSD;
  }

  /**
   * Intelligent model selection based on query complexity and budget
   */
  async selectOptimalModel(
    query: string,
    userId: string,
    remainingBudgetVND: number,
  ): Promise<CostOptimizationResult> {
    const complexity = this.analyzeQueryComplexity(query);
    // const remainingBudgetUSD = remainingBudgetVND / this.USD_TO_VND_RATE;

    // Estimate token usage based on query length and complexity
    const estimatedInputTokens = Math.ceil(query.length / 4); // ~4 chars per token
    const estimatedOutputTokens = this.estimateOutputTokens(complexity, estimatedInputTokens);

    // Find the best model within budget
    const modelOptions = this.getModelsByComplexity(complexity);

    for (const model of modelOptions) {
      const cost = this.calculateCost({
        inputTokens: estimatedInputTokens,
        model,
        outputTokens: estimatedOutputTokens,
        sessionId: '',
        userId, // Will be provided by caller
      });

      const costVND = cost * this.USD_TO_VND_RATE;

      if (costVND <= remainingBudgetVND) {
        return {
          budgetWarning: this.generateBudgetWarning(
            remainingBudgetVND - costVND,
            remainingBudgetVND,
          ),
          estimatedCostUSD: cost,
          estimatedCostVND: costVND,
          recommendedModel: model,
          remainingBudgetVND: remainingBudgetVND - costVND,
        };
      }
    }

    // If no model fits budget, use cheapest option with warning
    const cheapestModel = 'gemini-1.5-flash';
    const cost = this.calculateCost({
      inputTokens: estimatedInputTokens,
      model: cheapestModel,
      outputTokens: estimatedOutputTokens,
      sessionId: '',
      userId,
    });

    return {
      budgetWarning: 'Ngân sách thấp! Sử dụng mô hình tiết kiệm nhất.',
      estimatedCostUSD: cost,
      estimatedCostVND: cost * this.USD_TO_VND_RATE,
      recommendedModel: cheapestModel,
      remainingBudgetVND: remainingBudgetVND - cost * this.USD_TO_VND_RATE,
    };
  }

  /**
   * Analyze query complexity to determine appropriate model tier
   */
  private analyzeQueryComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const indicators = {
      complex: ['code', 'algorithm', 'research', 'detailed', 'comprehensive', 'advanced'],
      medium: ['explain', 'analyze', 'compare', 'summarize', 'write', 'create'],
      simple: ['hello', 'hi', 'what', 'how', 'when', 'where', 'translate'],
    };

    const lowerQuery = query.toLowerCase();

    // Check for complex indicators first
    if (indicators.complex.some((word) => lowerQuery.includes(word))) {
      return 'complex';
    }

    // Check for medium complexity
    if (indicators.medium.some((word) => lowerQuery.includes(word)) || query.length > 200) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Get models ordered by cost-effectiveness for each complexity level
   */
  private getModelsByComplexity(complexity: string): string[] {
    switch (complexity) {
      case 'simple': {
        return ['gemini-1.5-flash', 'gpt-4o-mini', 'claude-3-haiku'];
      }
      case 'medium': {
        return ['gpt-4o-mini', 'claude-3-haiku', 'gemini-1.5-pro', 'gpt-4o'];
      }
      case 'complex': {
        return ['claude-3-sonnet', 'gpt-4o', 'gemini-1.5-pro', 'claude-3-opus'];
      }
      default: {
        return ['gpt-4o-mini'];
      }
    }
  }

  /**
   * Estimate output tokens based on complexity and input length
   */
  private estimateOutputTokens(complexity: string, inputTokens: number): number {
    const multipliers = {
      // Detailed responses
      complex: 3,

      // Short responses
      medium: 1.5,
      simple: 0.5, // Comprehensive responses
    };

    const baseTokens = Math.max(
      50,
      inputTokens * multipliers[complexity as keyof typeof multipliers],
    );
    return Math.min(baseTokens, 4000); // Cap at 4K tokens
  }

  /**
   * Generate budget warning messages in Vietnamese
   */
  private generateBudgetWarning(remainingVND: number, totalBudgetVND: number): string | undefined {
    const usagePercentage = ((totalBudgetVND - remainingVND) / totalBudgetVND) * 100;

    if (remainingVND <= 0) {
      return 'Đã hết ngân sách! Vui lòng nâng cấp gói hoặc chờ chu kỳ mới.';
    } else if (usagePercentage >= 90) {
      return `Cảnh báo: Đã sử dụng ${usagePercentage.toFixed(1)}% ngân sách tháng này.`;
    } else if (usagePercentage >= 75) {
      return `Thông báo: Đã sử dụng ${usagePercentage.toFixed(1)}% ngân sách tháng này.`;
    }

    return undefined;
  }

  /**
   * Calculate monthly cost breakdown for Vietnamese users
   */
  calculateMonthlyBreakdown(usage: {
    complexQueries: number;
    mediumQueries: number;
    simpleQueries: number;
  }): {
    breakdown: Array<{
      avgCostPerQuery: number;
      category: string;
      queries: number;
      totalCost: number;
    }>;
    totalCostUSD: number;
    totalCostVND: number;
  } {
    const breakdown = [
      {
        avgCostPerQuery: 0.0001,
        category: 'Câu hỏi đơn giản',
        queries: usage.simpleQueries, // ~2.4 VND
        totalCost: usage.simpleQueries * 0.0001,
      },
      {
        avgCostPerQuery: 0.0005,
        category: 'Câu hỏi trung bình',
        queries: usage.mediumQueries, // ~12 VND
        totalCost: usage.mediumQueries * 0.0005,
      },
      {
        avgCostPerQuery: 0.002,
        category: 'Câu hỏi phức tạp',
        queries: usage.complexQueries, // ~48 VND
        totalCost: usage.complexQueries * 0.002,
      },
    ];

    const totalCostUSD = breakdown.reduce((sum, item) => sum + item.totalCost, 0);

    return {
      breakdown,
      totalCostUSD,
      totalCostVND: totalCostUSD * this.USD_TO_VND_RATE,
    };
  }
}

/**
 * Usage tracking middleware for tRPC integration
 */
export class UsageTracker {
  constructor(
    private db: any,
    private userId: string,
  ) {}

  async trackUsage(request: {
    costUSD: number;
    inputTokens: number;
    model: string;
    outputTokens: number;
    provider?: string;
    queryComplexity: string;
    sessionId: string;
  }): Promise<void> {
    const costVND = request.costUSD * 24_167; // USD to VND conversion
    const totalTokens = request.inputTokens + request.outputTokens;

    // Import the schema here to avoid circular dependencies
    const { usageLogs } = await import('@/database/schemas/usage');

    await this.db.insert(usageLogs).values({
      costUSD: request.costUSD,

      costVND: costVND,

      createdAt: new Date(),

      // Use provided provider or default to openai
      inputTokens: request.inputTokens,
      model: request.model,
      outputTokens: request.outputTokens,
      provider: request.provider || 'openai',
      queryComplexity: request.queryComplexity,
      sessionId: request.sessionId,
      totalTokens: totalTokens,
      updatedAt: new Date(),
      userId: this.userId,
    });

    // Update monthly usage summary
    await this.updateMonthlySummary(request, costVND);
  }

  async getRemainingBudget(subscriptionTier: keyof typeof VND_PRICING_TIERS): Promise<number> {
    const tierBudget = VND_PRICING_TIERS[subscriptionTier];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const monthlyUsage = await this.db
      .select({ totalCostVND: 'SUM(cost_vnd)' })
      .from('usage_logs')
      .where({
        month: currentMonth,
        userId: this.userId,
      })
      .first();

    const usedBudget = monthlyUsage?.totalCostVND || 0;
    return Math.max(0, tierBudget.monthlyVND - usedBudget);
  }

  private async updateMonthlySummary(request: any, costVND: number): Promise<void> {
    const currentMonth = new Date().toISOString().slice(0, 7);

    await this.db
      .insert('monthly_usage_summary')
      .values({
        lastUpdated: new Date(),
        month: currentMonth,
        totalCostVND: costVND,
        totalQueries: 1,
        totalTokens: request.inputTokens + request.outputTokens,
        userId: this.userId,
      })
      .onConflict(['userId', 'month'])
      .merge({
        lastUpdated: new Date(),
        totalCostVND: `monthly_usage_summary.total_cost_vnd + ${costVND}`,
        totalQueries: 'monthly_usage_summary.total_queries + 1',
        totalTokens: `monthly_usage_summary.total_tokens + ${request.inputTokens + request.outputTokens}`,
      });
  }
}

export { GLOBAL_PLANS, MODEL_TIERS, VN_PLANS } from '@/config/pricing';
