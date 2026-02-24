/* eslint-disable sort-keys-fix/sort-keys-fix */
import { jsonb, pgTable, text, varchar } from 'drizzle-orm/pg-core';

import { timestamps } from './_helpers';
import { users } from './user';

export const supportTickets = pgTable('support_tickets', {
    id: text('id')
        .$defaultFn(() => `ticket_${Date.now()}`)
        .primaryKey(),
    userId: text('user_id')
        .references(() => users.id, { onDelete: 'set null' }),

    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 20 }).notNull().default('open'), // open | in_progress | resolved | closed
    priority: varchar('priority', { length: 20 }).notNull().default('medium'), // low | medium | high | urgent

    source: varchar('source', { length: 20 }).notNull().default('voice'), // voice | chat | manual

    transcript: text('transcript'), // Full conversational transcript if from voice
    metadata: jsonb('metadata'), // Any extra context (Vapi session id, technical logs)

    ...timestamps,
});

export type NewSupportTicket = typeof supportTickets.$inferInsert;
export type SupportTicketItem = typeof supportTickets.$inferSelect;
