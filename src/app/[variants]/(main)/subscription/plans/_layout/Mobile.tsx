'use client';

import { PropsWithChildren } from 'react';
import { Flexbox } from 'react-layout-kit';

import MobileContentLayout from '@/components/server/MobileNavLayout';

import Header from './Header';

const Layout = ({ children }: PropsWithChildren) => (
  <MobileContentLayout header={<Header />}>
    <Flexbox gap={24} paddingBlock={20} width={'100%'}>
      {children}
    </Flexbox>
  </MobileContentLayout>
);

Layout.displayName = 'MobileSubscriptionPlansLayout';

export default Layout;
