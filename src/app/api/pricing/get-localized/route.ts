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
  data?: {
    // Payment info
    availablePaymentMethods: string[];
    // Comparison with US pricing
    comparisonWithUS: {
      premiumMonthly: {
        local: number;
        savingsPercent: number;
        us: number;
      };
      starterMonthly: {
        local: number;
        savingsPercent: number;
        us: number;
      };
      ultimateMonthly: {
        local: number;
        savingsPercent: number;
        us: number;
      };
    };
    // Location info
    countryCode: string;
    countryName: string;
    
    currency: string;
    
    detectionMethod: string;
    
    // PPP info
    pppMultiplier: number;
    // Pricing
    pricing: {
      premium: {
        monthly: number;
        monthlyUsd: number;
        savings: string;
        yearly: number;
        yearlyUsd: number;
      };
      starter: {
        monthly: number;
        monthlyUsd: number;
        savings: string;
        yearly: number;
        yearlyUsd: number; // e.g., "Save 17%"
      };
      ultimate: {
        monthly: number;
        monthlyUsd: number;
        savings: string;
        yearly: number;
        yearlyUsd: number;
      };
    };
    
    recommendedGateway: {
      estimatedFee: number;
      name: string;
      provider: string;
    };
  };
  error?: string;
  success: boolean;
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
      amount: pppData.pricing.starter.monthly,
      countryCode,
      currency: pppData.currency,
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
      data: {
        
        // Payment
availablePaymentMethods: paymentMethods,
        

// Comparison
comparisonWithUS: {
          premiumMonthly: {
            local: pppData.pricing.premium.monthlyUsd,
            savingsPercent: premiumSavings,
            us: usPricing.pricing.premium.monthlyUsd,
          },
          starterMonthly: {
            local: pppData.pricing.starter.monthlyUsd,
            savingsPercent: starterSavings,
            us: usPricing.pricing.starter.monthlyUsd,
          },
          ultimateMonthly: {
            local: pppData.pricing.ultimate.monthlyUsd,
            savingsPercent: ultimateSavings,
            us: usPricing.pricing.ultimate.monthlyUsd,
          },
        },
        

// Location
countryCode,
        

countryName: pppData.countryName,
        
        
        

currency: pppData.currency,
        
        
        


detectionMethod,
        
        
        

// PPP
pppMultiplier: pppData.pppMultiplier,
        
// Pricing
pricing: {
          premium: {
            monthly: pppData.pricing.premium.monthly,
            monthlyUsd: pppData.pricing.premium.monthlyUsd,
            savings: `Save ${premiumYearlySavings}%`,
            yearly: pppData.pricing.premium.yearly,
            yearlyUsd: pppData.pricing.premium.monthlyUsd * 12 * (1 - premiumYearlySavings / 100),
          },
          starter: {
            monthly: pppData.pricing.starter.monthly,
            monthlyUsd: pppData.pricing.starter.monthlyUsd,
            savings: `Save ${starterYearlySavings}%`,
            yearly: pppData.pricing.starter.yearly,
            yearlyUsd: pppData.pricing.starter.monthlyUsd * 12 * (1 - starterYearlySavings / 100),
          },
          ultimate: {
            monthly: pppData.pricing.ultimate.monthly,
            monthlyUsd: pppData.pricing.ultimate.monthlyUsd,
            savings: `Save ${ultimateSavings}%`,
            yearly: pppData.pricing.ultimate.yearly,
            yearlyUsd: pppData.pricing.ultimate.monthlyUsd * 12 * (1 - ultimateYearlySavings / 100),
          },
        },
        
        
        recommendedGateway: {
          estimatedFee: gateway.estimatedFee,
          name: gateway.name,
          provider: gateway.provider,
        },
      },
      success: true,
    });
  } catch (error) {
    console.error('Error getting localized pricing:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to get localized pricing',
        success: false,
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

