'use client';

import { Form } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import CompareSection from './features/CompareSection';
import { CostOptimizationSection } from './features/CostOptimizationSection';
import PlansSection from './features/PlansSection';

interface SubscriptionPageProps {
  mobile?: boolean;
}

const SubscriptionPage = memo<SubscriptionPageProps>(({ mobile }) => {
  const { t } = useTranslation('setting');

  return (
    <Form.Group
      style={{ maxWidth: '1024px', width: '100%' }}
      title={t('subscription.title')}
      variant={'borderless'}
    >
      <Flexbox gap={24} paddingBlock={20} width={'100%'}>
        <CostOptimizationSection mobile={mobile} />
        <PlansSection mobile={mobile} />
        <CompareSection mobile={mobile} />
      </Flexbox>
    </Form.Group>
  );
});

SubscriptionPage.displayName = 'SubscriptionPage';

export default SubscriptionPage;
