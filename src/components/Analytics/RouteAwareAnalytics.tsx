'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { memo, useMemo } from 'react';

import { analyticsEnv } from '@/envs/analytics';

// Lazy load heavy analytics components
const TikTok = dynamic(() => import('./TikTok'));
const TikTokProvider = dynamic(() => import('./TikTokProvider'));
const Clarity = dynamic(() => import('./Clarity'));
const Plausible = dynamic(() => import('./Plausible'));
const Umami = dynamic(() => import('./Umami'));

/**
 * Routes where marketing analytics (TikTok, etc.) should be loaded
 * These are public-facing pages where conversion tracking is valuable
 */
const MARKETING_ROUTES = new Set(['/', '/discover', '/subscription', '/landing']);

/**
 * Route prefixes for marketing pages
 * Used for pattern matching (e.g., /discover/assistant, /subscription/plans)
 */
const MARKETING_ROUTE_PREFIXES = ['/discover/', '/subscription/', '/landing/', '/apps/'];

/**
 * Routes where marketing analytics should NOT be loaded
 * These are app-core pages where we want maximum performance
 */
const PERFORMANCE_CRITICAL_ROUTES = [
  '/chat',
  '/settings',
  '/files',
  '/repos',
  '/profile',
  '/admin',
];

/**
 * Check if current route is a marketing route
 */
const isMarketingRoute = (pathname: string): boolean => {
  // Exact match
  if (MARKETING_ROUTES.has(pathname)) return true;

  // Prefix match for marketing routes
  for (const prefix of MARKETING_ROUTE_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }

  return false;
};

/**
 * Check if current route is performance-critical (should skip heavy analytics)
 */
const isPerformanceCriticalRoute = (pathname: string): boolean => {
  for (const route of PERFORMANCE_CRITICAL_ROUTES) {
    if (pathname.startsWith(route)) return true;
  }
  return false;
};

/**
 * Route-aware analytics component that only loads heavy marketing analytics
 * on marketing pages, keeping /chat and other core pages fast
 */
const RouteAwareAnalytics = memo(() => {
  const pathname = usePathname();

  // Determine which analytics to load based on current route
  const { shouldLoadTikTok, shouldLoadMarketingAnalytics } = useMemo(() => {
    // Skip heavy analytics on performance-critical routes
    if (isPerformanceCriticalRoute(pathname)) {
      return {
        shouldLoadMarketingAnalytics: false,
        shouldLoadTikTok: false,
      };
    }

    // Load marketing analytics on marketing routes
    const isMarketing = isMarketingRoute(pathname);
    return {
      shouldLoadMarketingAnalytics: isMarketing,
      shouldLoadTikTok: isMarketing && analyticsEnv.ENABLED_TIKTOK_PIXEL,
    };
  }, [pathname]);

  return (
    <>
      {/* TikTok Pixel - Only on marketing routes */}
      {shouldLoadTikTok && (
        <TikTokProvider>
          <TikTok pixelId={analyticsEnv.TIKTOK_PIXEL_ID} />
        </TikTokProvider>
      )}

      {/* Clarity - Only on marketing routes (session recording is heavy) */}
      {shouldLoadMarketingAnalytics && analyticsEnv.ENABLED_CLARITY_ANALYTICS && (
        <Clarity projectId={analyticsEnv.CLARITY_PROJECT_ID} />
      )}

      {/* Plausible - Lightweight, can load on all routes */}
      {analyticsEnv.ENABLED_PLAUSIBLE_ANALYTICS && (
        <Plausible
          domain={analyticsEnv.PLAUSIBLE_DOMAIN}
          scriptBaseUrl={analyticsEnv.PLAUSIBLE_SCRIPT_BASE_URL}
        />
      )}

      {/* Umami - Lightweight, can load on all routes */}
      {analyticsEnv.ENABLED_UMAMI_ANALYTICS && (
        <Umami
          scriptUrl={analyticsEnv.UMAMI_SCRIPT_URL}
          websiteId={analyticsEnv.UMAMI_WEBSITE_ID}
        />
      )}
    </>
  );
});

RouteAwareAnalytics.displayName = 'RouteAwareAnalytics';

export default RouteAwareAnalytics;
