/**
 * Rate Limiter Utility
 *
 * In-memory rate limiting with IP-based tracking.
 * Suitable for Vercel serverless (per-instance limiting).
 * For stricter global limiting, upgrade to Upstash Redis.
 *
 * Usage:
 *   import { rateLimiter } from '@/utils/rate-limiter';
 *   const result = rateLimiter.check('plugin-name', clientIp, { maxRequests: 30, windowMs: 60000 });
 *   if (!result.allowed) return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

interface RateLimitOptions {
    /** Maximum requests allowed in the window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
}

interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
}

// Store: Map<"namespace:ip", RateLimitEntry>
const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;
    lastCleanup = now;

    for (const [key, entry] of store) {
        if (entry.resetAt < now) {
            store.delete(key);
        }
    }
}

export const rateLimiter = {
    /**
     * Check if a request is allowed under rate limits
     */
    check(namespace: string, ip: string, options: RateLimitOptions): RateLimitResult {
        cleanup();

        const key = `${namespace}:${ip}`;
        const now = Date.now();
        const entry = store.get(key);

        // No entry or window expired → allow and reset
        if (!entry || entry.resetAt < now) {
            store.set(key, { count: 1, resetAt: now + options.windowMs });
            return { allowed: true, remaining: options.maxRequests - 1, resetAt: now + options.windowMs };
        }

        // Within window → increment
        entry.count++;

        if (entry.count > options.maxRequests) {
            return { allowed: false, remaining: 0, resetAt: entry.resetAt };
        }

        return { allowed: true, remaining: options.maxRequests - entry.count, resetAt: entry.resetAt };
    },
};

/**
 * Default rate limit configs per plugin type
 */
export const RATE_LIMITS = {
    /** External API calls (PubMed, OpenAlex, ClinicalTrials, CrossRef) */
    external: { maxRequests: 30, windowMs: 60 * 1000 },
    /** Local computation (clinical calculators) */
    local: { maxRequests: 60, windowMs: 60 * 1000 },
    /** Batch operations (citation export) */
    batch: { maxRequests: 10, windowMs: 60 * 1000 },
} as const;

/**
 * Extract client IP from NextRequest
 */
export function getClientIp(request: Request): string {
    const headers = request.headers;
    // Vercel/Cloudflare/standard headers
    return (
        headers.get('x-real-ip') ||
        headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        headers.get('cf-connecting-ip') ||
        '127.0.0.1'
    );
}

/**
 * Sanitize string input — prevent injection and limit length
 */
export function sanitizeInput(input: unknown, maxLength: number = 500): string {
    if (typeof input !== 'string') return '';
    return input
        .trim()
        .slice(0, maxLength)
        .replace(/[<>]/g, ''); // Strip HTML tags
}

/**
 * Validate and clamp a numeric input
 */
export function sanitizeNumber(input: unknown, min: number, max: number, defaultVal: number): number {
    const num = Number(input);
    if (isNaN(num)) return defaultVal;
    return Math.min(Math.max(num, min), max);
}
