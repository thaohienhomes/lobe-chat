import { auth } from '@clerk/nextjs/server';
import { and, eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { openclawBots } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const TELEGRAM_API = 'https://api.telegram.org/bot';

function getWebhookBaseUrl(): string {
  if (process.env.OFFICIAL_URL) return process.env.OFFICIAL_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://pho.chat';
}

interface RouteParams {
  params: Promise<{ botId: string }>;
}

/**
 * PATCH /api/openclaw/bots/[botId]
 * Update bot settings (status, systemPrompt).
 * When pausing: removes Telegram webhook.
 * When resuming: re-registers Telegram webhook.
 */
export async function PATCH(req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await params;
    const body = await req.json();
    const { status, systemPrompt } = body as { status?: string; systemPrompt?: string };

    const db = await getServerDB();

    // Verify bot belongs to user
    const [bot] = await db
      .select()
      .from(openclawBots)
      .where(and(eq(openclawBots.id, botId), eq(openclawBots.userId, userId)))
      .limit(1);

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Build update payload
    const updates: Record<string, any> = {};
    if (systemPrompt !== undefined) {
      updates.systemPrompt = systemPrompt || null;
    }

    if (status && (status === 'active' || status === 'paused')) {
      updates.status = status;

      // Handle webhook lifecycle
      if (status === 'paused' && bot.status === 'active') {
        // Remove webhook when pausing
        await fetch(`${TELEGRAM_API}${bot.botToken}/deleteWebhook`).catch(() => {});
      } else if (status === 'active' && bot.status === 'paused') {
        // Re-register webhook when resuming
        const baseUrl = getWebhookBaseUrl();
        const webhookUrl = `${baseUrl}/api/openclaw/webhook/${botId}`;
        await fetch(
          `${TELEGRAM_API}${bot.botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${bot.webhookSecret}`,
        ).catch(() => {});
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    await db
      .update(openclawBots)
      .set(updates)
      .where(eq(openclawBots.id, botId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[OpenClaw Bots] Update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/openclaw/bots/[botId]
 * Delete a bot. Removes Telegram webhook and deletes DB record.
 */
export async function DELETE(_req: Request, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { botId } = await params;
    const db = await getServerDB();

    // Verify bot belongs to user
    const [bot] = await db
      .select({ botToken: openclawBots.botToken, id: openclawBots.id })
      .from(openclawBots)
      .where(and(eq(openclawBots.id, botId), eq(openclawBots.userId, userId)))
      .limit(1);

    if (!bot) {
      return NextResponse.json({ error: 'Bot not found' }, { status: 404 });
    }

    // Remove Telegram webhook
    await fetch(`${TELEGRAM_API}${bot.botToken}/deleteWebhook`).catch(() => {});

    // Delete from database
    await db.delete(openclawBots).where(eq(openclawBots.id, botId));

    console.log(`[OpenClaw] Bot ${botId} deleted by user ${userId}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[OpenClaw Bots] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
