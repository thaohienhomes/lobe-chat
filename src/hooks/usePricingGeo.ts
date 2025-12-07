/**
 * Hook to detect user's geographic region for pricing display
 * Based on PRICING_MASTERPLAN.md.md geo-fencing requirements
 *
 * Usage:
 * const { region, isVietnam, isLoading, currency, paymentProvider } = usePricingGeo();
 */
import useSWR from 'swr';

// ============================================================================
// TYPES
// ============================================================================

export type PricingRegion = 'vietnam' | 'global';

export interface GeoInfo {
  countryCode: string;
  currency: 'VND' | 'USD';
  isVietnam: boolean;
  paymentProvider: 'sepay' | 'polar';
  region: PricingRegion;
}

export interface UsePricingGeoResult extends GeoInfo {
  error: Error | undefined;
  isLoading: boolean;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async (url: string): Promise<GeoInfo> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch geo info');
  }
  return response.json();
};

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook to get user's pricing region
 *
 * Features:
 * - Auto-detects from Cloudflare CF-IPCountry header
 * - Caches result with SWR
 * - Falls back to 'global' on error
 * - Provides loading state
 *
 * @example
 * ```tsx
 * const { region, isVietnam, currency } = usePricingGeo();
 *
 * return (
 *   <>
 *     {isVietnam ? <VietnamPricingCards /> : <GlobalPricingCards />}
 *     <p>Prices in {currency}</p>
 *   </>
 * );
 * ```
 */
export function usePricingGeo(): UsePricingGeoResult {
  const { data, error, isLoading } = useSWR<GeoInfo>('/api/pricing/geo', fetcher, {
    // Cache for 1 hour, revalidate rarely
    dedupingInterval: 60 * 60 * 1000,
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  // Default to global pricing if loading or error
  const defaultGeo: GeoInfo = {
    countryCode: 'XX',
    currency: 'USD',
    isVietnam: false,
    paymentProvider: 'polar',
    region: 'global',
  };

  return {
    ...(data || defaultGeo),
    error,
    isLoading,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format price based on region
 */
export function formatPrice(amount: number, region: PricingRegion): string {
  if (region === 'vietnam') {
    return new Intl.NumberFormat('vi-VN', {
      currency: 'VND',
      maximumFractionDigits: 0,
      style: 'currency',
    }).format(amount);
  }

  return new Intl.NumberFormat('en-US', {
    currency: 'USD',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}

/**
 * Get plan display name based on region
 */
export function getPlanDisplayName(planCode: string, region: PricingRegion): string {
  const vnNames: Record<string, string> = {
    vn_basic: 'Phở Tái',
    vn_free: 'Phở Không Người Lái',
    vn_pro: 'Phở Đặc Biệt',
    vn_team: 'Lẩu Phở (Team)',
  };

  const globalNames: Record<string, string> = {
    gl_lifetime: 'Lifetime Deal',
    gl_premium: 'Premium',
    gl_standard: 'Standard',
    gl_starter: 'Starter',
  };

  if (region === 'vietnam') {
    return vnNames[planCode] || planCode;
  }

  return globalNames[planCode] || planCode;
}

export default usePricingGeo;
