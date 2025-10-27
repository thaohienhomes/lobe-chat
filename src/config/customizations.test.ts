import { describe, expect, it } from 'vitest';
import {
  BRANDING_CONFIG,
  AUTH_CONFIG,
  PAYMENT_CONFIG,
  FEATURE_FLAGS,
  validateCustomizationConfig,
} from './customizations';

describe('Customizations Configuration', () => {
  describe('BRANDING_CONFIG', () => {
    it('should have valid app name', () => {
      expect(BRANDING_CONFIG.appName).toBe('pho.chat');
    });

    it('should have app description', () => {
      expect(BRANDING_CONFIG.appDescription).toBeDefined();
      expect(typeof BRANDING_CONFIG.appDescription).toBe('string');
    });

    it('should have valid support email', () => {
      expect(BRANDING_CONFIG.supportEmail).toBeDefined();
      expect(BRANDING_CONFIG.supportEmail).toContain('@');
    });

    it('should have valid business email', () => {
      expect(BRANDING_CONFIG.businessEmail).toBeDefined();
      expect(BRANDING_CONFIG.businessEmail).toContain('@');
    });

    it('should have website URL', () => {
      expect(BRANDING_CONFIG.websiteUrl).toBeDefined();
      expect(typeof BRANDING_CONFIG.websiteUrl).toBe('string');
    });

    it('should have primary color', () => {
      expect(BRANDING_CONFIG.primaryColor).toBeDefined();
      expect(BRANDING_CONFIG.primaryColor).toMatch(/^#[0-9A-F]{6}$/i);
    });

    it('should have social links object', () => {
      expect(BRANDING_CONFIG.socialLinks).toBeDefined();
      expect(typeof BRANDING_CONFIG.socialLinks).toBe('object');
    });

    it('should have legal links object', () => {
      expect(BRANDING_CONFIG.legalLinks).toBeDefined();
      expect(typeof BRANDING_CONFIG.legalLinks).toBe('object');
    });
  });

  describe('AUTH_CONFIG', () => {
    it('should have auth provider defined', () => {
      expect(AUTH_CONFIG.provider).toBeDefined();
      expect(typeof AUTH_CONFIG.provider).toBe('string');
    });

    it('should have Clerk configuration', () => {
      expect(AUTH_CONFIG.clerk).toBeDefined();
      expect(AUTH_CONFIG.clerk).toHaveProperty('enabled');
      expect(AUTH_CONFIG.clerk).toHaveProperty('publishableKey');
      expect(AUTH_CONFIG.clerk).toHaveProperty('secretKey');
    });

    it('should have Clerk enabled property', () => {
      expect(typeof AUTH_CONFIG.clerk.enabled).toBe('boolean');
    });

    it('should have NextAuth configuration', () => {
      expect(AUTH_CONFIG.nextAuth).toBeDefined();
      expect(AUTH_CONFIG.nextAuth).toHaveProperty('enabled');
    });

    it('should have NextAuth disabled', () => {
      expect(AUTH_CONFIG.nextAuth.enabled).toBe(false);
    });

    it('should have auth protection setting', () => {
      expect(AUTH_CONFIG).toHaveProperty('enableAuthProtection');
      expect(typeof AUTH_CONFIG.enableAuthProtection).toBe('boolean');
    });

    it('should have dev impersonate user setting', () => {
      expect(AUTH_CONFIG).toHaveProperty('devImpersonateUser');
    });
  });

  describe('PAYMENT_CONFIG', () => {
    it('should have payment provider defined', () => {
      expect(PAYMENT_CONFIG.provider).toBeDefined();
      expect(typeof PAYMENT_CONFIG.provider).toBe('string');
    });

    it('should have Sepay as provider', () => {
      expect(PAYMENT_CONFIG.provider).toBe('sepay');
    });

    it('should have Sepay configuration', () => {
      expect(PAYMENT_CONFIG.sepay).toBeDefined();
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('enabled');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('merchantId');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('secretKey');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('apiUrl');
    });

    it('should have valid Sepay API URL', () => {
      expect(PAYMENT_CONFIG.sepay.apiUrl).toMatch(/^https?:\/\//);
    });

    it('should have Sepay bank account configuration', () => {
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('bankAccount');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('bankName');
    });

    it('should have Sepay webhook configuration', () => {
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('webhookUrl');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('returnUrl');
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('cancelUrl');
    });

    it('should have Sepay mock mode property', () => {
      expect(PAYMENT_CONFIG.sepay).toHaveProperty('mockMode');
      expect(typeof PAYMENT_CONFIG.sepay.mockMode).toBe('boolean');
    });

    it('should have Polar payment configuration', () => {
      expect(PAYMENT_CONFIG.polar).toBeDefined();
      expect(PAYMENT_CONFIG.polar).toHaveProperty('enabled');
      expect(PAYMENT_CONFIG.polar).toHaveProperty('accessToken');
    });

    it('should have valid currency', () => {
      expect(PAYMENT_CONFIG.currency).toBe('VND');
    });

    it('should have valid minimum amount', () => {
      expect(PAYMENT_CONFIG.minAmount).toBeGreaterThan(0);
      expect(typeof PAYMENT_CONFIG.minAmount).toBe('number');
    });
  });

  describe('FEATURE_FLAGS', () => {
    it('should have CLERK_AUTH flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('CLERK_AUTH');
      expect(typeof FEATURE_FLAGS.CLERK_AUTH).toBe('boolean');
    });

    it('should have Clerk auth flag', () => {
      expect(typeof FEATURE_FLAGS.CLERK_AUTH).toBe('boolean');
    });

    it('should have SEPAY_PAYMENT flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('SEPAY_PAYMENT');
      expect(typeof FEATURE_FLAGS.SEPAY_PAYMENT).toBe('boolean');
    });

    it('should have PHO_BRANDING flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('PHO_BRANDING');
      expect(typeof FEATURE_FLAGS.PHO_BRANDING).toBe('boolean');
    });

    it('should have pho.chat branding enabled', () => {
      expect(FEATURE_FLAGS.PHO_BRANDING).toBe(true);
    });

    it('should have COST_OPTIMIZATION flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('COST_OPTIMIZATION');
      expect(typeof FEATURE_FLAGS.COST_OPTIMIZATION).toBe('boolean');
    });

    it('should have USAGE_TRACKING flag', () => {
      expect(FEATURE_FLAGS).toHaveProperty('USAGE_TRACKING');
      expect(typeof FEATURE_FLAGS.USAGE_TRACKING).toBe('boolean');
    });
  });

  describe('validateCustomizationConfig', () => {
    it('should validate configuration without errors', () => {
      expect(() => validateCustomizationConfig()).not.toThrow();
    });

    it('should be a function', () => {
      expect(typeof validateCustomizationConfig).toBe('function');
    });
  });

  describe('Configuration Integration', () => {
    it('should have all required configuration objects', () => {
      expect(BRANDING_CONFIG).toBeDefined();
      expect(AUTH_CONFIG).toBeDefined();
      expect(PAYMENT_CONFIG).toBeDefined();
      expect(FEATURE_FLAGS).toBeDefined();
    });

    it('should have consistent feature flags with config', () => {
      expect(FEATURE_FLAGS.CLERK_AUTH).toBe(AUTH_CONFIG.clerk.enabled);
      expect(FEATURE_FLAGS.PHO_BRANDING).toBe(true);
    });

    it('should have valid configuration structure', () => {
      const config = {
        branding: BRANDING_CONFIG,
        auth: AUTH_CONFIG,
        payment: PAYMENT_CONFIG,
        flags: FEATURE_FLAGS,
      };

      expect(config).toBeDefined();
      expect(config.branding).toBeDefined();
      expect(config.auth).toBeDefined();
      expect(config.payment).toBeDefined();
      expect(config.flags).toBeDefined();
    });

    it('should have auth provider configuration', () => {
      expect(AUTH_CONFIG.clerk).toBeDefined();
      expect(AUTH_CONFIG.nextAuth).toBeDefined();
      expect(typeof AUTH_CONFIG.clerk.enabled).toBe('boolean');
      expect(typeof AUTH_CONFIG.nextAuth.enabled).toBe('boolean');
    });

    it('should have Sepay as payment provider', () => {
      expect(PAYMENT_CONFIG.provider).toBe('sepay');
      expect(PAYMENT_CONFIG.sepay).toBeDefined();
    });

    it('should have pho.chat branding', () => {
      expect(BRANDING_CONFIG.appName).toBe('pho.chat');
      expect(FEATURE_FLAGS.PHO_BRANDING).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should have valid email format for support', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(BRANDING_CONFIG.supportEmail).toMatch(emailRegex);
    });

    it('should have valid email format for business', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(BRANDING_CONFIG.businessEmail).toMatch(emailRegex);
    });

    it('should have valid website URL format', () => {
      expect(BRANDING_CONFIG.websiteUrl).toMatch(/^https?:\/\//);
    });

    it('should have valid API URL format', () => {
      expect(PAYMENT_CONFIG.sepay.apiUrl).toMatch(/^https?:\/\//);
    });

    it('should have positive minimum payment amount', () => {
      expect(PAYMENT_CONFIG.minAmount).toBeGreaterThan(0);
    });

    it('should have valid currency code', () => {
      expect(PAYMENT_CONFIG.currency).toMatch(/^[A-Z]{3}$/);
    });
  });
});

