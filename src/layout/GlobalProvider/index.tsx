import dynamic from 'next/dynamic';
import { ReactNode, Suspense } from 'react';

import { LobeAnalyticsProviderWrapper } from '@/components/Analytics/LobeAnalyticsProviderWrapper';
import { getServerFeatureFlagsValue } from '@/config/featureFlags';
import { appEnv } from '@/envs/app';
import DevPanel from '@/features/DevPanel';
import PWARegister from '@/features/PWARegister';
import { getServerGlobalConfig } from '@/server/globalConfig';
import { ServerConfigStoreProvider } from '@/store/serverConfig/Provider';
import { getAntdLocale } from '@/utils/locale';

import AntdV5MonkeyPatch from './AntdV5MonkeyPatch';
import AppTheme from './AppTheme';
import ImportSettings from './ImportSettings';
import Locale from './Locale';
import QueryProvider from './Query';
import StoreInitialization from './StoreInitialization';
import StyleRegistry from './StyleRegistry';

// Phase 2 stores are non-critical — dynamic import creates separate chunk
// reducing initial JS bundle and TBT (Total Blocking Time)
const DeferredStoreInitialization = dynamic(() => import('./DeferredStoreInitialization'), {
  ssr: false,
});

interface GlobalLayoutProps {
  appearance: string;
  children: ReactNode;
  isMobile: boolean;
  locale: string;
  neutralColor?: string;
  primaryColor?: string;
  variants?: string;
}

const GlobalLayout = async ({
  children,
  neutralColor,
  primaryColor,
  locale: userLocale,
  appearance,
  isMobile,
  variants,
}: GlobalLayoutProps) => {
  const antdLocale = await getAntdLocale(userLocale);

  // get default feature flags to use with ssr
  const serverFeatureFlags = getServerFeatureFlagsValue();
  const serverConfig = await getServerGlobalConfig();
  return (
    <StyleRegistry>
      <Locale antdLocale={antdLocale} defaultLang={userLocale}>
        <AppTheme
          customFontFamily={appEnv.CUSTOM_FONT_FAMILY}
          customFontURL={appEnv.CUSTOM_FONT_URL}
          defaultAppearance={appearance}
          defaultNeutralColor={neutralColor as any}
          defaultPrimaryColor={primaryColor as any}
          globalCDN={appEnv.CDN_USE_GLOBAL}
        >
          <ServerConfigStoreProvider
            featureFlags={serverFeatureFlags}
            isMobile={isMobile}
            segmentVariants={variants}
            serverConfig={serverConfig}
          >
            <QueryProvider>{children}</QueryProvider>
            <LobeAnalyticsProviderWrapper />
            {/* Phase 1: Critical stores — theme, layout, auth (sync, fast) */}
            <Suspense>
              <StoreInitialization />
            </Suspense>
            {/* Phase 2: Non-critical stores — agent, AI provider, user (deferred to idle) */}
            <Suspense>
              <DeferredStoreInitialization />
            </Suspense>
            <PWARegister />
            <Suspense>
              <ImportSettings />
              {process.env.NODE_ENV === 'development' && <DevPanel />}
            </Suspense>
          </ServerConfigStoreProvider>
        </AppTheme>
      </Locale>
      <AntdV5MonkeyPatch />
    </StyleRegistry>
  );
};

export default GlobalLayout;
