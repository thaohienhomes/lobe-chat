/**
 * Centralized Configuration for pho.chat Customizations
 *
 * This file manages all custom configurations for:
 * - Clerk Authentication
 * - Sepay Payment Integration
 * - pho.chat Branding
 *
 * Using environment variables ensures these customizations are isolated
 * from upstream LobeChat code and won't conflict during upstream syncs.
 *
 * WHY THIS HELPS WITH UPSTREAM SYNC:
 * - Centralizes all custom configuration in one place
 * - Uses environment variables instead of hardcoded values
 * - Makes it easy to identify what's custom vs upstream
 * - Reduces merge conflicts during upstream syncs
 */

// ============================================================================
// BRANDING CONFIGURATION
// ============================================================================
// Isolated branding configuration using environment variables
// This prevents conflicts with upstream branding changes

export const BRANDING_CONFIG = {
  
  appDescription: process.env.NEXT_PUBLIC_BRAND_DESCRIPTION || 'Vietnamese AI Chat Platform',
  // App name and identity
appName: process.env.NEXT_PUBLIC_BRAND_NAME || 'pho.chat',

  
  businessEmail: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || 'hello@pho.chat',
  
faviconUrl: process.env.NEXT_PUBLIC_BRAND_FAVICON_URL || '/favicon.ico',

  
  
// Legal links
legalLinks: {
    help: process.env.NEXT_PUBLIC_HELP_URL,
    privacy: process.env.NEXT_PUBLIC_PRIVACY_URL,
    terms: process.env.NEXT_PUBLIC_TERMS_URL,
  },
  

// Logo and visual identity
logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL || '',

  
  

neutralColor: process.env.NEXT_PUBLIC_NEUTRAL_COLOR || '#000000',
  

// Color scheme
primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#FF6B6B',
  

// Social links
socialLinks: {
    discord: process.env.NEXT_PUBLIC_DISCORD_URL,
    github: process.env.NEXT_PUBLIC_GITHUB_URL,
    twitter: process.env.NEXT_PUBLIC_TWITTER_URL,
  },

  
  


supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@pho.chat',

  
  
// URLs and links
websiteUrl: process.env.NEXT_PUBLIC_WEBSITE_URL || 'https://pho.chat',
};

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================
// Isolated Clerk authentication configuration
// This prevents conflicts with upstream auth system changes

export const AUTH_CONFIG = {
  
  // Clerk-specific configuration
clerk: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_CLERK_AUTH === 'true',
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    secretKey: process.env.CLERK_SECRET_KEY,
    webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
  },

  
  

// User ID mapping for development
devImpersonateUser: process.env.CLERK_DEV_IMPERSONATE_USER,

  
  


// Auth protection settings
enableAuthProtection: process.env.ENABLE_AUTH_PROTECTION === '1',

  
  


// NextAuth configuration (for reference, not used in pho.chat)
nextAuth: {
    enabled: process.env.NEXT_PUBLIC_ENABLE_NEXT_AUTH === 'true',
  },

  
  
// Authentication provider selection
provider: process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'clerk',
};

// ============================================================================
// PAYMENT CONFIGURATION
// ============================================================================
// Isolated Sepay payment integration configuration
// This prevents conflicts with upstream payment system changes

export const PAYMENT_CONFIG = {
  
  
currency: process.env.NEXT_PUBLIC_PAYMENT_CURRENCY || 'VND',

  
  


// Payment settings
minAmount: parseInt(process.env.NEXT_PUBLIC_MIN_PAYMENT_AMOUNT || '1000', 10),

  
  


// Polar payment configuration (alternative provider)
polar: {
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    enabled: process.env.NEXT_PUBLIC_USE_POLAR === 'true',
    environment: process.env.POLAR_SERVER || 'production',
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
  },

  
  

// Payment provider selection
provider: process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'sepay',
  
// Sepay-specific configuration
sepay: {
    
    apiUrl: process.env.SEPAY_API_URL || 'https://api.sepay.vn/v1',
    // Bank account for QR code generation (bank transfer method)
bankAccount: process.env.SEPAY_BANK_ACCOUNT,

    
    bankName: process.env.SEPAY_BANK_NAME,

    
    // Webhook and callback URLs
cancelUrl: process.env.SEPAY_CANCEL_URL,
    // Credit Card payment support
creditCardApiKey: process.env.SEPAY_CREDIT_CARD_API_KEY,

    creditCardEnabled: process.env.NEXT_PUBLIC_SEPAY_CREDIT_CARD_ENABLED === 'true',
    enabled: process.env.NEXT_PUBLIC_USE_SEPAY === 'true',
    merchantId: process.env.SEPAY_MERCHANT_ID,

    // Mock mode for testing (when credentials not provided)
    mockMode: !process.env.SEPAY_SECRET_KEY || !process.env.SEPAY_MERCHANT_ID,

    // Webhook and callback URLs
    returnUrl: process.env.SEPAY_RETURN_URL,
    secretKey: process.env.SEPAY_SECRET_KEY,
    webhookUrl: process.env.SEPAY_NOTIFY_URL,
  },
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================
// Centralized feature flags for custom features
// This allows easy toggling of custom functionality

export const FEATURE_FLAGS = {
  // Clerk authentication feature
  CLERK_AUTH: AUTH_CONFIG.clerk.enabled,

  
  
// Cost optimization features
COST_OPTIMIZATION: process.env.COST_OPTIMIZATION_ENABLED === 'true',

  
  

// pho.chat branding feature
PHO_BRANDING: process.env.NEXT_PUBLIC_USE_PHO_BRANDING !== 'false',

  
  // Sepay payment feature
SEPAY_PAYMENT: PAYMENT_CONFIG.sepay.enabled,

  // Usage tracking
  USAGE_TRACKING: process.env.USAGE_TRACKING_ENABLED === 'true',
};

// ============================================================================
// VALIDATION
// ============================================================================
// Validate critical configuration at startup

export function validateCustomizationConfig(): void {
  const errors: string[] = [];

  // Validate Clerk configuration if enabled
  if (AUTH_CONFIG.clerk.enabled) {
    if (!AUTH_CONFIG.clerk.publishableKey) {
      errors.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required when Clerk auth is enabled');
    }
    if (!AUTH_CONFIG.clerk.secretKey) {
      errors.push('CLERK_SECRET_KEY is required when Clerk auth is enabled');
    }
  }

  // Validate Sepay configuration if enabled
  if (PAYMENT_CONFIG.sepay.enabled && !PAYMENT_CONFIG.sepay.mockMode) {
    if (!PAYMENT_CONFIG.sepay.merchantId) {
      errors.push('SEPAY_MERCHANT_ID is required when Sepay is enabled');
    }
    if (!PAYMENT_CONFIG.sepay.secretKey) {
      errors.push('SEPAY_SECRET_KEY is required when Sepay is enabled');
    }
  }

  if (errors.length > 0) {
    console.error('❌ Configuration validation failed:');
    errors.forEach((error) => console.error(`  - ${error}`));
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Critical configuration missing');
    }
  }
}

// ============================================================================
// EXPORT SUMMARY
// ============================================================================
// This configuration object provides a single source of truth for all
// pho.chat customizations, making it easy to:
// 1. Identify what's custom vs upstream
// 2. Manage environment variables
// 3. Prevent merge conflicts during upstream syncs
// 4. Test custom functionality in isolation
