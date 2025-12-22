'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { memo, useMemo } from 'react';

// Lazy load heavy analytics components
const TikTok = dynamic(() => import('./TikTok'));
const TikTokProvider = dynamic(() => import('./TikTokProvider'));

/**
 * Client-side environment variables for analytics
 * Only NEXT_PUBLIC_* variables are accessible in client components
 */
const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const ENABLED_TIKTOK_PIXEL = !!TIKTOK_PIXEL_ID;

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
 *
 * NOTE: This component only handles TikTok Pixel which uses NEXT_PUBLIC_ env var.
 * Other analytics (Clarity, Plausible, Umami) use server-side env vars and are
 * handled by the parent Analytics component which can access analyticsEnv.
 */
const RouteAwareAnalytics = memo(() => {
  const pathname = usePathname();

  // Determine if we should load TikTok based on current route
  const shouldLoadTikTok = useMemo(() => {
    // Skip on performance-critical routes
    if (isPerformanceCriticalRoute(pathname)) {
      return false;
    }

    // Load TikTok only on marketing routes and if enabled
    return isMarketingRoute(pathname) && ENABLED_TIKTOK_PIXEL;
  }, [pathname]);

  // Early return if TikTok is not enabled globally
  if (!ENABLED_TIKTOK_PIXEL) {
    return null;
  }

  return (
    <>
      {/* TikTok Pixel - Only on marketing routes */}
      {shouldLoadTikTok && (
        <TikTokProvider>
          <TikTok pixelId={TIKTOK_PIXEL_ID} />
        </TikTokProvider>
      )}
    </>
  );
});

RouteAwareAnalytics.displayName = 'RouteAwareAnalytics';

export default RouteAwareAnalytics;
