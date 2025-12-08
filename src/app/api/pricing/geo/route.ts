/**
 * Geo-detection API for Pricing
 *
 * GET /api/pricing/geo
 *
 * Returns the user's detected region for pricing display.
 * Uses Cloudflare CF-IPCountry header to detect location.
 *
 * Response:
 * - countryCode: ISO 3166-1 alpha-2 country code
 * - region: 'vietnam' | 'global'
 * - currency: 'VND' | 'USD'
 * - paymentProvider: 'sepay' | 'polar'
 */
import { NextRequest, NextResponse } from 'next/server';

import { createGeoResponse } from '@/utils/server/geoLocation';

export async function GET(request: NextRequest) {
  try {
    const geoInfo = createGeoResponse(request.headers);

    // Add cache headers - geo info can be cached for the session
    return NextResponse.json(geoInfo, {
      headers: {
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Geo detection error:', error);

    // Default to global pricing on error
    return NextResponse.json({
      countryCode: 'XX',
      currency: 'USD',
      isVietnam: false,
      paymentProvider: 'polar',
      region: 'global',
    });
  }
}
