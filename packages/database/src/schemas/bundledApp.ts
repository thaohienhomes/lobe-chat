/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { boolean, jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

import { LobeAgentChatConfig, LobeAgentConfig } from '@/types/agent';

import { timestamps } from './_helpers';

/**
 * Bundled Apps table - Pre-configured prompt templates for community sharing
 * Similar to Google AI Studio's bundled apps (e.g., https://aistudio.google.com/apps/bundled/personalized_comics)
 *
 * These are system-wide templates that users can instantly use without configuration.
 * Examples: artifact-creator, code-reviewer, content-writer, etc.
 */
export const bundledApps = pgTable('bundled_apps', {
  /**
   * Unique identifier for the bundled app (used in URL)
   * Format: kebab-case (e.g., 'artifact-creator', 'code-reviewer')
   * This will be used in URLs like: https://pho.chat/apps/bundled/artifact-creator
   */
  id: varchar('id', { length: 100 }).primaryKey(),

  /**
   * Display title of the bundled app
   */
  title: varchar('title', { length: 255 }).notNull(),

  /**
   * Detailed description of what this bundled app does
   */
  description: text('description'),

  /**
   * Avatar URL for the bundled app
   */
  avatar: text('avatar'),

  /**
   * Background color for the app card (hex color)
   */
  backgroundColor: text('background_color'),

  /**
   * Tags for categorization and search
   */
  tags: jsonb('tags').$type<string[]>().default([]),

  /**
   * System role/prompt for the agent
   * This is the core instruction that defines the agent's behavior
   */
  systemRole: text('system_role').notNull(),

  /**
   * Agent configuration (model, params, plugins, etc.)
   * Stores the complete LobeAgentConfig
   */
  config: jsonb('config').$type<Partial<LobeAgentConfig>>(),

  /**
   * Chat-specific configuration
   */
  chatConfig: jsonb('chat_config').$type<Partial<LobeAgentChatConfig>>(),

  /**
   * Opening message shown when user starts using this app
   */
  openingMessage: text('opening_message'),

  /**
   * Suggested opening questions to help users get started
   */
  openingQuestions: jsonb('opening_questions').$type<string[]>(),

  /**
   * Whether this bundled app is publicly visible
   */
  isPublic: boolean('is_public').default(true),

  /**
   * Whether this bundled app is featured (shown prominently)
   */
  isFeatured: boolean('is_featured').default(false),

  /**
   * Category for organization (e.g., 'productivity', 'creative', 'development')
   */
  category: varchar('category', { length: 50 }),

  /**
   * Usage count for analytics
   */
  usageCount: jsonb('usage_count').$type<number>().default(0),

  /**
   * Timestamps for creation and updates
   */
  ...timestamps,
});

export const insertBundledAppSchema = createInsertSchema(bundledApps);

export type NewBundledApp = typeof bundledApps.$inferInsert;
export type BundledAppItem = typeof bundledApps.$inferSelect;
