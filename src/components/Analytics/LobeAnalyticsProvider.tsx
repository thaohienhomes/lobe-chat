'use client';

import {
  GoogleAnalyticsProviderConfig,
  PostHogProviderAnalyticsConfig,
  createSingletonAnalytics,
} from '@lobehub/analytics';
import { AnalyticsProvider } from '@lobehub/analytics/react';
import { ReactNode, memo, useEffect, useState } from 'react';

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
    // Defer analytics initialization until after first paint
    // This prevents PostHog (~150KB) and GA4 from blocking FCP/LCP
    const [analytics, setAnalytics] = useState<typeof analyticsInstance>(analyticsInstance);

    useEffect(() => {
      if (analyticsInstance) {
        setAnalytics(analyticsInstance);
        return;
      }

      // Use requestIdleCallback to initialize after browser is idle
      const init = () => {
        analyticsInstance = createSingletonAnalytics({
          business: BUSINESS_LINE,
          debug: isDev,
          providers: {
            ga4: ga4Config,
            posthog: postHogConfig,
          },
        });
        setAnalytics(analyticsInstance);
      };

      if (typeof requestIdleCallback !== 'undefined') {
        const id = requestIdleCallback(init, { timeout: 3000 });
        return () => cancelIdleCallback(id);
      } else {
        // Fallback for Safari — defer to next frame
        const timer = setTimeout(init, 100);
        return () => clearTimeout(timer);
      }
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

          const posthog = analyticsInstance?.getProvider('posthog')?.getNativeInstance();

          if (posthog) {
            // Expose PostHog to window for debugging and external access
            if (typeof window !== 'undefined') {
              (window as any).posthog = posthog;
            }

            // Ensure properties are available for instant Feature Flag evaluation
            posthog.setPersonPropertiesForFlags({
              environment,
              platform: isDesktop ? 'desktop' : 'web',
            });

            // Register as super property (event property)
            const isZaloBrowser =
              typeof navigator !== 'undefined' && /zalo/i.test(navigator.userAgent);

            posthog.register({
              ...(isZaloBrowser && { browser_app: 'zalo' }),
              environment,
              platform: isDesktop ? 'desktop' : 'web',
            });

            // Set as Person Property for backend persistence and long-term targeting
            posthog.people.set({
              environment,
            });

            // Reload flags to ensure new context is used
            posthog.reloadFeatureFlags();
          }
        }}
      >
        {children}
      </AnalyticsProvider>
    );
  },
  () => true,
);
