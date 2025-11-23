import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { boolean, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const sharedConversations = pgTable('shared_conversations', {
  id: text('id').primaryKey().notNull(),
  userId: text('user_id'),
  
  // Metadata
  title: text('title').notNull(),
  description: text('description'),
  avatar: text('avatar'),
  backgroundColor: text('background_color'),
  tags: jsonb('tags').$type<string[]>(),
  
  // Agent configuration
  systemRole: text('system_role'),
  model: text('model'),
  provider: text('provider'),
  params: jsonb('params'),
  chatConfig: jsonb('chat_config'),
  
  // Messages (full conversation history)
  messages: jsonb('messages').notNull().$type<any[]>(),
  
  // Stats
  isPublic: boolean('is_public').default(true),
  viewCount: integer('view_count').default(0),
  forkCount: integer('fork_count').default(0),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  accessedAt: timestamp('accessed_at').defaultNow(),
});

export type SharedConversation = InferSelectModel<typeof sharedConversations>;
export type NewSharedConversation = InferInsertModel<typeof sharedConversations>;

