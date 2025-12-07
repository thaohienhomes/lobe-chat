'use client';

import { Form } from '@lobehub/ui';
import { useTheme } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import CompareSection from './features/CompareSection';
import CreditsSection from './features/CreditsSection';
import PlansSection from './features/PlansSection';

interface SubscriptionPageProps {
  mobile?: boolean;
}

const SubscriptionPage = memo<SubscriptionPageProps>(({ mobile }) => {
  const { t } = useTranslation('setting');
  const theme = useTheme();

  return (
    <Form.Group
      style={{ color: theme.colorText, maxWidth: '1024px', width: '100%' }}
      title={t('subscription.title')}
      variant={'borderless'}
    >
      <Flexbox gap={24} paddingBlock={20} width={'100%'}>
        <CreditsSection />
        <PlansSection mobile={mobile} />
        <CompareSection mobile={mobile} />
      </Flexbox>
    </Form.Group>
  );
});

SubscriptionPage.displayName = 'SubscriptionPage';

export default SubscriptionPage;
