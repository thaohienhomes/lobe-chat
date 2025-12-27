/**
 * Free Tier Configuration
 *
 * DEPRECATED: This file is being phased out in favor of src/config/pricing.ts
 * which contains the centralized pricing configuration.
 *
 * The new pricing structure uses:
 * - Points-based system (Phở Points) instead of message limits
 * - Tiered model access (Tier 1, 2, 3) instead of hardcoded model lists
 * - Plan-based model filtering via PLAN_MODEL_ACCESS
 *
 * See PRICING_MASTERPLAN.md for details.
 */

import {
  
  PLAN_MODEL_ACCESS,
  VN_PLANS,
  getModelTier,
} from '@/config/pricing';

// ============================================================================
// LEGACY EXPORTS (for backward compatibility)
// These re-export from the new centralized config
// ============================================================================

/**
 * @deprecated Use VN_PLANS from src/config/pricing.ts instead
 * Legacy trial config - now uses points-based system
 */
export const TRIAL_CONFIG = {
  
  // 50,000 points
// Legacy fields kept for API compatibility
// These are no longer enforced - use points instead
maxMessages: -1, 

  
  
  // Points per month for free tier (vn_free plan)
maxPoints: VN_PLANS.vn_free.monthlyPoints, // Unlimited (within points budget)
  maxTokens: -1, // Unlimited (within points budget)
  resetPeriodDays: 30, // Monthly reset
  trialPeriodDays: 0, // No time limit
} as const;

/**
 * @deprecated Use PLAN_MODEL_ACCESS.vn_free.models from src/config/pricing.ts
 * Free tier allowed models - Tier 1 only
 */
export const FREE_TIER_MODELS = PLAN_MODEL_ACCESS.vn_free.models;

/**
 * @deprecated Use PLAN_MODEL_ACCESS.vn_free.defaultModel from src/config/pricing.ts
 */
export const DEFAULT_FREE_MODEL = PLAN_MODEL_ACCESS.vn_free.defaultModel;

/**
 * @deprecated Use VN_PLANS from src/config/pricing.ts
 * Legacy plan pricing - kept for backward compatibility
 */
export const PLAN_PRICING = {
  premium: VN_PLANS.vn_pro.price, // 199,000 VND
  starter: VN_PLANS.vn_basic.price, // 69,000 VND
  ultimate: VN_PLANS.vn_team.price, // 149,000 VND per user
} as const;

/**
 * @deprecated Use VN_PLANS[plan].monthlyPoints from src/config/pricing.ts
 */
export const PLAN_CREDITS = {
  free: VN_PLANS.vn_free.monthlyPoints, // 50,000
  premium: VN_PLANS.vn_pro.monthlyPoints, // 2,000,000
  starter: VN_PLANS.vn_basic.monthlyPoints, // 300,000
  ultimate: VN_PLANS.vn_team.monthlyPoints, // Pooled (0 = custom)
} as const;

/**
 * @deprecated Status is now determined by subscription + points balance
 */
export type TrialStatus = {
  allowedTiers: number[];
  canUseAI: boolean;
  isOnTrial: boolean;
  planId: string;
  pointsRemaining: number;
  pointsUsed: number;
};

/**
 * Check if a model is allowed for free tier users (Tier 1 only)
 * @deprecated Use canPlanUseModel from src/config/pricing.ts
 */
export function isModelAllowedForTrial(model: string): boolean {
  const tier = getModelTier(model);
  return tier === 1; // Free tier = Tier 1 only
}

/**
 * Get a fallback model for free tier users
 * @deprecated Use getDefaultModelForPlan from src/config/pricing.ts
 */
export function getTrialFallbackModel(): string {
  return DEFAULT_FREE_MODEL;
}

/**
 * Get model tier for a given model
 * Re-exported from pricing config for convenience
 */



export {getModelTier,MODEL_TIERS} from '@/config/pricing';