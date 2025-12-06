/**
 * Proration calculation utilities for subscription upgrades/downgrades
 */

// Plan pricing in VND (free plan has 0 cost)
export const PLAN_PRICING: Record<string, { monthly: number; yearly: number }> = {
  free: { monthly: 0, yearly: 0 },
  premium: { monthly: 129_000, yearly: 1_290_000 },
  starter: { monthly: 39_000, yearly: 390_000 },
  ultimate: { monthly: 349_000, yearly: 3_490_000 },
};

// Plan tier hierarchy for determining upgrade vs downgrade
export const PLAN_TIERS: Record<string, number> = {
  free: 0,
  premium: 2,
  starter: 1,
  ultimate: 3,
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
export function calculateDaysRemaining(
  currentPeriodEnd: Date,
  now: Date = new Date(),
): number {
  return Math.max(
    0,
    Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
  );
}

