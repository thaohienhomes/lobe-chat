import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';

// Stores a log entry for every incoming webhook from Sepay or Polar.
// Used by the Admin Webhooks page for real-time payment debugging.
export const webhookLogs = pgTable('webhook_logs', {
    id: text('id')
        .$defaultFn(() => `wh_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`)
        .primaryKey(),

    provider: varchar('provider', { length: 20 }).notNull(), // 'sepay' | 'polar'
    eventType: varchar('event_type', { length: 100 }).notNull(), // e.g. 'payment.success', 'subscription.created'
    status: varchar('status', { length: 20 }).notNull().default('received'), // 'received' | 'success' | 'error' | 'ignored'

    // Key identifiers for linking back to payments
    orderId: text('order_id'),       // Sepay order_id or Polar checkout_id
    userId: text('user_id'),         // resolved user ID if known
    amountUsd: text('amount_usd'),   // stored as string to avoid precision issues

    // Full payload stored for debugging
    payload: jsonb('payload'),
    // Error message if processing failed
    errorMessage: text('error_message'),

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type WebhookLog = typeof webhookLogs.$inferSelect;
export type NewWebhookLog = typeof webhookLogs.$inferInsert;
