import { NextResponse } from 'next/server';

/**
 * POST /api/error-report
 *
 * Receives client-side error reports, deduplicates, and sends Telegram alerts
 * when error bursts are detected (>= 3 occurrences in 5 minutes).
 *
 * Rate limited to max 10 Telegram alerts per hour.
 * In-memory tracking — no database needed.
 */

const CHAT_ID = '748471251';
const BURST_THRESHOLD = 3;
const BURST_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ALERTS_PER_HOUR = 10;
const MAX_ENTRIES = 100;

type ErrorType = 'api_error' | 'js_error' | 'plugin_error';

interface ErrorEntry {
    count: number;
    firstSeen: number;
    lastMessage: string;
    lastStack?: string;
    lastUrl: string;
    notified: boolean;
}

// Module-level in-memory state (persists across requests within the same serverless instance)
const errorMap = new Map<string, ErrorEntry>();
let alertCount = 0;
let alertWindowStart = Date.now();

function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32-bit integer
    }
    return hash.toString(36);
}

function cleanup() {
    const now = Date.now();

    // Reset hourly alert counter
    if (now - alertWindowStart > 60 * 60 * 1000) {
        alertCount = 0;
        alertWindowStart = now;
    }

    // Remove stale entries
    for (const [key, entry] of errorMap) {
        if (now - entry.firstSeen > CLEANUP_INTERVAL_MS) {
            errorMap.delete(key);
        }
    }

    // Evict oldest if over max
    if (errorMap.size > MAX_ENTRIES) {
        const sorted = [...errorMap.entries()].sort((a, b) => a[1].firstSeen - b[1].firstSeen);
        const toRemove = sorted.slice(0, errorMap.size - MAX_ENTRIES);
        for (const [key] of toRemove) {
            errorMap.delete(key);
        }
    }
}

async function sendTelegramAlert(text: string) {
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
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
        console.error('[Error Report] Telegram send failed:', err);
    }
}

const VALID_TYPES = new Set<ErrorType>(['js_error', 'api_error', 'plugin_error']);

export async function POST(request: Request): Promise<NextResponse> {
    try {
        const body = await request.json();
        const { message, stack, type, url } = body as {
            message?: string;
            stack?: string;
            type?: string;
            url?: string;
        };

        if (!message || !type || !VALID_TYPES.has(type as ErrorType)) {
            return NextResponse.json({ status: 'ok' });
        }

        cleanup();

        const hash = simpleHash(`${type}:${message}`);
        const now = Date.now();

        const existing = errorMap.get(hash);
        if (existing) {
            // Check if within burst window
            if (now - existing.firstSeen > BURST_WINDOW_MS) {
                // Reset window
                errorMap.set(hash, {
                    count: 1,
                    firstSeen: now,
                    lastMessage: message,
                    lastStack: stack,
                    lastUrl: url || '',
                    notified: false,
                });
            } else {
                existing.count++;
                existing.lastMessage = message;
                existing.lastStack = stack;
                existing.lastUrl = url || '';
            }
        } else {
            errorMap.set(hash, {
                count: 1,
                firstSeen: now,
                lastMessage: message,
                lastStack: stack,
                lastUrl: url || '',
                notified: false,
            });
        }

        const entry = errorMap.get(hash)!;

        // Send Telegram alert on burst threshold
        if (entry.count >= BURST_THRESHOLD && !entry.notified && alertCount < MAX_ALERTS_PER_HOUR) {
            entry.notified = true;
            alertCount++;

            const minutes = Math.round((now - entry.firstSeen) / 60_000);
            const truncatedMessage = entry.lastMessage.slice(0, 200);
            const truncatedStack = entry.lastStack ? entry.lastStack.slice(0, 500) : 'N/A';

            const alertText = [
                `🔴 <b>CLIENT ERROR BURST</b>`,
                `Type: ${type}`,
                `Message: ${truncatedMessage}`,
                `URL: ${entry.lastUrl || 'N/A'}`,
                `Count: ${entry.count} in ${minutes || '<1'}min`,
                `<pre>${truncatedStack}</pre>`,
            ].join('\n');

            // Fire-and-forget
            sendTelegramAlert(alertText).catch(() => {});
        }

        return NextResponse.json({ status: 'ok' });
    } catch {
        return NextResponse.json({ status: 'ok' });
    }
}
