'use client';

import { analyticsEnv } from '@/envs/analytics';

// TikTok Pixel Event Types
export type TikTokEventName = 
  | 'ViewContent'
  | 'Search'
  | 'ClickButton'
  | 'AddToWishlist'
  | 'Subscribe'
  | 'CompleteRegistration'
  | 'AddPaymentInfo';

// Content item for TikTok events
export interface TikTokContent {
  content_id: string;
  content_type: 'product' | 'product_group';
  content_name: string;
  price?: number;
}

// TikTok event parameters
export interface TikTokEventParams {
  contents?: TikTokContent[];
  value?: number;
  currency?: string;
  search_string?: string;
  button_text?: string;
  description?: string;
}

// User identification parameters (PII should be hashed)
export interface TikTokUserParams {
  email?: string; // SHA-256 hashed
  phone_number?: string; // SHA-256 hashed
  external_id?: string; // SHA-256 hashed
}

// Global ttq object type declaration
declare global {
  interface Window {
    ttq?: {
      track: (eventName: TikTokEventName, params?: TikTokEventParams) => void;
      identify: (userParams: TikTokUserParams) => void;
      page: () => void;
    };
  }
}

/**
 * Check if TikTok Pixel is enabled and loaded
 */
export const isTikTokPixelEnabled = (): boolean => {
  return !!(analyticsEnv.TIKTOK_PIXEL_ID && typeof window !== 'undefined' && window.ttq);
};

/**
 * Track a TikTok Pixel event
 * @param eventName - The name of the event to track
 * @param params - Event parameters
 */
export const trackTikTokEvent = (eventName: TikTokEventName, params?: TikTokEventParams): void => {
  if (!isTikTokPixelEnabled()) {
    console.debug(`TikTok Pixel not enabled or loaded, skipping event: ${eventName}`);
    return;
  }

  try {
    console.debug(`Tracking TikTok event: ${eventName}`, params);
    window.ttq!.track(eventName, params);
  } catch (error) {
    console.error('Failed to track TikTok event:', error);
  }
};

/**
 * Identify user with TikTok Pixel (PII should be pre-hashed)
 * @param userParams - User identification parameters (hashed)
 */
export const identifyTikTokUser = (userParams: TikTokUserParams): void => {
  if (!isTikTokPixelEnabled()) {
    console.debug('TikTok Pixel not enabled or loaded, skipping user identification');
    return;
  }

  try {
    console.debug('Identifying TikTok user', { hasEmail: !!userParams.email, hasPhone: !!userParams.phone_number, hasExternalId: !!userParams.external_id });
    window.ttq!.identify(userParams);
  } catch (error) {
    console.error('Failed to identify TikTok user:', error);
  }
};

// Predefined event tracking functions for common use cases

/**
 * Track user registration completion
 */
export const trackCompleteRegistration = (planId?: string, planName?: string): void => {
  const contents: TikTokContent[] = [];
  
  if (planId && planName) {
    contents.push({
      content_id: planId,
      content_type: 'product',
      content_name: planName,
    });
  }

  trackTikTokEvent('CompleteRegistration', {
    contents: contents.length > 0 ? contents : undefined,
    currency: 'VND',
  });
};

/**
 * Track subscription purchase
 */
export const trackSubscribe = (planId: string, planName: string, value: number, billingCycle: 'monthly' | 'yearly'): void => {
  trackTikTokEvent('Subscribe', {
    contents: [{
      content_id: planId,
      content_type: 'product',
      content_name: `${planName} (${billingCycle})`,
      price: value,
    }],
    value,
    currency: 'VND',
  });
};

/**
 * Track viewing subscription plans
 */
export const trackViewContent = (planId: string, planName: string, value?: number): void => {
  trackTikTokEvent('ViewContent', {
    contents: [{
      content_id: planId,
      content_type: 'product',
      content_name: planName,
      price: value,
    }],
    value,
    currency: 'VND',
  });
};

/**
 * Track button clicks (CTAs, upgrade prompts, etc.)
 */
export const trackClickButton = (buttonText: string, description?: string): void => {
  trackTikTokEvent('ClickButton', {
    button_text: buttonText,
    description,
  });
};

/**
 * Track adding payment information
 */
export const trackAddPaymentInfo = (planId?: string, planName?: string): void => {
  const contents: TikTokContent[] = [];
  
  if (planId && planName) {
    contents.push({
      content_id: planId,
      content_type: 'product',
      content_name: planName,
    });
  }

  trackTikTokEvent('AddPaymentInfo', {
    contents: contents.length > 0 ? contents : undefined,
    currency: 'VND',
  });
};

/**
 * Track search actions
 */
export const trackSearch = (searchString: string): void => {
  trackTikTokEvent('Search', {
    search_string: searchString,
  });
};
