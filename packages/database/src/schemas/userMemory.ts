/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { timestamps, timestamptz } from './_helpers';
import { topics } from './topic';
import { users } from './user';

/**
 * User Memory Categories
 */
export const MEMORY_CATEGORIES = [
  'preference', // User preferences (likes/dislikes)
  'fact', // Personal facts (name, location, job)
  'interest', // Topics of interest
  'communication_style', // How user prefers to communicate
  'goal', // User's goals and objectives
  'context', // General context about user
] as const;

export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

/**
 * User Memories Table Schema
 * Stores persistent memories about users across chat sessions
 */
export const userMemories = pgTable('user_memories', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),

  userId: text('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),

  // Memory content and categorization
  category: text('category', { enum: MEMORY_CATEGORIES }).notNull().default('context'),
  content: text('content').notNull(),

  // Source tracking for debugging and transparency
  sourceTopicId: text('source_topic_id').references(() => topics.id, { onDelete: 'set null' }),
  sourceMessageId: text('source_message_id'),

  // Priority and usage tracking
  importance: integer('importance').notNull().default(5),
  usageCount: integer('usage_count').default(0),
  lastUsedAt: timestamptz('last_used_at'),

  ...timestamps,
});

// Type exports
export type NewUserMemory = typeof userMemories.$inferInsert;
export type UserMemoryItem = typeof userMemories.$inferSelect;

// Zod schemas for validation
export const insertUserMemorySchema = createInsertSchema(userMemories);
export const selectUserMemorySchema = createSelectSchema(userMemories);
