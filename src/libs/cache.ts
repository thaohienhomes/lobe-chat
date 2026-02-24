/**
 * Upstash Redis Cache Helper
 *
 * Provides a simple caching layer for expensive DB queries.
 * Uses Upstash Redis if UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set.
 * Falls back to in-memory Map cache if Redis is not configured.
 *
 * Usage:
 *   const data = await cachedQuery('key', 300, () => db.select(...));
 */

interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

// In-memory fallback cache
const memCache = new Map<string, CacheEntry<any>>();

function getFromMemCache<T>(key: string): T | null {
    const entry = memCache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        memCache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setInMemCache<T>(key: string, data: T, ttlSeconds: number): void {
    memCache.set(key, {
        data,
        expiresAt: Date.now() + (ttlSeconds * 1000),
    });

    // Evict old entries if cache exceeds 200 items
    if (memCache.size > 200) {
        const now = Date.now();
        for (const [k, v] of memCache.entries()) {
            if (now > v.expiresAt) memCache.delete(k);
        }
    }
}

/**
 * Check if Upstash Redis is configured
 */
function isRedisConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Get a value from Upstash Redis
 */
async function getFromRedis<T>(key: string): Promise<T | null> {
    try {
        const resp = await fetch(
            `${process.env.UPSTASH_REDIS_REST_URL}/get/${key}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                },
            },
        );
        const json = await resp.json();
        if (json.result) {
            return JSON.parse(json.result) as T;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * Set a value in Upstash Redis with TTL
 */
async function setInRedis<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    try {
        await fetch(
            `${process.env.UPSTASH_REDIS_REST_URL}/set/${key}/${JSON.stringify(data)}/ex/${ttlSeconds}`,
            {
                headers: {
                    Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                },
                method: 'POST',
            },
        );
    } catch {
        // Silently fail - cache is best-effort
    }
}

/**
 * Execute a query with caching.
 * Uses Upstash Redis if configured, otherwise falls back to in-memory cache.
 *
 * @param key   - Unique cache key
 * @param ttl   - Time-to-live in seconds
 * @param query - Async function that returns the data
 */
export async function cachedQuery<T>(
    key: string,
    ttl: number,
    query: () => Promise<T>,
): Promise<T> {
    const cacheKey = `pho:${key}`;

    // Try Redis first
    if (isRedisConfigured()) {
        const cached = await getFromRedis<T>(cacheKey);
        if (cached !== null) return cached;

        const result = await query();
        // Don't await the cache write — fire-and-forget
        setInRedis(cacheKey, result, ttl);
        return result;
    }

    // Fallback to in-memory
    const cached = getFromMemCache<T>(cacheKey);
    if (cached !== null) return cached;

    const result = await query();
    setInMemCache(cacheKey, result, ttl);
    return result;
}

/**
 * Invalidate a specific cache key (both Redis and in-memory)
 */
export async function invalidateCache(key: string): Promise<void> {
    const cacheKey = `pho:${key}`;
    memCache.delete(cacheKey);

    if (isRedisConfigured()) {
        try {
            await fetch(
                `${process.env.UPSTASH_REDIS_REST_URL}/del/${cacheKey}`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
                    },
                    method: 'POST',
                },
            );
        } catch {
            // Silent fail
        }
    }
}
