/**
 * Admin: Rate Limit Overview
 *
 * GET /api/admin/rate-limits/overview
 *
 * Scans ALL Upstash Redis keys for today's date and returns:
 * - Total messages per tier
 * - Top users by usage
 * - Number of unique users with activity
 *
 * Requires: ADMIN_USER_ID + UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 */
import { NextResponse } from 'next/server';

import { requireAdmin } from '../../_shared/auth';

// ── Upstash REST helpers ──────────────────────────────────────────────────────

function redisHeaders() {
    return {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

const BASE_URL = () => process.env.UPSTASH_REDIS_REST_URL ?? '';

/** SCAN all keys matching a pattern */
async function scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';
    do {
        const resp = await fetch(
            `${BASE_URL()}/scan/${cursor}?match=${encodeURIComponent(pattern)}&count=200`,
            { headers: redisHeaders() },
        );
        const data = await resp.json() as { result: [string, string[]] };
        const [nextCursor, batch] = data.result;
        cursor = nextCursor;
        keys.push(...(batch ?? []));
    } while (cursor !== '0');
    return keys;
}

/** Get multiple values via pipeline MGET */
async function mget(keys: string[]): Promise<(number | null)[]> {
    if (keys.length === 0) return [];
    // Upstash REST: GET /mget/key1/key2/...
    const resp = await fetch(
        `${BASE_URL()}/mget/${keys.map((k) => encodeURIComponent(k)).join('/')}`,
        { headers: redisHeaders() },
    );
    const data = await resp.json() as { result: (string | null)[] };
    return (data.result ?? []).map((v) => (v != null ? Number(v) : null));
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface TierSummary {
    activeUsers: number;
    totalMessages: number;
}

interface TopUser {
    tier: number;
    total: number;
    userId: string;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function GET() {
    const denied = await requireAdmin();
    if (denied) return denied;

    if (!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)) {
        return NextResponse.json(
            { error: 'Redis not configured', redisAvailable: false },
            { status: 503 },
        );
    }

    const today = new Date().toISOString().slice(0, 10);
    const pattern = `pho:ratelimit:*:tier*:${today}`;

    // 1. Scan all keys for today
    const keys = await scanKeys(pattern);

    if (keys.length === 0) {
        return NextResponse.json({
            date: today,
            redisAvailable: true,
            tierSummary: {} as Record<number, TierSummary>,
            topUsers: [] as TopUser[],
            totalKeys: 0,
            totalMessages: 0,
            uniqueUsers: 0,
        });
    }

    // 2. Batch-fetch all values
    const values = await mget(keys);

    // 3. Aggregate
    // Key format: pho:ratelimit:{userId}:tier{n}:{date}
    const tierSummary: Record<number, TierSummary> = {};
    // userId -> { tier -> count }
    const userTierMap: Record<string, Record<number, number>> = {};
    let totalMessages = 0;

    for (const [i, key] of keys.entries()) {
        const count = values[i] ?? 0;
        if (count === 0) continue;

        // Parse key
        const parts = key.split(':');
        // parts: ["pho", "ratelimit", userId, "tier{n}", date]
        const userId = parts[2] ?? 'unknown';
        const tierPart = parts[3] ?? 'tier0';
        const tier = parseInt(tierPart.replace('tier', ''), 10);

        // Tier summary
        if (!tierSummary[tier]) tierSummary[tier] = { activeUsers: 0, totalMessages: 0 };
        tierSummary[tier].totalMessages += count;
        tierSummary[tier].activeUsers++; // one entry per user per tier

        // User map
        if (!userTierMap[userId]) userTierMap[userId] = {};
        userTierMap[userId][tier] = (userTierMap[userId][tier] ?? 0) + count;

        totalMessages += count;
    }

    // 4. Top 10 users by total messages
    const topUsers: TopUser[] = Object.entries(userTierMap)
        .map(([userId, tiers]) => {
            const total = Object.values(tiers).reduce((a, b) => a + b, 0);
            const topTier = Object.entries(tiers).sort(([, a], [, b]) => b - a)[0];
            return { tier: topTier ? Number(topTier[0]) : 0, total, userId };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

    return NextResponse.json({
        date: today,
        redisAvailable: true,
        tierSummary,
        topUsers,
        totalKeys: keys.length,
        totalMessages,
        uniqueUsers: Object.keys(userTierMap).length,
    });
}
