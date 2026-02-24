import { sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

/**
 * GET /api/cron/error-monitor
 *
 * Lightweight error monitoring cron job.
 * Checks for critical anomalies in the last hour and sends Telegram alerts.
 *
 * Designed to be called by Vercel Cron every hour:
 * vercel.json: { "crons": [{ "path": "/api/cron/error-monitor", "schedule": "0 * * * *" }] }
 *
 * Protected by CRON_SECRET to prevent unauthorized access.
 */

const CRON_SECRET = process.env.CRON_SECRET;

async function sendTelegramAlert(text: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = '748471251';

    if (!BOT_TOKEN) return;

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            body: JSON.stringify({
                chat_id: CHAT_ID,
                parse_mode: 'HTML',
                text,
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    } catch (err) {
        console.error('[Error Monitor] Telegram send failed:', err);
    }
}

export async function GET(request: Request): Promise<NextResponse> {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const db = await getServerDB();
        const alerts: string[] = [];
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        // 1. Check for negative Phở Points balances
        const { users } = await import('@/database/schemas');
        const { lt, count } = await import('drizzle-orm');

        const negativeBalances = await db
            .select({ count: count() })
            .from(users)
            .where(lt(users.phoPointsBalance, 0));

        const negativeCount = negativeBalances[0]?.count || 0;
        if (negativeCount > 0) {
            alerts.push(`🔴 ${negativeCount} user(s) with NEGATIVE Phở Points balance`);
        }

        // 2. Check for stuck pending payments (>1 hour)
        try {
            const { sepayPayments } = await import('@/database/schemas');
            const { eq, and, lt: ltOp } = await import('drizzle-orm');
            const stuckPayments = await db
                .select({ count: count() })
                .from(sepayPayments)
                .where(and(
                    eq(sepayPayments.status, 'pending'),
                    ltOp(sepayPayments.createdAt, oneHourAgo),
                ));

            const stuckCount = stuckPayments[0]?.count || 0;
            if (stuckCount > 0) {
                alerts.push(`🟡 ${stuckCount} stuck pending payment(s) (>1 hour)`);
            }
        } catch {
            // sepayPayments table may not exist yet
        }

        // 3. Check for desynced plans (user has plan but no active subscription)
        try {
            const { subscriptions } = await import('@/database/schemas/billing');
            const desyncCheck = await db.execute(sql`
                SELECT COUNT(*) as count FROM users u
                WHERE u.current_plan_id IS NOT NULL
                AND u.current_plan_id NOT IN ('free', 'vn_free', 'gl_starter', 'trial')
                AND NOT EXISTS (
                    SELECT 1 FROM subscriptions s
                    WHERE s.user_id = u.id AND s.status = 'active'
                )
            `);
            const desyncCount = (desyncCheck as any)?.[0]?.count || 0;
            if (desyncCount > 0) {
                alerts.push(`🟠 ${desyncCount} user(s) with plan but no active subscription`);
            }
        } catch {
            // subscriptions table may not exist yet
        }

        // Send alert if issues found
        if (alerts.length > 0) {
            const message = [
                '<b>⚠️ Phở Chat Error Monitor</b>',
                '',
                ...alerts,
                '',
                `<i>${new Date().toISOString()}</i>`,
            ].join('\n');

            await sendTelegramAlert(message);
        }

        return NextResponse.json({
            alertCount: alerts.length,
            alerts,
            checkedAt: new Date().toISOString(),
            status: alerts.length > 0 ? 'issues_found' : 'healthy',
        });
    } catch (error) {
        console.error('[Error Monitor] Failed:', error);

        // Alert about monitor failure
        await sendTelegramAlert(
            `<b>🔴 Error Monitor FAILED</b>\n${error instanceof Error ? error.message : 'Unknown error'}`,
        );

        return NextResponse.json(
            { error: 'Monitor check failed', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 },
        );
    }
}
