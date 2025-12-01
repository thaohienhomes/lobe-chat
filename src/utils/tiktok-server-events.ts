/**
 * TikTok Server-Side Event Tracking Utilities
 * 
 * This module provides client-side functions to send events to the server-side
 * TikTok Events API endpoint. This ensures events are tracked even if client-side
 * pixel is blocked by ad blockers.
 */

'use client';

import { TikTokServerEventName, TikTokServerEventProperties } from '@/libs/tiktok-events-api';

interface TrackServerEventOptions {
  event: TikTokServerEventName;
  properties?: TikTokServerEventProperties;
  user?: {
    email?: string;
    phone?: string;
    userId?: string;
  };
  test_event_code?: string;
}

/**
 * Send an event to the server-side TikTok tracking endpoint
 * This provides better tracking accuracy and bypasses ad blockers
 */
export async function trackTikTokServerEvent(options: TrackServerEventOptions): Promise<boolean> {
  try {
    const response = await fetch('/api/analytics/tiktok/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options),
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
  test_event_code?: string
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
    user,
    test_event_code,
  });
}

// Convenience functions for common events

export async function trackServerViewContent(
  contentId: string,
  contentName: string,
  value?: number,
  user?: { email?: string; phone?: string; userId?: string }
): Promise<void> {
  await trackTikTokDualEvent(
    'ViewContent',
    {
      contents: [{
        content_id: contentId,
        content_type: 'product',
        content_name: contentName,
        price: value,
      }],
      value,
      currency: 'VND',
    },
    user
  );
}

export async function trackServerSubscribe(
  planId: string,
  planName: string,
  value: number,
  billingCycle: 'monthly' | 'yearly',
  user?: { email?: string; phone?: string; userId?: string }
): Promise<void> {
  await trackTikTokDualEvent(
    'Subscribe',
    {
      contents: [{
        content_id: planId,
        content_type: 'product',
        content_name: `${planName} (${billingCycle})`,
        price: value,
      }],
      value,
      currency: 'VND',
    },
    user
  );
}

export async function trackServerCompletePayment(
  orderId: string,
  value: number,
  planName?: string,
  user?: { email?: string; phone?: string; userId?: string }
): Promise<void> {
  await trackTikTokDualEvent(
    'CompletePayment',
    {
      contents: planName ? [{
        content_id: orderId,
        content_type: 'product',
        content_name: planName,
        price: value,
      }] : undefined,
      value,
      currency: 'VND',
      description: `Payment completed for order ${orderId}`,
    },
    user
  );
}

export async function trackServerInitiateCheckout(
  planId: string,
  planName: string,
  value: number,
  user?: { email?: string; phone?: string; userId?: string }
): Promise<void> {
  await trackTikTokDualEvent(
    'InitiateCheckout',
    {
      contents: [{
        content_id: planId,
        content_type: 'product',
        content_name: planName,
        price: value,
      }],
      value,
      currency: 'VND',
    },
    user
  );
}

