import { describe, it, expect, beforeEach, vi } from 'vitest';
import { paymentRateLimiter, checkPaymentRateLimit, getClientIp } from './rate-limit';

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

