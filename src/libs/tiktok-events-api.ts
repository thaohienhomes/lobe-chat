/**
 * TikTok Events API - Server-Side Event Tracking
 * 
 * This module provides server-side event tracking using the TikTok Events API.
 * It supports sending conversion events from the server to TikTok for better
 * tracking accuracy and to bypass ad blockers.
 * 
 * Documentation: https://business-api.tiktok.com/portal/docs?id=1771100865818625
 */

import { analyticsEnv } from '@/envs/analytics';
import crypto from 'crypto';

// TikTok Events API endpoint (Events 2.0)
const TIKTOK_EVENTS_API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/';

// Event names supported by TikTok Events API
export type TikTokServerEventName =
  | 'ViewContent'
  | 'Search'
  | 'ClickButton'
  | 'Subscribe'
  | 'CompleteRegistration'
  | 'AddPaymentInfo'
  | 'InitiateCheckout'
  | 'CompletePayment';

// User identification parameters.
// NOTE: Callers are responsible for hashing PII (email / phone / external_id)
// before passing it here when required by TikTok. This module forwards
// whatever values it receives.
export interface TikTokServerUserData {
  email?: string; // Typically SHA-256 hashed
  phone?: string; // Typically SHA-256 hashed (E.164 format before hashing)
  external_id?: string; // User ID (hashed or raw, depending on your policy)
  ip?: string; // User's IP address
  user_agent?: string; // User's browser user agent
}

// Content item for events
export interface TikTokServerContent {
  content_id: string;
  content_type?: 'product' | 'product_group';
  content_name?: string;
  price?: number;
  quantity?: number;
}

// Event properties
export interface TikTokServerEventProperties {
  contents?: TikTokServerContent[];
  value?: number;
  currency?: string;
  description?: string;
  query?: string;
}

// Complete event payload
export interface TikTokServerEvent {
  event: TikTokServerEventName;
  event_time: number; // Unix timestamp in seconds
  user: TikTokServerUserData;
  properties?: TikTokServerEventProperties;
  event_id?: string; // Unique event ID for deduplication
  test_event_code?: string; // For testing events in TikTok Events Manager
}

/**
 * Hash a string using SHA-256
 * TikTok requires PII data to be hashed before sending
 */
export function hashSHA256(value: string): string {
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Generate a unique event ID for deduplication
 * Format: {eventName}_{timestamp}_{randomString}
 */
export function generateEventId(eventName: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${eventName}_${timestamp}_${random}`;
}

/**
 * Send an event to TikTok Events API
 * 
 * @param event - The event to send
 * @returns Response from TikTok Events API
 */
export async function sendTikTokServerEvent(event: TikTokServerEvent): Promise<{
  success: boolean;
  message?: string;
  code?: number;
}> {
  // Check if TikTok Events API is configured
  if (!analyticsEnv.ENABLED_TIKTOK_PIXEL || !analyticsEnv.TIKTOK_PIXEL_ID || !analyticsEnv.TIKTOK_ACCESS_TOKEN) {
    console.debug('TikTok Events API not configured, skipping server-side event:', event.event);
    return { success: false, message: 'TikTok Events API not configured' };
  }

  try {
    // Build per-event payload according to TikTok Events API (Events 2.0) shape
    const testEventCode = event.test_event_code || analyticsEnv.TIKTOK_TEST_EVENT_CODE;
    const eventData: Record<string, any> = {
      event: event.event,
      event_time: event.event_time,
      event_id: event.event_id || generateEventId(event.event),
      user: event.user,
      properties: event.properties,
    };

    if (testEventCode) {
      eventData.test_event_code = testEventCode;
    }

    const payload = {
      event_source: 'web',
      event_source_id: analyticsEnv.TIKTOK_PIXEL_ID,
      data: [eventData],
    };

    console.debug('Sending TikTok server event:', {
      event: event.event,
      hasUser: !!event.user,
      hasProperties: !!event.properties,
      testMode: !!testEventCode,
    });

    const response = await fetch(TIKTOK_EVENTS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Access-Token': analyticsEnv.TIKTOK_ACCESS_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.code === 0) {
      console.debug('TikTok server event sent successfully:', event.event);
      return { success: true };
    } else {
      console.error('TikTok Events API error:', result);
      return {
        success: false,
        message: result.message || 'Unknown error',
        code: result.code,
      };
    }
  } catch (error) {
    console.error('Failed to send TikTok server event:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

