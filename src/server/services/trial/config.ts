/**
 * Freemium Trial Configuration
 * Defines trial limits and allowed models for free users
 */

// Trial usage limits
export const TRIAL_CONFIG = {
  // Maximum number of messages a free user can send
  maxMessages: 10,
  
  // Maximum tokens a free user can consume
  maxTokens: 50_000,
  
  // Trial period in days (0 = no time limit, only message/token limits)
  trialPeriodDays: 0,
  
  // Trial reset period (0 = never reset, users must upgrade)
  resetPeriodDays: 0,
} as const;

// Free tier allowed models (fast, cost-effective models through OpenRouter)
export const FREE_TIER_MODELS = [
  // Meta Llama models - fast and efficient
  'meta-llama/llama-3.1-8b-instruct',
  'meta-llama/llama-3.2-3b-instruct',
  
  // Google Gemini Flash - very fast
  'google/gemini-flash-1.5',
  'google/gemini-flash-2.0-exp',
  
  // DeepSeek - cost-effective and works in Vietnam
  'deepseek/deepseek-chat',
  
  // Anthropic Haiku - fast and cheap
  'anthropic/claude-3-haiku',
] as const;

// Default model for free trial users
export const DEFAULT_FREE_MODEL = 'meta-llama/llama-3.1-8b-instruct';

// Subscription plan pricing (VND)
export const PLAN_PRICING = {
  starter: 39_000,
  premium: 129_000,
  ultimate: 349_000,
} as const;

// Plan compute credits per month
export const PLAN_CREDITS = {
  free: 0,
  starter: 5_000_000,
  premium: 15_000_000,
  ultimate: 35_000_000,
} as const;

export type TrialStatus = {
  canUseAI: boolean;
  isOnTrial: boolean;
  messagesRemaining: number;
  messagesUsed: number;
  planId: 'free' | 'starter' | 'premium' | 'ultimate';
  tokensRemaining: number;
  tokensUsed: number;
  trialExpired: boolean;
};

/**
 * Check if a model is allowed for free trial users
 */
export function isModelAllowedForTrial(model: string): boolean {
  return FREE_TIER_MODELS.some(allowedModel => 
    model.toLowerCase().includes(allowedModel.toLowerCase()) ||
    allowedModel.toLowerCase().includes(model.toLowerCase())
  );
}

/**
 * Get a fallback model for trial users if requested model is not allowed
 */
export function getTrialFallbackModel(): string {
  return DEFAULT_FREE_MODEL;
}

