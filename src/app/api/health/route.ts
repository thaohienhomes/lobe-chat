import { NextResponse } from 'next/server';

import { cachedQuery } from '@/libs/cache';

/**
 * GET /api/health
 *
 * Health check endpoint for monitoring.
 * Returns status of all critical subsystems:
 * - Database connectivity
 * - AI providers (via quick list check)
 * - Cache layer
 * - Authentication service
 *
 * Used by: uptime monitors (UptimeRobot, Vercel), admin dashboard
 */
export async function GET(): Promise<NextResponse> {
    const start = Date.now();
    const checks: Record<string, { latencyMs: number; ok: boolean; error?: string }> = {};

    // 1. Database check
    try {
        const dbStart = Date.now();
        const { getServerDB } = await import('@/database/server');
        const db = await getServerDB();
        const { sql } = await import('drizzle-orm');
        await db.execute(sql`SELECT 1`);
        checks.database = { latencyMs: Date.now() - dbStart, ok: true };
    } catch (err: any) {
        checks.database = { error: err?.message || 'Connection failed', latencyMs: Date.now() - start, ok: false };
    }

    // 2. Cache check (Redis or in-memory)
    try {
        const cacheStart = Date.now();
        await cachedQuery('health:ping', 5, async () => 'pong');
        checks.cache = { latencyMs: Date.now() - cacheStart, ok: true };
    } catch (err: any) {
        checks.cache = { error: err?.message || 'Cache failed', latencyMs: 0, ok: false };
    }

    // 3. AI provider check (verify phoGatewayService loads)
    try {
        const aiStart = Date.now();
        const { phoGatewayService } = await import('@/server/services/phoGateway');
        const providers = phoGatewayService.resolveProviderList('pho-fast');
        checks.ai_gateway = {
            latencyMs: Date.now() - aiStart,
            ok: providers.length > 0,
        };
    } catch (err: any) {
        checks.ai_gateway = { error: err?.message || 'Gateway failed', latencyMs: 0, ok: false };
    }

    // 4. Auth check (Clerk SDK loads)
    try {
        const authStart = Date.now();
        const clerk = await import('@clerk/nextjs/server');
        checks.auth = {
            latencyMs: Date.now() - authStart,
            ok: typeof clerk.auth === 'function',
        };
    } catch (err: any) {
        checks.auth = { error: err?.message || 'Auth SDK failed', latencyMs: 0, ok: false };
    }

    // Calculate overall status
    const allOk = Object.values(checks).every(c => c.ok);
    const totalLatency = Date.now() - start;

    return NextResponse.json(
        {
            checks,
            status: allOk ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            totalLatencyMs: totalLatency,
            version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
        },
        { status: allOk ? 200 : 503 },
    );
}
