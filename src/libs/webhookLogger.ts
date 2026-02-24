import { webhookLogs } from '@/database/schemas';
import { getServerDB } from '@/database/server';

export interface WebhookLogEntry {
    provider: 'sepay' | 'polar';
    eventType: string;
    status: 'received' | 'success' | 'error' | 'ignored';
    orderId?: string;
    userId?: string;
    amountUsd?: string;
    payload?: Record<string, any>;
    errorMessage?: string;
}

/**
 * Logs an incoming webhook event to the database for admin visibility.
 * Non-blocking — errors are swallowed to not interrupt the webhook processing.
 */
export async function logWebhookEvent(entry: WebhookLogEntry): Promise<void> {
    try {
        const db = await getServerDB();
        await db.insert(webhookLogs).values({
            amountUsd: entry.amountUsd,
            errorMessage: entry.errorMessage,
            eventType: entry.eventType,
            orderId: entry.orderId,
            payload: entry.payload,
            provider: entry.provider,
            status: entry.status,
            userId: entry.userId,
        });
    } catch (err) {
        // Non-fatal: don't let logging failures break webhook processing
        console.error('[WebhookLogger] Failed to log event:', err);
    }
}
