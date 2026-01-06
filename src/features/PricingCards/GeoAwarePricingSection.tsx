/**
 * Geo-Aware Pricing Section
 * Automatically displays Vietnam or Global pricing based on user's location
 *
 * Based on PRICING_MASTERPLAN.md.md geo-fencing requirements
 */
'use client';

import { Skeleton } from 'antd';
import { memo } from 'react';
import { Flexbox } from 'react-layout-kit';

import { usePricingGeo } from '@/hooks/usePricingGeo';

import GlobalPricingCards from './GlobalPricingCards';
import VietnamPricingCards from './VietnamPricingCards';

/**
 * Geo-Aware Pricing Section
 * Automatically displays Vietnam or Global pricing based on user's location
 *
 * Based on PRICING_MASTERPLAN.md.md geo-fencing requirements
 */

interface GeoAwarePricingSectionProps {
  currentPlanId?: string;
  mobile?: boolean;
  onSelectPlan?: (planId: string) => void;
}

/**
 * GeoAwarePricingSection
 *
 * Features:
 * - Auto-detects user's region via CF-IPCountry header
 * - Shows Vietnam pricing (VND) for Vietnamese users
 * - Shows Global pricing (USD) for international users
 * - Automatic detection only (no manual toggle)
 * - Loading skeleton while detecting
 */
const GeoAwarePricingSection = memo<GeoAwarePricingSectionProps>(
  ({ mobile, onSelectPlan, currentPlanId }) => {
    const { isVietnam, isLoading } = usePricingGeo();

    if (isLoading) {
      return (
        <Flexbox gap={24} width="100%">
          <Skeleton active paragraph={{ rows: 1 }} title={{ width: 200 }} />
          <div
            style={{
              display: 'grid',
              gap: 24,
              gridTemplateColumns: mobile ? '1fr' : 'repeat(3, 1fr)',
            }}
          >
            {[1, 2, 3].map((i) => (
              <Skeleton.Node active key={i} style={{ height: 400, width: '100%' }} />
            ))}
          </div>
        </Flexbox>
      );
    }

    return (
      <Flexbox gap={24} width="100%">
        {/* Pricing Cards */}
        {isVietnam ? (
          <VietnamPricingCards
            currentPlanId={currentPlanId}
            mobile={mobile}
            onSelectPlan={onSelectPlan}
          />
        ) : (
          <GlobalPricingCards
            currentPlanId={currentPlanId}
            mobile={mobile}
            onSelectPlan={onSelectPlan}
          />
        )}
      </Flexbox>
    );
  },
);

GeoAwarePricingSection.displayName = 'GeoAwarePricingSection';

export default GeoAwarePricingSection;
