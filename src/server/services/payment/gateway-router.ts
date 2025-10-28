/**
 * Payment Gateway Router
 * Automatically selects the best payment gateway based on country, currency, and amount
 *
 * Updated 2025-01-08: Added Polar.sh for international payments
 */

export interface PaymentGatewaySelection {
  // Fixed amount in currency
  currency: string;
  estimatedFee: number;
  // Percentage
  estimatedFeeFixed: number;
  name: string;
  provider: 'sepay' | 'polar' | 'stripe' | 'razorpay' | 'paypal' | 'paddle' | 'lemonsqueezy';
  supportedMethods: string[];
}

export interface PaymentRequest {
  amount: number;
  countryCode: string;
  currency: string;
  paymentMethod?: string; // Optional: user's preferred method
}

/**
 * Gateway configurations with their capabilities
 */
const GATEWAY_CONFIGS: Record<
  string,
  {
    feeCurrency: string;
    feeFixed: number;
    feePercent: number;
    maxAmount?: number;
    // Higher = preferred
    minAmount?: number;
    name: string;
    priority: number;
    provider: PaymentGatewaySelection['provider'];
    supportedCountries: string[];
    supportedCurrencies: string[];
    supportedMethods: string[];
  }
> = {
  // LemonSqueezy - Merchant of Record
  lemonsqueezy: {
    feeCurrency: 'USD',
    // Similar to Paddle
feeFixed: 0.5,
    
feePercent: 5,
    
// Lower priority
minAmount: 1,

    

name: 'Lemon Squeezy',

    
    
priority: 35,

    
    
provider: 'lemonsqueezy',

    
    
supportedCountries: ['*'],

    // Global
supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedMethods: ['card', 'paypal'],
  },

  // Paddle - SaaS-focused
  paddle: {
    feeCurrency: 'USD',
    // Higher but handles VAT/tax
feeFixed: 0.5,
    
feePercent: 5,
    
// Lower priority (higher fees, but good for tax compliance)
minAmount: 1,

    

name: 'Paddle',

    
    
priority: 40,

    
    
provider: 'paddle',

    
    
supportedCountries: ['*'],

    // Global
supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN'],
    supportedMethods: ['card', 'paypal'],
  },

  // PayPal - Global fallback
  paypal: {
    feeCurrency: 'USD',
    feeFixed: 0.49,
    feePercent: 3.49,
    // Lower priority (higher fees)
minAmount: 1,

    
name: 'PayPal',

    
priority: 50,
    
    
provider: 'paypal',
    
    
supportedCountries: ['*'],

    // Global
supportedCurrencies: [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'JPY',
      'CNY',
      'INR',
      'BRL',
      'MXN',
      'PHP',
      'THB',
      'SGD',
      'HKD',
      'NZD',
      'TWD',
      'KRW',
      'CHF',
      'SEK',
      'NOK',
      'DKK',
      'PLN',
      'CZK',
      'HUF',
      'ILS',
      'MYR',
      'RUB',
      'ZAR',
    ],
    supportedMethods: ['paypal', 'card'],
  },

  // Polar.sh - International (Merchant of Record)
  polar: {
    feeCurrency: 'USD',
    // 4% + $0.40
feeFixed: 0.4,
    
feePercent: 4,
    
    // High priority for international (Merchant of Record)
minAmount: 1,

    
name: 'Polar.sh',

    
    priority: 90,

    provider: 'polar',

    supportedCountries: ['*'],

    // Global except VN (VN uses Sepay)
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR', 'JPY', 'BRL', 'MXN'],
    supportedMethods: ['card', 'paypal', 'google_pay', 'apple_pay'], // $1.00 USD
  },

  // Razorpay - India
  razorpay: {
    feeCurrency: 'INR',
    // Lower than Stripe for India
feeFixed: 0,
    
feePercent: 2,
    
// Highest priority for India
minAmount: 1,
    
    
name: 'Razorpay (India)',

    
priority: 100,

    
    provider: 'razorpay',

    supportedCountries: ['IN'],

    supportedCurrencies: ['INR'],
    supportedMethods: ['card', 'upi', 'netbanking', 'wallet', 'emi'], // ₹1 INR
  },

  // Sepay - Vietnam only
  sepay: {
    feeCurrency: 'VND',
    // No fee for bank transfer
feeFixed: 0,
    
feePercent: 0,
    
// Highest priority for Vietnam
minAmount: 1000,
    
    
name: 'Sepay (Vietnam Bank Transfer)',

    
priority: 100,

    
    provider: 'sepay',

    supportedCountries: ['VN'],

    supportedCurrencies: ['VND'],
    supportedMethods: ['bank_transfer', 'qr_code'], // 1,000 VND
  },

  // Stripe - Global
  stripe: {
    feeCurrency: 'USD',
    feeFixed: 0.3,
    feePercent: 2.9,
    // High priority for most countries
minAmount: 0.5,
    
name: 'Stripe',
    
    priority: 80,

    provider: 'stripe',

    supportedCountries: [
      'US',
      'CA',
      'GB',
      'DE',
      'FR',
      'ES',
      'IT',
      'NL',
      'BE',
      'AT',
      'CH',
      'SE',
      'NO',
      'DK',
      'FI',
      'IE',
      'PT',
      'PL',
      'CZ',
      'GR',
      'RO',
      'BG',
      'HR',
      'SI',
      'SK',
      'LT',
      'LV',
      'EE',
      'CY',
      'MT',
      'AU',
      'NZ',
      'SG',
      'HK',
      'JP',
      'MY',
      'TH',
      'ID',
      'PH',
      'MX',
      'BR',
      'AE',
      'SA',
      'ZA',
    ],

    supportedCurrencies: [
      'USD',
      'EUR',
      'GBP',
      'CAD',
      'AUD',
      'NZD',
      'SGD',
      'HKD',
      'JPY',
      'MYR',
      'THB',
      'IDR',
      'PHP',
      'MXN',
      'BRL',
      'AED',
      'SAR',
      'ZAR',
      'CHF',
      'SEK',
      'NOK',
      'DKK',
      'PLN',
      'CZK',
      'RON',
      'BGN',
      'HRK',
      'HUF',
    ],
    supportedMethods: [
      'card',
      'sepa_debit',
      'ach',
      'bacs',
      'becs_debit',
      'fpx',
      'promptpay',
      'alipay',
      'wechat',
      'konbini',
      'oxxo',
      'boleto',
      'p24',
      'sofort',
      'giropay',
      'eps',
      'ideal',
      'bancontact',
    ], // $0.50 USD
  },
};

/**
 * Select the best payment gateway for a request
 */
export function selectPaymentGateway(request: PaymentRequest): PaymentGatewaySelection {
  const { countryCode, currency, amount, paymentMethod } = request;

  // Find all compatible gateways
  const compatibleGateways = Object.entries(GATEWAY_CONFIGS)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .filter(([_, config]) => {
      // Check country support
      const supportsCountry =
        config.supportedCountries.includes('*') || config.supportedCountries.includes(countryCode);
      if (!supportsCountry) return false;

      // Check currency support
      const supportsCurrency = config.supportedCurrencies.includes(currency);
      if (!supportsCurrency) return false;

      // Check payment method if specified
      if (paymentMethod && !config.supportedMethods.includes(paymentMethod)) return false;

      // Check amount limits
      if (config.minAmount && amount < config.minAmount) return false;
      if (config.maxAmount && amount > config.maxAmount) return false;

      return true;
    })
    .sort((a, b) => b[1].priority - a[1].priority); // Sort by priority (highest first)

  if (compatibleGateways.length === 0) {
    // Fallback to PayPal if no gateway found
    const paypalConfig = GATEWAY_CONFIGS.paypal;
    return {
      currency: paypalConfig.feeCurrency,
      estimatedFee: paypalConfig.feePercent,
      estimatedFeeFixed: paypalConfig.feeFixed,
      name: paypalConfig.name,
      provider: paypalConfig.provider,
      supportedMethods: paypalConfig.supportedMethods,
    };
  }

  // Return the highest priority gateway
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_gatewayKey, selectedConfig] = compatibleGateways[0];
  return {
    currency: selectedConfig.feeCurrency,
    estimatedFee: selectedConfig.feePercent,
    estimatedFeeFixed: selectedConfig.feeFixed,
    name: selectedConfig.name,
    provider: selectedConfig.provider,
    supportedMethods: selectedConfig.supportedMethods,
  };
}

/**
 * Calculate total cost including gateway fees
 */
export function calculateTotalWithFees(
  amount: number,
  currency: string,
  gateway: PaymentGatewaySelection,
): {
  currency: string;
  gatewayFee: number;
  subtotal: number;
  total: number;
} {
  const percentageFee = amount * (gateway.estimatedFee / 100);
  const fixedFee = gateway.estimatedFeeFixed; // Assume same currency for simplicity
  const totalFee = percentageFee + fixedFee;

  return {
    currency,
    gatewayFee: totalFee,
    subtotal: amount,
    total: amount + totalFee,
  };
}

/**
 * Get all available payment methods for a country
 */
export function getAvailablePaymentMethods(countryCode: string, currency: string): string[] {
  const methods = new Set<string>();

  Object.values(GATEWAY_CONFIGS).forEach((_config) => {
    const supportsCountry =
      _config.supportedCountries.includes('*') || _config.supportedCountries.includes(countryCode);
    const supportsCurrency = _config.supportedCurrencies.includes(currency);

    if (supportsCountry && supportsCurrency) {
      _config.supportedMethods.forEach((method) => methods.add(method));
    }
  });

  return Array.from(methods);
}

/**
 * Validate if a payment gateway supports a specific configuration
 */
export function validateGatewaySupport(
  provider: string,
  countryCode: string,
  currency: string,
): boolean {
  const config = GATEWAY_CONFIGS[provider];
  if (!config) return false;

  const supportsCountry =
    config.supportedCountries.includes('*') || config.supportedCountries.includes(countryCode);
  const supportsCurrency = config.supportedCurrencies.includes(currency);

  return supportsCountry && supportsCurrency;
}

/**
 * Get gateway configuration
 */
export function getGatewayConfig(provider: string) {
  return GATEWAY_CONFIGS[provider] || null;
}

/**
 * Get all available gateways for a country
 */
export function getAvailableGateways(
  countryCode: string,
  currency: string,
): PaymentGatewaySelection[] {
  return (
    Object.entries(GATEWAY_CONFIGS)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_key, config]) => {
        const supportsCountry =
          config.supportedCountries.includes('*') ||
          config.supportedCountries.includes(countryCode);
        const supportsCurrency = config.supportedCurrencies.includes(currency);
        return supportsCountry && supportsCurrency;
      })
      .sort((a, b) => b[1].priority - a[1].priority)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_key, config]) => ({
        currency: config.feeCurrency,
        estimatedFee: config.feePercent,
        estimatedFeeFixed: config.feeFixed,
        name: config.name,
        provider: config.provider,
        supportedMethods: config.supportedMethods,
      }))
  );
}
