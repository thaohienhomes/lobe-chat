/* eslint-disable sort-keys-fix/sort-keys-fix  */
import { integer, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { createdAt, timestamptz, updatedAt } from './_helpers';
import { users } from './user';

export const openclawBots = pgTable('openclaw_bots', {
  id: text('id')
    .$defaultFn(() => `ocbot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`)
    .primaryKey(),

  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),

  botToken: text('bot_token').notNull(),
  botUsername: varchar('bot_username', { length: 256 }),
  botName: varchar('bot_name', { length: 256 }),

  status: varchar('status', { length: 20 }).notNull().default('active'), // 'active' | 'paused' | 'error'
  channelType: varchar('channel_type', { length: 20 }).notNull().default('telegram'),

  systemPrompt: text('system_prompt'),

  messageCount: integer('message_count').notNull().default(0),
  dailyMessageCount: integer('daily_message_count').notNull().default(0),
  dailyResetAt: timestamptz('daily_reset_at'),

  webhookSecret: varchar('webhook_secret', { length: 64 }),

  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type OpenclawBot = typeof openclawBots.$inferSelect;
export type NewOpenclawBot = typeof openclawBots.$inferInsert;
