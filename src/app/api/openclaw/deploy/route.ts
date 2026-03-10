import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { openclawBots } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const TELEGRAM_API = 'https://api.telegram.org/bot';

// Use env var or derive from Vercel URL
function getWebhookBaseUrl(): string {
  if (process.env.OFFICIAL_URL) return process.env.OFFICIAL_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://pho.chat';
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== 'string' || !token.includes(':')) {
      return NextResponse.json(
        { error: 'Invalid bot token format', success: false },
        { status: 400 },
      );
    }

    // 1. Validate token via Telegram getMe
    const getMeRes = await fetch(`${TELEGRAM_API}${token}/getMe`);
    const getMeData = await getMeRes.json();

    if (!getMeData.ok) {
      return NextResponse.json(
        { error: 'Invalid Telegram bot token. Please check and try again.', success: false },
        { status: 400 },
      );
    }

    const botInfo = getMeData.result;
    const botUsername = botInfo.username;
    const botName = botInfo.first_name;

    // 2. Check if this bot is already deployed
    const db = await getServerDB();
    const [existing] = await db
      .select()
      .from(openclawBots)
      .where(eq(openclawBots.botUsername, botUsername))
      .limit(1);

    if (existing && existing.status === 'active') {
      return NextResponse.json({
        botId: existing.id,
        botName: existing.botName,
        botUsername: existing.botUsername,
        success: true,
      });
    }

    // 3. Generate bot ID and webhook secret
    const botId = `ocbot_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const webhookSecret = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);

    // 4. Set webhook with Telegram
    const baseUrl = getWebhookBaseUrl();
    const webhookUrl = `${baseUrl}/api/openclaw/webhook/${botId}`;

    const setWebhookRes = await fetch(
      `${TELEGRAM_API}${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${webhookSecret}`,
    );
    const setWebhookData = await setWebhookRes.json();

    if (!setWebhookData.ok) {
      return NextResponse.json(
        { error: 'Failed to set Telegram webhook. Please try again.', success: false },
        { status: 500 },
      );
    }

    // 5. Store in database
    const now = new Date();
    const dailyResetAt = new Date(now);
    dailyResetAt.setHours(23, 59, 59, 999);

    await db.insert(openclawBots).values({
      botName,
      botToken: token,
      botUsername,
      dailyResetAt,
      id: botId,
      systemPrompt: null, // uses default prompt in webhook handler
      webhookSecret,
    });

    console.log(`[OpenClaw] Bot @${botUsername} deployed with ID ${botId}`);

    return NextResponse.json({
      botId,
      botName,
      botUsername,
      success: true,
    });
  } catch (error) {
    console.error('[OpenClaw Deploy] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 },
    );
  }
}
