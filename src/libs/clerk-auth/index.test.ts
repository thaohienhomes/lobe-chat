import { auth, clerkClient } from '@clerk/nextjs/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ClerkAuth } from './index';

// Mock @clerk/nextjs/server module
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  currentUser: vi.fn(),
}));

// Save original env
const originalEnv = { ...process.env };

beforeEach(() => {
  vi.resetAllMocks();
  process.env = { ...originalEnv };
  Object.assign(process.env, { NODE_ENV: 'development' });
});

afterEach(() => {
  process.env = originalEnv;
});

describe('ClerkAuth', () => {
  describe('constructor', () => {
    it('should parse user ID mapping from environment variable', () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      const clerkAuth = new ClerkAuth();

      expect(clerkAuth['devUserId']).toBe('dev_user');
      expect(clerkAuth['prodUserId']).toBe('prod_user');
    });

    it('should handle empty mapping string', () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = '';
      const clerkAuth = new ClerkAuth();

      expect((clerkAuth as any).devUserId).toBeNull();
      expect((clerkAuth as any).prodUserId).toBeNull();
    });

    it('should handle invalid mapping format', () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'invalid_format';
      const clerkAuth = new ClerkAuth();

      expect((clerkAuth as any).devUserId).toBeNull();
      expect((clerkAuth as any).prodUserId).toBeNull();
    });

    it('should handle undefined mapping', () => {
      delete process.env.CLERK_DEV_IMPERSONATE_USER;
      const clerkAuth = new ClerkAuth();

      expect((clerkAuth as any).devUserId).toBeNull();
      expect((clerkAuth as any).prodUserId).toBeNull();
    });
  });

  describe('getAuthFromRequest', () => {
    it('should get auth from request using clerkClient().authenticateRequest()', async () => {
      const mockToAuth = vi.fn().mockReturnValue({ userId: 'original_user_id' });
      const mockAuthenticateRequest = vi.fn().mockResolvedValue({ toAuth: mockToAuth });
      vi.mocked(clerkClient).mockResolvedValue({
        authenticateRequest: mockAuthenticateRequest,
      } as any);

      const clerkAuth = new ClerkAuth();
      const mockRequest = new Request('https://example.com');
      const result = await clerkAuth.getAuthFromRequest(mockRequest as any);

      expect(clerkClient).toHaveBeenCalled();
      expect(mockAuthenticateRequest).toHaveBeenCalledWith(mockRequest);
      expect(result).toEqual({
        clerkAuth: { userId: 'original_user_id' },
        userId: 'original_user_id',
      });
    });

    it('should map user ID in development environment', async () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      Object.assign(process.env, { NODE_ENV: 'development' });

      const mockToAuth = vi.fn().mockReturnValue({ userId: 'dev_user' });
      const mockAuthenticateRequest = vi.fn().mockResolvedValue({ toAuth: mockToAuth });
      vi.mocked(clerkClient).mockResolvedValue({
        authenticateRequest: mockAuthenticateRequest,
      } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuthFromRequest(new Request('https://example.com') as any);

      expect(result).toEqual({
        clerkAuth: { userId: 'dev_user' },
        userId: 'prod_user',
      });
    });

    it('should fall back to auth() when authenticateRequest fails', async () => {
      vi.mocked(clerkClient).mockRejectedValue(new Error('client error'));
      vi.mocked(auth).mockResolvedValue({ userId: 'fallback_user' } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuthFromRequest(new Request('https://example.com') as any);

      expect(result).toEqual({
        clerkAuth: { userId: 'fallback_user' },
        userId: 'fallback_user',
      });
    });

    it('should handle null user ID', async () => {
      const mockToAuth = vi.fn().mockReturnValue({ userId: null });
      const mockAuthenticateRequest = vi.fn().mockResolvedValue({ toAuth: mockToAuth });
      vi.mocked(clerkClient).mockResolvedValue({
        authenticateRequest: mockAuthenticateRequest,
      } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuthFromRequest(new Request('https://example.com') as any);

      expect(result).toEqual({
        clerkAuth: { userId: null },
        userId: null,
      });
    });
  });

  describe('getAuth', () => {
    it('should get auth and return original user ID when no mapping', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: 'original_user_id' } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuth();

      expect(auth).toHaveBeenCalled();
      expect(result).toEqual({
        clerkAuth: { userId: 'original_user_id' },
        userId: 'original_user_id',
      });
    });

    it('should map user ID in development environment', async () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      Object.assign(process.env, { NODE_ENV: 'development' });
      vi.mocked(auth).mockResolvedValue({ userId: 'dev_user' } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuth();

      expect(result).toEqual({
        clerkAuth: { userId: 'dev_user' },
        userId: 'prod_user',
      });
    });

    it('should not map user ID in production environment', async () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      Object.assign(process.env, { NODE_ENV: 'production' });
      vi.mocked(auth).mockResolvedValue({ userId: 'dev_user' } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuth();

      expect(result).toEqual({
        clerkAuth: { userId: 'dev_user' },
        userId: 'dev_user',
      });
    });

    it('should handle null user ID', async () => {
      vi.mocked(auth).mockResolvedValue({ userId: null } as any);

      const clerkAuth = new ClerkAuth();
      const result = await clerkAuth.getAuth();

      expect(result).toEqual({
        clerkAuth: { userId: null },
        userId: null,
      });
    });
  });

  describe('getMappedUserId', () => {
    it('should return null for null input', () => {
      const clerkAuth = new ClerkAuth();
      const result = (clerkAuth as any).getMappedUserId(null);

      expect(result).toBeNull();
    });

    it('should return original ID when no mapping exists', () => {
      const clerkAuth = new ClerkAuth();
      const result = (clerkAuth as any).getMappedUserId('some_user_id');

      expect(result).toBe('some_user_id');
    });

    it('should return mapped ID when matching dev ID in development', () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      Object.assign(process.env, { NODE_ENV: 'development' });

      const clerkAuth = new ClerkAuth();
      const result = (clerkAuth as any).getMappedUserId('dev_user');

      expect(result).toBe('prod_user');
    });

    it('should return original ID when not matching dev ID', () => {
      process.env.CLERK_DEV_IMPERSONATE_USER = 'dev_user=prod_user';
      Object.assign(process.env, { NODE_ENV: 'development' });

      const clerkAuth = new ClerkAuth();
      const result = (clerkAuth as any).getMappedUserId('other_user');

      expect(result).toBe('other_user');
    });
  });
});
