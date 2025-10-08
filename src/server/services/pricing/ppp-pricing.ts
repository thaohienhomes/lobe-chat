/**
 * PPP (Purchasing Power Parity) Pricing Service
 * Handles country-specific pricing for pho.chat
 */

import { eq } from 'drizzle-orm';
import { pppPricing } from '@/database/schemas/billing-multi-market';
import type { ServerDB } from '@/database/core';

export interface PppPricingData {
  countryCode: string;
  countryName: string;
  currency: string;
  pppMultiplier: number;
  pricing: {
    starter: { monthly: number; yearly: number; monthlyUsd: number };
    premium: { monthly: number; yearly: number; monthlyUsd: number };
    ultimate: { monthly: number; yearly: number; monthlyUsd: number };
  };
  availablePaymentMethods: string[];
  preferredPaymentGateway: string;
}

/**
 * Base USD pricing (reference point)
 */
const BASE_USD_PRICING = {
  starter: { monthly: 1.2, yearly: 12.0 },
  premium: { monthly: 4.0, yearly: 40.0 },
  ultimate: { monthly: 11.6, yearly: 116.0 },
};

/**
 * Default PPP multipliers by country
 * Source: World Bank PPP data + Numbeo Cost of Living Index
 */
export const DEFAULT_PPP_MULTIPLIERS: Record<string, {
  multiplier: number;
  currency: string;
  name: string;
  gateway: string;
  methods: string[];
}> = {
  // Southeast Asia
  VN: {
    multiplier: 0.40, // Vietnam - 40% of US purchasing power
    currency: 'VND',
    name: 'Vietnam',
    gateway: 'sepay',
    methods: ['bank_transfer', 'qr_code'],
  },
  TH: {
    multiplier: 0.55,
    currency: 'THB',
    name: 'Thailand',
    gateway: 'stripe',
    methods: ['card', 'promptpay'],
  },
  ID: {
    multiplier: 0.45,
    currency: 'IDR',
    name: 'Indonesia',
    gateway: 'stripe',
    methods: ['card', 'bank_transfer'],
  },
  PH: {
    multiplier: 0.42,
    currency: 'PHP',
    name: 'Philippines',
    gateway: 'stripe',
    methods: ['card', 'gcash'],
  },
  MY: {
    multiplier: 0.60,
    currency: 'MYR',
    name: 'Malaysia',
    gateway: 'stripe',
    methods: ['card', 'fpx'],
  },

  // South Asia
  IN: {
    multiplier: 0.35, // India - 35% of US purchasing power
    currency: 'INR',
    name: 'India',
    gateway: 'razorpay',
    methods: ['card', 'upi', 'netbanking', 'wallet'],
  },
  PK: {
    multiplier: 0.30,
    currency: 'PKR',
    name: 'Pakistan',
    gateway: 'stripe',
    methods: ['card'],
  },
  BD: {
    multiplier: 0.32,
    currency: 'BDT',
    name: 'Bangladesh',
    gateway: 'stripe',
    methods: ['card'],
  },

  // East Asia
  CN: {
    multiplier: 0.65,
    currency: 'CNY',
    name: 'China',
    gateway: 'stripe',
    methods: ['card', 'alipay', 'wechat'],
  },
  JP: {
    multiplier: 1.10,
    currency: 'JPY',
    name: 'Japan',
    gateway: 'stripe',
    methods: ['card', 'konbini'],
  },
  KR: {
    multiplier: 0.95,
    currency: 'KRW',
    name: 'South Korea',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Americas
  US: {
    multiplier: 1.00, // Base reference
    currency: 'USD',
    name: 'United States',
    gateway: 'stripe',
    methods: ['card', 'ach'],
  },
  CA: {
    multiplier: 0.95,
    currency: 'CAD',
    name: 'Canada',
    gateway: 'stripe',
    methods: ['card'],
  },
  MX: {
    multiplier: 0.50,
    currency: 'MXN',
    name: 'Mexico',
    gateway: 'stripe',
    methods: ['card', 'oxxo'],
  },
  BR: {
    multiplier: 0.48,
    currency: 'BRL',
    name: 'Brazil',
    gateway: 'stripe',
    methods: ['card', 'boleto'],
  },
  AR: {
    multiplier: 0.45,
    currency: 'ARS',
    name: 'Argentina',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Europe
  GB: {
    multiplier: 1.05,
    currency: 'GBP',
    name: 'United Kingdom',
    gateway: 'stripe',
    methods: ['card', 'bacs'],
  },
  DE: {
    multiplier: 1.00,
    currency: 'EUR',
    name: 'Germany',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit', 'sofort'],
  },
  FR: {
    multiplier: 1.00,
    currency: 'EUR',
    name: 'France',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
  },
  ES: {
    multiplier: 0.90,
    currency: 'EUR',
    name: 'Spain',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
  },
  IT: {
    multiplier: 0.88,
    currency: 'EUR',
    name: 'Italy',
    gateway: 'stripe',
    methods: ['card', 'sepa_debit'],
  },
  PL: {
    multiplier: 0.65,
    currency: 'PLN',
    name: 'Poland',
    gateway: 'stripe',
    methods: ['card', 'p24'],
  },
  RU: {
    multiplier: 0.55,
    currency: 'RUB',
    name: 'Russia',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Middle East
  AE: {
    multiplier: 0.95,
    currency: 'AED',
    name: 'United Arab Emirates',
    gateway: 'stripe',
    methods: ['card'],
  },
  SA: {
    multiplier: 0.85,
    currency: 'SAR',
    name: 'Saudi Arabia',
    gateway: 'stripe',
    methods: ['card'],
  },
  TR: {
    multiplier: 0.50,
    currency: 'TRY',
    name: 'Turkey',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Africa
  ZA: {
    multiplier: 0.52,
    currency: 'ZAR',
    name: 'South Africa',
    gateway: 'stripe',
    methods: ['card'],
  },
  NG: {
    multiplier: 0.38,
    currency: 'NGN',
    name: 'Nigeria',
    gateway: 'stripe',
    methods: ['card'],
  },
  EG: {
    multiplier: 0.35,
    currency: 'EGP',
    name: 'Egypt',
    gateway: 'stripe',
    methods: ['card'],
  },

  // Oceania
  AU: {
    multiplier: 1.05,
    currency: 'AUD',
    name: 'Australia',
    gateway: 'stripe',
    methods: ['card', 'becs_debit'],
  },
  NZ: {
    multiplier: 1.00,
    currency: 'NZD',
    name: 'New Zealand',
    gateway: 'stripe',
    methods: ['card'],
  },
};

/**
 * Currency exchange rates (approximate, should be updated regularly)
 */
export const CURRENCY_RATES: Record<string, number> = {
  USD: 1.0,
  VND: 24_167,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  CNY: 7.24,
  INR: 83.12,
  IDR: 15_678,
  THB: 35.8,
  MYR: 4.72,
  PHP: 56.5,
  KRW: 1_338,
  AUD: 1.53,
  CAD: 1.36,
  BRL: 4.97,
  MXN: 17.1,
  ARS: 350.0,
  PLN: 4.05,
  TRY: 32.5,
  ZAR: 18.9,
  AED: 3.67,
  SAR: 3.75,
  RUB: 92.5,
  NGN: 1_550,
  EGP: 48.9,
  NZD: 1.68,
  PKR: 278,
  BDT: 110,
};

/**
 * Calculate PPP-adjusted pricing for a country
 */
export function calculatePppPricing(countryCode: string): PppPricingData {
  const countryData = DEFAULT_PPP_MULTIPLIERS[countryCode] || DEFAULT_PPP_MULTIPLIERS['US'];
  const { multiplier, currency, name, gateway, methods } = countryData;
  const exchangeRate = CURRENCY_RATES[currency] || 1.0;

  // Calculate prices in local currency
  const starterMonthly = BASE_USD_PRICING.starter.monthly * multiplier * exchangeRate;
  const starterYearly = BASE_USD_PRICING.starter.yearly * multiplier * exchangeRate;
  const premiumMonthly = BASE_USD_PRICING.premium.monthly * multiplier * exchangeRate;
  const premiumYearly = BASE_USD_PRICING.premium.yearly * multiplier * exchangeRate;
  const ultimateMonthly = BASE_USD_PRICING.ultimate.monthly * multiplier * exchangeRate;
  const ultimateYearly = BASE_USD_PRICING.ultimate.yearly * multiplier * exchangeRate;

  return {
    countryCode,
    countryName: name,
    currency,
    pppMultiplier: multiplier,
    pricing: {
      starter: {
        monthly: Math.round(starterMonthly),
        yearly: Math.round(starterYearly),
        monthlyUsd: BASE_USD_PRICING.starter.monthly * multiplier,
      },
      premium: {
        monthly: Math.round(premiumMonthly),
        yearly: Math.round(premiumYearly),
        monthlyUsd: BASE_USD_PRICING.premium.monthly * multiplier,
      },
      ultimate: {
        monthly: Math.round(ultimateMonthly),
        yearly: Math.round(ultimateYearly),
        monthlyUsd: BASE_USD_PRICING.ultimate.monthly * multiplier,
      },
    },
    availablePaymentMethods: methods,
    preferredPaymentGateway: gateway,
  };
}

/**
 * Get PPP pricing from database or calculate default
 */
export async function getPppPricing(db: ServerDB, countryCode: string): Promise<PppPricingData> {
  try {
    // Try to get from database first
    const result = await db
      .select()
      .from(pppPricing)
      .where(eq(pppPricing.countryCode, countryCode))
      .limit(1);

    if (result.length > 0) {
      const data = result[0];
      return {
        countryCode: data.countryCode,
        countryName: data.countryName,
        currency: data.currency,
        pppMultiplier: data.pppMultiplier,
        pricing: {
          starter: {
            monthly: data.starterMonthly,
            yearly: data.starterYearly,
            monthlyUsd: data.starterMonthlyUsd,
          },
          premium: {
            monthly: data.premiumMonthly,
            yearly: data.premiumYearly,
            monthlyUsd: data.premiumMonthlyUsd,
          },
          ultimate: {
            monthly: data.ultimateMonthly,
            yearly: data.ultimateYearly,
            monthlyUsd: data.ultimateMonthlyUsd,
          },
        },
        availablePaymentMethods: (data.availablePaymentMethods as string[]) || [],
        preferredPaymentGateway: data.preferredPaymentGateway || 'stripe',
      };
    }
  } catch (error) {
    console.error('Error fetching PPP pricing from database:', error);
  }

  // Fallback to calculated pricing
  return calculatePppPricing(countryCode);
}

