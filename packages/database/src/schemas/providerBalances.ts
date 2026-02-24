import { pgTable, real, text, varchar } from 'drizzle-orm/pg-core';
import { timestamps } from './_helpers';

export const providerBalances = pgTable('provider_balances', {
    providerId: varchar('provider_id', { length: 50 }).notNull().primaryKey(),
    prepaidBalanceUsd: real('prepaid_balance_usd').notNull().default(0),
    alertThresholdUsd: real('alert_threshold_usd').notNull().default(5),
    notes: text('notes'),
    ...timestamps,
});

export type ProviderBalance = typeof providerBalances.$inferSelect;
export type NewProviderBalance = typeof providerBalances.$inferInsert;
