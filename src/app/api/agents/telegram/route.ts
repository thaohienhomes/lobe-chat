import { count, eq, gt, lt, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const SYSTEM_PROMPT = `
You are an AI assistant for the Phở Platform admin (Mission Control).
Your job is to parse natural language commands from the admin via Telegram.
You must output ONLY raw JSON, with no markdown formatting or extra text.
Available actions:
- check_user_status: When the admin wants to look up a user by email or id. Requires "email" or "id" field.
- sync_subscription: When the admin wants to force fix/sync a user's subscription. Requires "email" or "id" field.
- error_summary: When the admin wants to see recent error/anomaly summary. No parameters needed.
- health_check: When the admin wants to check overall system health status. No parameters needed.
- unknown: When the request does not match available commands. Include a "reply" field with a conversational response asking for clarification.

Example input: "Check user hung@gmail.com"
Example output: {"action": "check_user_status", "email": "hung@gmail.com"}

Example input: "Fix sync for user 12345"
Example output: {"action": "sync_subscription", "id": "12345"}

Example input: "error summary"
Example output: {"action": "error_summary"}

Example input: "health check"
Example output: {"action": "health_check"}
`;

async function sendTelegramMessage(chatId: string | number, text: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    if (!BOT_TOKEN) return;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try {
        await fetch(url, {
            body: JSON.stringify({
                chat_id: chatId,
                parse_mode: 'HTML',
                text: text // Allow code block formatting
            }),
            headers: { 'Content-Type': 'application/json' },
            method: 'POST',
        });
    } catch (err) {
        console.error('[Telegram Ops] Fetch error:', err);
    }
}

async function parseIntentWithLLM(text: string) {
    // Use Vercel AI Gateway which acts as an OpenAI-compatible proxy to all models
    const apiKey = process.env.VERCELAIGATEWAY_API_KEY;
    const apiUrl = 'https://ai-gateway.vercel.sh/v1';

    if (!apiKey) {
        console.error('[Telegram Ops] VERCELAIGATEWAY_API_KEY is not set');
        return null;
    }

    try {
        const response = await fetch(`${apiUrl}/chat/completions`, {
            body: JSON.stringify({
                // Format: provider/model 
                messages: [
                    { content: SYSTEM_PROMPT, role: 'system' },
                    { content: text, role: 'user' }
                ],
                model: 'google/gemini-2.0-flash'
            }),
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            method: 'POST'
        });

        if (!response.ok) {
            console.error('[Telegram Ops] Vercel AI Gateway Error:', await response.text());
            return null;
        }

        const data = await response.json();
        const resultText = data.choices[0]?.message?.content;

        // Safety parse if the model wraps it in markdown blocks
        const cleanJson = resultText.replaceAll('```json', '').replaceAll('```', '').trim();
        return JSON.parse(cleanJson);
    } catch (err) {
        console.error('[Telegram Ops] Intent Parsing Failed:', err);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body.message;

        if (!message || !message.text) {
            return NextResponse.json({ status: 'ok' });
        }

        const chatId = message.chat.id;
        const text = message.text;

        console.log(`[Telegram Ops] Command from ${chatId}: ${text}`);

        if (text.startsWith('/ping')) {
            await sendTelegramMessage(chatId, '🏓 Pong! PhoPlatform Guard Bot is online.');
            return NextResponse.json({ status: 'ok' });
        }

        // Call LLM to parse intent
        await sendTelegramMessage(chatId, '⚙️ Parsing command...');
        const parsedIntent = await parseIntentWithLLM(text);

        if (!parsedIntent) {
            await sendTelegramMessage(chatId, '❌ Failed to parse command. Please try again.');
            return NextResponse.json({ status: 'ok' });
        }

        switch (parsedIntent.action) {
            case 'unknown': {
                await sendTelegramMessage(chatId, parsedIntent.reply || 'I am not sure how to help with that.');

                break;
            }
            case 'check_user_status': {
                const identifier = parsedIntent.email || parsedIntent.id;
                if (!identifier) {
                    await sendTelegramMessage(chatId, '❌ Please provide an email or user ID to check.');
                } else {
                    await sendTelegramMessage(chatId, `🔍 Searching DB for <b>${identifier}</b>...`);
                    const db = await getServerDB();
                    let userRecord;
                    if (identifier.includes('@')) {
                        const [u] = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
                        userRecord = u;
                    } else {
                        const [u] = await db.select().from(users).where(eq(users.id, identifier)).limit(1);
                        userRecord = u;
                    }

                    if (!userRecord) {
                        await sendTelegramMessage(chatId, `❌ User <b>${identifier}</b> not found in Neon DB.`);
                    } else {
                        const reply = `👤 <b>USER FOUND</b>
ID: <code>${userRecord.id}</code>
Name: <b>${userRecord.fullName || 'N/A'}</b>
Email: ${userRecord.email || 'N/A'}
Plan: <b>${userRecord.currentPlanId}</b>
Status: <b>${userRecord.subscriptionStatus}</b>
Phở Points: <code>${userRecord.phoPointsBalance?.toLocaleString() || 0}</code>
`;
                        await sendTelegramMessage(chatId, reply);
                    }
                }

                break;
            }
            case 'sync_subscription': {
                const identifier = parsedIntent.email || parsedIntent.id;
                if (!identifier) {
                    await sendTelegramMessage(chatId, '❌ Please provide an email or user ID to sync.');
                } else {
                    await sendTelegramMessage(chatId, `⚙️ Executing Sync action for <b>${identifier}</b>...`);
                    const db = await getServerDB();
                    let userRecords = [];
                    if (identifier.includes('@')) {
                        userRecords = await db.select().from(users).where(eq(users.email, identifier));
                    } else {
                        userRecords = await db.select().from(users).where(eq(users.id, identifier));
                    }

                    if (userRecords.length === 0) {
                        await sendTelegramMessage(chatId, `❌ User <b>${identifier}</b> not found in Neon DB.`);
                    } else {
                        const now = new Date();
                        const pointsResetDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

                        for (const record of userRecords) {
                            // Force the subscription status to ACTIVE and upgrade to Medical Beta
                            await db.update(users)
                                .set({
                                    currentPlanId: 'medical_beta',
                                    phoPointsBalance: Math.max(record.phoPointsBalance || 0, 500_000),
                                    pointsResetDate: pointsResetDate,
                                    subscriptionStatus: 'ACTIVE'
                                })
                                .where(eq(users.id, record.id));
                        }

                        await sendTelegramMessage(chatId, `✅ <b>SYNC HOTFIX APPLIED (${userRecords.length} records)</b>
Target: <b>${identifier}</b>
Action: Upgraded to <b>Medical Beta</b> & Status set to <b>ACTIVE</b>.
The user's Phở Points balance has also been topped up. They now have full access.`);
                    }
                }

                break;
            }
            case 'error_summary': {
                await sendTelegramMessage(chatId, '🔍 Running error checks...');
                const db = await getServerDB();
                const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                const checks: string[] = [];

                // Negative balances
                const negBal = await db.select({ count: count() }).from(users).where(lt(users.phoPointsBalance, 0));
                const negCount = negBal[0]?.count || 0;
                checks.push(negCount > 0 ? `🔴 ${negCount} negative balance(s)` : '✅ No negative balances');

                // Stuck payments
                try {
                    const { sepayPayments } = await import('@/database/schemas');
                    const { and } = await import('drizzle-orm');
                    const stuck = await db.select({ count: count() }).from(sepayPayments)
                        .where(and(eq(sepayPayments.status, 'pending'), lt(sepayPayments.createdAt, oneHourAgo)));
                    const stuckCount = stuck[0]?.count || 0;
                    checks.push(stuckCount > 0 ? `🟡 ${stuckCount} stuck payment(s)` : '✅ No stuck payments');
                } catch { checks.push('⚪ Payments table N/A'); }

                // API errors
                try {
                    const { usageLogs } = await import('@/database/schemas');
                    const { and, isNotNull } = await import('drizzle-orm');
                    const errs = await db.select({ count: count() }).from(usageLogs)
                        .where(and(gt(usageLogs.createdAt, oneHourAgo), isNotNull(sql`${usageLogs.metadata}->>'errorCode'`)));
                    const errCount = errs[0]?.count || 0;
                    checks.push(errCount > 0 ? `🔴 ${errCount} API error(s) (1h)` : '✅ No API errors');
                } catch { checks.push('⚪ Usage logs N/A'); }

                // Slow responses
                try {
                    const { usageLogs } = await import('@/database/schemas');
                    const { and, isNotNull } = await import('drizzle-orm');
                    const slow = await db.select({ avgMs: sql<number>`AVG(${usageLogs.responseTimeMs})` }).from(usageLogs)
                        .where(and(gt(usageLogs.createdAt, oneHourAgo), isNotNull(usageLogs.responseTimeMs)));
                    const avgMs = slow[0]?.avgMs || 0;
                    checks.push(avgMs > 10_000 ? `🟡 Slow avg: ${Math.round(avgMs)}ms` : `✅ Avg response: ${Math.round(avgMs)}ms`);
                } catch { checks.push('⚪ Response times N/A'); }

                const summary = [`<b>📊 Error Summary</b>`, '', ...checks, '', `<i>${new Date().toISOString()}</i>`].join('\n');
                await sendTelegramMessage(chatId, summary);
                break;
            }
            case 'health_check': {
                await sendTelegramMessage(chatId, '🏥 Running health checks...');
                const results: string[] = [];

                // DB check
                try {
                    const db = await getServerDB();
                    await db.execute(sql`SELECT 1`);
                    const userCount = await db.select({ count: count() }).from(users);
                    results.push(`✅ DB: OK (${userCount[0]?.count || 0} users)`);
                } catch {
                    results.push('❌ DB: FAILED');
                }

                // Telegram Bot check
                try {
                    const botToken = process.env.TELEGRAM_BOT_TOKEN;
                    const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
                    const data = await res.json();
                    results.push(data.ok ? `✅ Bot: @${data.result.username}` : '❌ Bot: FAILED');
                } catch {
                    results.push('❌ Bot: FAILED');
                }

                // AI Gateway check
                try {
                    const aiKey = process.env.VERCELAIGATEWAY_API_KEY;
                    if (aiKey) {
                        const res = await fetch('https://ai-gateway.vercel.sh/v1/models', {
                            headers: { 'Authorization': `Bearer ${aiKey}` },
                        });
                        results.push(res.ok ? '✅ AI Gateway: OK' : `⚠️ AI Gateway: ${res.status}`);
                    } else {
                        results.push('⚪ AI Gateway: No key');
                    }
                } catch {
                    results.push('❌ AI Gateway: FAILED');
                }

                const reply = [`<b>🏥 Health Check</b>`, '', ...results, '', `<i>${new Date().toISOString()}</i>`].join('\n');
                await sendTelegramMessage(chatId, reply);
                break;
            }
            default: {
                // Just dumping the parsed intent for now (Step 2)
                await sendTelegramMessage(chatId, `🧠 Intent Parsed:\n<pre><code class="language-json">${JSON.stringify(parsedIntent, null, 2)}</code></pre>`);
                // In Step 3 & 4 we will actually execute these intents against the DB
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('[Telegram Webhook] Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
