'use client';

import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

import SafeSpacing from '@/components/SafeSpacing';
import { HEADER_HEIGHT } from '@/const/layoutTokens';
import SettingContainer from '@/features/Setting/SettingContainer';

import Header from './Header';

const Layout = ({ children }: PropsWithChildren) => (
  <>
    <Header />
    <SettingContainer addonBefore={<SafeSpacing height={HEADER_HEIGHT} />}>
      <Flexbox gap={24} paddingBlock={20} width={'100%'}>
        {children}
      </Flexbox>
    </SettingContainer>
  </>
);

Layout.displayName = 'DesktopSubscriptionPlansLayout';

export default Layout;
