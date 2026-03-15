import { describe, it, expect, beforeEach } from 'vitest';
import { paymentRateLimiter, checkPaymentRateLimit, getClientIp , DailyTierRateLimiter, chatDailyRateLimiter } from './rate-limit';

// ── DailyTierRateLimiter Tests ──────────────────────────────
// Tests run in-memory fallback mode (no UPSTASH env vars in test)



describe('Rate Limiting Middleware', () => {
  beforeEach(() => {
    paymentRateLimiter.reset();
  });

  describe('getClientIp', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.2');
    });

    it('should return unknown if no IP headers present', () => {
      const request = new Request('http://localhost/api/test');
      const ip = getClientIp(request);
      expect(ip).toBe('unknown');
    });

    it('should prioritize x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe('192.168.1.1');
    });
  });

  describe('IP Rate Limiting', () => {
    it('should allow requests within IP limit', () => {
      const ip = '192.168.1.1';

      for (let i = 0; i < 30; i++) {
        const result = paymentRateLimiter.checkLimit(ip, `user${i}`);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding IP limit', () => {
      const ip = '192.168.1.1';

      // Make 30 requests (at limit) with different users
      for (let i = 0; i < 30; i++) {
        paymentRateLimiter.checkLimit(ip, `user${i}`);
      }

      // 31st request should be blocked
      const result = paymentRateLimiter.checkLimit(ip, 'user_extra');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP rate limit exceeded');
    });

    it('should allow different IPs independently', () => {
      // IP 1 makes 30 requests
      for (let i = 0; i < 30; i++) {
        paymentRateLimiter.checkLimit('192.168.1.1', `user${i}`);
      }

      // IP 2 should still be able to make requests
      const result = paymentRateLimiter.checkLimit('192.168.1.2', 'user_new');
      expect(result.allowed).toBe(true);
    });
  });

  describe('User Rate Limiting', () => {
    it('should allow requests within user limit', () => {
      const ip = '192.168.1.1';
      const userId = 'user123';

      for (let i = 0; i < 10; i++) {
        const result = paymentRateLimiter.checkLimit(ip, userId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding user limit', () => {
      const ip = '192.168.1.1';
      const userId = 'user123';

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        paymentRateLimiter.checkLimit(ip, userId);
      }

      // 11th request should be blocked
      const result = paymentRateLimiter.checkLimit(ip, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('User rate limit exceeded');
    });

    it('should allow different users independently', () => {
      const ip = '192.168.1.1';

      // User 1 makes 10 requests
      for (let i = 0; i < 10; i++) {
        paymentRateLimiter.checkLimit(ip, 'user1');
      }

      // User 2 should still be able to make requests
      const result = paymentRateLimiter.checkLimit(ip, 'user2');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Combined Rate Limiting', () => {
    it('should enforce both IP and user limits', () => {
      const ip = '192.168.1.1';
      const userId = 'user123';

      // Make 10 requests (at user limit)
      for (let i = 0; i < 10; i++) {
        paymentRateLimiter.checkLimit(ip, userId);
      }

      // 11th request should be blocked by user limit
      const result = paymentRateLimiter.checkLimit(ip, userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('User rate limit exceeded');
    });

    it('should block on IP limit even if user limit not reached', () => {
      const userId = 'user123';

      // Make 30 requests from IP 1 (at IP limit)
      for (let i = 0; i < 30; i++) {
        paymentRateLimiter.checkLimit('192.168.1.1', userId);
      }

      // 31st request from same IP should be blocked
      const result = paymentRateLimiter.checkLimit('192.168.1.1', userId);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('IP rate limit exceeded');
    });
  });

  describe('Remaining Requests', () => {
    it('should return correct remaining requests', () => {
      const userId = 'user123';

      // Make 3 requests
      paymentRateLimiter.checkLimit('192.168.1.1', userId);
      paymentRateLimiter.checkLimit('192.168.1.1', userId);
      paymentRateLimiter.checkLimit('192.168.1.1', userId);

      const remaining = paymentRateLimiter.getRemainingRequests(userId);
      expect(remaining).toBe(7); // 10 - 3
    });

    it('should return full limit for new user', () => {
      const remaining = paymentRateLimiter.getRemainingRequests('newuser');
      expect(remaining).toBe(10);
    });

    it('should return 0 when limit exceeded', () => {
      const userId = 'user123';

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        paymentRateLimiter.checkLimit('192.168.1.1', userId);
      }

      const remaining = paymentRateLimiter.getRemainingRequests(userId);
      expect(remaining).toBe(0);
    });
  });

  describe('checkPaymentRateLimit', () => {
    it('should return allowed for valid request', async () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const result = await checkPaymentRateLimit(request, 'user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBeDefined();
    });

    it('should return blocked for rate limited request', async () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      // Make 10 requests
      for (let i = 0; i < 10; i++) {
        await checkPaymentRateLimit(request, 'user123');
      }

      // 11th request should be blocked
      const result = await checkPaymentRateLimit(request, 'user123');
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('User rate limit exceeded');
      expect(result.remaining).toBe(0);
      expect(result.resetTime).toBeDefined();
    });

    it('should include rate limit headers in response', async () => {
      const request = new Request('http://localhost/api/test', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
        },
      });

      const result = await checkPaymentRateLimit(request, 'user123');
      expect(result.remaining).toBe(9);
      expect(result.resetTime).toBeDefined();
    });
  });

  describe('Stats', () => {
    it('should track active limits', () => {
      paymentRateLimiter.checkLimit('192.168.1.1', 'user1');
      paymentRateLimiter.checkLimit('192.168.1.2', 'user2');
      paymentRateLimiter.checkLimit('192.168.1.3', 'user3');

      const stats = paymentRateLimiter.getStats();
      expect(stats.ipLimitsActive).toBe(3);
      expect(stats.userLimitsActive).toBe(3);
    });

    it('should return zero stats after reset', () => {
      paymentRateLimiter.checkLimit('192.168.1.1', 'user1');
      paymentRateLimiter.reset();

      const stats = paymentRateLimiter.getStats();
      expect(stats.ipLimitsActive).toBe(0);
      expect(stats.userLimitsActive).toBe(0);
    });
  });
});

describe('DailyTierRateLimiter', () => {
  let limiter: DailyTierRateLimiter;

  beforeEach(() => {
    limiter = new DailyTierRateLimiter();
  });

  describe('Basic limiting', () => {
    it('should allow requests within daily limit', async () => {
      const limit = 5;
      for (let i = 0; i < limit; i++) {
        const result = await limiter.check('user1', 2, limit);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(limit - i - 1);
      }
    });

    it('should block requests exceeding daily limit', async () => {
      const limit = 3;
      // Use up all 3
      for (let i = 0; i < limit; i++) {
        await limiter.check('user1', 2, limit);
      }

      const result = await limiter.check('user1', 2, limit);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.reason).toContain('Daily Tier 2 limit reached');
      expect(result.reason).toContain('3 messages/day');
    });

    it('should return correct dailyLimit in result', async () => {
      const result = await limiter.check('user1', 3, 50);
      expect(result.dailyLimit).toBe(50);
      expect(result.tier).toBe(3);
    });
  });

  describe('Unlimited access', () => {
    it('should always allow when limit is -1', async () => {
      for (let i = 0; i < 100; i++) {
        const result = await limiter.check('user1', 2, -1);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(-1);
        expect(result.dailyLimit).toBe(-1);
      }
    });

    it('should always allow when limit is undefined', async () => {
      const result = await limiter.check('user1', 1, undefined);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
    });
  });

  describe('Tier independence', () => {
    it('should track different tiers independently', async () => {
      // Use up Tier 2 limit
      for (let i = 0; i < 5; i++) {
        await limiter.check('user1', 2, 5);
      }
      const tier2Result = await limiter.check('user1', 2, 5);
      expect(tier2Result.allowed).toBe(false);

      // Tier 3 should still be available
      const tier3Result = await limiter.check('user1', 3, 10);
      expect(tier3Result.allowed).toBe(true);
    });
  });

  describe('User independence', () => {
    it('should track different users independently', async () => {
      // User 1 uses up limit
      for (let i = 0; i < 3; i++) {
        await limiter.check('user1', 2, 3);
      }
      expect((await limiter.check('user1', 2, 3)).allowed).toBe(false);

      // User 2 should still be fine
      expect((await limiter.check('user2', 2, 3)).allowed).toBe(true);
    });
  });

  describe('Usage tracking', () => {
    it('should report correct usage', async () => {
      await limiter.check('user1', 2, 10);
      await limiter.check('user1', 2, 10);
      await limiter.check('user1', 2, 10);

      const usage = await limiter.getUsage('user1', 2);
      expect(usage.count).toBe(3);
    });

    it('should report 0 for unknown user', async () => {
      const usage = await limiter.getUsage('unknown', 2);
      expect(usage.count).toBe(0);
    });
  });

  describe('Reset', () => {
    it('should clear all entries on reset', async () => {
      await limiter.check('user1', 2, 5);
      await limiter.check('user2', 3, 10);
      limiter.reset();

      const stats = limiter.getStats();
      expect(stats.activeEntries).toBe(0);

      // Should be able to use again after reset
      const result = await limiter.check('user1', 2, 5);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
    });
  });

  describe('Singleton', () => {
    it('chatDailyRateLimiter should be a DailyTierRateLimiter', () => {
      expect(chatDailyRateLimiter).toBeInstanceOf(DailyTierRateLimiter);
    });
  });
});

