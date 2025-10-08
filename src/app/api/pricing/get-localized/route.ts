/**
 * Get Localized Pricing API
 * Returns PPP-adjusted pricing based on user's location
 * 
 * GET /api/pricing/get-localized
 * Query params:
 *   - country: Optional country code override (for testing)
 * 
 * Response:
 *   - countryCode: Detected country
 *   - currency: Local currency
 *   - pricing: Localized prices for all plans
 *   - paymentMethods: Available payment methods
 *   - recommendedGateway: Best payment gateway for this country
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectUserLocation } from '@/server/services/geo/location-detector';
import { calculatePppPricing } from '@/server/services/pricing/ppp-pricing';
import { selectPaymentGateway, getAvailablePaymentMethods } from '@/server/services/payment/gateway-router';

export interface LocalizedPricingResponse {
  success: boolean;
  data?: {
    // Location info
    countryCode: string;
    countryName: string;
    currency: string;
    detectionMethod: string;
    
    // PPP info
    pppMultiplier: number;
    
    // Pricing
    pricing: {
      starter: {
        monthly: number;
        yearly: number;
        monthlyUsd: number;
        yearlyUsd: number;
        savings: string; // e.g., "Save 17%"
      };
      premium: {
        monthly: number;
        yearly: number;
        monthlyUsd: number;
        yearlyUsd: number;
        savings: string;
      };
      ultimate: {
        monthly: number;
        yearly: number;
        monthlyUsd: number;
        yearlyUsd: number;
        savings: string;
      };
    };
    
    // Payment info
    availablePaymentMethods: string[];
    recommendedGateway: {
      provider: string;
      name: string;
      estimatedFee: number;
    };
    
    // Comparison with US pricing
    comparisonWithUS: {
      starterMonthly: {
        us: number;
        local: number;
        savingsPercent: number;
      };
      premiumMonthly: {
        us: number;
        local: number;
        savingsPercent: number;
      };
      ultimateMonthly: {
        us: number;
        local: number;
        savingsPercent: number;
      };
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<LocalizedPricingResponse>> {
  try {
    // Get country from query param or detect from request
    const { searchParams } = new URL(request.url);
    const countryOverride = searchParams.get('country');
    
    let countryCode: string;
    let detectionMethod: string;
    
    if (countryOverride && /^[A-Z]{2}$/.test(countryOverride)) {
      countryCode = countryOverride;
      detectionMethod = 'manual_override';
    } else {
      const location = detectUserLocation(request);
      countryCode = location.countryCode;
      detectionMethod = location.detectionMethod;
    }
    
    // Get PPP pricing for this country
    const pppData = calculatePppPricing(countryCode);
    
    // Get available payment methods
    const paymentMethods = getAvailablePaymentMethods(countryCode, pppData.currency);
    
    // Select recommended payment gateway
    const gateway = selectPaymentGateway({
      countryCode,
      currency: pppData.currency,
      amount: pppData.pricing.starter.monthly,
    });
    
    // Calculate yearly savings
    const starterYearlySavings = Math.round(
      ((pppData.pricing.starter.monthly * 12 - pppData.pricing.starter.yearly) / 
       (pppData.pricing.starter.monthly * 12)) * 100
    );
    const premiumYearlySavings = Math.round(
      ((pppData.pricing.premium.monthly * 12 - pppData.pricing.premium.yearly) / 
       (pppData.pricing.premium.monthly * 12)) * 100
    );
    const ultimateYearlySavings = Math.round(
      ((pppData.pricing.ultimate.monthly * 12 - pppData.pricing.ultimate.yearly) / 
       (pppData.pricing.ultimate.monthly * 12)) * 100
    );
    
    // Get US pricing for comparison
    const usPricing = calculatePppPricing('US');
    
    // Calculate savings compared to US
    const starterSavings = Math.round(
      ((usPricing.pricing.starter.monthlyUsd - pppData.pricing.starter.monthlyUsd) / 
       usPricing.pricing.starter.monthlyUsd) * 100
    );
    const premiumSavings = Math.round(
      ((usPricing.pricing.premium.monthlyUsd - pppData.pricing.premium.monthlyUsd) / 
       usPricing.pricing.premium.monthlyUsd) * 100
    );
    const ultimateSavings = Math.round(
      ((usPricing.pricing.ultimate.monthlyUsd - pppData.pricing.ultimate.monthlyUsd) / 
       usPricing.pricing.ultimate.monthlyUsd) * 100
    );
    
    return NextResponse.json({
      success: true,
      data: {
        // Location
        countryCode,
        countryName: pppData.countryName,
        currency: pppData.currency,
        detectionMethod,
        
        // PPP
        pppMultiplier: pppData.pppMultiplier,
        
        // Pricing
        pricing: {
          starter: {
            monthly: pppData.pricing.starter.monthly,
            yearly: pppData.pricing.starter.yearly,
            monthlyUsd: pppData.pricing.starter.monthlyUsd,
            yearlyUsd: pppData.pricing.starter.monthlyUsd * 12 * (1 - starterYearlySavings / 100),
            savings: `Save ${starterYearlySavings}%`,
          },
          premium: {
            monthly: pppData.pricing.premium.monthly,
            yearly: pppData.pricing.premium.yearly,
            monthlyUsd: pppData.pricing.premium.monthlyUsd,
            yearlyUsd: pppData.pricing.premium.monthlyUsd * 12 * (1 - premiumYearlySavings / 100),
            savings: `Save ${premiumYearlySavings}%`,
          },
          ultimate: {
            monthly: pppData.pricing.ultimate.monthly,
            yearly: pppData.pricing.ultimate.yearly,
            monthlyUsd: pppData.pricing.ultimate.monthlyUsd,
            yearlyUsd: pppData.pricing.ultimate.monthlyUsd * 12 * (1 - ultimateYearlySavings / 100),
            savings: `Save ${ultimateSavings}%`,
          },
        },
        
        // Payment
        availablePaymentMethods: paymentMethods,
        recommendedGateway: {
          provider: gateway.provider,
          name: gateway.name,
          estimatedFee: gateway.estimatedFee,
        },
        
        // Comparison
        comparisonWithUS: {
          starterMonthly: {
            us: usPricing.pricing.starter.monthlyUsd,
            local: pppData.pricing.starter.monthlyUsd,
            savingsPercent: starterSavings,
          },
          premiumMonthly: {
            us: usPricing.pricing.premium.monthlyUsd,
            local: pppData.pricing.premium.monthlyUsd,
            savingsPercent: premiumSavings,
          },
          ultimateMonthly: {
            us: usPricing.pricing.ultimate.monthlyUsd,
            local: pppData.pricing.ultimate.monthlyUsd,
            savingsPercent: ultimateSavings,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting localized pricing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get localized pricing',
      },
      { status: 500 }
    );
  }
}

/**
 * Example responses:
 * 
 * Vietnam (VN):
 * {
 *   "success": true,
 *   "data": {
 *     "countryCode": "VN",
 *     "countryName": "Vietnam",
 *     "currency": "VND",
 *     "pppMultiplier": 0.4,
 *     "pricing": {
 *       "starter": {
 *         "monthly": 11607,
 *         "yearly": 116067,
 *         "monthlyUsd": 0.48,
 *         "savings": "Save 17%"
 *       }
 *     },
 *     "recommendedGateway": {
 *       "provider": "sepay",
 *       "name": "Sepay (Vietnam Bank Transfer)",
 *       "estimatedFee": 0
 *     },
 *     "comparisonWithUS": {
 *       "starterMonthly": {
 *         "us": 1.2,
 *         "local": 0.48,
 *         "savingsPercent": 60
 *       }
 *     }
 *   }
 * }
 * 
 * India (IN):
 * {
 *   "success": true,
 *   "data": {
 *     "countryCode": "IN",
 *     "currency": "INR",
 *     "pppMultiplier": 0.35,
 *     "pricing": {
 *       "starter": {
 *         "monthly": 35,
 *         "yearly": 349
 *       }
 *     },
 *     "recommendedGateway": {
 *       "provider": "razorpay",
 *       "name": "Razorpay (India)"
 *     }
 *   }
 * }
 * 
 * United States (US):
 * {
 *   "success": true,
 *   "data": {
 *     "countryCode": "US",
 *     "currency": "USD",
 *     "pppMultiplier": 1.0,
 *     "pricing": {
 *       "starter": {
 *         "monthly": 1.2,
 *         "yearly": 12.0
 *       }
 *     },
 *     "recommendedGateway": {
 *       "provider": "stripe",
 *       "name": "Stripe"
 *     }
 *   }
 * }
 */

