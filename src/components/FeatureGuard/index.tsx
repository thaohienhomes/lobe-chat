'use client';

import { useFeatureFlagEnabled } from 'posthog-js/react';
import React, { PropsWithChildren } from 'react';

interface FeatureGuardProps extends PropsWithChildren {
  /**
   * Optional fallback content to render if the feature is disabled.
   */
  fallback?: React.ReactNode;
  /**
   * The key of the feature flag to check.
   */
  flag: string;
}

/**
 * A component that guards its children with a PostHog feature flag.
 * If the flag is enabled, children are rendered.
 * If disabled, fallback (or null) is rendered.
 *
 * @example
 * <FeatureGuard flag="new-feature">
 *   <NewFeatureComponent />
 * </FeatureGuard>
 */
const FeatureGuard = ({ flag, children, fallback = null }: FeatureGuardProps) => {
  const isEnabled = useFeatureFlagEnabled(flag);

  if (!isEnabled) {
    return fallback;
  }

  return children;
};

export default FeatureGuard;
