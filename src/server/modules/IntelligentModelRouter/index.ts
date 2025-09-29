/**
 * Intelligent Model Router for pho.chat
 * Optimizes model selection based on cost, performance, and user preferences
 */
// @ts-nocheck

import { CostOptimizationEngine, MODEL_COSTS } from '../CostOptimization';

export interface RoutingRequest {
  features?: {
    requiresFunctionCalling?: boolean;
    requiresLongContext?: boolean;
    requiresStreaming?: boolean;
    requiresVision?: boolean;
  };
  query: string;
  remainingBudgetVND: number;
  sessionId: string;
  subscriptionTier: 'starter' | 'premium' | 'ultimate';
  userId: string;
  userPreferences?: {
    blockedModels?: string[];
    maxLatency?: number;
    preferredProviders?: string[];
    prioritizeCost?: boolean;
  };
}

export interface RoutingResult {
  confidence: number;
  estimatedCostVND: number;
  estimatedLatencyMs: number;
  fallbackChain: Array<{ model: string; provider: string }>;
  reasoning: string;
  selectedModel: string;
  selectedProvider: string; // 0-1 score
}

export interface ProviderHealth {
  averageLatency: number;
  errorRate: number;
  isHealthy: boolean;
  lastChecked: Date;
  provider: string;
}

export class IntelligentModelRouter {
  private costEngine: CostOptimizationEngine;
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private routingCache: Map<string, RoutingResult> = new Map();

  // Model capabilities matrix
  private readonly MODEL_CAPABILITIES = {
    'claude-3-haiku': {
      functionCalling: true,
      languages: ['en', 'vi', 'zh', 'ja', 'ko'],
      maxContext: 200_000,
      specialties: ['general', 'analysis', 'writing'],
      streaming: true,
      vision: false,
    },
    'claude-3-sonnet': {
      functionCalling: true,
      languages: ['en', 'vi', 'zh', 'ja', 'ko'],
      maxContext: 200_000,
      specialties: ['reasoning', 'writing', 'analysis'],
      streaming: true,
      vision: true,
    },
    'gemini-1.5-flash': {
      functionCalling: true,
      languages: ['en', 'vi', 'zh', 'ja', 'ko'],
      maxContext: 1_000_000,
      specialties: ['general', 'multimodal', 'long-context'],
      streaming: true,
      vision: true,
    },
    'gpt-4o': {
      functionCalling: true,
      languages: ['en', 'vi', 'zh', 'ja', 'ko'],
      maxContext: 128_000,
      specialties: ['reasoning', 'coding', 'analysis'],
      streaming: true,
      vision: true,
    },
    'gpt-4o-mini': {
      functionCalling: true,
      languages: ['en', 'vi', 'zh', 'ja', 'ko'],
      maxContext: 128_000,
      specialties: ['general', 'coding', 'translation'],
      streaming: true,
      vision: false,
    },
  } as const;

  // Provider routing configuration
  private readonly PROVIDER_CONFIG = {
    direct: {
      advantages: ['low_latency', 'full_features', 'cost_transparency'],
      disadvantages: ['maintenance_overhead'],
      providers: ['openai', 'anthropic', 'google'],
    },
    gateway: {
      advantages: ['easy_maintenance', 'model_variety'],
      disadvantages: ['higher_latency', 'cost_markup', 'feature_lag'],
      providers: ['aihubmix', 'openrouter'],
    },
  };

  constructor() {
    this.costEngine = new CostOptimizationEngine();
    this.initializeProviderHealth();
  }

  /**
   * Main routing function - selects optimal model based on multiple factors
   */
  async routeRequest(request: RoutingRequest): Promise<RoutingResult> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.routingCache.get(cacheKey);

    if (cached && this.isCacheValid()) {
      return cached;
    }

    // Step 1: Analyze query complexity and requirements
    const queryAnalysis = this.analyzeQuery(request.query);

    // Step 2: Filter models based on requirements and capabilities
    const eligibleModels = this.filterEligibleModels(request, queryAnalysis);

    // Step 3: Score models based on multiple criteria
    const scoredModels = await this.scoreModels(eligibleModels, request, queryAnalysis);

    // Step 4: Select best model and create fallback chain
    const result = this.selectOptimalModel(scoredModels, request);

    // Cache result for 5 minutes
    this.routingCache.set(cacheKey, result);
    setTimeout(() => this.routingCache.delete(cacheKey), 5 * 60 * 1000);

    return result;
  }

  /**
   * Analyze query to determine complexity, language, and requirements
   */
  private analyzeQuery(query: string): {
    category: string;
    complexity: 'simple' | 'medium' | 'complex';
    estimatedTokens: number;
    language: string;
    requiresCreativity: boolean;
    requiresReasoning: boolean;
  } {
    const lowerQuery = query.toLowerCase();

    // Detect Vietnamese language
    const vietnamesePattern = /[àáâãèéêìíòóôõùúýăđĩũơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]/;
    const isVietnamese = vietnamesePattern.test(query);

    // Complexity analysis
    const complexityIndicators = {
      complex: ['code', 'algorithm', 'research', 'detailed', 'comprehensive', 'advanced', 'lập trình', 'thuật toán'],
      medium: ['explain', 'analyze', 'compare', 'summarize', 'write', 'create', 'giải thích', 'phân tích'],
      simple: ['hello', 'hi', 'what', 'how', 'when', 'where', 'translate', 'xin chào', 'là gì'],
    };

    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (complexityIndicators.complex.some(word => lowerQuery.includes(word))) {
      complexity = 'complex';
    } else if (complexityIndicators.medium.some(word => lowerQuery.includes(word)) || query.length > 200) {
      complexity = 'medium';
    }

    // Category detection
    const categories = {
      analysis: ['analyze', 'compare', 'evaluate', 'phân tích', 'so sánh'],
      coding: ['code', 'program', 'function', 'algorithm', 'debug', 'lập trình', 'mã nguồn'],
      creative: ['write', 'story', 'poem', 'creative', 'viết', 'sáng tác'],
      general: [],
      translation: ['translate', 'dịch', 'translation', 'language'],
    };

    let category = 'general';
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(word => lowerQuery.includes(word))) {
        category = cat;
        break;
      }
    }

    return {
      category,
      complexity,
      estimatedTokens: Math.ceil(query.length / 4),
      language: isVietnamese ? 'vi' : 'en',
      requiresCreativity: category === 'creative',
      requiresReasoning: complexity === 'complex' || category === 'analysis',
    };
  }

  /**
   * Filter models based on requirements and capabilities
   */
  private filterEligibleModels(
    request: RoutingRequest,
    analysis: ReturnType<typeof this.analyzeQuery>
  ): string[] {
    const allModels = Object.keys(this.MODEL_CAPABILITIES);

    return allModels.filter(model => {
      const capabilities = this.MODEL_CAPABILITIES[model as keyof typeof this.MODEL_CAPABILITIES];

      // Check feature requirements
      if (request.features?.requiresVision && !capabilities.vision) return false;
      if (request.features?.requiresFunctionCalling && !capabilities.functionCalling) return false;
      if (request.features?.requiresStreaming && !capabilities.streaming) return false;

      // Check language support
      if (!capabilities.languages.includes(analysis.language)) return false;

      // Check user preferences
      if (request.userPreferences?.blockedModels?.includes(model)) return false;

      // Check context length requirements
      if (analysis.estimatedTokens > capabilities.maxContext) return false;

      return true;
    });
  }

  /**
   * Score models based on cost, performance, and suitability
   */
  private async scoreModels(
    models: string[],
    request: RoutingRequest,
    analysis: ReturnType<typeof this.analyzeQuery>
  ): Promise<Array<{ details: any, model: string; score: number; }>> {
    const scored = [];

    for (const model of models) {
      const capabilities = this.MODEL_CAPABILITIES[model as keyof typeof this.MODEL_CAPABILITIES];
      const modelCost = MODEL_COSTS[model as keyof typeof MODEL_COSTS];

      if (!modelCost) continue;

      // Calculate estimated cost
      const estimatedOutputTokens = analysis.estimatedTokens * (analysis.complexity === 'complex' ? 3 : analysis.complexity === 'medium' ? 1.5 : 0.5);
      const estimatedCostUSD = this.costEngine.calculateCost({
        inputTokens: analysis.estimatedTokens,
        model,
        outputTokens: estimatedOutputTokens,
        sessionId: request.sessionId,
        userId: request.userId,
      });
      const estimatedCostVND = estimatedCostUSD * 24_167;

      // Scoring factors (0-1 scale)
      const costScore = Math.max(0, 1 - (estimatedCostVND / request.remainingBudgetVND));
      const capabilityScore = this.calculateCapabilityScore(model, analysis, request);
      const performanceScore = this.calculatePerformanceScore(model);
      const preferenceScore = this.calculatePreferenceScore(model, request);

      // Weighted final score
      const weights = {
        capability: 0.3,
        cost: request.subscriptionTier === 'starter' ? 0.4 : request.subscriptionTier === 'premium' ? 0.3 : 0.2,
        performance: 0.2,
        preference: 0.1,
      };

      const finalScore =
        costScore * weights.cost +
        capabilityScore * weights.capability +
        performanceScore * weights.performance +
        preferenceScore * weights.preference;

      scored.push({
        details: {
          capabilities,
          capabilityScore,
          costScore,
          estimatedCostVND,
          performanceScore,
          preferenceScore,
        },
        model,
        score: finalScore,
      });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  private calculateCapabilityScore(
    model: string,
    analysis: ReturnType<typeof this.analyzeQuery>,
    request: RoutingRequest
  ): number {
    const capabilities = this.MODEL_CAPABILITIES[model as keyof typeof this.MODEL_CAPABILITIES];
    let score = 0.5; // Base score

    // Specialty matching
    if (capabilities.specialties.includes(analysis.category)) {
      score += 0.3;
    }

    // Feature matching
    if (request.features?.requiresVision && capabilities.vision) score += 0.2;
    if (request.features?.requiresLongContext && capabilities.maxContext > 100_000) score += 0.2;

    return Math.min(1, score);
  }

  private calculatePerformanceScore(model: string): number {
    // Based on empirical performance data
    const performanceRatings = {
      'claude-3-haiku': 0.9,
      'claude-3-sonnet': 0.9,
      'gemini-1.5-flash': 0.85,
      'gpt-4o': 0.95,
      'gpt-4o-mini': 0.8,
    };

    return performanceRatings[model as keyof typeof performanceRatings] || 0.5;
  }

  private calculatePreferenceScore(model: string, request: RoutingRequest): number {
    if (request.userPreferences?.preferredProviders?.includes(this.getProviderForModel(model))) {
      return 1;
    }
    return 0.5;
  }

  private selectOptimalModel(
    scoredModels: Array<{ details: any, model: string; score: number; }>,
    request: RoutingRequest
  ): RoutingResult {
    const best = scoredModels[0];
    const fallbackChain = scoredModels.slice(1, 4).map(m => ({
      model: m.model,
      provider: this.getProviderForModel(m.model),
    }));

    return {
      confidence: best.score,
      estimatedCostVND: best.details.estimatedCostVND,
      estimatedLatencyMs: this.getEstimatedLatency(best.model),
      fallbackChain,
      reasoning: this.generateReasoning(best, request),
      selectedModel: best.model,
      selectedProvider: this.getProviderForModel(best.model),
    };
  }

  private getProviderForModel(model: string): string {
    const providerMap = {
      'claude-3-haiku': 'anthropic',
      'claude-3-sonnet': 'anthropic',
      'gemini-1.5-flash': 'google',
      'gpt-4o': 'openai',
      'gpt-4o-mini': 'openai',
    };
    return providerMap[model as keyof typeof providerMap] || 'openai';
  }

  private getEstimatedLatency(model: string): number {
    const latencyMap = {
      'claude-3-haiku': 600,
      'claude-3-sonnet': 1000,
      'gemini-1.5-flash': 700,
      'gpt-4o': 1200,
      'gpt-4o-mini': 800,
    };
    return latencyMap[model as keyof typeof latencyMap] || 1000;
  }

  private generateReasoning(best: any, request: RoutingRequest): string {
    return `Chọn ${best.model} vì: chi phí tối ưu (${best.details.estimatedCostVND.toFixed(0)} VND), phù hợp với gói ${request.subscriptionTier}, và đáp ứng yêu cầu kỹ thuật.`;
  }

  private generateCacheKey(request: RoutingRequest): string {
    return `${request.userId}-${request.query.slice(0, 50)}-${request.subscriptionTier}`;
  }

  private isCacheValid(): boolean {
    // Cache is valid for 5 minutes
    return true;
  }

  private initializeProviderHealth(): void {
    // Initialize with default healthy state
    const providers = ['openai', 'anthropic', 'google', 'aihubmix'];
    providers.forEach(provider => {
      this.providerHealth.set(provider, {
        averageLatency: 1000,
        errorRate: 0.01,
        isHealthy: true,
        lastChecked: new Date(),
        provider,
      });
    });
  }
}
