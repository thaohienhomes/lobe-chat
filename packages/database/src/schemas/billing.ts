/* eslint-disable sort-keys-fix/sort-keys-fix */
import { boolean, integer, jsonb, pgTable, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core';

import { timestamps, timestamptz } from './_helpers';
import { users } from './user';

export const sepayPayments = pgTable(
  'sepay_payments',
  {
    id: text('id')
      .$defaultFn(() => `sepay_${Date.now()}`)
      .primaryKey(),

    orderId: text('order_id').notNull(),
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    planId: varchar('plan_id', { length: 50 }).notNull(),
    billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // 'monthly' | 'yearly'

    amountVnd: integer('amount_vnd').notNull(),
    currency: varchar('currency', { length: 10 }).notNull(), // e.g., 'VND'

    status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending'|'success'|'failed'
    paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('sepay'),

    transactionId: text('transaction_id'),
    maskedCardNumber: text('masked_card_number'), // e.g., '****-****-****-0366' for credit card payments

    rawWebhook: jsonb('raw_webhook'),
    metadata: jsonb('metadata'),

    ...timestamps,
  },
  (self) => ({
    orderIdUnique: uniqueIndex('sepay_payments_order_id_key').on(self.orderId),
  }),
);

export type NewSepayPayment = typeof sepayPayments.$inferInsert;
export type SepayPaymentItem = typeof sepayPayments.$inferSelect;

export const subscriptions = pgTable('subscriptions', {
  id: text('id')
    .$defaultFn(() => `sub_${Date.now()}`)
    .primaryKey(),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  planId: varchar('plan_id', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active'|'canceled'|'past_due'
  billingCycle: varchar('billing_cycle', { length: 20 }).notNull(),

  currentPeriodStart: timestamptz('current_period_start').notNull().defaultNow(),
  currentPeriodEnd: timestamptz('current_period_end').notNull(),

  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  paymentProvider: varchar('payment_provider', { length: 20 }).notNull().default('sepay'),

  ...timestamps,
});

export type NewSubscription = typeof subscriptions.$inferInsert;
export type SubscriptionItem = typeof subscriptions.$inferSelect;
