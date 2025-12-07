/**
 * Pricing Schema for Phở Chat
 * Based on PRICING_MASTERPLAN.md.md
 */
import { boolean, integer, pgTable, real, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';
import { users } from './user';

/**
 * Model Pricing Configuration
 * Allows dynamic cost changes without code deployment
 */
export const modelPricing = pgTable('model_pricing', {
  id: text('id').primaryKey(), 
  // Actual model ID sent to provider
// Points cost per 1M tokens (Phở Points system)
inputCostPer1M: real('input_cost_per_1m').notNull(), 

  
  
// Points per 1M output tokens
// Legacy VND pricing (kept for backward compatibility)
inputPrice: real('input_price').default(0), 
  


isActive: boolean('is_active').default(true), 

  
  
// e.g., 'gpt-4o', 'claude-3-opus'
modelId: text('model_id').unique().notNull(),
  // Points per 1M input tokens
outputCostPer1M: real('output_cost_per_1m').notNull(),
  outputPrice: real('output_price').default(0),

  
  perMsgFee: real('per_msg_fee').default(0),

  // Tier classification (1: Cheap, 2: Standard, 3: Expensive)
tier: integer('tier').default(1).notNull(),

  ...timestamps,
});

/**
 * Transactions - Unified for Sepay & Polar
 * Tracks all payment transactions
 */
export const transactions = pgTable('transactions', {
  amount: real('amount').notNull(),

  currency: varchar('currency', { length: 10 }).notNull(),

  id: text('id')
    .$defaultFn(() => `tx_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`)
    .primaryKey(),
  

// PENDING | COMPLETED | FAILED
// Metadata
metadata: text('metadata'), 

  
  




// Sepay transaction ID or Polar Order ID
// Plan information
planCode: varchar('plan_code', { length: 50 }), 
  






// vn_basic, vn_pro, gl_standard, etc.
pointsGranted: integer('points_granted').default(0), 

  
  





// 'VND' or 'USD'
// Payment provider info
provider: varchar('provider', { length: 20 }).notNull(), 
  




// 'SEPAY' or 'POLAR'
providerTxId: text('provider_tx_id'), 

  


// Points added to user wallet
status: varchar('status', { length: 20 }).notNull().default('PENDING'), 

  
  
userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(), // JSON string for additional data

  ...timestamps,
});

/**
 * Daily Usage Tracking
 * For enforcing daily tier limits
 */
export const dailyUsage = pgTable('daily_usage', {
  date: varchar('date', { length: 10 }).notNull(),

  id: text('id')
    .$defaultFn(() => `daily_${Date.now()}`)
    .primaryKey(),

  

// Points used today
pointsUsed: integer('points_used').default(0), 

  
  
// Format: YYYY-MM-DD
// Daily tier usage counts
tier1Messages: integer('tier1_messages').default(0),
  
tier2Messages: integer('tier2_messages').default(0),
  
tier3Messages: integer('tier3_messages').default(0),

  
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  ...timestamps,
});

// Export types
export type ModelPricing = typeof modelPricing.$inferSelect;
export type NewModelPricing = typeof modelPricing.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type DailyUsage = typeof dailyUsage.$inferSelect;
export type NewDailyUsage = typeof dailyUsage.$inferInsert;
