/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { LobeChatPluginManifest } from '@lobehub/chat-plugin-sdk';
import { boolean, integer, jsonb, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

import { DEFAULT_PREFERENCE } from '@/const/user';
import { CustomPluginParams } from '@/types/tool/plugin';

import { timestamps, timestamptz } from './_helpers';

export const users = pgTable('users', {
  id: text('id').primaryKey().notNull(),
  username: text('username').unique(),
  email: text('email'),

  avatar: text('avatar'),
  phone: text('phone'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  fullName: text('full_name'),

  isOnboarded: boolean('is_onboarded').default(false),
  // Time user was created in Clerk
  clerkCreatedAt: timestamptz('clerk_created_at'),

  // Required by nextauth, all null allowed
  emailVerifiedAt: timestamptz('email_verified_at'),

  preference: jsonb('preference').$defaultFn(() => DEFAULT_PREFERENCE),

  // Phở Points System (from PRICING_MASTERPLAN)
  // phoPointsBalance: Monthly allowance of points based on plan
  // Default: 50,000 for vn_free tier
  phoPointsBalance: integer('pho_points_balance').default(50_000),
  pointsResetDate: timestamptz('points_reset_date'), // For monthly quota reset
  lifetimeSpent: integer('lifetime_spent').default(0),

  // Current subscription plan
  // vn_free | vn_basic | vn_pro | vn_team | gl_starter | gl_standard | gl_premium | gl_lifetime
  currentPlanId: text('current_plan_id').default('vn_free'),
  subscriptionStatus: text('subscription_status').default('FREE'), // FREE | ACTIVE | PAST_DUE | CANCELLED
  countryCode: text('country_code'), // 'VN' or others - for geo-fencing

  // Fair Usage Policy (FUP) - Daily tier limits
  dailyTier1Usage: integer('daily_tier1_usage').default(0),
  dailyTier2Usage: integer('daily_tier2_usage').default(0),
  dailyTier3Usage: integer('daily_tier3_usage').default(0),
  lastUsageDate: timestamptz('last_usage_date').defaultNow(),

  // Gamification - Daily streak
  streakCount: integer('streak_count').default(0),
  lastActiveDate: timestamptz('last_active_date'),

  ...timestamps,
});

export type NewUser = typeof users.$inferInsert;
export type UserItem = typeof users.$inferSelect;

export const userSettings = pgTable('user_settings', {
  id: text('id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),

  tts: jsonb('tts'),
  hotkey: jsonb('hotkey'),
  keyVaults: text('key_vaults'),
  general: jsonb('general'),
  languageModel: jsonb('language_model'),
  systemAgent: jsonb('system_agent'),
  defaultAgent: jsonb('default_agent'),
  tool: jsonb('tool'),
});
export type UserSettingsItem = typeof userSettings.$inferSelect;

export const userInstalledPlugins = pgTable(
  'user_installed_plugins',
  {
    userId: text('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),

    identifier: text('identifier').notNull(),
    type: text('type', { enum: ['plugin', 'customPlugin'] }).notNull(),
    manifest: jsonb('manifest').$type<LobeChatPluginManifest>(),
    settings: jsonb('settings'),
    customParams: jsonb('custom_params').$type<CustomPluginParams>(),

    ...timestamps,
  },
  (self) => ({
    id: primaryKey({ columns: [self.userId, self.identifier] }),
  }),
);

export type NewInstalledPlugin = typeof userInstalledPlugins.$inferInsert;
export type InstalledPluginItem = typeof userInstalledPlugins.$inferSelect;
