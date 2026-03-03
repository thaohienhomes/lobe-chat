/**
 * Admin: Rate Limit Inspector & Reset
 *
 * GET  /api/admin/rate-limits/[userId]        — view current daily counters
 * DELETE /api/admin/rate-limits/[userId]      — reset all daily counters
 * DELETE /api/admin/rate-limits/[userId]?tier=2  — reset a specific tier
 *
 * Requires: ADMIN_USER_ID env var + logged-in admin session.
 * Requires: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 */
import { NextRequest, NextResponse } from 'next/server';

import { requireAdmin } from '../../_shared/auth';

// ── Upstash REST helpers ──────────────────────────────────────────────────────

function redisHeaders() {
    return {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
    };
}

const BASE_URL = () => process.env.UPSTASH_REDIS_REST_URL ?? '';

/** Execute a raw Upstash pipeline (array of commands) */
async function redisPipeline(commands: unknown[][]): Promise<unknown[]> {
    const resp = await fetch(`${BASE_URL()}/pipeline`, {
        body: JSON.stringify(commands),
        headers: redisHeaders(),
        method: 'POST',
    });
    const data = await resp.json();
    return Array.isArray(data) ? data.map((d: { result: unknown }) => d.result) : [];
}

/** SCAN for keys matching a pattern (handles cursor pagination) */
async function scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    do {
        const resp = await fetch(`${BASE_URL()}/scan/${cursor}?match=${pattern}&count=100`, {
            headers: redisHeaders(),
        });
        const data = await resp.json();
        // Upstash returns: { result: [nextCursor, [keys...]] }
        const [nextCursor, batch] = data.result as [string, string[]];
        cursor = nextCursor;
        keys.push(...(batch ?? []));
    } while (cursor !== '0');

    return keys;
}

/** GET the value of a single key (returns number or null) */
async function redisGet(key: string): Promise<number | null> {
    const resp = await fetch(`${BASE_URL()}/get/${key}`, {
        headers: redisHeaders(),
    });
    const data = await resp.json();
    return data.result != null ? Number(data.result) : null;
}

/** TTL for a key (seconds remaining) */
async function redisTTL(key: string): Promise<number> {
    const resp = await fetch(`${BASE_URL()}/ttl/${key}`, {
        headers: redisHeaders(),
    });
    const data = await resp.json();
    return Number(data.result ?? -1);
}

/** DELETE one or more keys */
async function redisDel(keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    const resp = await fetch(`${BASE_URL()}/del/${keys.join('/')}`, {
        headers: redisHeaders(),
        method: 'GET', // Upstash DEL via GET path syntax
    });
    const data = await resp.json();
    return Number(data.result ?? 0);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRedisConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/** UTC date string for today */
function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

/** Parse tier query param → number | null */
function parseTier(searchParams: URLSearchParams): number | null {
    const t = searchParams.get('tier');
    if (!t) return null;
    const n = parseInt(t, 10);
    return Number.isFinite(n) ? n : null;
}

// ── Route handlers ────────────────────────────────────────────────────────────

/**
 * GET /api/admin/rate-limits/[userId]
 *
 * Returns all daily rate limit counters for the user across all tiers.
 *
 * Response shape:
 * {
 *   userId: string,
 *   date: "2026-03-03",
 *   redisAvailable: boolean,
 *   counters: [
 *     { key: "pho:ratelimit:...:tier2:2026-03-03", tier: 2, count: 5, ttlSeconds: 36000 },
 *     ...
 *   ]
 * }
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    const denied = await requireAdmin();
    if (denied) return denied;

    if (!isRedisConfigured()) {
        return NextResponse.json(
            { error: 'Redis not configured (UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN missing)', redisAvailable: false },
            { status: 503 },
        );
    }

    const { userId } = await params;
    const keyPattern = `pho:ratelimit:${userId}:tier*`;
    const keys = await scanKeys(keyPattern);

    const counters = await Promise.all(
        keys.map(async (key) => {
            const [count, ttl] = await Promise.all([redisGet(key), redisTTL(key)]);
            // key format: pho:ratelimit:{userId}:tier{n}:{date}
            const parts = key.split(':');
            const tierPart = parts.find((p) => p.startsWith('tier'));
            const tier = tierPart ? parseInt(tierPart.replace('tier', ''), 10) : null;
            const date = parts.at(-1) ?? null;
            return { count: count ?? 0, date, key, tier, ttlSeconds: ttl };
        }),
    );

    // Sort by tier then date desc
    counters.sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0) || (b.date ?? '').localeCompare(a.date ?? ''));

    return NextResponse.json({
        counters,
        date: todayKey(),
        keyPattern,
        redisAvailable: true,
        totalKeys: keys.length,
        userId,
    });
}

/**
 * DELETE /api/admin/rate-limits/[userId]
 *        ?tier=2            → reset only tier 2 for today
 *        (no params)        → reset ALL tiers for ALL days
 *
 * Response shape:
 * { userId, deleted: number, keys: string[] }
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    const denied = await requireAdmin();
    if (denied) return denied;

    if (!isRedisConfigured()) {
        return NextResponse.json(
            { error: 'Redis not configured', redisAvailable: false },
            { status: 503 },
        );
    }

    const { userId } = await params;
    const tier = parseTier(req.nextUrl.searchParams);

    // Build scan pattern
    const pattern = tier
        ? `pho:ratelimit:${userId}:tier${tier}:*`
        : `pho:ratelimit:${userId}:tier*`;

    const keys = await scanKeys(pattern);

    if (keys.length === 0) {
        return NextResponse.json({ deleted: 0, keys: [], message: 'No keys found', userId });
    }

    const deleted = await redisDel(keys);

    return NextResponse.json({
        deleted,
        keys,
        message: `Deleted ${deleted} rate limit key(s) for user ${userId}${tier ? ` (tier ${tier} only)` : ''}`,
        userId,
    });
}
