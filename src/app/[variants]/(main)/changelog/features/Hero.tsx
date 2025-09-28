'use client';

import { useResponsive, useTheme } from 'antd-style';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Flexbox } from 'react-layout-kit';
import urlJoin from 'url-join';

import { BRANDING_NAME, SOCIAL_URL } from '@/const/branding';
import { OFFICIAL_SITE } from '@/const/url';

import GridLayout from './GridLayout';

const Hero = memo(() => {
  const { t } = useTranslation('changelog');
  const theme = useTheme();
  const { mobile } = useResponsive();
  const xUrl = SOCIAL_URL.x;
  return (
    <GridLayout>
      <Flexbox gap={16} style={{ paddingTop: 32, zIndex: 1 }}>
        <h1 style={{ fontSize: mobile ? 28 : 40, fontWeight: 'bold', margin: 0 }}>{t('title')}</h1>
        <div style={{ fontSize: mobile ? 18 : 24, opacity: 0.6 }}>
          {t('description', { appName: BRANDING_NAME })}
        </div>
        <Flexbox gap={8} horizontal style={{ fontSize: 16 }}>
          <Link href={urlJoin(OFFICIAL_SITE, '/changelog/versions')} target={'_blank'}>
            {t('actions.versions')}
          </Link>
          {xUrl && (
            <>
              <div style={{ color: theme.colorInfo }}>·</div>
              <Link href={xUrl} target={'_blank'}>
                {t('actions.followOnX')}
              </Link>
            </>
          )}
        </Flexbox>
      </Flexbox>
    </GridLayout>
  );
});

export default Hero;
