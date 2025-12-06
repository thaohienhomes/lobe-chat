'use client';

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
  content_name: string;
  content_type: 'product' | 'product_group';
  price?: number;
}

// TikTok event parameters
export interface TikTokEventParams {
  button_text?: string;
  contents?: TikTokContent[];
  currency?: string;
  description?: string;
  search_string?: string;
  value?: number;
}

// User identification parameters (PII should be hashed)
export interface TikTokUserParams {
  email?: string;
  // SHA-256 hashed
  external_id?: string;
  // SHA-256 hashed
  phone_number?: string; // SHA-256 hashed
}

// Global ttq object type declaration
declare global {
  interface Window {
    ttq?: {
      identify: (userParams: TikTokUserParams) => void;
      page: () => void;
      track: (eventName: TikTokEventName, params?: TikTokEventParams) => void;
    };
  }
}

/**
 * Check if TikTok Pixel is enabled and loaded
 * Note: The Pixel ID is embedded in the script tag loaded by the TikTok component.
 * We only need to check if the ttq object is available on the window.
 */
export const isTikTokPixelEnabled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ttq;
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
    console.debug('Identifying TikTok user', {
      hasEmail: !!userParams.email,
      hasExternalId: !!userParams.external_id,
      hasPhone: !!userParams.phone_number,
    });
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
      content_name: planName,
      content_type: 'product',
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
export const trackSubscribe = (
  planId: string,
  planName: string,
  value: number,
  billingCycle: 'monthly' | 'yearly',
): void => {
  trackTikTokEvent('Subscribe', {
    contents: [
      {
        content_id: planId,
        content_name: `${planName} (${billingCycle})`,
        content_type: 'product',
        price: value,
      },
    ],
    currency: 'VND',
    value,
  });
};

/**
 * Track viewing subscription plans
 */
export const trackViewContent = (planId: string, planName: string, value?: number): void => {
  trackTikTokEvent('ViewContent', {
    contents: [
      {
        content_id: planId,
        content_name: planName,
        content_type: 'product',
        price: value,
      },
    ],
    currency: 'VND',
    value,
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
      content_name: planName,
      content_type: 'product',
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
