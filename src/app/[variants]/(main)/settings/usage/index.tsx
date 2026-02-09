'use client';

import { Form } from '@lobehub/ui';
import { Divider, Typography } from 'antd';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { TierUsageDisplay, UsageMeter } from '@/features/UsageMeter';

import BillingInfo from './features/BillingInfo';
import PromoCodeForm from './features/PromoCodeForm';
import UsageHistory from './features/UsageHistory';
import UsageOverview from './features/UsageOverview';

const { Title } = Typography;

interface UsagePageProps {
  mobile?: boolean;
}

/**
 * UsagePage Component
 *
 * Displays user's usage statistics including:
 * - Phở Points balance (UsageMeter)
 * - Daily Tier 2/3 usage limits (TierUsageDisplay)
 * - Billing information
 * - Usage history
 *
 * Based on PRICING_MASTERPLAN.md.md
 */
const UsagePage = memo<UsagePageProps>(({ mobile }) => {
  const { t } = useTranslation('setting');

  return (
    <Form.Group
      style={{ maxWidth: '1024px', width: '100%' }}
      title={t('usage.title')}
      variant={'borderless'}
    >
      <Flexbox gap={24} paddingBlock={20} width={'100%'}>
        {/* Phở Points Balance Section */}
        <Flexbox gap={16}>
          <Title level={4}>🍜 Phở Points Balance</Title>
          <UsageMeter />
        </Flexbox>

        <Divider />

        {/* Daily Tier Usage Limits */}
        <Flexbox gap={16}>
          <Title level={4}>📊 Daily Model Usage</Title>
          <TierUsageDisplay showTier2 showTier3 />
        </Flexbox>

        <Divider />

        {/* Original sections */}
        <UsageOverview mobile={mobile} />
        <PromoCodeForm />
        <BillingInfo mobile={mobile} />
        <UsageHistory mobile={mobile} />
      </Flexbox>
    </Form.Group>
  );
});

UsagePage.displayName = 'UsagePage';

export default UsagePage;
