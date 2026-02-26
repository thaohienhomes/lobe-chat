'use client';

import { getGlobalAnalyticsOptional } from '@lobehub/analytics/react';

/**
 * A SSR-safe wrapper around analytics.
 * During SSR/prerendering, AnalyticsProvider is not available,
 * so useAnalytics() from @lobehub/analytics/react throws.
 * This hook falls back to getGlobalAnalyticsOptional() which returns null safely.
 */
export const useAnalyticsSafe = () => {
    // Try to get from global singleton (works everywhere, returns null if not initialized)
    const analytics = typeof window !== 'undefined' ? getGlobalAnalyticsOptional() : null;

    return { analytics };
};
