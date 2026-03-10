import { auth } from '@clerk/nextjs/server';
import { desc, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { openclawBots } from '@/database/schemas';
import { getServerDB } from '@/database/server';

/**
 * GET /api/openclaw/bots
 * List all bots belonging to the authenticated user.
 * Strips botToken from response for security.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getServerDB();
    const bots = await db
      .select({
        botName: openclawBots.botName,
        botUsername: openclawBots.botUsername,
        createdAt: openclawBots.createdAt,
        dailyMessageCount: openclawBots.dailyMessageCount,
        dailyResetAt: openclawBots.dailyResetAt,
        id: openclawBots.id,
        messageCount: openclawBots.messageCount,
        status: openclawBots.status,
        systemPrompt: openclawBots.systemPrompt,
        updatedAt: openclawBots.updatedAt,
      })
      .from(openclawBots)
      .where(eq(openclawBots.userId, userId))
      .orderBy(desc(openclawBots.createdAt));

    return NextResponse.json({ bots });
  } catch (error) {
    console.error('[OpenClaw Bots] List error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
