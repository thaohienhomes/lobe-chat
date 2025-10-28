/**
 * Smart Model Routing System
 * 
 * Intelligently routes requests to optimal models based on:
 * - Query complexity analysis
 * - User's remaining budget
 * - Model performance characteristics
 * - Cost optimization
 * - User preferences and history
 */

import { MODEL_COSTS } from '@/server/modules/CostOptimization';

interface ModelCapabilities {
  // 0-10 code generation
  analysis: number;      
  // 0-10 creative writing
  coding: number;     
  // 0-10 response speed
  costEfficiency: number;         
  // 0-10 reasoning ability
  creativity: number;       
  reasoning: number;          
  // 0-10 data analysis
  speed: number; // 0-10 cost per quality
}

interface RoutingDecision {
  alternativeModels: string[];
  confidence: number;
  estimatedCost: number;
  estimatedTokens: number;
  reason: string;
  selectedModel: string;
}

interface UserContext {
  preferredModels: string[];
  queryHistory: QueryHistoryItem[];
  remainingBudgetUSD: number;
  subscriptionTier: 'starter' | 'premium' | 'ultimate';
}

interface QueryHistoryItem {
  model: string;
  query: string;
  satisfaction: number; // 0-10 user satisfaction
  timestamp: number;
}

export class SmartModelRouter {
  // Model capabilities matrix
  private modelCapabilities: Record<string, ModelCapabilities> = {
    'claude-3-haiku': {
      analysis: 6,
      coding: 6,
      costEfficiency: 8,
      creativity: 8,
      reasoning: 6,
      speed: 8,
    },
    'claude-3-sonnet': {
      analysis: 9,
      coding: 8,
      costEfficiency: 4,
      creativity: 9,
      reasoning: 9,
      speed: 5,
    },
    'gemini-1.5-flash': {
      analysis: 7,
      coding: 6,
      costEfficiency: 10,
      creativity: 7,
      reasoning: 6,
      speed: 10,
    },
    'gemini-1.5-pro': {
      analysis: 9,
      coding: 8,
      costEfficiency: 6,
      creativity: 8,
      reasoning: 8,
      speed: 7,
    },
    'gpt-4o': {
      analysis: 8,
      coding: 9,
      costEfficiency: 5,
      creativity: 8,
      reasoning: 9,
      speed: 6,
    },
    'gpt-4o-mini': {
      analysis: 7,
      coding: 8,
      costEfficiency: 9,
      creativity: 7,
      reasoning: 7,
      speed: 9,
    },
  };

  // Query complexity indicators
  private complexityIndicators = {
    complex: [
      'code', 'algorithm', 'research', 'detailed', 'comprehensive',
      'advanced', 'complex', 'deep', 'thorough', 'sophisticated',
      'implement', 'design', 'architecture', 'optimize',
    ],
    medium: [
      'explain', 'analyze', 'compare', 'summarize', 'write', 'create',
      'describe', 'outline', 'list', 'steps', 'process',
    ],
    simple: [
      'hello', 'hi', 'what', 'how', 'when', 'where', 'who',
      'translate', 'define', 'meaning', 'simple', 'quick',
    ],
  };

  /**
   * Route query to optimal model
   */
  async routeQuery(
    query: string,
    userContext: UserContext
  ): Promise<RoutingDecision> {
    // Analyze query characteristics
    const complexity = this.analyzeComplexity(query);
    const queryType = this.analyzeQueryType(query);
    const estimatedTokens = this.estimateTokens(query);

    // Get candidate models based on budget and tier
    const candidates = this.getCandidateModels(userContext);

    // Score each candidate model
    const scoredModels = candidates.map(model => ({
      cost: this.calculateCost(model, estimatedTokens),
      model,
      score: this.calculateModelScore(
        model,
        complexity,
        queryType,
        estimatedTokens,
        userContext
      ),
    }));

    // Sort by score (highest first)
    scoredModels.sort((a, b) => b.score - a.score);

    // Select best model that fits budget
    const selected = scoredModels.find(
      candidate => candidate.cost <= userContext.remainingBudgetUSD
    );

    if (!selected) {
      // Fallback to cheapest model if budget is very low
      const cheapest = scoredModels.reduce((min, current) =>
        current.cost < min.cost ? current : min
      );

      return {
        alternativeModels: [],
        confidence: 0.6,
        estimatedCost: cheapest.cost,
        estimatedTokens,
        reason: 'Budget constraint - using most cost-effective model',
        selectedModel: cheapest.model,
      };
    }

    return {
      alternativeModels: scoredModels
        .slice(1, 4)
        .map(candidate => candidate.model),
      confidence: this.calculateConfidence(selected.score, scoredModels),
      estimatedCost: selected.cost,
      estimatedTokens,
      reason: this.generateReason(selected.model, complexity, queryType),
      selectedModel: selected.model,
    };
  }

  /**
   * Analyze query complexity
   */
  private analyzeComplexity(query: string): 'simple' | 'medium' | 'complex' {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/);

    // Check for complex indicators first
    const complexCount = this.complexityIndicators.complex.filter(
      indicator => lowerQuery.includes(indicator)
    ).length;

    if (complexCount > 0 || words.length > 50) {
      return 'complex';
    }

    // Check for medium complexity
    const mediumCount = this.complexityIndicators.medium.filter(
      indicator => lowerQuery.includes(indicator)
    ).length;

    if (mediumCount > 0 || words.length > 20) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Analyze query type for specialized routing
   */
  private analyzeQueryType(query: string): string {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('code') || lowerQuery.includes('program') || 
        lowerQuery.includes('function') || lowerQuery.includes('algorithm')) {
      return 'coding';
    }

    if (lowerQuery.includes('creative') || lowerQuery.includes('story') ||
        lowerQuery.includes('poem') || lowerQuery.includes('write')) {
      return 'creative';
    }

    if (lowerQuery.includes('analyze') || lowerQuery.includes('data') ||
        lowerQuery.includes('research') || lowerQuery.includes('study')) {
      return 'analysis';
    }

    if (lowerQuery.includes('reason') || lowerQuery.includes('logic') ||
        lowerQuery.includes('solve') || lowerQuery.includes('problem')) {
      return 'reasoning';
    }

    return 'general';
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(query: string): number {
    // Rough estimation: 4 characters per token for input
    const inputTokens = Math.ceil(query.length / 4);
    
    // Estimate output tokens based on query complexity
    const complexity = this.analyzeComplexity(query);
    const outputMultiplier = {
      complex: 4,
      medium: 2.5,
      simple: 1.5,
    };

    const outputTokens = Math.min(
      inputTokens * outputMultiplier[complexity],
      2000 // Cap at 2K tokens
    );

    return inputTokens + outputTokens;
  }

  /**
   * Get candidate models based on user context
   */
  private getCandidateModels(userContext: UserContext): string[] {
    const allModels = Object.keys(this.modelCapabilities);
    
    // Filter based on subscription tier
    if (userContext.subscriptionTier === 'starter') {
      // Starter users get access to all models but budget constraints apply
      return allModels;
    }

    return allModels;
  }

  /**
   * Calculate model score for given context
   */
  private calculateModelScore(
    model: string,
    complexity: string,
    queryType: string,
    estimatedTokens: number,
    userContext: UserContext
  ): number {
    const capabilities = this.modelCapabilities[model];
    if (!capabilities) return 0;

    let score = 0;

    // Base capability score based on query type
    switch (queryType) {
      case 'coding': {
        score += capabilities.coding * 0.4;
        break;
      }
      case 'creative': {
        score += capabilities.creativity * 0.4;
        break;
      }
      case 'analysis': {
        score += capabilities.analysis * 0.4;
        break;
      }
      case 'reasoning': {
        score += capabilities.reasoning * 0.4;
        break;
      }
      default: {
        score += (capabilities.reasoning + capabilities.creativity) * 0.2;
      }
    }

    // Complexity bonus
    const complexityMultiplier = {
      complex: 1.2,
      medium: 1,
      simple: 0.8,
    };
    score *= complexityMultiplier[complexity as keyof typeof complexityMultiplier];

    // Cost efficiency (important for budget-conscious users)
    score += capabilities.costEfficiency * 0.3;

    // Speed bonus (user experience)
    score += capabilities.speed * 0.2;

    // User preference bonus
    if (userContext.preferredModels.includes(model)) {
      score += 1;
    }

    // Budget constraint penalty
    const cost = this.calculateCost(model, estimatedTokens);
    const budgetRatio = cost / userContext.remainingBudgetUSD;
    if (budgetRatio > 0.5) {
      score *= 0.8; // Penalty for expensive models when budget is low
    }

    return Math.max(0, score);
  }

  /**
   * Calculate cost for model and token usage
   */
  private calculateCost(model: string, estimatedTokens: number): number {
    const costs = MODEL_COSTS[model as keyof typeof MODEL_COSTS];
    if (!costs) return 0;

    // Assume 25% input, 75% output tokens
    const inputTokens = estimatedTokens * 0.25;
    const outputTokens = estimatedTokens * 0.75;

    return (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
  }

  /**
   * Generate human-readable reason for model selection
   */
  private generateReason(
    model: string,
    complexity: string,
    queryType: string
  ): string {
    const reasons = {
      'claude-3-haiku': 'Excellent for creative writing and fast responses',
      'claude-3-sonnet': 'Highest quality for sophisticated analysis and reasoning',
      'gemini-1.5-flash': 'Fastest response with excellent cost efficiency',
      'gemini-1.5-pro': 'Superior analysis capabilities for complex queries',
      'gpt-4o': 'Advanced reasoning for complex problems and coding',
      'gpt-4o-mini': 'Great balance of quality and speed for general tasks',
    };

    const baseReason = reasons[model as keyof typeof reasons] || 'Optimal for your query';
    
    if (complexity === 'complex') {
      return `${baseReason} - Complex query detected`;
    }
    
    if (queryType !== 'general') {
      return `${baseReason} - Specialized for ${queryType} tasks`;
    }

    return baseReason;
  }

  /**
   * Calculate confidence in routing decision
   */
  private calculateConfidence(
    selectedScore: number,
    allScores: Array<{ score: number }>
  ): number {
    if (allScores.length < 2) return 1;

    const secondBest = allScores[1].score;
    const gap = selectedScore - secondBest;
    
    // Confidence based on score gap
    return Math.min(1, 0.5 + (gap / 10));
  }

  /**
   * Learn from user feedback to improve routing
   */
  async updateUserPreferences(
    userId: string,
    model: string,
    satisfaction: number
  ): Promise<void> {
    // This would typically update a database
    // For now, we'll just log the feedback
    console.log(`User feedback: ${userId} rated ${model} as ${satisfaction}/10`);
    
    // In a real implementation, this would:
    // 1. Store feedback in database
    // 2. Update user preference weights
    // 3. Retrain routing algorithm periodically
  }
}

// Singleton instance
let routerInstance: SmartModelRouter | null = null;

/**
 * Get or create router instance
 */
export function getSmartModelRouter(): SmartModelRouter {
  if (!routerInstance) {
    routerInstance = new SmartModelRouter();
  }
  return routerInstance;
}

export type { ModelCapabilities, QueryHistoryItem,RoutingDecision, UserContext };
