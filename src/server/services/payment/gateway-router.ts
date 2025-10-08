/**
 * Payment Gateway Router
 * Automatically selects the best payment gateway based on country, currency, and amount
 *
 * Updated 2025-01-08: Added Polar.sh for international payments
 */

export interface PaymentGatewaySelection {
  provider: 'sepay' | 'polar' | 'stripe' | 'razorpay' | 'paypal' | 'paddle' | 'lemonsqueezy';
  name: string;
  supportedMethods: string[];
  estimatedFee: number; // Percentage
  estimatedFeeFixed: number; // Fixed amount in currency
  currency: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  countryCode: string;
  paymentMethod?: string; // Optional: user's preferred method
}

/**
 * Gateway configurations with their capabilities
 */
const GATEWAY_CONFIGS: Record<string, {
  provider: PaymentGatewaySelection['provider'];
  name: string;
  supportedCountries: string[];
  supportedCurrencies: string[];
  supportedMethods: string[];
  feePercent: number;
  feeFixed: number;
  feeCurrency: string;
  priority: number; // Higher = preferred
  minAmount?: number;
  maxAmount?: number;
}> = {
  // Sepay - Vietnam only
  sepay: {
    provider: 'sepay',
    name: 'Sepay (Vietnam Bank Transfer)',
    supportedCountries: ['VN'],
    supportedCurrencies: ['VND'],
    supportedMethods: ['bank_transfer', 'qr_code'],
    feePercent: 0, // No fee for bank transfer
    feeFixed: 0,
    feeCurrency: 'VND',
    priority: 100, // Highest priority for Vietnam
    minAmount: 1000, // 1,000 VND
  },

  // Polar.sh - International (Merchant of Record)
  polar: {
    provider: 'polar',
    name: 'Polar.sh',
    supportedCountries: ['*'], // Global except VN (VN uses Sepay)
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'SGD', 'INR', 'JPY', 'BRL', 'MXN'],
    supportedMethods: ['card', 'paypal', 'google_pay', 'apple_pay'],
    feePercent: 4.0, // 4% + $0.40
    feeFixed: 0.40,
    feeCurrency: 'USD',
    priority: 90, // High priority for international (Merchant of Record)
    minAmount: 1.00, // $1.00 USD
  },

  // Stripe - Global
  stripe: {
    provider: 'stripe',
    name: 'Stripe',
    supportedCountries: [
      'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI',
      'IE', 'PT', 'PL', 'CZ', 'GR', 'RO', 'BG', 'HR', 'SI', 'SK', 'LT', 'LV', 'EE', 'CY', 'MT',
      'AU', 'NZ', 'SG', 'HK', 'JP', 'MY', 'TH', 'ID', 'PH', 'MX', 'BR', 'AE', 'SA', 'ZA',
    ],
    supportedCurrencies: [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'SGD', 'HKD', 'JPY', 'MYR', 'THB', 'IDR', 'PHP',
      'MXN', 'BRL', 'AED', 'SAR', 'ZAR', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'RON', 'BGN',
      'HRK', 'HUF',
    ],
    supportedMethods: [
      'card', 'sepa_debit', 'ach', 'bacs', 'becs_debit', 'fpx', 'promptpay', 'alipay', 'wechat',
      'konbini', 'oxxo', 'boleto', 'p24', 'sofort', 'giropay', 'eps', 'ideal', 'bancontact',
    ],
    feePercent: 2.9,
    feeFixed: 0.30,
    feeCurrency: 'USD',
    priority: 80, // High priority for most countries
    minAmount: 0.50, // $0.50 USD
  },

  // Razorpay - India
  razorpay: {
    provider: 'razorpay',
    name: 'Razorpay (India)',
    supportedCountries: ['IN'],
    supportedCurrencies: ['INR'],
    supportedMethods: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
    feePercent: 2.0, // Lower than Stripe for India
    feeFixed: 0,
    feeCurrency: 'INR',
    priority: 100, // Highest priority for India
    minAmount: 1, // ₹1 INR
  },

  // PayPal - Global fallback
  paypal: {
    provider: 'paypal',
    name: 'PayPal',
    supportedCountries: ['*'], // Global
    supportedCurrencies: [
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL', 'MXN', 'PHP', 'THB', 'SGD',
      'HKD', 'NZD', 'TWD', 'KRW', 'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS', 'MYR',
      'RUB', 'ZAR',
    ],
    supportedMethods: ['paypal', 'card'],
    feePercent: 3.49,
    feeFixed: 0.49,
    feeCurrency: 'USD',
    priority: 50, // Lower priority (higher fees)
    minAmount: 1.00,
  },

  // Paddle - SaaS-focused
  paddle: {
    provider: 'paddle',
    name: 'Paddle',
    supportedCountries: ['*'], // Global
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'BRL', 'MXN'],
    supportedMethods: ['card', 'paypal'],
    feePercent: 5.0, // Higher but handles VAT/tax
    feeFixed: 0.50,
    feeCurrency: 'USD',
    priority: 40, // Lower priority (higher fees, but good for tax compliance)
    minAmount: 1.00,
  },

  // LemonSqueezy - Merchant of Record
  lemonsqueezy: {
    provider: 'lemonsqueezy',
    name: 'Lemon Squeezy',
    supportedCountries: ['*'], // Global
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
    supportedMethods: ['card', 'paypal'],
    feePercent: 5.0, // Similar to Paddle
    feeFixed: 0.50,
    feeCurrency: 'USD',
    priority: 35, // Lower priority
    minAmount: 1.00,
  },
};

/**
 * Select the best payment gateway for a request
 */
export function selectPaymentGateway(request: PaymentRequest): PaymentGatewaySelection {
  const { countryCode, currency, amount, paymentMethod } = request;

  // Find all compatible gateways
  const compatibleGateways = Object.entries(GATEWAY_CONFIGS)
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
      provider: paypalConfig.provider,
      name: paypalConfig.name,
      supportedMethods: paypalConfig.supportedMethods,
      estimatedFee: paypalConfig.feePercent,
      estimatedFeeFixed: paypalConfig.feeFixed,
      currency: paypalConfig.feeCurrency,
    };
  }

  // Return the highest priority gateway
  const [_, selectedConfig] = compatibleGateways[0];
  return {
    provider: selectedConfig.provider,
    name: selectedConfig.name,
    supportedMethods: selectedConfig.supportedMethods,
    estimatedFee: selectedConfig.feePercent,
    estimatedFeeFixed: selectedConfig.feeFixed,
    currency: selectedConfig.feeCurrency,
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
  subtotal: number;
  gatewayFee: number;
  total: number;
  currency: string;
} {
  const percentageFee = amount * (gateway.estimatedFee / 100);
  const fixedFee = gateway.estimatedFeeFixed; // Assume same currency for simplicity
  const totalFee = percentageFee + fixedFee;

  return {
    subtotal: amount,
    gatewayFee: totalFee,
    total: amount + totalFee,
    currency,
  };
}

/**
 * Get all available payment methods for a country
 */
export function getAvailablePaymentMethods(countryCode: string, currency: string): string[] {
  const methods = new Set<string>();

  Object.values(GATEWAY_CONFIGS).forEach((config) => {
    const supportsCountry =
      config.supportedCountries.includes('*') || config.supportedCountries.includes(countryCode);
    const supportsCurrency = config.supportedCurrencies.includes(currency);

    if (supportsCountry && supportsCurrency) {
      config.supportedMethods.forEach((method) => methods.add(method));
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
export function getAvailableGateways(countryCode: string, currency: string): PaymentGatewaySelection[] {
  return Object.entries(GATEWAY_CONFIGS)
    .filter(([_, config]) => {
      const supportsCountry =
        config.supportedCountries.includes('*') || config.supportedCountries.includes(countryCode);
      const supportsCurrency = config.supportedCurrencies.includes(currency);
      return supportsCountry && supportsCurrency;
    })
    .sort((a, b) => b[1].priority - a[1].priority)
    .map(([_, config]) => ({
      provider: config.provider,
      name: config.name,
      supportedMethods: config.supportedMethods,
      estimatedFee: config.feePercent,
      estimatedFeeFixed: config.feeFixed,
      currency: config.feeCurrency,
    }));
}

