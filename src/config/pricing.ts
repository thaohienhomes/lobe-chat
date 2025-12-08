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
    displayName: 'Lifetime Deal',
    features: [
      'All Premium features forever',
      '500K points/month (reset monthly)',
      'Priority support',
      'Early access to new features',
    ],
    keyLimits: '500K points/mo (Reset). One-time payment.',
    monthlyPoints: 500_000, // Reset monthly
    price: 149, // One-time
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
    price: 19.9,
    priceYearly: 199,
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
    price: 9.9,
    priceYearly: 99,
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
