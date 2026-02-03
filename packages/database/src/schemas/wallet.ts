/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Phở Wallet Schema
 * Central bank for the Phở ecosystem (Phở Chat + Phở Studio)
 *
 * Tier Access Rules:
 * - 'free', 'vn_basic': Chat only, NO studio access
 * - 'vn_creator', 'vn_pro', 'global_standard': Full studio access
 */
import { integer, pgTable, text } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';

// Valid tier codes for the wallet
export const WALLET_TIER_CODES = [
    'free',
    'vn_basic',
    'vn_creator',
    'vn_pro',
    'global_standard',
] as const;

export type WalletTierCode = (typeof WALLET_TIER_CODES)[number];

// Tiers that are BLOCKED from studio_gen service
export const STUDIO_BLOCKED_TIERS: WalletTierCode[] = ['free', 'vn_basic'];

// pho_wallet - Central bank for Phở ecosystem
export const phoWallet = pgTable('pho_wallet', {
    // Primary key is the Clerk user ID
    clerkUserId: text('clerk_user_id').primaryKey().notNull(),

    // Credit balance (integer, atomic operations)
    balance: integer('balance').default(0).notNull(),

    // Tier code determines service access levels
    tierCode: text('tier_code').default('free').notNull(),

    ...timestamps,
});

export type NewPhoWallet = typeof phoWallet.$inferInsert;
export type PhoWalletItem = typeof phoWallet.$inferSelect;
