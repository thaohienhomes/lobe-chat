import { and, eq, lte, ne, desc, lt } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { sepayPayments, users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

// Helper function to send Telegram messages
async function sendTelegramMessage(text: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = '748471251'; // Admin chat ID obtained from previous interactions

    if (!BOT_TOKEN) {
        console.error('[Anomaly Radar Cron] TELEGRAM_BOT_TOKEN missing');
        return;
    }

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            body: JSON.stringify({
                chat_id: CHAT_ID,
                parse_mode: 'HTML',
                text: text
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    } catch (err) {
        console.error('[Anomaly Radar Cron] Fetch error:', err);
    }
}

export async function GET() {
    // You might want to verify cron secret here if accessing from Vercel
    // Check for authorization header if needed

    try {
        const db = await getServerDB();

        // 1. Detect Desync: Users on paid plans but stuck with 'FREE' status.
        const subscriptionAnomalies = await db
            .select()
            .from(users)
            .where(
                and(
                    ne(users.currentPlanId, 'vn_free'),
                    ne(users.currentPlanId, 'gl_starter'),
                    eq(users.subscriptionStatus, 'FREE')
                )
            );

        // 2. Negative Balance Anomalies
        const negativePointsAnomalies = await db
            .select()
            .from(users)
            .where(lt(users.phoPointsBalance, 0));

        // 3. Stuck Pending Payments (Older than 2 hours)
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
        const stuckPayments = await db
            .select()
            .from(sepayPayments)
            .where(
                and(
                    eq(sepayPayments.status, 'pending'),
                    lte(sepayPayments.createdAt, twoHoursAgo)
                )
            )
            .orderBy(desc(sepayPayments.createdAt))
            .limit(20);

        if (subscriptionAnomalies.length > 0) {
            let msg = `🚨 <b>ANOMALY RADAR ALERT</b> 🚨\n\n`;
            msg += `Found <b>${subscriptionAnomalies.length}</b> Subscription Desyncs (Paid plan but FREE status).\n`;

            // List a few
            for (const anomaly of subscriptionAnomalies.slice(0, 5)) {
                msg += `- <code>${anomaly.email || anomaly.id}</code> (Plan: ${anomaly.currentPlanId})\n`;
            }
            if (subscriptionAnomalies.length > 5) msg += `...and ${subscriptionAnomalies.length - 5} more.\n`;

            msg += `\nReply with "Fix sync [email]" to auto-resolve.`;
            await sendTelegramMessage(msg);
        }

        if (negativePointsAnomalies.length > 0) {
            let msg = `⚠️ <b>ANOMALY RADAR ALERT</b> ⚠️\n\n`;
            msg += `Found <b>${negativePointsAnomalies.length}</b> Negative Points Balances.\n`;

            for (const anomaly of negativePointsAnomalies.slice(0, 5)) {
                msg += `- <code>${anomaly.email || anomaly.id}</code> (Balance: ${anomaly.phoPointsBalance})\n`;
            }
            await sendTelegramMessage(msg);
        }

        if (stuckPayments.length > 0) {
            let msg = `⏳ <b>STUCK PAYMENTS ALERT</b> ⏳\n\n`;
            msg += `Found <b>${stuckPayments.length}</b> Sepay transactions stuck in 'pending' for >2 hours.\n`;

            for (const payment of stuckPayments.slice(0, 5)) {
                msg += `- Order: <code>${payment.orderId}</code> (${payment.amountVnd?.toLocaleString()} VND)\n`;
            }
            if (stuckPayments.length > 5) msg += `...and ${stuckPayments.length - 5} more.\n`;
            await sendTelegramMessage(msg);
        }

        // We report success to the cron runner
        return NextResponse.json({
            desyncs: subscriptionAnomalies.length,
            negativePoints: negativePointsAnomalies.length,
            status: 'ok',
            stuckPayments: stuckPayments.length
        });

    } catch (e) {
        console.error('[Anomaly Radar Cron] Error:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
