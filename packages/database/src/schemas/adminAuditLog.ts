import { jsonb, pgTable, text, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './user';

export const adminAuditLogs = pgTable('admin_audit_logs', {
    id: text('id')
        .$defaultFn(() => `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`)
        .primaryKey(),

    // Who performed the action
    adminId: text('admin_id')
        .references(() => users.id, { onDelete: 'cascade' })
        .notNull(),

    // What kind of action
    action: varchar('action', { length: 100 }).notNull(), // e.g., 'TOPUP_POINTS', 'CHANGE_PLAN', 'UPDATE_PROVIDER_BALANCE'

    // Who or what was affected
    targetId: text('target_id'), // e.g., userId being modified, or providerId
    targetType: varchar('target_type', { length: 50 }), // e.g., 'user', 'provider'

    // Details of the change
    details: jsonb('details').$type<{
        previousValue?: any;
        newValue?: any;
        reason?: string;
        amount?: number;
        [key: string]: any;
    }>(),

    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AdminAuditLog = typeof adminAuditLogs.$inferSelect;
export type NewAdminAuditLog = typeof adminAuditLogs.$inferInsert;
