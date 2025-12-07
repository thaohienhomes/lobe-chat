/**
 * PPP (Purchasing Power Parity) Pricing Service
 * Handles country-specific pricing for pho.chat
 */
/* eslint-disable sort-keys-fix/sort-keys-fix, unicorn/no-zero-fractions */
import type { LobeChatDatabase } from '@lobechat/database';
import { eq } from 'drizzle-orm';

import { pppPricing } from '@/database/schemas/billing-multi-market';

export interface PppPricingData {
  availablePaymentMethods: string[];
  countryCode: string;
  countryName: string;
  currency: string;
  pppMultiplier: number;
  preferredPaymentGateway: string;
  pricing: {
    // Global plans (USD via Polar.sh)
    gl_premium: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
    gl_standard: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
    gl_starter: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
    // Legacy mappings
    premium: { monthly: number; monthlyUsd: number; yearly: number };
    starter: { monthly: number; monthlyUsd: number; yearly: number };
    ultimate: { monthly: number; monthlyUsd: number; yearly: number };
    // Vietnam plans (VND via Sepay)
    vn_basic: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
    vn_free: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
    vn_pro: { monthly: number; monthlyPoints: number; monthlyUsd: number; yearly: number };
  };
}

/**
 * Base USD pricing based on PRICING_MASTERPLAN.md.md
 * Global plans (via Polar.sh)
 */
const BASE_USD_PRICING = {
  // Global plans
  gl_lifetime: { monthly: 149.0, monthlyPoints: 500_000, yearly: 149.0 }, // One-time
  gl_premium: { monthly: 19.9, monthlyPoints: 2_000_000, yearly: 199.0 },
  gl_standard: { monthly: 9.9, monthlyPoints: 500_000, yearly: 99.0 },
  gl_starter: { monthly: 0, monthlyPoints: 30_000, yearly: 0 },

  // Legacy mappings (for backward compatibility)
  premium: { monthly: 2.85, yearly: 28.5 }, // ~69,000 VND
  starter: { monthly: 0, yearly: 0 }, // Free
  ultimate: { monthly: 8.25, yearly: 82.5 }, // ~199,000 VND
};

/**
 * Default PPP multipliers by country
 * Source: World Bank PPP data + Numbeo Cost of Living Index
 */
export const DEFAULT_PPP_MULTIPLIERS: Record<
  string,
  {
    currency: string;
    gateway: string;
    methods: string[];
    multiplier: number;
    name: string;
  }
> = {
  BD: {
    currency: 'BDT',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.32,
    name: 'Bangladesh',
  },

  // East Asia
  CN: {
    currency: 'CNY',
    gateway: 'stripe',
    methods: ['card', 'alipay', 'wechat'],
    multiplier: 0.65,
    name: 'China',
  },

  ID: {
    currency: 'IDR',
    gateway: 'stripe',
    methods: ['card', 'bank_transfer'],
    multiplier: 0.45,
    name: 'Indonesia',
  },

  // South Asia
  IN: {
    // India - 35% of US purchasing power
    currency: 'INR',
    gateway: 'razorpay',
    methods: ['card', 'upi', 'netbanking', 'wallet'],
    multiplier: 0.35,
    name: 'India',
  },

  JP: {
    currency: 'JPY',
    gateway: 'stripe',
    methods: ['card', 'konbini'],
    multiplier: 1.1,
    name: 'Japan',
  },

  CA: {
    currency: 'CAD',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.95,
    name: 'Canada',
  },

  MY: {
    currency: 'MYR',
    gateway: 'stripe',
    multiplier: 0.6,
    methods: ['card', 'fpx'],
    name: 'Malaysia',
  },

  BR: {
    currency: 'BRL',
    gateway: 'stripe',
    methods: ['card', 'boleto'],
    multiplier: 0.48,
    name: 'Brazil',
  },

  TH: {
    currency: 'THB',
    multiplier: 0.55,
    gateway: 'stripe',
    name: 'Thailand',
    methods: ['card', 'promptpay'],
  },

  AR: {
    currency: 'ARS',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.45,
    name: 'Argentina',
  },
  // Southeast Asia
  VN: {
    multiplier: 0.4, // Vietnam - 40% of US purchasing power
    currency: 'VND',
    name: 'Vietnam',
    gateway: 'sepay',
    methods: ['bank_transfer', 'qr_code'],
  },

  DE: {
    currency: 'EUR',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit', 'sofort'],
    multiplier: 1,
    name: 'Germany',
  },

  ES: {
    currency: 'EUR',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
    multiplier: 0.9,
    name: 'Spain',
  },

  PH: {
    multiplier: 0.42,
    currency: 'PHP',
    name: 'Philippines',
    gateway: 'stripe',
    methods: ['card', 'gcash'],
  },

  FR: {
    currency: 'EUR',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
    multiplier: 1,
    name: 'France',
  },

  // Middle East
  AE: {
    currency: 'AED',
    gateway: 'stripe',
    multiplier: 0.95,
    methods: ['card'],
    name: 'United Arab Emirates',
  },

  PK: {
    multiplier: 0.3,
    currency: 'PKR',
    name: 'Pakistan',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Europe
  GB: {
    currency: 'GBP',
    gateway: 'stripe',
    methods: ['card', 'bacs'],
    multiplier: 1.05,
    name: 'United Kingdom',
  },

  IT: {
    currency: 'EUR',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
    multiplier: 0.88,
    name: 'Italy',
  },

  KR: {
    currency: 'KRW',
    multiplier: 0.95,
    gateway: 'stripe',
    name: 'South Korea',
    methods: ['card'],
  },

  // Oceania
  AU: {
    currency: 'AUD',
    multiplier: 1.05,
    gateway: 'stripe',
    name: 'Australia',
    methods: ['card', 'becs_debit'],
  },

  // Americas
  US: {
    multiplier: 1.0, // Base reference
    currency: 'USD',
    name: 'United States',
    gateway: 'stripe',
    methods: ['card', 'ach'],
  },

  EG: {
    currency: 'EGP',
    gateway: 'stripe',
    multiplier: 0.35,
    methods: ['card'],
    name: 'Egypt',
  },

  MX: {
    multiplier: 0.5,
    currency: 'MXN',
    name: 'Mexico',
    gateway: 'stripe',
    methods: ['card', 'oxxo'],
  },

  NG: {
    currency: 'NGN',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.38,
    name: 'Nigeria',
  },

  NZ: {
    currency: 'NZD',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 1,
    name: 'New Zealand',
  },

  PL: {
    currency: 'PLN',
    gateway: 'stripe',
    methods: ['card', 'p24'],
    multiplier: 0.65,
    name: 'Poland',
  },

  RU: {
    currency: 'RUB',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.55,
    name: 'Russia',
  },

  SA: {
    currency: 'SAR',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.85,
    name: 'Saudi Arabia',
  },

  TR: {
    currency: 'TRY',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.5,
    name: 'Turkey',
  },
  // Africa
  ZA: {
    currency: 'ZAR',
    gateway: 'stripe',
    methods: ['card'],
    multiplier: 0.52,
    name: 'South Africa',
  },
};

/**
 * Currency exchange rates (approximate, should be updated regularly)
 */
export const CURRENCY_RATES: Record<string, number> = {
  CNY: 7.24,
  EUR: 0.92,
  GBP: 0.79,
  IDR: 15_678,
  AUD: 1.53,
  INR: 83.12,
  BRL: 4.97,
  JPY: 149.5,
  ARS: 350,
  USD: 1,
  CAD: 1.36,
  VND: 24_167,
  AED: 3.67,
  KRW: 1338,
  MXN: 17.1,
  EGP: 48.9,
  MYR: 4.72,
  NGN: 1550,
  THB: 35.8,
  BDT: 110,
  PHP: 56.5,
  NZD: 1.68,
  PKR: 278,
  PLN: 4.05,
  RUB: 92.5,
  SAR: 3.75,
  TRY: 32.5,
  ZAR: 18.9,
};

/**
 * Calculate PPP-adjusted pricing for a country
 */
export function calculatePppPricing(countryCode: string): PppPricingData {
  const countryData = DEFAULT_PPP_MULTIPLIERS[countryCode] || DEFAULT_PPP_MULTIPLIERS['US'];
  const { multiplier, currency, name, gateway, methods } = countryData;
  const exchangeRate = CURRENCY_RATES[currency] || 1;

  // Calculate prices in local currency (legacy plans)
  const starterMonthly = BASE_USD_PRICING.starter.monthly * multiplier * exchangeRate;
  const starterYearly = BASE_USD_PRICING.starter.yearly * multiplier * exchangeRate;
  const premiumMonthly = BASE_USD_PRICING.premium.monthly * multiplier * exchangeRate;
  const premiumYearly = BASE_USD_PRICING.premium.yearly * multiplier * exchangeRate;
  const ultimateMonthly = BASE_USD_PRICING.ultimate.monthly * multiplier * exchangeRate;
  const ultimateYearly = BASE_USD_PRICING.ultimate.yearly * multiplier * exchangeRate;

  // Calculate global plan prices
  const glStarterMonthly = BASE_USD_PRICING.gl_starter.monthly * multiplier * exchangeRate;
  const glStandardMonthly = BASE_USD_PRICING.gl_standard.monthly * multiplier * exchangeRate;
  const glPremiumMonthly = BASE_USD_PRICING.gl_premium.monthly * multiplier * exchangeRate;

  return {
    availablePaymentMethods: methods,
    countryCode,
    countryName: name,
    currency,
    pppMultiplier: multiplier,
    preferredPaymentGateway: gateway,
    pricing: {
      // Global plans (USD via Polar.sh)
      gl_premium: {
        monthly: Math.round(glPremiumMonthly),
        monthlyPoints: BASE_USD_PRICING.gl_premium.monthlyPoints,
        monthlyUsd: BASE_USD_PRICING.gl_premium.monthly * multiplier,
        yearly: Math.round(glPremiumMonthly * 10),
      },
      gl_standard: {
        monthly: Math.round(glStandardMonthly),
        monthlyPoints: BASE_USD_PRICING.gl_standard.monthlyPoints,
        monthlyUsd: BASE_USD_PRICING.gl_standard.monthly * multiplier,
        yearly: Math.round(glStandardMonthly * 10),
      },
      gl_starter: {
        monthly: Math.round(glStarterMonthly),
        monthlyPoints: BASE_USD_PRICING.gl_starter.monthlyPoints,
        monthlyUsd: BASE_USD_PRICING.gl_starter.monthly * multiplier,
        yearly: 0,
      },
      // Vietnam plans (VND via Sepay) - fixed prices
      vn_basic: { monthly: 69_000, monthlyPoints: 300_000, monthlyUsd: 2.85, yearly: 690_000 },
      vn_free: { monthly: 0, monthlyPoints: 50_000, monthlyUsd: 0, yearly: 0 },
      vn_pro: { monthly: 199_000, monthlyPoints: 2_000_000, monthlyUsd: 8.25, yearly: 1_990_000 },
      // Legacy mappings
      premium: {
        monthly: Math.round(premiumMonthly),
        monthlyUsd: BASE_USD_PRICING.premium.monthly * multiplier,
        yearly: Math.round(premiumYearly),
      },
      starter: {
        monthly: Math.round(starterMonthly),
        monthlyUsd: BASE_USD_PRICING.starter.monthly * multiplier,
        yearly: Math.round(starterYearly),
      },
      ultimate: {
        monthly: Math.round(ultimateMonthly),
        monthlyUsd: BASE_USD_PRICING.ultimate.monthly * multiplier,
        yearly: Math.round(ultimateYearly),
      },
    },
  };
}

/**
 * Get PPP pricing from database or calculate default
 */
export async function getPppPricing(
  db: LobeChatDatabase,
  countryCode: string,
): Promise<PppPricingData> {
  try {
    // Try to get from database first
    const result = await db
      .select()
      .from(pppPricing)
      .where(eq(pppPricing.countryCode, countryCode))
      .limit(1);

    if (result.length > 0) {
      const data = result[0];
      const calculated = calculatePppPricing(countryCode);
      return {
        availablePaymentMethods: (data.availablePaymentMethods as string[]) || [],
        countryCode: data.countryCode,
        countryName: data.countryName,
        currency: data.currency,
        pppMultiplier: parseFloat(data.pppMultiplier),
        preferredPaymentGateway: data.preferredPaymentGateway || 'stripe',
        pricing: {
          // Include all plans from calculated pricing
          ...calculated.pricing,
          // Override with database values for legacy plans
          premium: {
            monthly: data.premiumMonthly,
            monthlyUsd: parseFloat(data.premiumMonthlyUsd),
            yearly: data.premiumYearly,
          },
          starter: {
            monthly: data.starterMonthly,
            monthlyUsd: parseFloat(data.starterMonthlyUsd),
            yearly: data.starterYearly,
          },
          ultimate: {
            monthly: data.ultimateMonthly,
            monthlyUsd: parseFloat(data.ultimateMonthlyUsd),
            yearly: data.ultimateYearly,
          },
        },
      };
    }
  } catch (error) {
    console.error('Error fetching PPP pricing from database:', error);
  }

  // Fallback to calculated pricing
  return calculatePppPricing(countryCode);
}
