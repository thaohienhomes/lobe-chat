/**
 * Geo-location Utilities for Pricing
 * Based on PRICING_MASTERPLAN.md.md
 *
 * Detects user's country via Cloudflare headers to show appropriate pricing:
 * - Vietnam (VN): Show VND pricing via Sepay
 * - Other countries: Show USD pricing via Polar.sh
 */

// ============================================================================
// TYPES
// ============================================================================

export type PricingRegion = 'vietnam' | 'global';

export interface GeoLocationResult {
  countryCode: string;
  isVietnam: boolean;
  region: PricingRegion;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Vietnam country codes (including territories)
 */
const VIETNAM_COUNTRY_CODES = new Set(['VN', 'VNM']);

/**
 * ASEAN countries that might get Vietnam-like pricing in the future
 */
export const ASEAN_COUNTRY_CODES = new Set([
  'BN', // Brunei
  'ID', // Indonesia
  'KH', // Cambodia
  'LA', // Laos
  'MM', // Myanmar
  'MY', // Malaysia
  'PH', // Philippines
  'SG', // Singapore
  'TH', // Thailand
  'VN', // Vietnam
]);

// ============================================================================
// SERVER-SIDE DETECTION (from Request Headers)
// ============================================================================

/**
 * Detect country from Cloudflare CF-IPCountry header
 *
 * Header priority:
 * 1. CF-IPCountry (Cloudflare)
 * 2. X-Vercel-IP-Country (Vercel)
 * 3. X-Country (custom header from edge middleware)
 *
 * @param headers - Request headers object
 * @returns GeoLocationResult
 */
export function detectCountryFromHeaders(headers: Headers): GeoLocationResult {
  // Try different header sources in priority order
  const countryCode =
    headers.get('CF-IPCountry') ||
    headers.get('cf-ipcountry') ||
    headers.get('X-Vercel-IP-Country') ||
    headers.get('x-vercel-ip-country') ||
    headers.get('X-Country') ||
    headers.get('x-country') ||
    'XX'; // Unknown

  const upperCode = countryCode.toUpperCase();
  const isVietnam = VIETNAM_COUNTRY_CODES.has(upperCode);

  return {
    countryCode: upperCode,
    isVietnam,
    region: isVietnam ? 'vietnam' : 'global',
  };
}

/**
 * Get pricing region from country code
 */
export function getPricingRegionFromCountry(countryCode: string): PricingRegion {
  return VIETNAM_COUNTRY_CODES.has(countryCode.toUpperCase()) ? 'vietnam' : 'global';
}

/**
 * Check if country is in Vietnam
 */
export function isVietnamCountry(countryCode: string): boolean {
  return VIETNAM_COUNTRY_CODES.has(countryCode.toUpperCase());
}

/**
 * Check if country is in ASEAN region
 */
export function isASEANCountry(countryCode: string): boolean {
  return ASEAN_COUNTRY_CODES.has(countryCode.toUpperCase());
}

// ============================================================================
// API ENDPOINT HELPER
// ============================================================================

/**
 * Create an API endpoint that returns the user's detected region
 * Can be called from client-side to get geo info
 */
export function createGeoResponse(headers: Headers) {
  const geo = detectCountryFromHeaders(headers);

  return {
    countryCode: geo.countryCode,
    currency: geo.isVietnam ? 'VND' : 'USD',
    isVietnam: geo.isVietnam,
    paymentProvider: geo.isVietnam ? 'sepay' : 'polar',
    region: geo.region,
  };
}
