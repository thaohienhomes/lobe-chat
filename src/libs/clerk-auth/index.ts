import { createClerkClient } from '@clerk/backend';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Create a standalone Clerk backend client that doesn't depend on middleware context.
// This is used in tRPC route handlers where auth() fails because clerkMiddleware()
// context isn't propagated through NextResponse.rewrite().
const backendClient = createClerkClient({
  publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY,
});

export class ClerkAuth {
  private devUserId: string | null = null;
  private prodUserId: string | null = null;

  constructor() {
    this.parseUserIdMapping();
  }

  /**
   * 从请求中获取认证信息和用户ID
   * Uses @clerk/backend authenticateRequest() to avoid dependency on clerkMiddleware() context.
   */
  async getAuthFromRequest(request?: NextRequest | Request) {
    if (request) {
      try {
        const requestState = await backendClient.authenticateRequest(request, {
          authorizedParties: process.env.CLERK_AUTHORIZED_PARTIES
            ? process.env.CLERK_AUTHORIZED_PARTIES.split(',')
            : undefined,
        });
        const clerkAuth = requestState.toAuth();
        const userId = this.getMappedUserId(clerkAuth?.userId ?? null);

        return { clerkAuth, userId };
      } catch (error) {
        console.error('[ClerkAuth] authenticateRequest failed:', error);
        // Return unauthenticated state instead of throwing
        return { clerkAuth: null, userId: null };
      }
    }

    // No request object - return unauthenticated
    return { clerkAuth: null, userId: null };
  }

  /**
   * 获取当前认证信息和用户ID
   * Uses auth() for server components/actions where middleware context is available.
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
   * 根据环境变量映射用户ID
   */
  private getMappedUserId(originalUserId: string | null): string | null {
    if (!originalUserId) return null;

    // 只在开发环境下执行映射
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
   * 解析环境变量中的用户ID映射配置
   * 格式: "dev=prod"
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
