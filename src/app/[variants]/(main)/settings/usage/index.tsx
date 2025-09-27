'use client';

import { Form } from '@lobehub/ui';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import BillingInfo from './features/BillingInfo';
import UsageHistory from './features/UsageHistory';
import UsageOverview from './features/UsageOverview';

interface UsagePageProps {
  mobile?: boolean;
}

const UsagePage = memo<UsagePageProps>(({ mobile }) => {
  const { t } = useTranslation('setting');

  return (
    <Form.Group
      style={{ maxWidth: '1024px', width: '100%' }}
      title={t('usage.title')}
      variant={'borderless'}
    >
      <Flexbox gap={24} paddingBlock={20} width={'100%'}>
        <UsageOverview mobile={mobile} />
        <BillingInfo mobile={mobile} />
        <UsageHistory mobile={mobile} />
      </Flexbox>
    </Form.Group>
  );
});

UsagePage.displayName = 'UsagePage';

export default UsagePage;
