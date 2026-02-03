/**
 * Centralized Pricing Configuration for Phở Chat
 * Based on PRICING_MASTERPLAN.md.md
 *
 * This file contains all pricing-related constants and types.
 * All other files should import from this central config.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PlanConfig {
  advancedAI: boolean;
  code: string;
  dailyTier2Limit?: number;
  dailyTier3Limit?: number;
  displayName: string;
  enableCustomAPI: boolean;
  enableKnowledgeBase: boolean;
  features: string[];
  // Legacy descriptive features
  keyLimits: string;

  monthlyPoints: number;
  price: number;
  priceYearly?: number;
  prioritySupport: boolean;
  // New Feature Flags & Limits (matching Plan Comparison)
  storageGB: number;
  vectorEntries: number;
}

export interface ModelTierConfig {
  inputCostPer1M: number;
  models: string[];
  outputCostPer1M: number;
  pointsPerMessage: number;
  tier: 1 | 2 | 3;
  tierName: string;
}

export interface PlanModelAccess {
  allowedTiers: number[];
  dailyLimits?: Record<string, number>;
  defaultModel: string;
  defaultProvider: string;
  models: string[];
}

// ============================================================================
// VIETNAM PLANS (VND - via Sepay/VietQR)
// ============================================================================

export const VN_PLANS: Record<string, PlanConfig> = {
  vn_basic: {
    advancedAI: false,
    code: 'vn_basic',
    dailyTier2Limit: 30,
    displayName: 'Phở Tái (Starter)',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      'Conversation history',
      'File upload support',
      'No ads',
    ],

    keyLimits: 'Unlim Tier 1. 30 Tier 2 msgs/day.',

    monthlyPoints: 300_000,

    // Matched to Plan Comparison "Starter"
    price: 69_000,

    priceYearly: 690_000,

    prioritySupport: false,
    // New Features
    storageGB: 1,
    vectorEntries: 5000,
  },
  vn_free: {
    advancedAI: false,
    code: 'vn_free',
    displayName: 'Phở Không Người Lái (Free)',
    enableCustomAPI: false,
    enableKnowledgeBase: false,
    features: [
      'Tier 1 models only (GPT-4o-mini, Gemini Flash)',
      'Basic conversation',
      'No history saving',
    ],

    keyLimits: 'Tier 1 Models Only. No History.',

    monthlyPoints: 50_000,

    // Slight bump for Free
    price: 0,

    prioritySupport: false,
    // New Features
    storageGB: 0.5,
    vectorEntries: 0,
  },
  vn_pro: {
    advancedAI: false,
    code: 'vn_pro',
    dailyTier2Limit: -1, // Unlimited
    dailyTier3Limit: 50,
    displayName: 'Phở Đặc Biệt (Premium)',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      '2M Phở Points/tháng',
      '~40 videos hoặc ~200 ảnh',
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day',
      'Phở Studio access ✨',
    ],
    keyLimits: 'Unlim Tier 1 & 2. 50 Tier 3 msgs/day.',
    monthlyPoints: 2_000_000,
    price: 199_000,
    priceYearly: 1_990_000,
    prioritySupport: true,
    // New Features
    storageGB: 2,
    vectorEntries: 10_000,
  },
  vn_team: {
    advancedAI: true,
    code: 'vn_team',
    displayName: 'Lẩu Phở (Team)',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'All Premium features',
      'Admin Dashboard',
      'Pooled points for team',
      'User management',
      'Usage analytics',
    ],
    keyLimits: 'Min 3 users. Admin Dashboard.',
    monthlyPoints: 2_000_000, // Pooled - set to same as Pro per spec interaction
    price: 299_000,
    prioritySupport: true,
    // New Features
    storageGB: 4,
    vectorEntries: 20_000,
  },
  vn_ultimate: {
    advancedAI: true,
    code: 'vn_ultimate',
    dailyTier2Limit: -1, // Unlimited
    dailyTier3Limit: 100,
    displayName: 'Phở Pro (Ultimate)',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      '5M Phở Points/tháng',
      '~100 videos hoặc ~500 ảnh',
      'Unlimited Tier 1 & 2 models',
      '100 Tier 3 messages/day',
      'Phở Studio access ✨',
      'Priority support',
    ],
    keyLimits: 'Unlim Tier 1 & 2. 100 Tier 3 msgs/day. Studio Access.',
    monthlyPoints: 5_000_000,
    price: 499_000,
    priceYearly: 4_990_000,
    prioritySupport: true,
    storageGB: 4,
    vectorEntries: 20_000,
  },
} as const;

// ============================================================================
// GLOBAL PLANS (USD - via Polar.sh)
// ============================================================================

export const GLOBAL_PLANS: Record<string, PlanConfig> = {
  gl_lifetime: {
    advancedAI: true,
    code: 'gl_lifetime',
    dailyTier2Limit: -1, // Unlimited Tier 2 within monthly points cap
    displayName: 'Founding Member (Lifetime)',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'Phở Chat unlimited forever',
      '2M Phở Points/month (Chat only)',
      'Tier 1 & 2 model access',
      'Priority support',
      'Early access to new features',
      '⚠️ Studio NOT included',
    ],
    keyLimits: '2M points/mo (Chat only). No Studio.',
    monthlyPoints: 2_000_000,
    price: 149.99,
    prioritySupport: true,
    // New Features
    storageGB: 4,
    vectorEntries: 20_000,
  },
  gl_premium: {
    advancedAI: false,
    code: 'gl_premium',
    dailyTier2Limit: -1, // Unlimited Tier 2
    dailyTier3Limit: 50, // 50 Tier 3 messages/day
    displayName: 'Premium',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day',
      'Priority support',
      'All advanced features',
    ],
    keyLimits: 'Unlim Tier 1 & 2. 50 Tier 3 msgs/day.',
    monthlyPoints: 2_000_000,
    price: 19.99,
    priceYearly: 199.99,
    prioritySupport: true,
    // New Features
    storageGB: 2,
    vectorEntries: 10_000,
  },
  gl_standard: {
    advancedAI: false,
    code: 'gl_standard',
    dailyTier2Limit: 30, // 30 Tier 2 messages/day
    displayName: 'Starter',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      'Conversation history',
      'File upload support',
    ],
    keyLimits: 'Unlim Tier 1. 30 Tier 2 msgs/day.',
    monthlyPoints: 300_000,
    price: 9.99,
    priceYearly: 99.99,
    prioritySupport: false,
    // New Features
    storageGB: 1,
    vectorEntries: 5000,
  },
  gl_starter: {
    advancedAI: false,
    code: 'gl_starter',
    displayName: 'Free',
    enableCustomAPI: false,
    enableKnowledgeBase: false,
    features: ['Tier 1 models only', 'Basic conversation', 'Limited history'],
    keyLimits: 'Tier 1 Models Only. Limited History.',
    monthlyPoints: 50_000,
    price: 0,
    prioritySupport: false,
    // New Features
    storageGB: 0.5,
    vectorEntries: 0,
  },
  // Lifetime Deal Plans
  lifetime_early_bird: {
    advancedAI: true,
    code: 'lifetime_early_bird',
    dailyTier2Limit: -1,
    dailyTier3Limit: 50,
    displayName: 'Lifetime Early Bird',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'All Premium features',
      'Lifetime access',
      '2M Points/Month (Reset)',
      'Priority Support',
    ],
    keyLimits: 'Lifetime Access. 2M Points/Mo.',
    monthlyPoints: 2_000_000,
    price: 89,
    prioritySupport: true,
    storageGB: 4,
    vectorEntries: 20_000,
  },
  lifetime_last_call: {
    advancedAI: true,
    code: 'lifetime_last_call',
    dailyTier2Limit: -1,
    dailyTier3Limit: 50,
    displayName: 'Lifetime Last Call',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'All Premium features',
      'Lifetime access',
      '2M Points/Month (Reset)',
      'Priority Support',
    ],
    keyLimits: 'Lifetime Access. 2M Points/Mo.',
    monthlyPoints: 2_000_000,
    price: 149.99,
    prioritySupport: true,
    storageGB: 4,
    vectorEntries: 20_000,
  },
  lifetime_standard: {
    advancedAI: true,
    code: 'lifetime_standard',
    dailyTier2Limit: -1,
    dailyTier3Limit: 50,
    displayName: 'Lifetime Standard',
    enableCustomAPI: true,
    enableKnowledgeBase: true,
    features: [
      'All Premium features',
      'Lifetime access',
      '2M Points/Month (Reset)',
      'Priority Support',
    ],
    keyLimits: 'Lifetime Access. 2M Points/Mo.',
    monthlyPoints: 2_000_000,
    price: 119,
    prioritySupport: true,
    storageGB: 4,
    vectorEntries: 20_000,
  },
} as const;

// ============================================================================
// PLAN-TO-MODELS ACCESS MAPPING
// ============================================================================

/**
 * Defines which models are allowed for each subscription plan
 * and sets default model selection per plan
 */
export const PLAN_MODEL_ACCESS: Record<string, PlanModelAccess> = {
  // ============================================================================
  // GLOBAL PLANS - All use OpenRouter as primary provider
  // ============================================================================

  // Global Lifetime: Tier 1, 2, 3 - Behaves like PRO with 2M points monthly reset
  gl_lifetime: {
    allowedTiers: [1, 2], // Per SPECS: Same as PRO = Tier 1 & 2 only
    dailyLimits: { tier2: -1 }, // Unlimited Tier 2 within monthly points cap
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
    ],
  },

  // Global Premium (Pro): Tier 1 & 2 with 2M points cap
  gl_premium: {
    allowedTiers: [1, 2], // Per SPECS: PRO = Tier 1 & 2
    dailyLimits: { tier2: -1 }, // Unlimited within monthly cap
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
    ],
  },

  // Global Standard: Tier 1 & 2 with daily limits
  gl_standard: {
    allowedTiers: [1, 2],
    dailyLimits: { tier2: 30 },
    defaultModel: 'gpt-4o',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
    ],
  },

  // Global Starter Plan: Tier 1 ONLY per SPECS_BUSINESS.md
  // "BASIC TIER: Models: Tier 1 ONLY (Unlimited*). Strictly NO access to Tier 2 Models."
  gl_starter: {
    allowedTiers: [1], // Tier 1 ONLY - same as vn_basic
    defaultModel: 'gpt-4o-mini',
    defaultProvider: 'openrouter', // Use OpenRouter as primary provider
    models: [
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
    ],
  },

  // ============================================================================
  // LIFETIME DEAL PLANS - All tiers with 2M points/month
  // ============================================================================

  // Lifetime Early Bird: All tiers (Tier 1, 2, 3) with 50 Tier 3 messages/day
  lifetime_early_bird: {
    allowedTiers: [1, 2, 3],
    dailyLimits: { tier2: -1, tier3: 50 }, // Unlimited Tier 2, 50 Tier 3/day
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter',
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      // Tier 3 models
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-preview',
    ],
  },

  // Lifetime Last Call: Same as Early Bird and Standard
  lifetime_last_call: {
    allowedTiers: [1, 2, 3],
    dailyLimits: { tier2: -1, tier3: 50 },
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter',
    models: [
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-preview',
    ],
  },

  // Lifetime Standard: Same as Early Bird
  lifetime_standard: {
    allowedTiers: [1, 2, 3],
    dailyLimits: { tier2: -1, tier3: 50 },
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter',
    models: [
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-preview',
    ],
  },

  // ============================================================================
  // VIETNAM PLANS - All use OpenRouter as primary provider
  // ============================================================================

  // Vietnam Basic Plan (Phở Tái): Tier 1 + Tier 2 with 30 messages/day limit
  // Per VN_PLANS config: dailyTier2Limit: 30
  vn_basic: {
    allowedTiers: [1, 2], // Phở Tái allows Tier 1 & 2
    dailyLimits: { tier2: 30 }, // 30 Tier 2 messages/day
    defaultModel: 'gpt-4o',
    defaultProvider: 'openrouter', // Use OpenRouter as primary provider
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models (30 msg/day limit)
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
    ],
  },
  // ============================================================================
  // VIETNAM PLANS - All use OpenRouter as primary provider
  // ============================================================================

  // VN Free: Tier 1 ONLY with 50,000 points/month, no chat history/file uploads
  vn_free: {
    allowedTiers: [1],
    defaultModel: 'gpt-4o-mini',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
    ],
  },

  // VN Pro (Phở Đặc Biệt): Tier 1, 2 & 3 with 50 Tier 3 messages/day limit
  // Per VN_PLANS config: dailyTier2Limit: -1 (unlimited), dailyTier3Limit: 50
  vn_pro: {
    allowedTiers: [1, 2, 3], // Phở Đặc Biệt allows all tiers
    dailyLimits: { tier2: -1, tier3: 50 }, // Unlimited Tier 2, 50 Tier 3 messages/day
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models (unlimited)
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      // Tier 3 models (50 msg/day limit)
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-preview',
    ],
  },

  // VN Team: All tiers (enterprise plan)
  vn_team: {
    allowedTiers: [1, 2, 3],
    dailyLimits: { tier3: 100 },
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter', // OpenRouter as primary
    models: [
      // All models available
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-pro',
      'o3',
    ],
  },

  // VN Ultimate (Phở Pro): All tiers with 100 Tier 3 messages/day + Studio access
  vn_ultimate: {
    allowedTiers: [1, 2, 3],
    dailyLimits: { tier2: -1, tier3: 100 }, // Unlimited Tier 2, 100 Tier 3/day
    defaultModel: 'claude-3-5-sonnet',
    defaultProvider: 'openrouter',
    models: [
      // Tier 1 models
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
      // Tier 2 models (unlimited)
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
      // Tier 3 models (100 msg/day limit)
      'gpt-4-turbo',
      'claude-3-opus',
      'o1',
      'o1-preview',
      'o1-pro',
      'o3',
    ],
  },
} as const;

// ============================================================================
// MODEL TIERS (Points-based pricing)
// ============================================================================

/**
 * Model tier mapping with comprehensive model IDs
 * Includes both short names and full OpenRouter-style IDs
 *
 * Tier 1: Budget models - Available to FREE/BASIC plans
 * Tier 2: Standard models - Available to PRO plans (Phở Tái, Standard)
 * Tier 3: Premium models - Available to TEAM/Enterprise plans (Phở Đặc Biệt)
 */
export const MODEL_TIERS: Record<number, ModelTierConfig> = {
  1: {
    inputCostPer1M: 5,
    models: [
      // OpenAI budget models
      'gpt-4o-mini',
      'openai/gpt-4o-mini',
      // Google budget models
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'gemini-flash-1.5',
      'gemini-2.0-flash-001',
      'google/gemini-flash-1.5',
      'google/gemini-2.0-flash-001',
      'google/gemma-2-9b-it',
      'google/gemma-2-9b-it:free',
      // Anthropic budget models
      'claude-3-haiku',
      'claude-3.5-haiku',
      'anthropic/claude-3-haiku',
      'anthropic/claude-3.5-haiku',
      // DeepSeek budget models
      'deepseek-chat',
      'deepseek/deepseek-chat',
      'deepseek/deepseek-r1:free',
      // Qwen budget models
      'qwen-turbo',
      'qwen/qwen-2-7b-instruct:free',
      // Meta LLaMA models (free tier)
      'meta-llama/llama-3.1-8b-instruct:free',
      'meta-llama/llama-3.2-11b-vision-instruct',
      'meta-llama/llama-3.3-70b-instruct:free',
    ],
    outputCostPer1M: 15, // Cost per 1M output tokens
    pointsPerMessage: 5, // ~15-20 points per typical message
    tier: 1,
    tierName: 'Cheap (Budget)',
  },
  2: {
    inputCostPer1M: 100,
    models: [
      // OpenAI standard models
      'gpt-4o',
      'openai/gpt-4o',
      'gpt-4.1',
      // Anthropic standard models
      'claude-3.5-sonnet',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'anthropic/claude-3.5-sonnet',
      // Google standard models
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'gemini-pro-1.5',
      'google/gemini-pro-1.5',
      'google/gemini-2.0-pro-exp-02-05:free',
      // DeepSeek premium models
      'deepseek-reasoner',
      'deepseek-r1',
      'deepseek/deepseek-r1',
      // Meta LLaMA premium models
      'meta-llama/llama-3.2-90b-vision-instruct',
      'meta-llama/llama-3.3-70b-instruct',
      // Auto model - maps to Tier 2 by default since it routes to best model
      'openrouter/auto',
    ],
    outputCostPer1M: 300,
    pointsPerMessage: 150,
    tier: 2,
    tierName: 'Standard',
  },
  3: {
    inputCostPer1M: 500,
    models: [
      // OpenAI premium models (O-series)
      'gpt-4-turbo',
      'o1',
      'o1-mini',
      'o1-preview',
      'o1-pro',
      'o3',
      'openai/o1',
      'openai/o1-mini',
      'openai/o1-preview',
      // Anthropic premium models
      'claude-3-opus',
      'anthropic/claude-3-opus',
    ],
    outputCostPer1M: 1500,
    pointsPerMessage: 1000,
    tier: 3,
    tierName: 'Expensive (Premium)',
  },
} as const;

// ============================================================================
// PLAN USAGE ESTIMATES (for comparison table)
// ============================================================================
// Based on:
// - Tier 1 message: ~5 points (GPT-4o-mini)
// - Tier 2 message: ~150 points (GPT-4o, Claude 3.5)
// - Tier 3 message: ~1000 points (o1, Claude Opus)
// - Image (Flux Pro): ~10,000 points
// - Video 5s (Instant): ~50,000 points
// - Audio 10s: ~20,000 points

export const PLAN_USAGE_ESTIMATES = {
  gl_lifetime: {
    hasStudio: false,
    images: '0 (Chat only)',
    monthlyPoints: 2_000_000,
    tier1Messages: '~400,000',
    tier2Messages: '~13,000',
    tier3Messages: '~2,000',
    videos: '0 (No Studio)',
  },

  gl_premium: {
    hasStudio: true,
    images: '~200',
    monthlyPoints: 2_000_000,
    tier1Messages: '~400,000',
    tier2Messages: '~13,000',
    tier3Messages: '~2,000',
    videos: '~40',
  },

  gl_standard: {
    hasStudio: false,
    images: '~30',
    monthlyPoints: 300_000,
    tier1Messages: '~60,000',
    tier2Messages: '~2,000',
    tier3Messages: '0',
    videos: '0 (No Studio)',
  },

  // Global Plans
  gl_starter: {
    hasStudio: false,
    images: '~5',
    monthlyPoints: 50_000,
    tier1Messages: '~10,000',
    tier2Messages: '~300',
    tier3Messages: '0',
    videos: '0 (No Studio)',
  },

  vn_basic: {
    hasStudio: false,
    images: '~30',
    monthlyPoints: 300_000,
    tier1Messages: '~60,000',
    tier2Messages: '~2,000',
    tier3Messages: '0',
    videos: '0 (No Studio)',
  },
  // VN Plans
  vn_free: {
    hasStudio: false,
    images: '~5',
    monthlyPoints: 50_000,
    tier1Messages: '~10,000',
    tier2Messages: '~300',
    tier3Messages: '0',
    videos: '0 (No Studio)',
  },
  vn_pro: {
    hasStudio: true,
    images: '~200',
    monthlyPoints: 2_000_000,
    tier1Messages: '~400,000',
    tier2Messages: '~13,000',
    tier3Messages: '~2,000',
    videos: '~40',
  },
  vn_ultimate: {
    hasStudio: true,
    images: '~500',
    monthlyPoints: 5_000_000,
    tier1Messages: '~1,000,000',
    tier2Messages: '~33,000',
    tier3Messages: '~5,000',
    videos: '~100',
  },
} as const;

// ============================================================================
// POLAR PRODUCT IDS (for global payments)
// ============================================================================

export const POLAR_PRODUCT_IDS = {
  gl_lifetime: 'polar_prod_ltd_id',
  gl_premium: 'polar_prod_prem_id',
  gl_standard: 'polar_prod_std_id',
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get model tier by model name
 * Supports both full OpenRouter-style IDs (e.g., 'openai/gpt-4o-mini')
 * and short model names (e.g., 'gpt-4o-mini')
 *
 * Matching priority:
 * 1. Exact match with the full model ID
 * 2. Exact match with model ID without :free suffix
 * 3. Partial match (model name contains the tier model)
 */
export function getModelTier(modelName: string): number {
  const normalizedName = modelName.toLowerCase();
  // Remove :free suffix for matching (free variants inherit tier from base model)
  const nameWithoutFreeSuffix = normalizedName.replace(/:free$/, '');

  // Priority 1: Check for exact match first
  for (const [tier, config] of Object.entries(MODEL_TIERS)) {
    if (
      config.models.some(
        (m) => normalizedName === m.toLowerCase() || nameWithoutFreeSuffix === m.toLowerCase(),
      )
    ) {
      return Number(tier);
    }
  }

  // Priority 2: Check if model name contains any tier model (partial match)
  // This handles cases where the model ID might have extra prefixes/suffixes
  for (const [tier, config] of Object.entries(MODEL_TIERS)) {
    if (
      config.models.some(
        (m) => normalizedName.includes(m.toLowerCase()) || m.toLowerCase().includes(normalizedName),
      )
    ) {
      return Number(tier);
    }
  }

  // Default to Tier 2 for unknown models (safer default - requires paid plan)
  return 2;
}

/**
 * Get points cost for a model
 */
export function getModelPointsCost(modelName: string): number {
  const tier = getModelTier(modelName);
  return MODEL_TIERS[tier as keyof typeof MODEL_TIERS]?.pointsPerMessage ?? 150;
}

/**
 * Calculate points for token usage
 */
export function calculatePointsFromTokens(
  modelName: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const tier = getModelTier(modelName);
  const tierConfig = MODEL_TIERS[tier as keyof typeof MODEL_TIERS];

  if (!tierConfig) return 150; // Default

  const inputCost = (inputTokens / 1_000_000) * tierConfig.inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * tierConfig.outputCostPer1M;

  return Math.ceil(inputCost + outputCost);
}

/**
 * Get plan by code (works for both VN and Global)
 */
export function getPlanByCode(code: string): PlanConfig | undefined {
  return VN_PLANS[code] || GLOBAL_PLANS[code];
}

/**
 * Check if user can use a model tier based on their plan
 * Uses PLAN_MODEL_ACCESS.allowedTiers for accurate tier checking
 */
export function canUseTier(planCode: string, tier: number): boolean {
  // Use PLAN_MODEL_ACCESS as the source of truth
  const planAccess = PLAN_MODEL_ACCESS[planCode];
  if (planAccess?.allowedTiers) {
    return planAccess.allowedTiers.includes(tier);
  }

  // Fallback: check plan config
  const plan = getPlanByCode(planCode);
  if (!plan) return tier === 1;

  // Free plans: Tier 1 only
  if (plan.price === 0 && !planCode.includes('lifetime')) return tier === 1;

  // Default: allow tier 1 only for unknown plans
  return tier === 1;
}

/**
 * Get daily limit for a tier based on plan
 */
export function getDailyTierLimit(planCode: string, tier: number): number {
  const plan = getPlanByCode(planCode);
  if (!plan) return tier === 1 ? -1 : 0;

  if (tier === 1) return -1; // Always unlimited

  if (tier === 2) {
    return plan.dailyTier2Limit ?? 0;
  }

  if (tier === 3) {
    return plan.dailyTier3Limit ?? 0;
  }

  return 0;
}

// ============================================================================
// LEGACY MAPPINGS (for backward compatibility)
// ============================================================================

export const LEGACY_PLAN_MAPPING: Record<string, string> = {
  free: 'vn_free',
  premium: 'vn_basic',
  starter: 'vn_free',
  ultimate: 'vn_pro',
} as const;

export function getLegacyPlanMapping(legacyId: string): string {
  return LEGACY_PLAN_MAPPING[legacyId] || legacyId;
}

// ============================================================================
// PLAN MODEL ACCESS HELPERS
// ============================================================================

/**
 * Get allowed models for a subscription plan
 */
export function getAllowedModelsForPlan(planCode: string): string[] {
  const planAccess = PLAN_MODEL_ACCESS[planCode];
  if (!planAccess) {
    // Default to free plan models if plan not found
    return PLAN_MODEL_ACCESS.vn_free.models;
  }
  return planAccess.models;
}

/**
 * Get default model and provider for a subscription plan
 */
export function getDefaultModelForPlan(planCode: string): { model: string; provider: string } {
  const planAccess = PLAN_MODEL_ACCESS[planCode];
  if (!planAccess) {
    return {
      model: PLAN_MODEL_ACCESS.vn_free.defaultModel,
      provider: PLAN_MODEL_ACCESS.vn_free.defaultProvider,
    };
  }
  return {
    model: planAccess.defaultModel,
    provider: planAccess.defaultProvider,
  };
}

/**
 * Check if a plan can use a specific model
 */
export function canPlanUseModel(planCode: string, modelId: string): boolean {
  const allowedModels = getAllowedModelsForPlan(planCode);
  return allowedModels.includes(modelId);
}

/**
 * Get required providers for a plan (based on allowed models)
 */
export function getRequiredProvidersForPlan(planCode: string): string[] {
  const allowedModels = getAllowedModelsForPlan(planCode);

  // Model to provider mapping
  const modelProviderMap: Record<string, string> = {
    'claude-3-5-sonnet': 'anthropic',

    // Anthropic models
    'claude-3-haiku': 'anthropic',

    'claude-3-opus': 'anthropic',

    'claude-3-sonnet': 'anthropic',

    // Other models
    'deepseek-chat': 'deepseek',

    'deepseek-reasoner': 'deepseek',

    // Google models
    'gemini-1.5-flash': 'google',

    'gemini-1.5-pro': 'google',

    'gemini-2.0-flash': 'google',

    'gemini-2.5-pro': 'google',

    'gpt-4-turbo': 'openai',

    'gpt-4.1': 'openai',

    'gpt-4o': 'openai',

    // OpenAI models
    'gpt-4o-mini': 'openai',

    'o1': 'openai',

    'o1-pro': 'openai',
    'o3': 'openai',
    'qwen-turbo': 'qwen',
  };

  const providers = new Set<string>();
  allowedModels.forEach((model) => {
    const provider = modelProviderMap[model];
    if (provider) {
      providers.add(provider);
    }
  });

  return Array.from(providers);
}

/**
 * Get allowed tiers for a subscription plan
 */
export function getAllowedTiersForPlan(planCode: string): number[] {
  const planAccess = PLAN_MODEL_ACCESS[planCode];
  if (!planAccess) {
    return PLAN_MODEL_ACCESS.vn_free.allowedTiers;
  }
  return planAccess.allowedTiers;
}
