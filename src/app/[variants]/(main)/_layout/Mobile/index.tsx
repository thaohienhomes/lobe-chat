'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { PropsWithChildren, memo } from 'react';

import { withSuspense } from '@/components/withSuspense';
import { BANNER_HEIGHT } from '@/features/AlertBanner/const';
import { useShowMobileWorkspace } from '@/hooks/useShowMobileWorkspace';
import { featureFlagsSelectors, useServerConfigStore } from '@/store/serverConfig';

import NavBar from './NavBar';

// Reserve exact banner height while loading to prevent CLS (layout shift)
const CloudBanner = dynamic(() => import('@/features/AlertBanner/CloudBanner'), {
  loading: () => <div style={{ height: BANNER_HEIGHT }} />,
});
const MOBILE_NAV_ROUTES = new Set([
  '/chat',
  '/discover',
  '/discover/assistant',
  '/discover/mcp',
  '/discover/plugin',
  '/discover/model',
  '/discover/provider',
  '/me',
]);

const Layout = memo(({ children }: PropsWithChildren) => {
  const showMobileWorkspace = useShowMobileWorkspace();
  const pathname = usePathname();
  const showNav = !showMobileWorkspace && MOBILE_NAV_ROUTES.has(pathname);

  const { showCloudPromotion } = useServerConfigStore(featureFlagsSelectors);

  return (
    <>
      {showCloudPromotion && <CloudBanner mobile />}
      {children}
      {showNav && <NavBar />}
    </>
  );
});

Layout.displayName = 'MobileMainLayout';

export default withSuspense(Layout);
