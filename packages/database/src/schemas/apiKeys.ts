/* eslint-disable sort-keys-fix/sort-keys-fix */
/**
 * Phở API Keys Schema
 * Stores hashed API keys for the public REST API.
 * Raw keys are NEVER stored — only shown once at creation time.
 */
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const phoApiKeys = pgTable('pho_api_keys', {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),

    // Owner of this key (Clerk User ID)
    clerkUserId: text('clerk_user_id').notNull(),

    // Human-readable label set by user (e.g., "My Python Script")
    label: text('label').default('Default').notNull(),

    // SHA-256 hash of the full key — used for lookup
    keyHash: text('key_hash').notNull().unique(),

    // First 8 chars of the key for display (e.g., "pho_a1b2...")
    keyPrefix: text('key_prefix').notNull(),

    // Key management
    isActive: boolean('is_active').default(true).notNull(),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type NewPhoApiKey = typeof phoApiKeys.$inferInsert;
export type PhoApiKeyItem = typeof phoApiKeys.$inferSelect;

