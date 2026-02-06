'use client';

import {
  GoogleAnalyticsProviderConfig,
  PostHogProviderAnalyticsConfig,
  createSingletonAnalytics,
} from '@lobehub/analytics';
import { AnalyticsProvider } from '@lobehub/analytics/react';
import { ReactNode, memo, useMemo } from 'react';

import { BUSINESS_LINE } from '@/const/analytics';
import { isDesktop } from '@/const/version';
import { isDev } from '@/utils/env';

type Props = {
  children: ReactNode;
  ga4Config: GoogleAnalyticsProviderConfig;
  postHogConfig: PostHogProviderAnalyticsConfig;
};

let analyticsInstance: ReturnType<typeof createSingletonAnalytics> | null = null;

export const LobeAnalyticsProvider = memo(
  ({ children, ga4Config, postHogConfig }: Props) => {
    const analytics = useMemo(() => {
      if (analyticsInstance) {
        return analyticsInstance;
      }

      analyticsInstance = createSingletonAnalytics({
        business: BUSINESS_LINE,
        debug: isDev,
        providers: {
          ga4: ga4Config,
          posthog: postHogConfig,
        },
      });

      return analyticsInstance;
    }, []);

    if (!analytics) return children;

    return (
      <AnalyticsProvider
        client={analytics}
        onInitializeSuccess={() => {
          // Determine environment from Vercel or fallback
          const environment =
            process.env.NEXT_PUBLIC_VERCEL_ENV || // 'production', 'preview', 'development'
            (isDev ? 'development' : 'production');

          analyticsInstance?.setGlobalContext({
            environment,
            platform: isDesktop ? 'desktop' : 'web',
          });

          analyticsInstance
            ?.getProvider('posthog')
            ?.getNativeInstance()
            ?.register({
              environment, // For feature flag targeting
              platform: isDesktop ? 'desktop' : 'web',
            });
        }}
      >
        {children}
      </AnalyticsProvider>
    );
  },
  () => true,
);
