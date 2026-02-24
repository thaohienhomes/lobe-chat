/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Referral Conversions Schema
 * Tracks when a user signs up via a referral link.
 */
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const referralConversions = pgTable('referral_conversions', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    // The user who shared the referral link
    referrerClerkId: text('referrer_clerk_id').notNull(),

    // The user who signed up via the link
    referredClerkId: text('referred_clerk_id').notNull(),

    // The referral code used (for attribution)
    referralCode: text('referral_code').notNull(),

    // Whether bonus points have been awarded
    bonusAwarded: boolean('bonus_awarded').default(false).notNull(),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type NewReferralConversion = typeof referralConversions.$inferInsert;
export type ReferralConversionItem = typeof referralConversions.$inferSelect;
