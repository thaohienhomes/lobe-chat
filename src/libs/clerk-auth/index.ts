import { AuthObject } from '@clerk/backend';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export class ClerkAuth {
  private devUserId: string | null = null;
  private prodUserId: string | null = null;

  constructor() {
    this.parseUserIdMapping();
  }

  /**
   * Get auth from an incoming request using clerkClient().authenticateRequest().
   * This bypasses the need for clerkMiddleware() context, which is broken
   * when NextResponse.rewrite() is used in middleware.
   */
  async getAuthFromRequest(request?: NextRequest | Request): Promise<{
    clerkAuth: AuthObject | null;
    userId: string | null;
  }> {
    if (request) {
      try {
        const client = await clerkClient();
        const requestState = await client.authenticateRequest(request);
        const clerkAuth = requestState.toAuth();
        const userId = this.getMappedUserId(clerkAuth?.userId ?? null);

        return { clerkAuth, userId };
      } catch (error) {
        console.warn('[ClerkAuth] authenticateRequest failed, falling back to auth():', error);
      }
    }

    // Fallback to auth() for cases without request object
    try {
      const clerkAuth = await auth();
      const userId = this.getMappedUserId(clerkAuth.userId);
      return { clerkAuth, userId };
    } catch {
      return { clerkAuth: null, userId: null };
    }
  }

  /**
   * Get current auth info and user ID (for server components / actions)
   */
  async getAuth() {
    const clerkAuth = await auth();
    const userId = this.getMappedUserId(clerkAuth.userId);

    return { clerkAuth, userId };
  }

  async getCurrentUser() {
    const user = await currentUser();

    if (!user) return null;

    const userId = this.getMappedUserId(user.id) as string;

    return { ...user, id: userId };
  }

  /**
   * Map user ID based on environment variable (dev → prod mapping)
   */
  private getMappedUserId(originalUserId: string | null): string | null {
    if (!originalUserId) return null;

    // Only map in development environment
    if (
      process.env.NODE_ENV === 'development' &&
      this.devUserId &&
      this.prodUserId &&
      originalUserId === this.devUserId
    ) {
      return this.prodUserId;
    }

    return originalUserId;
  }

  /**
   * Parse user ID mapping from environment variable
   * Format: "dev=prod"
   */
  private parseUserIdMapping(): void {
    const mappingStr = process.env.CLERK_DEV_IMPERSONATE_USER || '';

    if (!mappingStr) return;

    const [dev, prod] = mappingStr.split('=');
    if (dev && prod) {
      this.devUserId = dev.trim();
      this.prodUserId = prod.trim();
    }
  }
}

export type IClerkAuth = ClerkAuth;

export const clerkAuth = new ClerkAuth();
