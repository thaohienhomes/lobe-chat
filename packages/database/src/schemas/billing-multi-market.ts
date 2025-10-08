/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Multi-Market Billing Schema for pho.chat
 * Supports multiple currencies, payment gateways, and PPP pricing
 */

import { boolean, integer, jsonb, pgTable, real, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';
import { timestamps, timestamptz } from './_helpers';
import { users } from './user';

/**
 * Unified payments table - supports all payment gateways
 * Replaces sepayPayments with a more flexible structure
 */
export const payments = pgTable(
  'payments',
  {
    id: text('id')
      .$defaultFn(() => `pay_${Date.now()}`)
      .primaryKey(),

    // Order tracking
    orderId: text('order_id').notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    // Subscription details
    planId: varchar('plan_id', { length: 50 }).notNull(),
    billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // 'monthly' | 'yearly'

    // Multi-currency support
    amount: real('amount').notNull(), // Store as decimal for precision
    currency: varchar('currency', { length: 10 }).notNull(), // 'VND', 'USD', 'EUR', 'INR', etc.
    amountUsd: real('amount_usd').notNull(), // Always store USD equivalent for analytics

    // Payment gateway
    paymentProvider: varchar('payment_provider', { length: 30 }).notNull(), // 'sepay', 'stripe', 'razorpay', 'paypal', 'paddle'
    paymentMethod: varchar('payment_method', { length: 30 }), // 'card', 'bank_transfer', 'upi', 'wallet', etc.

    // Payment status
    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending'|'processing'|'success'|'failed'|'refunded'

    // Transaction tracking
    transactionId: text('transaction_id'), // Gateway's transaction ID
    externalId: text('external_id'), // Gateway's payment intent/session ID (Stripe, etc.)

    // Geo and pricing context
    countryCode: varchar('country_code', { length: 2 }), // ISO 3166-1 alpha-2 (VN, US, IN, etc.)
    pppMultiplier: real('ppp_multiplier'), // PPP adjustment factor (0.5 - 2.0)

    // Customer info
    customerEmail: varchar('customer_email', { length: 255 }),
    customerName: varchar('customer_name', { length: 255 }),
    customerPhone: varchar('customer_phone', { length: 50 }),

    // Metadata
    rawWebhook: jsonb('raw_webhook'), // Store raw webhook data for debugging
    metadata: jsonb('metadata'), // Additional flexible data

    // Timestamps
    paidAt: timestamptz('paid_at'), // When payment was completed
    refundedAt: timestamptz('refunded_at'), // When payment was refunded
    ...timestamps,
  },
  (self) => ({
    orderIdUnique: uniqueIndex('payments_order_id_key').on(self.orderId),
    userIdIdx: uniqueIndex('payments_user_id_idx').on(self.userId),
    statusIdx: uniqueIndex('payments_status_idx').on(self.status),
  }),
);

export type NewPayment = typeof payments.$inferInsert;
export type PaymentItem = typeof payments.$inferSelect;

/**
 * Subscriptions table - enhanced with multi-market support
 */
export const subscriptionsMultiMarket = pgTable('subscriptions_multi_market', {
  id: text('id')
    .$defaultFn(() => `sub_${Date.now()}`)
    .primaryKey(),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  // Plan details
  planId: varchar('plan_id', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active'|'canceled'|'past_due'|'paused'
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(),

  // Billing period
  currentPeriodStart: timestamptz('current_period_start').notNull().defaultNow(),
  currentPeriodEnd: timestamptz('current_period_end').notNull(),

  // Payment details
  paymentProvider: varchar('payment_provider', { length: 30 }).notNull(), // 'sepay', 'stripe', etc.
  currency: varchar('currency', { length: 10 }).notNull(), // User's billing currency
  amount: real('amount').notNull(), // Amount in user's currency
  amountUsd: real('amount_usd').notNull(), // USD equivalent

  // Geo context
  countryCode: varchar('country_code', { length: 2 }), // User's country
  pppMultiplier: real('ppp_multiplier'), // PPP adjustment applied

  // Subscription management
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamptz('canceled_at'),
  pausedAt: timestamptz('paused_at'),

  // External IDs for gateway integration
  externalSubscriptionId: text('external_subscription_id'), // Stripe subscription ID, etc.
  externalCustomerId: text('external_customer_id'), // Stripe customer ID, etc.

  // Metadata
  metadata: jsonb('metadata'),

  ...timestamps,
});

export type NewSubscriptionMultiMarket = typeof subscriptionsMultiMarket.$inferInsert;
export type SubscriptionMultiMarketItem = typeof subscriptionsMultiMarket.$inferSelect;

/**
 * PPP Pricing table - stores country-specific pricing
 */
export const pppPricing = pgTable('ppp_pricing', {
  id: text('id')
    .$defaultFn(() => `ppp_${Date.now()}`)
    .primaryKey(),

  // Country and currency
  countryCode: varchar('country_code', { length: 2 }).notNull(), // ISO 3166-1 alpha-2
  countryName: varchar('country_name', { length: 100 }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(), // Local currency code

  // PPP adjustment
  pppMultiplier: real('ppp_multiplier').notNull(), // 0.5 - 2.0 (relative to USD)
  gdpPerCapita: real('gdp_per_capita'), // For reference
  purchasingPowerIndex: real('purchasing_power_index'), // Numbeo index

  // Plan pricing in local currency
  starterMonthly: real('starter_monthly').notNull(),
  starterYearly: real('starter_yearly').notNull(),
  premiumMonthly: real('premium_monthly').notNull(),
  premiumYearly: real('premium_yearly').notNull(),
  ultimateMonthly: real('ultimate_monthly').notNull(),
  ultimateYearly: real('ultimate_yearly').notNull(),

  // USD equivalents (for analytics)
  starterMonthlyUsd: real('starter_monthly_usd').notNull(),
  premiumMonthlyUsd: real('premium_monthly_usd').notNull(),
  ultimateMonthlyUsd: real('ultimate_monthly_usd').notNull(),

  // Payment methods available in this country
  availablePaymentMethods: jsonb('available_payment_methods').$type<string[]>(), // ['card', 'bank_transfer', 'upi']
  preferredPaymentGateway: varchar('preferred_payment_gateway', { length: 30 }), // 'stripe', 'sepay', etc.

  // Status
  isActive: boolean('is_active').default(true),
  effectiveFrom: timestamptz('effective_from').notNull().defaultNow(),
  effectiveTo: timestamptz('effective_to'),

  ...timestamps,
});

export type NewPppPricing = typeof pppPricing.$inferInsert;
export type PppPricingItem = typeof pppPricing.$inferSelect;

/**
 * Payment gateway configurations
 */
export const paymentGatewayConfigs = pgTable('payment_gateway_configs', {
  id: text('id')
    .$defaultFn(() => `gateway_${Date.now()}`)
    .primaryKey(),

  // Gateway details
  provider: varchar('provider', { length: 30 }).notNull(), // 'stripe', 'sepay', 'razorpay', etc.
  name: varchar('name', { length: 100 }).notNull(),
  isActive: boolean('is_active').default(true),

  // Supported features
  supportedCurrencies: jsonb('supported_currencies').$type<string[]>(), // ['USD', 'EUR', 'VND']
  supportedCountries: jsonb('supported_countries').$type<string[]>(), // ['US', 'VN', 'IN']
  supportedPaymentMethods: jsonb('supported_payment_methods').$type<string[]>(), // ['card', 'bank_transfer']

  // Configuration (encrypted in production)
  config: jsonb('config'), // API keys, webhook secrets, etc.

  // Fees and costs
  transactionFeePercent: real('transaction_fee_percent'), // Gateway's fee (e.g., 2.9%)
  transactionFeeFixed: real('transaction_fee_fixed'), // Fixed fee per transaction
  currency: varchar('currency', { length: 10 }), // Currency for fixed fee

  // Priority and routing
  priority: integer('priority').default(0), // Higher priority = preferred gateway
  minAmount: real('min_amount'), // Minimum transaction amount
  maxAmount: real('max_amount'), // Maximum transaction amount

  ...timestamps,
});

export type NewPaymentGatewayConfig = typeof paymentGatewayConfigs.$inferInsert;
export type PaymentGatewayConfigItem = typeof paymentGatewayConfigs.$inferSelect;

