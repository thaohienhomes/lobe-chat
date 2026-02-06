/* eslint-disable sort-keys-fix/sort-keys-fix */
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const getAnalyticsConfig = () => {
  return createEnv({
    client: {
      // PostHog Analytics - Must be in client block with NEXT_PUBLIC_ prefix
      NEXT_PUBLIC_POSTHOG_ENABLED: z.boolean(),
      NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
      NEXT_PUBLIC_POSTHOG_HOST: z.string(),
    },
    server: {
      ENABLED_PLAUSIBLE_ANALYTICS: z.boolean(),
      PLAUSIBLE_SCRIPT_BASE_URL: z.string(),
      PLAUSIBLE_DOMAIN: z.string().optional(),

      DEBUG_POSTHOG_ANALYTICS: z.boolean(),

      ENABLED_UMAMI_ANALYTICS: z.boolean(),
      UMAMI_WEBSITE_ID: z.string().optional(),
      UMAMI_SCRIPT_URL: z.string(),

      ENABLED_CLARITY_ANALYTICS: z.boolean(),
      CLARITY_PROJECT_ID: z.string().optional(),

      ENABLE_VERCEL_ANALYTICS: z.boolean(),
      DEBUG_VERCEL_ANALYTICS: z.boolean(),

      ENABLE_GOOGLE_ANALYTICS: z.boolean(),
      GOOGLE_ANALYTICS_MEASUREMENT_ID: z.string().optional(),

      REACT_SCAN_MONITOR_API_KEY: z.string().optional(),

      ENABLED_TIKTOK_PIXEL: z.boolean(),
      TIKTOK_PIXEL_ID: z.string().optional(),
      TIKTOK_ACCESS_TOKEN: z.string().optional(),
      TIKTOK_TEST_EVENT_CODE: z.string().optional(),
    },
    runtimeEnv: {
      // Plausible Analytics
      ENABLED_PLAUSIBLE_ANALYTICS: !!process.env.PLAUSIBLE_DOMAIN,
      PLAUSIBLE_DOMAIN: process.env.PLAUSIBLE_DOMAIN,
      PLAUSIBLE_SCRIPT_BASE_URL: process.env.PLAUSIBLE_SCRIPT_BASE_URL || 'https://plausible.io',

      // Posthog Analytics - Client-side accessible
      NEXT_PUBLIC_POSTHOG_ENABLED: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
      NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      DEBUG_POSTHOG_ANALYTICS: process.env.DEBUG_POSTHOG_ANALYTICS === '1',

      // Umami Analytics
      ENABLED_UMAMI_ANALYTICS: !!process.env.UMAMI_WEBSITE_ID,
      UMAMI_SCRIPT_URL: process.env.UMAMI_SCRIPT_URL || 'https://analytics.umami.is/script.js',
      UMAMI_WEBSITE_ID: process.env.UMAMI_WEBSITE_ID,

      // Clarity Analytics
      ENABLED_CLARITY_ANALYTICS: !!process.env.CLARITY_PROJECT_ID,
      CLARITY_PROJECT_ID: process.env.CLARITY_PROJECT_ID,

      // Vercel Analytics
      ENABLE_VERCEL_ANALYTICS: process.env.ENABLE_VERCEL_ANALYTICS === '1',
      DEBUG_VERCEL_ANALYTICS: process.env.DEBUG_VERCEL_ANALYTICS === '1',

      // Google Analytics
      ENABLE_GOOGLE_ANALYTICS: !!process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID,
      GOOGLE_ANALYTICS_MEASUREMENT_ID: process.env.GOOGLE_ANALYTICS_MEASUREMENT_ID,

      // React Scan Monitor
      // https://dashboard.react-scan.com
      REACT_SCAN_MONITOR_API_KEY: process.env.REACT_SCAN_MONITOR_API_KEY,

      // TikTok Pixel
      ENABLED_TIKTOK_PIXEL: !!process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
      TIKTOK_PIXEL_ID: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
      TIKTOK_ACCESS_TOKEN: process.env.TIKTOK_ACCESS_TOKEN,
      TIKTOK_TEST_EVENT_CODE: process.env.TIKTOK_TEST_EVENT_CODE,
    },
  });
};

export const analyticsEnv = getAnalyticsConfig();

// Aliased exports for backward compatibility
export const ENABLED_POSTHOG_ANALYTICS = analyticsEnv.NEXT_PUBLIC_POSTHOG_ENABLED;
export const POSTHOG_KEY = analyticsEnv.NEXT_PUBLIC_POSTHOG_KEY;
export const POSTHOG_HOST = analyticsEnv.NEXT_PUBLIC_POSTHOG_HOST;
