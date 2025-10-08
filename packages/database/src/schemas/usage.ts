import { boolean, integer, jsonb, pgTable, primaryKey, real, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';
import { timestamps } from './_helpers';

/**
 * Usage logs table for tracking AI model usage and costs
 */
export const usageLogs = pgTable('usage_logs', {
  id: text('id')
    .$defaultFn(() => `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    .primaryKey(),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  sessionId: text('session_id'),

  // Model information
  model: varchar('model', { length: 100 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),

  // Token usage
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens')
    .$defaultFn(() => 0), // Will be calculated as inputTokens + outputTokens

  // Cost tracking
  costUSD: real('cost_usd').notNull(),
  costVND: real('cost_vnd').notNull(),

  // Query metadata
  queryComplexity: varchar('query_complexity', { length: 20 }), // 'simple', 'medium', 'complex'
  queryCategory: varchar('query_category', { length: 50 }), // 'chat', 'code', 'translation', etc.

  // Performance metrics
  responseTimeMs: integer('response_time_ms'),

  // Additional metadata
  metadata: jsonb('metadata').$type<{
    userAgent?: string;
    ipAddress?: string;
    features?: string[]; // ['streaming', 'function_calling', 'vision']
    errorCode?: string;
  }>(),

  ...timestamps,
});

/**
 * Monthly usage summary for efficient budget tracking
 */
export const monthlyUsageSummary = pgTable(
  'monthly_usage_summary',
  {
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    month: varchar('month', { length: 7 }).notNull(), // Format: YYYY-MM

    // Aggregated usage
    totalQueries: integer('total_queries').default(0),
    totalTokens: integer('total_tokens').default(0),
    totalCostUSD: real('total_cost_usd').default(0),
    totalCostVND: real('total_cost_vnd').default(0),

    // Breakdown by complexity
    simpleQueries: integer('simple_queries').default(0),
    mediumQueries: integer('medium_queries').default(0),
    complexQueries: integer('complex_queries').default(0),

    // Breakdown by model tier
    cheapModelUsage: real('cheap_model_usage').default(0), // VND
    midTierModelUsage: real('mid_tier_model_usage').default(0), // VND
    premiumModelUsage: real('premium_model_usage').default(0), // VND

    // Budget tracking
    subscriptionTier: varchar('subscription_tier', { length: 20 }), // 'starter', 'premium', 'ultimate'
    budgetLimitVND: real('budget_limit_vnd'),
    budgetUsedVND: real('budget_used_vnd').default(0),
    budgetRemainingVND: real('budget_remaining_vnd'),

    // Warnings and alerts
    budgetWarningsSent: integer('budget_warnings_sent').default(0),
    lastWarningAt: timestamp('last_warning_at'),

    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.month] }),
  })
);

/**
 * Cost optimization settings per user
 */
export const userCostSettings = pgTable('user_cost_settings', {
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),

  // Budget preferences
  monthlyBudgetVND: real('monthly_budget_vnd').default(39000), // Default to starter tier (39,000 VND - updated 2025-01-08)
  dailyBudgetVND: real('daily_budget_vnd'),

  // Model preferences
  preferredModels: jsonb('preferred_models').$type<string[]>(),
  blockedModels: jsonb('blocked_models').$type<string[]>(),

  // Cost optimization settings
  enableCostOptimization: boolean('enable_cost_optimization').default(true),
  maxCostPerQueryVND: real('max_cost_per_query_vnd').default(100), // ~$0.004 USD

  // Alert preferences
  enableBudgetAlerts: boolean('enable_budget_alerts').default(true),
  budgetAlertThresholds: jsonb('budget_alert_thresholds').$type<{
    warning: number; // percentage (e.g., 75)
    critical: number; // percentage (e.g., 90)
    emergency: number; // percentage (e.g., 95)
  }>().default({ warning: 75, critical: 90, emergency: 95 }),

  // Notification preferences
  emailAlerts: boolean('email_alerts').default(true),
  inAppAlerts: boolean('in_app_alerts').default(true),

  ...timestamps,
});

/**
 * Provider cost tracking for admin analytics
 */
export const providerCosts = pgTable('provider_costs', {
  id: text('id')
    .$defaultFn(() => `provider_cost_${Date.now()}`)
    .primaryKey(),

  provider: varchar('provider', { length: 50 }).notNull(),
  model: varchar('model', { length: 100 }).notNull(),

  // Cost per 1K tokens in USD
  inputCostPer1K: real('input_cost_per_1k').notNull(),
  outputCostPer1K: real('output_cost_per_1k').notNull(),

  // Effective date range
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),

  // Additional metadata
  currency: varchar('currency', { length: 3 }).default('USD'),
  notes: text('notes'),

  ...timestamps,
});

// Export types
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;

export type MonthlyUsageSummary = typeof monthlyUsageSummary.$inferSelect;
export type NewMonthlyUsageSummary = typeof monthlyUsageSummary.$inferInsert;

export type UserCostSettings = typeof userCostSettings.$inferSelect;
export type NewUserCostSettings = typeof userCostSettings.$inferInsert;

export type ProviderCost = typeof providerCosts.$inferSelect;
export type NewProviderCost = typeof providerCosts.$inferInsert;
