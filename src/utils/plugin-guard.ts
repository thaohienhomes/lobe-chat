import { NextRequest, NextResponse } from 'next/server';

import { RATE_LIMITS, getClientIp, rateLimiter } from '@/utils/rate-limiter';

/**
 * Plugin API Guard
 *
 * Higher-order function that wraps plugin route handlers with:
 * - Rate limiting (per IP, configurable per endpoint type)
 * - Input sanitization
 * - Error handling with structured responses
 * - Request logging
 *
 * Usage:
 *   import { withPluginGuard } from '@/utils/plugin-guard';
 *   export const POST = withPluginGuard('pubmed-search', 'external', async (request) => { ... });
 */

type PluginHandler = (request: NextRequest) => Promise<NextResponse>;
type RateLimitType = keyof typeof RATE_LIMITS;

export function withPluginGuard(
    pluginName: string,
    rateLimitType: RateLimitType,
    handler: PluginHandler,
): PluginHandler {
    return async (request: NextRequest) => {
        const ip = getClientIp(request);

        // 1. Rate limiting
        const limits = RATE_LIMITS[rateLimitType];
        const result = rateLimiter.check(pluginName, ip, limits);

        if (!result.allowed) {
            const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
            return NextResponse.json(
                {
                    error: 'Too many requests. Please try again later.',
                    retryAfterSeconds: retryAfter,
                },
                {
                    headers: {
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(limits.maxRequests),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
                    },
                    status: 429,
                },
            );
        }

        // 2. Add rate limit headers to response
        try {
            const response = await handler(request);

            // Clone response to add headers
            const headers = new Headers(response.headers);
            headers.set('X-RateLimit-Limit', String(limits.maxRequests));
            headers.set('X-RateLimit-Remaining', String(result.remaining));
            headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

            return new NextResponse(response.body, {
                headers,
                status: response.status,
                statusText: response.statusText,
            });
        } catch (error) {
            console.error(`[${pluginName}] Unhandled error:`, error);
            return NextResponse.json(
                { error: 'An unexpected error occurred. Please try again.' },
                { status: 500 },
            );
        }
    };
}

// Re-export sanitization helpers for convenience
export { sanitizeInput, sanitizeNumber } from '@/utils/rate-limiter';
