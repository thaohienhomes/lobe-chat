/**
 * GeoLocation Detection Service
 * Detects user's country from IP address and headers
 */
import { geolocation } from '@vercel/functions';
import type { NextRequest } from 'next/server';

export interface UserLocation {
  city?: string;
  countryCode: string;
  // ISO 3166-1 alpha-2 (VN, US, IN, etc.)
  countryName: string;
  detectionMethod: 'vercel' | 'cloudflare' | 'zeabur' | 'netlify' | 'header' | 'fallback';
  latitude?: number;
  longitude?: number;
  region?: string;
  timezone?: string;
}

/**
 * Country code to name mapping
 */
const COUNTRY_NAMES: Record<string, string> = {
  AE: 'United Arab Emirates',
  AR: 'Argentina',
  AT: 'Austria',
  AU: 'Australia',
  BD: 'Bangladesh',
  BE: 'Belgium',
  BR: 'Brazil',
  CA: 'Canada',
  CH: 'Switzerland',
  CN: 'China',
  CZ: 'Czech Republic',
  DE: 'Germany',
  DK: 'Denmark',
  EG: 'Egypt',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  GB: 'United Kingdom',
  GR: 'Greece',
  HK: 'Hong Kong',
  HU: 'Hungary',
  ID: 'Indonesia',
  IE: 'Ireland',
  IL: 'Israel',
  IN: 'India',
  IT: 'Italy',
  JP: 'Japan',
  KR: 'South Korea',
  MX: 'Mexico',
  MY: 'Malaysia',
  NG: 'Nigeria',
  NL: 'Netherlands',
  NO: 'Norway',
  NZ: 'New Zealand',
  PH: 'Philippines',
  PK: 'Pakistan',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  RU: 'Russia',
  SA: 'Saudi Arabia',
  SE: 'Sweden',
  SG: 'Singapore',
  TH: 'Thailand',
  TR: 'Turkey',
  TW: 'Taiwan',
  US: 'United States',
  VN: 'Vietnam',
  ZA: 'South Africa',
};

/**
 * Detect user's location from request
 */
export function detectUserLocation(request: NextRequest): UserLocation {
  // Try Vercel Edge geolocation first (most accurate)
  try {
    const geo = geolocation(request);
    if (geo?.country) {
      return {
        city: geo.city,
        countryCode: geo.country,
        countryName: COUNTRY_NAMES[geo.country] || geo.country,
        detectionMethod: 'vercel',
        latitude: geo.latitude ? parseFloat(geo.latitude) : undefined,
        longitude: geo.longitude ? parseFloat(geo.longitude) : undefined,
        region: geo.region,
      };
    }
  } catch (error) {
    console.warn('Vercel geolocation failed:', error);
  }

  // Try various header sources
  const countryCode =
    request.headers.get('x-vercel-ip-country') || // Vercel
    request.headers.get('cf-ipcountry') || // Cloudflare
    request.headers.get('x-zeabur-ip-country') || // Zeabur
    request.headers.get('x-country-code') || // Netlify
    request.headers.get('cloudfront-viewer-country'); // AWS CloudFront

  if (countryCode && countryCode !== 'XX') {
    const method = request.headers.get('x-vercel-ip-country')
      ? 'vercel'
      : request.headers.get('cf-ipcountry')
        ? 'cloudflare'
        : request.headers.get('x-zeabur-ip-country')
          ? 'zeabur'
          : 'header';

    return {
      city: request.headers.get('x-vercel-ip-city') || undefined,
      countryCode,
      countryName: COUNTRY_NAMES[countryCode] || countryCode,
      detectionMethod: method as UserLocation['detectionMethod'],
      region: request.headers.get('x-vercel-ip-region') || undefined,
    };
  }

  // Fallback to US if no country detected
  console.warn('Could not detect country, falling back to US');
  return {
    countryCode: 'US',
    countryName: 'United States',
    detectionMethod: 'fallback',
  };
}

/**
 * Detect user's location from IP address (server-side)
 * Uses free IP geolocation APIs
 */
export async function detectLocationFromIP(ipAddress: string): Promise<UserLocation> {
  try {
    // Try ipapi.co (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
      headers: {
        'User-Agent': 'pho.chat/1.0',
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.country_code && data.country_code !== 'XX') {
        return {
          city: data.city,
          countryCode: data.country_code,
          countryName: data.country_name || COUNTRY_NAMES[data.country_code] || data.country_code,
          detectionMethod: 'header',
          latitude: data.latitude,
          longitude: data.longitude,
          region: data.region,
          timezone: data.timezone,
        };
      }
    }
  } catch (error) {
    console.error('IP geolocation API failed:', error);
  }

  // Fallback to US
  return {
    countryCode: 'US',
    countryName: 'United States',
    detectionMethod: 'fallback',
  };
}

/**
 * Get user's IP address from request
 */
export function getUserIP(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    null
  );
}

/**
 * Validate country code format
 */
export function isValidCountryCode(code: string): boolean {
  return /^[A-Z]{2}$/.test(code) && code !== 'XX';
}

/**
 * Get country name from code
 */
export function getCountryName(countryCode: string): string {
  return COUNTRY_NAMES[countryCode] || countryCode;
}

/**
 * Detect location with caching support
 */
export class LocationDetector {
  private cache: Map<string, { location: UserLocation; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 3_600_000; // 1 hour in milliseconds

  /**
   * Detect location with caching
   */
  async detect(request: NextRequest): Promise<UserLocation> {
    const ip = getUserIP(request);
    const cacheKey = ip || 'unknown';

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.location;
    }

    // Detect location
    const location = detectUserLocation(request);

    // Cache result
    this.cache.set(cacheKey, {
      location,
      timestamp: Date.now(),
    });

    // Clean old cache entries
    this.cleanCache();

    return location;
  }

  /**
   * Clean expired cache entries
   */
  private cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Export singleton instance
export const locationDetector = new LocationDetector();
