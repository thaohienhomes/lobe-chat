/**
 * TikTok Server-Side Event Tracking Utilities
 *
 * This module provides client-side functions to send events to the server-side
 * TikTok Events API endpoint. This ensures events are tracked even if client-side
 * pixel is blocked by ad blockers.
 */

'use client';

import { TikTokServerEventName, TikTokServerEventProperties } from '@/libs/tiktok-events-api';

/**
 * TikTok Server-Side Event Tracking Utilities
 *
 * This module provides client-side functions to send events to the server-side
 * TikTok Events API endpoint. This ensures events are tracked even if client-side
 * pixel is blocked by ad blockers.
 */

interface TrackServerEventOptions {
  event: TikTokServerEventName;
  properties?: TikTokServerEventProperties;
  test_event_code?: string;
  user?: {
    email?: string;
    phone?: string;
    userId?: string;
  };
}

/**
 * Send an event to the server-side TikTok tracking endpoint
 * This provides better tracking accuracy and bypasses ad blockers
 */
export async function trackTikTokServerEvent(options: TrackServerEventOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/tiktok/track', {
      body: JSON.stringify(options),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const result = await response.json();

    if (result.success) {
      console.debug('TikTok server event tracked:', options.event);
      return true;
    } else {
      console.error('Failed to track TikTok server event:', result.error);
      return false;
    }
  } catch (error) {
    console.error('Error sending TikTok server event:', error);
    return false;
  }
}

/**
 * Track both client-side (pixel) and server-side events
 * This provides redundancy and better tracking coverage
 */
export async function trackTikTokDualEvent(
  eventName: TikTokServerEventName,
  properties?: TikTokServerEventProperties,
  user?: { email?: string; phone?: string; userId?: string },
  test_event_code?: string,
): Promise<void> {
  // Track client-side event (if pixel is loaded)
  if (typeof window !== 'undefined' && window.ttq) {
    try {
      window.ttq.track(eventName as any, properties as any);
      console.debug('TikTok client event tracked:', eventName);
    } catch (error) {
      console.error('Failed to track TikTok client event:', error);
    }
  }

  // Track server-side event (always attempt)
  await trackTikTokServerEvent({
    event: eventName,
    properties,
    test_event_code,
    user,
  });
}

// Convenience functions for common events

export async function trackServerViewContent(
  contentId: string,
  contentName: string,
  value?: number,
  user?: { email?: string; phone?: string; userId?: string },
): Promise<void> {
  await trackTikTokDualEvent(
    'ViewContent',
    {
      contents: [
        {
          content_id: contentId,
          content_name: contentName,
          content_type: 'product',
          price: value,
        },
      ],
      currency: 'VND',
      value,
    },
    user,
  );
}

export async function trackServerSubscribe(
  planId: string,
  planName: string,
  value: number,
  billingCycle: 'monthly' | 'yearly',
  user?: { email?: string; phone?: string; userId?: string },
): Promise<void> {
  await trackTikTokDualEvent(
    'Subscribe',
    {
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
    },
    user,
  );
}

export async function trackServerCompletePayment(
  orderId: string,
  value: number,
  planName?: string,
  user?: { email?: string; phone?: string; userId?: string },
): Promise<void> {
  await trackTikTokDualEvent(
    'CompletePayment',
    {
      contents: planName
        ? [
            {
              content_id: orderId,
              content_name: planName,
              content_type: 'product',
              price: value,
            },
          ]
        : undefined,
      currency: 'VND',
      description: `Payment completed for order ${orderId}`,
      value,
    },
    user,
  );
}

export async function trackServerInitiateCheckout(
  planId: string,
  planName: string,
  value: number,
  user?: { email?: string; phone?: string; userId?: string },
): Promise<void> {
  await trackTikTokDualEvent(
    'InitiateCheckout',
    {
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
    },
    user,
  );
}
