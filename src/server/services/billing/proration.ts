/**
 * Proration calculation utilities for subscription upgrades/downgrades
 * Based on PRICING_MASTERPLAN.md.md
 */

/**
 * Plan pricing in VND based on PRICING_MASTERPLAN.md.md
 * Uses Phở Points system
 */
export const PLAN_PRICING: Record<
  string,
  { monthly: number; monthlyPoints: number; yearly: number }
> = {
  
  // per user
// Legacy mappings (for backward compatibility)
free: { monthly: 0, monthlyPoints: 50_000, yearly: 0 },
  


premium: { monthly: 69_000, monthlyPoints: 300_000, yearly: 690_000 },
  


starter: { monthly: 0, monthlyPoints: 50_000, yearly: 0 },
  


ultimate: { monthly: 199_000, monthlyPoints: 2_000_000, yearly: 1_990_000 }, 

  
  // Vietnam Plans
vn_basic: { monthly: 69_000, monthlyPoints: 300_000, yearly: 690_000 },
  vn_free: { monthly: 0, monthlyPoints: 50_000, yearly: 0 },
  vn_pro: { monthly: 199_000, monthlyPoints: 2_000_000, yearly: 1_990_000 },
  vn_team: { monthly: 149_000, monthlyPoints: 0, yearly: 1_490_000 },
};

/**
 * Plan tier hierarchy for determining upgrade vs downgrade
 * Higher number = higher tier
 */
export const PLAN_TIERS: Record<string, number> = {
  
  // Legacy mappings
free: 0,
  

premium: 1,
  

starter: 0,
  

ultimate: 2,

  
  // Vietnam Plans
vn_basic: 1,
  vn_free: 0,
  vn_pro: 2,
  vn_team: 3,
};

/**
 * Calculate prorated amount for plan change
 * @param currentPlan - Current plan ID (free, starter, premium, ultimate)
 * @param newPlan - New plan ID to upgrade/downgrade to
 * @param billingCycle - Billing cycle (monthly or yearly)
 * @param currentPeriodEnd - Current subscription period end date
 * @param now - Current date (optional, defaults to new Date())
 * @returns Prorated amount in VND (positive = charge, negative = credit)
 */
export function calculateProratedAmount(
  currentPlan: string,
  newPlan: string,
  billingCycle: 'monthly' | 'yearly',
  currentPeriodEnd: Date,
  now: Date = new Date(),
): number {
  const daysRemaining = Math.ceil(
    (currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  const totalDays = billingCycle === 'monthly' ? 30 : 365;

  // Get pricing with fallback to 0 for unknown plans (like 'free')
  const currentPricing = PLAN_PRICING[currentPlan] || { monthly: 0, yearly: 0 };
  const newPricing = PLAN_PRICING[newPlan] || { monthly: 0, yearly: 0 };

  const currentPrice = currentPricing[billingCycle];
  const newPrice = newPricing[billingCycle];

  // Special case: upgrading from free plan - charge full price for new plan
  if (currentPlan === 'free') {
    return newPrice;
  }

  // Calculate daily rates
  const currentDailyRate = currentPrice / totalDays;
  const newDailyRate = newPrice / totalDays;

  // Calculate credit for remaining days on current plan
  const credit = currentDailyRate * daysRemaining;

  // Calculate charge for new plan for remaining days
  const charge = newDailyRate * daysRemaining;

  // Prorated amount (positive = charge, negative = credit)
  return Math.round(charge - credit);
}

/**
 * Determine if a plan change is an upgrade or downgrade
 * @param currentPlan - Current plan ID
 * @param newPlan - New plan ID
 * @returns Object with isUpgrade and isDowngrade flags
 */
export function getPlanChangeType(
  currentPlan: string,
  newPlan: string,
): { isDowngrade: boolean; isUpgrade: boolean } {
  const currentTier = PLAN_TIERS[currentPlan] ?? 0;
  const newTier = PLAN_TIERS[newPlan] ?? 0;

  return {
    isDowngrade: newTier < currentTier,
    isUpgrade: newTier > currentTier,
  };
}

/**
 * Calculate days remaining in current billing period
 * @param currentPeriodEnd - Current subscription period end date
 * @param now - Current date (optional, defaults to new Date())
 * @returns Number of days remaining
 */
export function calculateDaysRemaining(currentPeriodEnd: Date, now: Date = new Date()): number {
  return Math.max(
    0,
    Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}
