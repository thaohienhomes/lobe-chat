import fetch from 'node-fetch';

/**
 * Run this script to register your local ngrok or production domain with Telegram Bot API.
 * Usage: npx tsx scripts/setup-telegram-webhook.ts <BOT_TOKEN> <WEBHOOK_URL>
 */

const botToken = process.argv[2];
const webhookUrl = process.argv[3];

if (!botToken || !webhookUrl) {
    console.error('Usage: npx tsx scripts/setup-telegram-webhook.ts <BOT_TOKEN> <WEBHOOK_URL>');
    console.error('Example: npx tsx scripts/setup-telegram-webhook.ts 123456:ABC-DEF https://your-domain.com/api/agents/telegram');
    process.exit(1);
}

async function setup() {
    const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log('Telegram API Response:', data);

        if (data.ok) {
            console.log('✅ Webhook successfully set to:', webhookUrl);
        } else {
            console.error('❌ Failed to set webhook.');
        }
    } catch (error) {
        console.error('Error reaching Telegram API:', error);
    }
}

setup();
