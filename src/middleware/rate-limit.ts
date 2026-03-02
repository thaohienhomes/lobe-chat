/**
 * Rate Limiting Middleware
 * Sliding window rate limiting with per-IP and per-user limits.
 * Used for payment, API, and other mutating endpoints.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  ipLimit: number; // Max requests per IP per window
  ipWindowMs: number; // Time window in milliseconds
  userLimit: number; // Max requests per user per window
  userWindowMs: number; // Time window in milliseconds
}

/**
 * In-memory rate limiter
 * For production, consider using Upstash Redis or similar
 */
class RateLimiter {
  private ipLimits: Map<string, RateLimitEntry> = new Map();
  private userLimits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      ipLimit: 30, // 30 requests per IP per minute
      ipWindowMs: 60 * 1000, // 1 minute
      userLimit: 10, // 10 requests per user per minute
      userWindowMs: 60 * 1000, // 1 minute
      ...config,
    };

    // Cleanup expired entries every 5 minutes
    this.startCleanupInterval();
  }

  /**
   * Check if request is allowed for IP
   */
  checkIpLimit(ip: string): boolean {
    const now = Date.now();
    const entry = this.ipLimits.get(ip);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.ipLimits.set(ip, {
        count: 1,
        resetTime: now + this.config.ipWindowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.ipLimit) {
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Check if request is allowed for user
   */
  checkUserLimit(userId: string): boolean {
    const now = Date.now();
    const entry = this.userLimits.get(userId);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.userLimits.set(userId, {
        count: 1,
        resetTime: now + this.config.userWindowMs,
      });
      return true;
    }

    // Check if limit exceeded
    if (entry.count >= this.config.userLimit) {
      return false;
    }

    // Increment counter
    entry.count++;
    return true;
  }

  /**
   * Check both IP and user limits
   */
  checkLimit(ip: string, userId: string): { allowed: boolean; reason?: string } {
    if (!this.checkIpLimit(ip)) {
      return {
        allowed: false,
        reason: `IP rate limit exceeded: ${this.config.ipLimit} requests per ${this.config.ipWindowMs / 1000}s`,
      };
    }

    if (!this.checkUserLimit(userId)) {
      return {
        allowed: false,
        reason: `User rate limit exceeded: ${this.config.userLimit} requests per ${this.config.userWindowMs / 1000}s`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get remaining requests for user
   */
  getRemainingRequests(userId: string): number {
    const now = Date.now();
    const entry = this.userLimits.get(userId);

    if (!entry || now > entry.resetTime) {
      return this.config.userLimit;
    }

    return Math.max(0, this.config.userLimit - entry.count);
  }

  /**
   * Get reset time for user
   */
  getResetTime(userId: string): number {
    const entry = this.userLimits.get(userId);
    if (!entry) {
      return Date.now();
    }
    return entry.resetTime;
  }

  /**
   * Cleanup expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();

      // Cleanup IP limits
      for (const [ip, entry] of this.ipLimits.entries()) {
        if (now > entry.resetTime) {
          this.ipLimits.delete(ip);
        }
      }

      // Cleanup user limits
      for (const [userId, entry] of this.userLimits.entries()) {
        if (now > entry.resetTime) {
          this.userLimits.delete(userId);
        }
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Reset limits for testing
   */
  reset(): void {
    this.ipLimits.clear();
    this.userLimits.clear();
  }

  /**
   * Get stats for monitoring
   */
  getStats(): {
    ipLimitsActive: number;
    userLimitsActive: number;
  } {
    const now = Date.now();
    let activeIpLimits = 0;
    let activeUserLimits = 0;

    for (const entry of this.ipLimits.values()) {
      if (now <= entry.resetTime) {
        activeIpLimits++;
      }
    }

    for (const entry of this.userLimits.values()) {
      if (now <= entry.resetTime) {
        activeUserLimits++;
      }
    }

    return {
      ipLimitsActive: activeIpLimits,
      userLimitsActive: activeUserLimits,
    };
  }
}

// ── Daily Tier Rate Limiter (Upstash Redis + In-Memory fallback) ─────
// Enforces PLAN_MODEL_ACCESS.dailyLimits (e.g. tier2: 30/day, tier3: 50/day)
// Uses Upstash Redis for persistence across deploys/instances.
// Falls back to in-memory if UPSTASH_REDIS_REST_URL is not set.

interface DailyTierEntry {
  count: number;
  /** UTC date string (YYYY-MM-DD) this entry belongs to */
  dateKey: string;
}

export interface DailyTierCheckResult {
  allowed: boolean;
  dailyLimit: number;
  reason?: string;
  remaining: number;
  resetTime: number; // ms timestamp for next midnight UTC
  tier: number;
}

/**
 * Per-user, per-tier daily message rate limiter.
 *
 * Reads limits from `PLAN_MODEL_ACCESS[planCode].dailyLimits`.
 * A limit of `-1` means unlimited. Missing limit = unlimited.
 * Resets at midnight UTC each day.
 *
 * Uses Upstash Redis when configured for persistence across
 * deploys and serverless instances. Falls back to in-memory Map.
 */
export class DailyTierRateLimiter {
  // In-memory fallback: `${userId}:tier${tier}` → DailyTierEntry
  private entries: Map<string, DailyTierEntry> = new Map();

  constructor() {
    // Cleanup stale in-memory entries every 30 minutes
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 30 * 60 * 1000);
    }
  }

  /**
   * Check if Upstash Redis is available
   */
  private isRedisConfigured(): boolean {
    return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  }

  /**
   * Get current UTC date string (YYYY-MM-DD)
   */
  private getDateKey(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Get seconds until next midnight UTC
   */
  private getSecondsUntilMidnightUTC(): number {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return Math.ceil((tomorrow.getTime() - now.getTime()) / 1000);
  }

  /**
   * Get ms timestamp for next midnight UTC
   */
  private getNextMidnightUTC(): number {
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    return tomorrow.getTime();
  }

  // ── Redis operations ──────────────────────────────────────

  /**
   * Atomically increment a Redis key and return the new count.
   * Uses INCR which is atomic — no race conditions across instances.
   * Sets TTL to auto-expire at midnight UTC.
   */
  private async redisIncr(redisKey: string): Promise<number | null> {
    try {
      // Use Upstash REST API pipeline: INCR + EXPIRE in one request
      const resp = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/pipeline`,
        {
          body: JSON.stringify([
            ['INCR', redisKey],
            ['EXPIREAT', redisKey, Math.ceil(this.getNextMidnightUTC() / 1000).toString()],
          ]),
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            'Content-Type': 'application/json',
          },
          method: 'POST',
        },
      );
      const json = await resp.json();
      // Pipeline returns array of results, first one is INCR result
      if (Array.isArray(json) && json[0]?.result !== undefined) {
        return Number(json[0].result);
      }
      return null;
    } catch {
      return null; // Fallback to in-memory
    }
  }

  /**
   * Get current count from Redis
   */
  private async redisGet(redisKey: string): Promise<number | null> {
    try {
      const resp = await fetch(
        `${process.env.UPSTASH_REDIS_REST_URL}/get/${redisKey}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
        },
      );
      const json = await resp.json();
      if (json.result !== null && json.result !== undefined) {
        return Number(json.result);
      }
      return 0;
    } catch {
      return null;
    }
  }

  // ── Core check (async for Redis) ──────────────────────────

  /**
   * Check if a user can send a message on a given tier.
   * Uses Redis when available, falls back to in-memory.
   *
   * @param userId   Clerk user ID or unique identifier
   * @param tier     Model tier (1, 2, or 3)
   * @param limit    Daily limit for this tier from plan config (-1 = unlimited, undefined = unlimited)
   */
  async check(userId: string, tier: number, limit: number | undefined): Promise<DailyTierCheckResult> {
    const effectiveLimit = limit ?? -1;
    const resetTime = this.getNextMidnightUTC();

    // Unlimited
    if (effectiveLimit === -1) {
      return { allowed: true, dailyLimit: -1, remaining: -1, resetTime, tier };
    }

    const dateKey = this.getDateKey();

    // ── Try Redis first ──
    if (this.isRedisConfigured()) {
      const redisKey = `pho:ratelimit:${userId}:tier${tier}:${dateKey}`;
      const newCount = await this.redisIncr(redisKey);

      if (newCount !== null) {
        if (newCount > effectiveLimit) {
          return {
            allowed: false,
            dailyLimit: effectiveLimit,
            reason: `Daily Tier ${tier} limit reached: ${effectiveLimit} messages/day. Resets at midnight UTC.`,
            remaining: 0,
            resetTime,
            tier,
          };
        }
        return {
          allowed: true,
          dailyLimit: effectiveLimit,
          remaining: Math.max(0, effectiveLimit - newCount),
          resetTime,
          tier,
        };
      }
      // Redis failed — fall through to in-memory
    }

    // ── In-memory fallback ──
    const key = `${userId}:tier${tier}`;
    const entry = this.entries.get(key);

    // New day or new user — create fresh entry
    if (!entry || entry.dateKey !== dateKey) {
      this.entries.set(key, { count: 1, dateKey });
      return {
        allowed: true,
        dailyLimit: effectiveLimit,
        remaining: Math.max(0, effectiveLimit - 1),
        resetTime,
        tier,
      };
    }

    // Check limit
    if (entry.count >= effectiveLimit) {
      return {
        allowed: false,
        dailyLimit: effectiveLimit,
        reason: `Daily Tier ${tier} limit reached: ${effectiveLimit} messages/day. Resets at midnight UTC.`,
        remaining: 0,
        resetTime,
        tier,
      };
    }

    // Increment
    entry.count++;
    return {
      allowed: true,
      dailyLimit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - entry.count),
      resetTime,
      tier,
    };
  }

  /**
   * Get current usage for a user on a specific tier (for reporting)
   */
  async getUsage(userId: string, tier: number): Promise<{ count: number; dateKey: string }> {
    const dateKey = this.getDateKey();

    // Try Redis first
    if (this.isRedisConfigured()) {
      const redisKey = `pho:ratelimit:${userId}:tier${tier}:${dateKey}`;
      const count = await this.redisGet(redisKey);
      if (count !== null) {
        return { count, dateKey };
      }
    }

    // In-memory fallback
    const key = `${userId}:tier${tier}`;
    const entry = this.entries.get(key);

    if (!entry || entry.dateKey !== dateKey) {
      return { count: 0, dateKey };
    }
    return { count: entry.count, dateKey: entry.dateKey };
  }

  /**
   * Remove stale in-memory entries from previous days
   */
  private cleanup(): void {
    const currentDate = this.getDateKey();
    for (const [key, entry] of this.entries.entries()) {
      if (entry.dateKey !== currentDate) {
        this.entries.delete(key);
      }
    }
  }

  /** Reset in-memory entries (for testing) */
  reset(): void {
    this.entries.clear();
  }

  /** Get stats for monitoring */
  getStats(): { activeEntries: number } {
    const currentDate = this.getDateKey();
    let active = 0;
    for (const entry of this.entries.values()) {
      if (entry.dateKey === currentDate) active++;
    }
    return { activeEntries: active };
  }
}

// ── Singleton instances ──────────────────────────────────────

/** Chat daily tier limits (enforces PLAN_MODEL_ACCESS.dailyLimits) */
export const chatDailyRateLimiter = new DailyTierRateLimiter();

/** Payment endpoints (30 req/min IP, 10 req/min user) */
export const paymentRateLimiter = new RateLimiter({
  ipLimit: 30,
  ipWindowMs: 60 * 1000,
  userLimit: 10,
  userWindowMs: 60 * 1000,
});

/** General API endpoints (20 req/min IP, 10 req/min user) */
export const apiRateLimiter = new RateLimiter({
  ipLimit: 20,
  ipWindowMs: 60 * 1000,
  userLimit: 10,
  userWindowMs: 60 * 1000,
});

/** Newsletter send — very strict (5 req/hour) */
export const newsletterRateLimiter = new RateLimiter({
  ipLimit: 5,
  ipWindowMs: 60 * 60 * 1000,
  userLimit: 3,
  userWindowMs: 60 * 60 * 1000,
});

/**
 * Extract IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback - this won't work in production but is useful for development
  return 'unknown';
}

/**
 * Generic rate limit check — works with any RateLimiter instance
 */
export async function checkRateLimit(
  request: Request,
  userId: string,
  limiter: RateLimiter = apiRateLimiter,
): Promise<{ allowed: boolean; reason?: string; remaining?: number; resetTime?: number }> {
  const ip = getClientIp(request);
  const result = limiter.checkLimit(ip, userId);

  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.reason,
      remaining: 0,
      resetTime: limiter.getResetTime(userId),
    };
  }

  return {
    allowed: true,
    remaining: limiter.getRemainingRequests(userId),
    resetTime: limiter.getResetTime(userId),
  };
}

/** @deprecated Use checkRateLimit(req, userId, paymentRateLimiter) instead */
export const checkPaymentRateLimit = (
  request: Request,
  userId: string,
) => checkRateLimit(request, userId, paymentRateLimiter);

