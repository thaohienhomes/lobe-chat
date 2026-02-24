import { NextRequest, NextResponse } from 'next/server';

import { getServerDB } from '@/database/server';

/**
 * Generates a cryptographically secure API key and returns its SHA-256 hash.
 *
 * Key format: pho_<32 random hex chars>
 * Example:    pho_a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
 *
 * Only the HASH is stored in the database. The raw key is returned once to the user.
 */
async function generateApiKey(): Promise<{ hash: string; prefix: string; rawKey: string }> {
    // Generate 32 random bytes → 64 hex chars
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const hex = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');

    const rawKey = `pho_${hex}`;
    const prefix = rawKey.slice(0, 12); // "pho_a1b2c3d4"

    // SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(rawKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return { hash, prefix, rawKey };
}

/**
 * POST /api/keys
 * Create a new API key for the authenticated user.
 * Body: { label?: string }
 * Returns: { key: string, prefix: string, id: string } — key shown ONCE
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const label = body?.label || 'Default';

        const db = await getServerDB();
        const { phoApiKeys } = await import('@/database/schemas') as any;
        const { eq } = await import('drizzle-orm');

        // Limit: max 5 keys per user
        const existing = await db.select().from(phoApiKeys).where(eq(phoApiKeys.clerkUserId, clerkUserId));
        if (existing.length >= 5) {
            return NextResponse.json({ error: 'Maximum 5 API keys allowed. Delete an existing key first.' }, { status: 400 });
        }

        // Generate secure key
        const { hash, prefix, rawKey } = await generateApiKey();

        // Store hashed key
        const [created] = await db.insert(phoApiKeys).values({
            clerkUserId,
            keyHash: hash,
            keyPrefix: prefix,
            label,
        }).returning({ id: phoApiKeys.id });

        return NextResponse.json({
            id: created.id,
            key: rawKey, // ⚠️ Shown ONCE — never stored or returned again
            label,
            message: 'Save this key securely — it will not be shown again.',
            prefix,
        });
    } catch (error) {
        console.error('[api/keys] Error:', error);
        return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 });
    }
}

/**
 * GET /api/keys
 * List all API keys for the authenticated user (prefix + metadata only, never the raw key).
 */
export async function GET(): Promise<NextResponse> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getServerDB();
        const { phoApiKeys } = await import('@/database/schemas') as any;
        const { eq } = await import('drizzle-orm');

        const keys = await db
            .select({
                createdAt: phoApiKeys.createdAt,
                id: phoApiKeys.id,
                isActive: phoApiKeys.isActive,
                keyPrefix: phoApiKeys.keyPrefix,
                label: phoApiKeys.label,
                lastUsedAt: phoApiKeys.lastUsedAt,
            })
            .from(phoApiKeys)
            .where(eq(phoApiKeys.clerkUserId, clerkUserId));

        return NextResponse.json({ keys });
    } catch (error) {
        console.error('[api/keys] Error:', error);
        return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
    }
}

/**
 * DELETE /api/keys
 * Revoke an API key.
 * Body: { keyId: string }
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
    try {
        const { auth } = await import('@clerk/nextjs/server');
        const { userId: clerkUserId } = await auth();

        if (!clerkUserId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { keyId } = body;

        if (!keyId) {
            return NextResponse.json({ error: 'keyId is required' }, { status: 400 });
        }

        const db = await getServerDB();
        const { phoApiKeys } = await import('@/database/schemas') as any;
        const { and, eq } = await import('drizzle-orm');

        // Only delete keys owned by the authenticated user
        const result = await db
            .delete(phoApiKeys)
            .where(and(eq(phoApiKeys.id, keyId), eq(phoApiKeys.clerkUserId, clerkUserId)))
            .returning({ id: phoApiKeys.id });

        if (result.length === 0) {
            return NextResponse.json({ error: 'Key not found or not owned by you' }, { status: 404 });
        }

        return NextResponse.json({ deleted: true, id: keyId });
    } catch (error) {
        console.error('[api/keys] Error:', error);
        return NextResponse.json({ error: 'Failed to delete key' }, { status: 500 });
    }
}
