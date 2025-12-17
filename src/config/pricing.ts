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
  code: string;
  dailyTier2Limit?: number;
  dailyTier3Limit?: number;
  displayName: string;
  features: string[];
  keyLimits: string;
  monthlyPoints: number;
  price: number;
  priceYearly?: number;
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
    code: 'vn_basic',
    dailyTier2Limit: 30,
    displayName: 'Phở Tái',
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      'Conversation history',
      'File upload support',
      'No ads',
    ],
    keyLimits: 'Unlim Tier 1. 30 Tier 2 msgs/day.',
    monthlyPoints: 300_000,
    price: 69_000,
    priceYearly: 690_000, // ~17% discount
  },
  vn_free: {
    code: 'vn_free',
    displayName: 'Phở Không Người Lái',
    features: [
      'Tier 1 models only (GPT-4o-mini, Gemini Flash)',
      'Basic conversation',
      'No history saving',
    ],
    keyLimits: 'Tier 1 Models Only. No History.',
    monthlyPoints: 50_000,
    price: 0,
  },
  vn_pro: {
    code: 'vn_pro',
    dailyTier2Limit: -1, // Unlimited
    dailyTier3Limit: 50,
    displayName: 'Phở Đặc Biệt',
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day (Claude Opus, GPT-4 Turbo)',
      'Priority support',
      'Advanced features',
      'Team collaboration',
      'Export & backup',
    ],
    keyLimits: 'Unlim Tier 1 & 2. 50 Tier 3 msgs/day.',
    monthlyPoints: 2_000_000,
    price: 199_000,
    priceYearly: 1_990_000, // ~17% discount
  },
  vn_team: {
    code: 'vn_team',
    displayName: 'Lẩu Phở (Team)',
    features: [
      'All Pro features',
      'Admin Dashboard',
      'Pooled points for team',
      'User management',
      'Usage analytics',
    ],
    keyLimits: 'Min 3 users. Admin Dashboard.',
    monthlyPoints: 0, // Pooled
    price: 149_000, // per user
  },
} as const;

// ============================================================================
// GLOBAL PLANS (USD - via Polar.sh)
// ============================================================================

export const GLOBAL_PLANS: Record<string, PlanConfig> = {
  gl_lifetime: {
    code: 'gl_lifetime',
    displayName: 'Founding Member (Lifetime)',
    features: [
      'All Premium features forever',
      '2M Phở Points/month (reset monthly)',
      'Tier 1 & 2 model access',
      'Priority support',
      'Early access to new features',
    ],
    keyLimits: '2M points/mo (Reset). One-time payment.',
    monthlyPoints: 2_000_000, // Reset monthly via cron job
    price: 149.99, // One-time - match Polar Dashboard
  },
  gl_premium: {
    code: 'gl_premium',
    displayName: 'Premium',
    features: [
      'Unlimited Tier 1 & 2 models',
      '50 Tier 3 messages/day',
      'Priority support',
      'All advanced features',
    ],
    keyLimits: 'Unlim Tier 1 & 2. 50 Tier 3 msgs/day.',
    monthlyPoints: 2_000_000,
    price: 19.99, // Match Polar Dashboard
    priceYearly: 199.99, // Match Polar Dashboard
  },
  gl_standard: {
    code: 'gl_standard',
    displayName: 'Standard',
    features: [
      'Unlimited Tier 1 models',
      '30 Tier 2 messages/day',
      'Conversation history',
      'File upload support',
    ],
    keyLimits: 'Unlim Tier 1. 30 Tier 2 msgs/day.',
    monthlyPoints: 500_000,
    price: 9.99, // Match Polar Dashboard
    priceYearly: 99.99, // Match Polar Dashboard
  },
  gl_starter: {
    code: 'gl_starter',
    displayName: 'Starter',
    features: ['Tier 1 models only', 'Basic conversation', 'Limited history'],
    keyLimits: 'Tier 1 Models Only. Limited History.',
    monthlyPoints: 30_000,
    price: 0,
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



  // Vietnam Basic Plan: Tier 1 ONLY per SPECS_BUSINESS.md
  // "BASIC TIER: Models: Tier 1 ONLY (Unlimited*). Strictly NO access to Tier 2 Models (GPT-4o, Sonnet)."
  vn_basic: {
    allowedTiers: [1], // CRITICAL: Tier 1 ONLY - no Tier 2 access
    defaultModel: 'gpt-4o-mini',
    defaultProvider: 'openrouter', // Use OpenRouter as primary provider
    models: [
      // Tier 1 models ONLY
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
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

  // VN Pro: Tier 1 & 2 with 2M points cap per SPECS
  vn_pro: {
    allowedTiers: [1, 2], // Per SPECS: PRO = Tier 1 & 2 (not Tier 3)
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
} as const;

// ============================================================================
// MODEL TIERS (Points-based pricing)
// ============================================================================

export const MODEL_TIERS: Record<number, ModelTierConfig> = {
  1: {
    inputCostPer1M: 5,
    models: [
      'gpt-4o-mini',
      'gemini-1.5-flash',
      'gemini-2.0-flash',
      'claude-3-haiku',
      'deepseek-chat',
      'qwen-turbo',
    ],
    outputCostPer1M: 15,
    pointsPerMessage: 5,
    tier: 1,
    tierName: 'Cheap (Budget)',
  },
  2: {
    inputCostPer1M: 100,
    models: [
      'gpt-4o',
      'gpt-4.1',
      'claude-3-5-sonnet',
      'claude-3-sonnet',
      'gemini-1.5-pro',
      'gemini-2.5-pro',
      'deepseek-reasoner',
    ],
    outputCostPer1M: 300,
    pointsPerMessage: 150,
    tier: 2,
    tierName: 'Standard',
  },
  3: {
    inputCostPer1M: 500,
    models: ['gpt-4-turbo', 'claude-3-opus', 'o1', 'o1-pro', 'o3'],
    outputCostPer1M: 1500,
    pointsPerMessage: 1000,
    tier: 3,
    tierName: 'Expensive (Premium)',
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
 */
export function getModelTier(modelName: string): number {
  const normalizedName = modelName.toLowerCase();

  for (const [tier, config] of Object.entries(MODEL_TIERS)) {
    if (config.models.some((m) => normalizedName.includes(m.toLowerCase()))) {
      return Number(tier);
    }
  }

  // Default to Tier 2 for unknown models
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
 */
export function canUseTier(planCode: string, tier: number): boolean {
  const plan = getPlanByCode(planCode);
  if (!plan) return tier === 1;

  // Free plans: Tier 1 only
  if (plan.price === 0) return tier === 1;

  // Basic/Standard plans: Tier 1 & 2 (with daily limit for Tier 2)
  if (planCode === 'vn_basic' || planCode === 'gl_standard') {
    return tier <= 2;
  }

  // Pro/Premium plans: All tiers (with daily limit for Tier 3)
  return true;
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
  allowedModels.forEach(model => {
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
