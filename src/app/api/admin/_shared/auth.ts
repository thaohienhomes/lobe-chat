/**
 * Admin Auth Guard
 *
 * Shared middleware for admin-only API routes.
 * Uses Clerk auth + ADMIN_USER_ID environment variable.
 */
import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const ADMIN_USER_IDS = new Set(
    [process.env.ADMIN_USER_ID].filter(Boolean),
);

/**
 * Verify the current request is from an authenticated admin user.
 * Returns `null` if authorized, or a NextResponse error if not.
 *
 * Usage:
 * ```ts
 * const denied = await requireAdmin();
 * if (denied) return denied;
 * ```
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ADMIN_USER_IDS.has(userId)) {
        return NextResponse.json(
            { error: 'Forbidden — Admin access required' },
            { status: 403 },
        );
    }

    return null; // Authorized
}
