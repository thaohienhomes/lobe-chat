'use client';

import dynamic from 'next/dynamic';

import { isDesktop } from '@/const/version';
import { analyticsEnv } from '@/envs/analytics';

import Desktop from './Desktop';
import Google from './Google';
import Sentry from './Sentry';
import Vercel from './Vercel';

// Route-aware analytics - loads heavy marketing analytics only on marketing pages
// This significantly improves performance on /chat and other core pages
const RouteAwareAnalytics = dynamic(() => import('./RouteAwareAnalytics'), {
  ssr: false, // Client-side only since it uses usePathname
});

const ReactScan = dynamic(() => import('./ReactScan'));

/**
 * Analytics component - Optimized for performance
 *
 * Core analytics (Sentry, Vercel, Google) load on all pages for essential tracking.
 * Heavy marketing analytics (TikTok, Clarity) are route-aware and only load on
 * marketing pages (/discover, /subscription, /landing, etc.)
 *
 * This optimization reduces JS bundle on /chat by ~100-200KB and improves:
 * - LCP (Largest Contentful Paint)
 * - TBT (Total Blocking Time)
 * - TTI (Time to Interactive)
 */
const Analytics = () => {
  return (
    <>
      {/* Core analytics - Always load (essential for error tracking & basic analytics) */}
      {process.env.NEXT_PUBLIC_ENABLE_SENTRY === '1' && <Sentry />}
      {analyticsEnv.ENABLE_VERCEL_ANALYTICS && <Vercel />}
      {analyticsEnv.ENABLE_GOOGLE_ANALYTICS && <Google />}

      {/* Route-aware analytics - Heavy marketing analytics only on marketing pages */}
      <RouteAwareAnalytics />

      {/* Dev tools - Only in development */}
      {!!analyticsEnv.REACT_SCAN_MONITOR_API_KEY && (
        <ReactScan apiKey={analyticsEnv.REACT_SCAN_MONITOR_API_KEY} />
      )}

      {/* Desktop-specific analytics */}
      {isDesktop && <Desktop />}
    </>
  );
};

export default Analytics;
