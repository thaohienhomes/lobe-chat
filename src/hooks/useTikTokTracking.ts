'use client';

import { useCallback } from 'react';

import { trackClickButton, trackSearch, trackViewContent } from '@/utils/tiktok-events';

/**
 * Custom hook for TikTok Pixel event tracking
 * Provides convenient methods for tracking common user interactions
 */
export const useTikTokTracking = () => {
  // Track button clicks with context
  const trackButtonClick = useCallback((buttonText: string, context?: string) => {
    trackClickButton(buttonText, context);
  }, []);

  // Track search actions
  const trackSearchAction = useCallback((searchQuery: string) => {
    trackSearch(searchQuery);
  }, []);

  // Track content views
  const trackContentView = useCallback((contentId: string, contentName: string, value?: number) => {
    trackViewContent(contentId, contentName, value);
  }, []);

  // Track upgrade button clicks
  const trackUpgradeClick = useCallback((planName: string, location: string) => {
    trackClickButton(`Upgrade to ${planName}`, `Clicked from ${location}`);
  }, []);

  // Track navigation clicks
  const trackNavigationClick = useCallback((destination: string, source: string) => {
    trackClickButton(`Navigate to ${destination}`, `From ${source}`);
  }, []);

  // Track feature interaction clicks
  const trackFeatureClick = useCallback((featureName: string, action: string) => {
    trackClickButton(`${action} ${featureName}`, `Feature interaction`);
  }, []);

  // Track CTA clicks
  const trackCTAClick = useCallback((ctaText: string, placement: string) => {
    trackClickButton(ctaText, `CTA placement: ${placement}`);
  }, []);

  return {
    trackButtonClick,
    trackCTAClick,
    trackContentView,
    trackFeatureClick,
    trackNavigationClick,
    trackSearchAction,
    trackUpgradeClick,
  };
};

export default useTikTokTracking;
