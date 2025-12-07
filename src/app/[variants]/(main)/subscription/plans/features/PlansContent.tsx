'use client';

import { useUser } from '@clerk/nextjs';
import { memo, useCallback } from 'react';
import { Flexbox } from 'react-layout-kit';

import { GeoAwarePricingSection } from '@/features/PricingCards';
import { usePricingGeo } from '@/hooks/usePricingGeo';

import CompareSection from '../../../settings/subscription/features/CompareSection';

/**
 * PlansContent Component
 *
 * Displays geo-aware pricing cards that automatically show:
 * - Vietnam pricing (VND) for Vietnamese users
 * - Global pricing (USD) for international users
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
const PlansContent = memo(() => {
  const { user } = useUser();
  const { isVietnam } = usePricingGeo();

  // Get current plan from user metadata
  const currentPlanId = (user?.publicMetadata?.planId as string) || 'vn_free';

  // Handle plan selection - navigate to checkout/upgrade
  const handleSelectPlan = useCallback((planId: string) => {
    // Determine payment provider based on plan prefix
    const isVietnamPlan = planId.startsWith('vn_');

    if (isVietnamPlan) {
      // Vietnam plans use Sepay
      window.location.href = `/subscription/checkout?plan=${planId}&provider=sepay`;
    } else {
      // Global plans use Polar
      window.location.href = `/subscription/checkout?plan=${planId}&provider=polar`;
    }
  }, []);

  return (
    <Flexbox gap={32} style={{ margin: '0 auto', maxWidth: '1200px' }} width={'100%'}>
      {/* Geo-aware pricing cards */}
      <GeoAwarePricingSection currentPlanId={currentPlanId} onSelectPlan={handleSelectPlan} />

      {/* Feature comparison table - only show for Vietnam region */}
      {isVietnam && <CompareSection />}
    </Flexbox>
  );
});

PlansContent.displayName = 'PlansContent';

export default PlansContent;
