import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { openclawBots } from '@/database/schemas';
import { getServerDB } from '@/database/server';

const TELEGRAM_API = 'https://api.telegram.org/bot';

const DEFAULT_SYSTEM_PROMPT = `You are a helpful AI assistant powered by pho.chat OpenClaw.
Respond naturally and helpfully in the same language the user writes in.
Keep responses concise but informative.
If asked who you are, say you're an AI bot deployed via pho.chat OpenClaw.`;

const DAILY_MESSAGE_LIMIT = 100;

async function sendTelegramMessage(botToken: string, chatId: number, text: string) {
  try {
    await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
      body: JSON.stringify({
        chat_id: chatId,
        parse_mode: 'HTML',
        text,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });
  } catch (err) {
    console.error('[OpenClaw Webhook] Failed to send message:', err);
  }
}

async function callAI(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.VERCELAIGATEWAY_API_KEY;
  if (!apiKey) {
    return 'Sorry, AI service is temporarily unavailable.';
  }

  try {
    const response = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      body: JSON.stringify({
        messages: [
          { content: systemPrompt, role: 'system' },
          { content: userMessage, role: 'user' },
        ],
        model: 'google/gemini-2.0-flash',
      }),
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!response.ok) {
      console.error('[OpenClaw AI] Gateway error:', await response.text());
      return 'Sorry, I encountered an error. Please try again.';
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (err) {
    console.error('[OpenClaw AI] Error:', err);
    return 'Sorry, I encountered an error. Please try again.';
  }
}

interface RouteParams {
  params: Promise<{ botId: string }>;
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { botId } = await params;
    const body = await req.json();

    // Validate Telegram update has a message
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      return NextResponse.json({ status: 'ok' });
    }

    const chatId = message.chat.id;
    const userText = message.text;

    // Handle /start command
    if (userText === '/start') {
      const db = await getServerDB();
      const [bot] = await db
        .select({ botName: openclawBots.botName, botToken: openclawBots.botToken })
        .from(openclawBots)
        .where(eq(openclawBots.id, botId))
        .limit(1);

      if (bot) {
        await sendTelegramMessage(
          bot.botToken,
          chatId,
          `👋 Hello! I'm <b>${bot.botName || 'AI Bot'}</b>, powered by pho.chat OpenClaw.\n\nSend me any message and I'll respond with AI!\n\n⚡ Powered by <a href="https://pho.chat/openclaw">pho.chat</a>`,
        );
      }
      return NextResponse.json({ status: 'ok' });
    }

    // Look up bot in DB
    const db = await getServerDB();
    const [bot] = await db
      .select()
      .from(openclawBots)
      .where(eq(openclawBots.id, botId))
      .limit(1);

    if (!bot || bot.status !== 'active') {
      return NextResponse.json({ status: 'ok' });
    }

    // Verify webhook secret if present
    const secretHeader = req.headers.get('x-telegram-bot-api-secret-token');
    if (bot.webhookSecret && secretHeader !== bot.webhookSecret) {
      return NextResponse.json({ status: 'ok' });
    }

    // Check daily message limit
    const now = new Date();
    let dailyCount = bot.dailyMessageCount;

    if (bot.dailyResetAt && now > bot.dailyResetAt) {
      // Reset daily counter
      dailyCount = 0;
      const newResetAt = new Date(now);
      newResetAt.setHours(23, 59, 59, 999);

      await db
        .update(openclawBots)
        .set({ dailyMessageCount: 0, dailyResetAt: newResetAt })
        .where(eq(openclawBots.id, botId));
    }

    if (dailyCount >= DAILY_MESSAGE_LIMIT) {
      await sendTelegramMessage(
        bot.botToken,
        chatId,
        '⚠️ Daily message limit reached (100/day on free plan).\n\nUpgrade at https://pho.chat/openclaw for unlimited messages!',
      );
      return NextResponse.json({ status: 'ok' });
    }

    // Call AI
    const systemPrompt = bot.systemPrompt || DEFAULT_SYSTEM_PROMPT;
    const aiResponse = await callAI(systemPrompt, userText);

    // Add watermark for free tier
    const watermarkedResponse = `${aiResponse}\n\n⚡ <a href="https://pho.chat/openclaw">pho.chat</a>`;

    // Send response
    await sendTelegramMessage(bot.botToken, chatId, watermarkedResponse);

    // Increment message counts
    await db
      .update(openclawBots)
      .set({
        dailyMessageCount: sql`${openclawBots.dailyMessageCount} + 1`,
        messageCount: sql`${openclawBots.messageCount} + 1`,
      })
      .where(eq(openclawBots.id, botId));

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('[OpenClaw Webhook] Error:', error);
    return NextResponse.json({ status: 'ok' }); // Always return 200 to Telegram
  }
}
