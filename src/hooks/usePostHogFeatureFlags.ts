'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Hook to access PostHog feature flags reactively.
 *
 * Uses `window.posthog` (exposed by LobeAnalyticsProvider) instead of
 * importing posthog-js directly, because the actual PostHog instance
 * is managed by @lobehub/analytics.
 *
 * IMPORTANT: This hook is "fail-open" — if PostHog is not loaded or
 * flags haven't been fetched yet, `isFeatureEnabled` returns TRUE
 * so that all providers remain visible by default.
 */
export const usePostHogFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean | string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function loadFlags(instance: any) {
      try {
        // Listen for flag updates (this also fires on initial load)
        instance.onFeatureFlags(() => {
          const currentFlags: Record<string, boolean | string> = {};
          const flagKeys = instance.featureFlags?.getFlags?.() || [];
          for (const key of flagKeys) {
            currentFlags[key] = instance.getFeatureFlag(key) ?? false;
          }
          setFlags(currentFlags);
          setReady(true);
        });

        // Also try to read flags immediately (they may already be loaded)
        const flagKeys = instance.featureFlags?.getFlags?.() || [];
        if (flagKeys.length > 0) {
          const currentFlags: Record<string, boolean | string> = {};
          for (const key of flagKeys) {
            currentFlags[key] = instance.getFeatureFlag(key) ?? false;
          }
          setFlags(currentFlags);
          setReady(true);
        }
      } catch {
        // If anything fails, stay in fail-open mode
      }
    }

    const ph = typeof window !== 'undefined' ? (window as any).posthog : null;

    if (!ph) {
      // PostHog not yet initialized — remain in "fail-open" mode
      // Retry after a short delay to catch late initialization
      const retryTimer = setTimeout(() => {
        const phRetry = typeof window !== 'undefined' ? (window as any).posthog : null;
        if (phRetry) {
          loadFlags(phRetry);
        }
      }, 3000);

      return () => clearTimeout(retryTimer);
    }

    loadFlags(ph);
  }, []);

  /**
   * Check if a feature flag is enabled.
   *
   * FAIL-OPEN: If flags haven't loaded yet (`ready === false`),
   * this returns TRUE so providers are shown by default.
   * Only applies filtering once flags are confirmed loaded.
   */
  const isFeatureEnabled = useCallback(
    (key: string): boolean => {
      if (!ready) return true; // Fail-open: show everything until flags load
      return !!flags[key];
    },
    [ready, flags],
  );

  return { flags, isFeatureEnabled, loading: !ready, ready };
};
