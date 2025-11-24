/* eslint-disable sort-keys-fix/sort-keys-fix */
import {
  boolean,
  decimal,
  integer,
  jsonb,
  pgTable,
  text,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';

/**
 * PPP (Purchasing Power Parity) Pricing Table
 * Stores country-specific pricing data for multi-market billing
 */
export const pppPricing = pgTable(
  'ppp_pricing',
  {
    id: text('id')
      .$defaultFn(() => `ppp_${Date.now()}`)
      .primaryKey(),

    countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
    countryName: varchar('country_name', { length: 100 }).notNull(),
    currency: varchar('currency', { length: 3 }).notNull(), // ISO 4217

    pppMultiplier: decimal('ppp_multiplier', { precision: 5, scale: 3 }).notNull(), // e.g., 0.350 for India

    // Pricing for each plan in local currency
    starterMonthly: integer('starter_monthly').notNull(),
    starterYearly: integer('starter_yearly').notNull(),
    starterMonthlyUsd: decimal('starter_monthly_usd', { precision: 8, scale: 2 }).notNull(),

    premiumMonthly: integer('premium_monthly').notNull(),
    premiumYearly: integer('premium_yearly').notNull(),
    premiumMonthlyUsd: decimal('premium_monthly_usd', { precision: 8, scale: 2 }).notNull(),

    ultimateMonthly: integer('ultimate_monthly').notNull(),
    ultimateYearly: integer('ultimate_yearly').notNull(),
    ultimateMonthlyUsd: decimal('ultimate_monthly_usd', { precision: 8, scale: 2 }).notNull(),

    // Payment gateway preferences
    preferredPaymentGateway: varchar('preferred_payment_gateway', { length: 20 }).notNull(), // 'stripe', 'sepay', 'razorpay'
    availablePaymentMethods: jsonb('available_payment_methods').notNull(), // ['card', 'bank_transfer', 'upi']

    isActive: boolean('is_active').default(true),

    ...timestamps,
  },
  (self) => ({
    countryCodeUnique: uniqueIndex('ppp_pricing_country_code_key').on(self.countryCode),
  }),
);

export type NewPppPricing = typeof pppPricing.$inferInsert;
export type PppPricingItem = typeof pppPricing.$inferSelect;

/**
 * Payment Gateway Configurations
 * Stores configuration for different payment gateways by country/region
 */
export const paymentGatewayConfigs = pgTable(
  'payment_gateway_configs',
  {
    id: text('id')
      .$defaultFn(() => `pgc_${Date.now()}`)
      .primaryKey(),

    gatewayName: varchar('gateway_name', { length: 50 }).notNull(), // 'stripe', 'sepay', 'razorpay'
    countryCode: varchar('country_code', { length: 2 }).notNull(),

    isEnabled: boolean('is_enabled').default(true),
    priority: integer('priority').default(1), // Lower number = higher priority

    // Gateway-specific configuration
    config: jsonb('config').notNull(), // API keys, webhook URLs, etc.

    // Fee structure
    fixedFee: decimal('fixed_fee', { precision: 8, scale: 2 }).default('0'),
    percentageFee: decimal('percentage_fee', { precision: 5, scale: 3 }).default('0'),

    ...timestamps,
  },
  (self) => ({
    gatewayCountryUnique: uniqueIndex('payment_gateway_configs_gateway_country_key').on(
      self.gatewayName,
      self.countryCode,
    ),
  }),
);

export type NewPaymentGatewayConfig = typeof paymentGatewayConfigs.$inferInsert;
export type PaymentGatewayConfigItem = typeof paymentGatewayConfigs.$inferSelect;
