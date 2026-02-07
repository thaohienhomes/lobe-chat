import posthog from 'posthog-js';
import { useEffect, useState } from 'react';

/**
 * Hook to access PostHog feature flags reactively
 */
export const usePostHogFeatureFlags = () => {
  const [flags, setFlags] = useState<Record<string, boolean | string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial flags
    setFlags(
      posthog.featureFlags.getFlags().reduce(
        (acc, flag) => {
          acc[flag] = posthog.getFeatureFlag(flag) ?? false;
          return acc;
        },
        {} as Record<string, boolean | string>,
      ),
    );
    setLoading(false);

    // Listen for updates
    const callback = () => {
      const currentFlags = posthog.featureFlags.getFlags().reduce(
        (acc, flag) => {
          acc[flag] = posthog.getFeatureFlag(flag) ?? false;
          return acc;
        },
        {} as Record<string, boolean | string>,
      );
      setFlags(currentFlags);
    };

    posthog.onFeatureFlags(callback);

    return () => {
      // posthog-js doesn't have an offFeatureFlags, but we can manage our own sub if needed
      // for now, simple callback on update is enough
    };
  }, []);

  const isFeatureEnabled = (key: string) => {
    return !!flags[key];
  };

  return { flags, isFeatureEnabled, loading };
};
