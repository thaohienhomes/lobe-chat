/**
 * Cost Optimization System for Vietnamese Market
 * Target: 29,000 VND/month (~$1.20 USD) subscription tier
 */


// Cost per 1K tokens in USD (as of 2024)
export const MODEL_COSTS = {

  'claude-3-haiku': { input: 0.000_25, output: 0.001_25 },

  'claude-3-opus': { input: 0.015, output: 0.075 },

  'claude-3-sonnet': { input: 0.003, output: 0.015 },



  'gemini-1.5-flash': { input: 0.000_075, output: 0.0003 },


  'gemini-1.5-pro': { input: 0.001_25, output: 0.005 },


  // Premium models for specialized tasks
  'gpt-4-turbo': { input: 0.01, output: 0.03 },





  // Mid-tier models for complex queries
  'gpt-4o': { input: 0.0025, output: 0.01 },


  // Ultra-cheap models for basic queries
  'gpt-4o-mini': { input: 0.000_15, output: 0.0006 },
} as const;

// Vietnamese market pricing strategy
// Updated 2025-01-08: Price increase to cover operational costs and prepare for advanced features
export const VND_PRICING_TIERS = {
  premium: {

    // 15M tokens/month
    dailyBudget: 500_000,

    // ~$5.34 USD (updated from $4.00)
    monthlyUSD: 5.34,

    monthlyVND: 129_000, // Updated: +30.3% from 99,000 VND
    tokenBudget: 15_000_000, // ~500K tokens/day
  },
  starter: {

    // 5M tokens/month
    dailyBudget: 166_667,

    // ~$1.61 USD (updated from $1.20)
    monthlyUSD: 1.61,

    monthlyVND: 39_000, // Updated: +34.5% from 29,000 VND
    tokenBudget: 5_000_000, // ~167K tokens/day
  },
  ultimate: {

    // 35M tokens/month
    dailyBudget: 1_166_667,

    // ~$14.44 USD (updated from $11.60)
    monthlyUSD: 14.44,

    monthlyVND: 349_000, // Updated: +20.8% from 289,000 VND
    tokenBudget: 35_000_000, // ~1.17M tokens/day
  }
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
    remainingBudgetVND: number
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
          budgetWarning: this.generateBudgetWarning(remainingBudgetVND - costVND, remainingBudgetVND),
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
      remainingBudgetVND: remainingBudgetVND - (cost * this.USD_TO_VND_RATE),
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
    if (indicators.complex.some(word => lowerQuery.includes(word))) {
      return 'complex';
    }

    // Check for medium complexity
    if (indicators.medium.some(word => lowerQuery.includes(word)) || query.length > 200) {
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
      simple: 0.5,  // Comprehensive responses
    };

    const baseTokens = Math.max(50, inputTokens * multipliers[complexity as keyof typeof multipliers]);
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
  constructor(private db: any, private userId: string) { }

  async trackUsage(request: {
    costUSD: number;
    inputTokens: number;
    model: string;
    outputTokens: number;
    queryComplexity: string;
    sessionId: string;
  }): Promise<void> {
    const costVND = request.costUSD * 24_167; // USD to VND conversion

    await this.db.insert('usage_logs').values({
      costUSD: request.costUSD,
      costVND: costVND,
      inputTokens: request.inputTokens,
      model: request.model,
      outputTokens: request.outputTokens,
      queryComplexity: request.queryComplexity,
      sessionId: request.sessionId,
      timestamp: new Date(),
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
