/**
 * TikTok Server-Side Event Tracking API
 * POST /api/analytics/tiktok/track
 *
 * This endpoint receives event data from the client and sends it to TikTok Events API
 * for server-side conversion tracking. This provides better tracking accuracy and
 * bypasses ad blockers.
 */
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

import {
  TikTokServerEvent,
  TikTokServerEventName,
  TikTokServerEventProperties,
  TikTokServerUserData,
  hashSHA256,
  sendTikTokServerEvent,
} from '@/libs/tiktok-events-api';

// Request body interface
interface TrackEventRequest {
  event: TikTokServerEventName;
  properties?: TikTokServerEventProperties;
  test_event_code?: string;
  user?: {
    email?: string; // Will be hashed
    phone?: string; // Will be hashed
    userId?: string; // Will be hashed
  }; // For testing in TikTok Events Manager
}

/**
 * POST /api/analytics/tiktok/track
 * Track a server-side TikTok event
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get user IP and user agent from request headers
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Parse request body
    const body: TrackEventRequest = await request.json();

    if (!body.event) {
      return NextResponse.json(
        { error: 'Event name is required', success: false },
        { status: 400 },
      );
    }

    // Build user data with hashed PII
    const userData: TikTokServerUserData = {
      ip,
      user_agent: userAgent,
    };

    // Hash user PII if provided
    if (body.user?.email) {
      userData.email = hashSHA256(body.user.email);
    }
    if (body.user?.phone) {
      userData.phone = hashSHA256(body.user.phone);
    }
    if (body.user?.userId) {
      userData.external_id = hashSHA256(body.user.userId);
    }

    // If no user data provided in request, try to get from Clerk session
    if (!body.user && !userData.email && !userData.external_id) {
      try {
        const { userId } = await auth();
        if (userId) {
          userData.external_id = hashSHA256(userId);
        }
      } catch (error) {
        // Clerk auth not available or user not logged in - continue without user data
        console.debug('Could not get user from Clerk session:', error);
      }
    }

    // Build event payload
    const event: TikTokServerEvent = {
      event: body.event,
      event_time: Math.floor(Date.now() / 1000),
      properties: body.properties,

      test_event_code: body.test_event_code,
      // Unix timestamp in seconds
      user: userData,
    };

    // Send event to TikTok Events API
    const result = await sendTikTokServerEvent(event);

    if (result.success) {
      return NextResponse.json({
        message: 'Event tracked successfully',
        success: true,
      });
    } else {
      return NextResponse.json(
        {
          code: result.code,
          error: result.message || 'Failed to track event',
          success: false,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error('Error tracking TikTok event:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/analytics/tiktok/track
 * Health check endpoint
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'TikTok server-side event tracking endpoint',
    status: 'ok',
  });
}
