/**
 * Geo-Aware Pricing Section
 * Automatically displays Vietnam or Global pricing based on user's location
 *
 * Based on PRICING_MASTERPLAN.md.md geo-fencing requirements
 */
'use client';

import { Skeleton, Switch, Typography } from 'antd';
import { memo, useState } from 'react';
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

const { Text } = Typography;

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
 * - Allows manual toggle between regions
 * - Loading skeleton while detecting
 */
const GeoAwarePricingSection = memo<GeoAwarePricingSectionProps>(
  ({ mobile, onSelectPlan, currentPlanId }) => {
    const { isVietnam, isLoading, countryCode } = usePricingGeo();

    // Allow manual override of region
    const [showVietnam, setShowVietnam] = useState<boolean | null>(null);

    // Use detected region unless manually overridden
    const displayVietnam = showVietnam !== null ? showVietnam : isVietnam;

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
        {/* Region Toggle */}
        <Flexbox align="center" gap={16} horizontal justify="flex-end">
          <Text type="secondary">
            Detected: {countryCode} ({isVietnam ? 'Vietnam' : 'Global'})
          </Text>
          <Flexbox align="center" gap={8} horizontal>
            <Text type={displayVietnam ? 'secondary' : undefined}>USD 🌍</Text>
            <Switch checked={displayVietnam} onChange={(checked) => setShowVietnam(checked)} />
            <Text type={displayVietnam ? undefined : 'secondary'}>VND 🇻🇳</Text>
          </Flexbox>
        </Flexbox>

        {/* Pricing Cards */}
        {displayVietnam ? (
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
