import dynamic from 'next/dynamic';

import { isDesktop } from '@/const/version';
import { analyticsEnv } from '@/envs/analytics';

import Desktop from './Desktop';
import Google from './Google';
import Vercel from './Vercel';

// Lazy load analytics components
const Plausible = dynamic(() => import('./Plausible'));
const Umami = dynamic(() => import('./Umami'));
const Clarity = dynamic(() => import('./Clarity'));
const ReactScan = dynamic(() => import('./ReactScan'));

// Route-aware TikTok analytics - only loads on marketing pages
// This significantly improves performance on /chat and other core pages
// Note: RouteAwareAnalytics is a 'use client' component, so it handles its own hydration
const RouteAwareTikTok = dynamic(() => import('./RouteAwareAnalytics'));

/**
 * Analytics component - Optimized for performance
 *
 * Core analytics (Vercel, Google, Plausible, Umami) load on all pages.
 * TikTok Pixel is route-aware and only loads on marketing pages
 * (/discover, /subscription, /landing, etc.) - NOT on /chat, /settings, etc.
 *
 * This optimization reduces JS bundle on /chat by ~100-200KB and improves:
 * - LCP (Largest Contentful Paint)
 * - TBT (Total Blocking Time)
 * - TTI (Time to Interactive)
 */
const Analytics = () => {
  return (
    <>
      {/* Core analytics - Always load (essential for basic analytics) */}
      {analyticsEnv.ENABLE_VERCEL_ANALYTICS && <Vercel />}
      {analyticsEnv.ENABLE_GOOGLE_ANALYTICS && <Google />}

      {/* Lightweight analytics - Load on all pages */}
      {analyticsEnv.ENABLED_PLAUSIBLE_ANALYTICS && (
        <Plausible
          domain={analyticsEnv.PLAUSIBLE_DOMAIN}
          scriptBaseUrl={analyticsEnv.PLAUSIBLE_SCRIPT_BASE_URL}
        />
      )}
      {analyticsEnv.ENABLED_UMAMI_ANALYTICS && (
        <Umami
          scriptUrl={analyticsEnv.UMAMI_SCRIPT_URL}
          websiteId={analyticsEnv.UMAMI_WEBSITE_ID}
        />
      )}
      {analyticsEnv.ENABLED_CLARITY_ANALYTICS && (
        <Clarity projectId={analyticsEnv.CLARITY_PROJECT_ID} />
      )}

      {/* Route-aware TikTok - Only on marketing pages, NOT on /chat */}
      <RouteAwareTikTok />

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
