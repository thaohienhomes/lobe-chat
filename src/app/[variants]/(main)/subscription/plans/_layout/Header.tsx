'use client';

import { ActionIcon } from '@lobehub/ui';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';

import { HEADER_HEIGHT } from '@/const/layoutTokens';

const Header = memo(() => {
  const { t } = useTranslation('setting');
  const router = useRouter();

  return (
    <Flexbox
      align={'center'}
      gap={8}
      height={HEADER_HEIGHT}
      horizontal
      paddingInline={16}
      style={{
        borderBottom: '1px solid rgba(5, 5, 5, 0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <ActionIcon
        icon={ArrowLeft}
        onClick={() => router.back()}
        size={'small'}
        title={t('header.back')}
      />
      <span style={{ fontSize: 16, fontWeight: 600 }}>{t('subscription.plans.title')}</span>
    </Flexbox>
  );
});

Header.displayName = 'SubscriptionPlansHeader';

export default Header;
