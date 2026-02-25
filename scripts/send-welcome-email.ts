/**
 * Send welcome email for Phở Đặc Biệt plan
 * Run: npx tsx scripts/send-welcome-email.ts
 */
import dotenv from 'dotenv';
import { resolve } from 'node:path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found');
    process.exit(1);
}

const TO_EMAIL = 'vuthanhhuong120898@gmail.com';
const USER_NAME = 'Hường';
const TEMP_PASSWORD = 'PhoChatPro@2026';

const htmlContent = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #1a1a2e; color: #e0e0e0;">
  <div style="background: linear-gradient(135deg, #16213e 0%, #0f3460 100%); border-radius: 16px; padding: 32px; border: 1px solid #e94560;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #e94560; font-size: 28px; margin: 0;">🍜 Chào mừng đến Phở Chat!</h1>
      <p style="color: #a0a0c0; margin-top: 8px;">Gói Phở Đặc Biệt đã được kích hoạt</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">Xin chào <strong style="color: #e94560;">${USER_NAME}</strong>,</p>

    <p style="font-size: 15px; line-height: 1.6;">Tài khoản Phở Chat của bạn đã được tạo với gói <strong style="color: #53d769;">Phở Đặc Biệt (Premium)</strong>. Dưới đây là thông tin đăng nhập:</p>

    <div style="background: #0d1b2a; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #e94560;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0; color: #a0a0c0;">🌐 Website</td><td style="padding: 8px 0;"><a href="https://pho.chat" style="color: #e94560; text-decoration: none; font-weight: bold;">https://pho.chat</a></td></tr>
        <tr><td style="padding: 8px 0; color: #a0a0c0;">📧 Email</td><td style="padding: 8px 0; font-weight: bold;">${TO_EMAIL}</td></tr>
        <tr><td style="padding: 8px 0; color: #a0a0c0;">🔑 Mật khẩu</td><td style="padding: 8px 0; font-weight: bold; color: #ffd700;">${TEMP_PASSWORD}</td></tr>
      </table>
    </div>

    <div style="background: #1a2744; border-radius: 12px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #53d769; margin-top: 0;">📦 Gói Phở Đặc Biệt bao gồm:</h3>
      <ul style="padding-left: 20px; line-height: 2;">
        <li>💬 <strong>2,000,000 Phở Points/tháng</strong></li>
        <li>🤖 Unlimited Tier 1 &amp; 2 AI models (GPT-4o, Gemini 2.5, Claude...)</li>
        <li>📎 <strong>Upload file</strong> để phân tích &amp; tóm tắt nội dung</li>
        <li>📚 Knowledge Base — lưu trữ tài liệu thông minh</li>
        <li>🎨 Phở Studio — tạo ảnh &amp; video AI</li>
        <li>⭐ Hỗ trợ ưu tiên</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 28px 0;">
      <a href="https://pho.chat" style="display: inline-block; background: linear-gradient(135deg, #e94560, #c23152); color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Đăng nhập ngay →</a>
    </div>

    <div style="background: #2a1a0a; border: 1px solid #ffd700; border-radius: 8px; padding: 12px; margin-top: 20px;">
      <p style="margin: 0; font-size: 14px; color: #ffd700;">⚠️ <strong>Quan trọng:</strong> Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu (Settings → Profile → Password).</p>
    </div>

    <hr style="border: none; border-top: 1px solid #2a3a5a; margin: 24px 0;">
    <p style="font-size: 13px; color: #606080; text-align: center;">
      Phở Chat — Công cụ AI cá nhân, giúp bạn có một bộ não thông minh hơn 🧠<br>
      Nếu cần hỗ trợ, reply trực tiếp email này.
    </p>
  </div>
</body>
</html>`;

async function main() {
    console.log(`📧 Sending welcome email to: ${TO_EMAIL}...`);

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Tom from Phở Chat <hi@pho.chat>',
            to: [TO_EMAIL],
            subject: '🍜 Chào mừng đến Phở Chat — Gói Phở Đặc Biệt đã kích hoạt!',
            html: htmlContent,
        }),
    });

    const data = await res.json();

    if (res.ok) {
        console.log(`✅ Email sent! ID: ${data.id}`);
    } else {
        console.error('❌ Failed:', JSON.stringify(data, null, 2));
    }
}

main().catch(console.error);
