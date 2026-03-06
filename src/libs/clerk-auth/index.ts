import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

export class ClerkAuth {
  private devUserId: string | null = null;
  private prodUserId: string | null = null;

  constructor() {
    this.parseUserIdMapping();
  }

  /**
   * 从请求中获取认证信息和用户ID
   * Uses clerkClient().authenticateRequest() to avoid dependency on clerkMiddleware() context.
   * This works in tRPC route handlers where auth() fails because middleware context
   * isn't propagated through NextResponse.rewrite().
   */
  async getAuthFromRequest(request?: NextRequest | Request) {
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
    const clerkAuth = await auth();
    const userId = this.getMappedUserId(clerkAuth.userId);

    return { clerkAuth, userId };
  }

  /**
   * 获取当前认证信息和用户ID
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
