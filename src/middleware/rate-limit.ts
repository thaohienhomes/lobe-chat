/**
 * Rate Limiting Middleware for Payment Endpoints
 * Prevents brute force attacks on credit card validation
 *
 * Implements sliding window rate limiting with per-IP and per-user limits
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

// Create singleton instance
export const paymentRateLimiter = new RateLimiter({
  ipLimit: 30, // 30 requests per IP per minute
  ipWindowMs: 60 * 1000,
  userLimit: 10, // 10 requests per user per minute
  userWindowMs: 60 * 1000,
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
 * Rate limit check for payment endpoints
 */
export async function checkPaymentRateLimit(
  request: Request,
  userId: string,
): Promise<{ allowed: boolean; reason?: string; remaining?: number; resetTime?: number }> {
  const ip = getClientIp(request);
  const result = paymentRateLimiter.checkLimit(ip, userId);

  if (!result.allowed) {
    return {
      allowed: false,
      reason: result.reason,
      remaining: 0,
      resetTime: paymentRateLimiter.getResetTime(userId),
    };
  }

  return {
    allowed: true,
    remaining: paymentRateLimiter.getRemainingRequests(userId),
    resetTime: paymentRateLimiter.getResetTime(userId),
  };
}

