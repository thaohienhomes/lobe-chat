import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { users } from '@/database/schemas';
import { getServerDB } from '@/database/server';

/**
 * Generate unsubscribe confirmation page HTML
 */
function generateUnsubscribeHtml(success: boolean, errorMessage: string): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Đã hủy đăng ký' : 'Lỗi'} - Phở.chat</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0B0E14;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 400px;
      padding: 40px;
      text-align: center;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    p {
      color: rgba(255,255,255,0.7);
      font-size: 15px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    .error { color: #ef4444; }
    a {
      display: inline-block;
      padding: 12px 28px;
      background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
      color: #fff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    a:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    ${
      success
        ? `
      <div class="icon">✅</div>
      <h1>Đã hủy đăng ký thành công</h1>
      <p>Bạn sẽ không nhận được email cập nhật từ Phở.chat nữa. Bạn có thể đăng ký lại bất cứ lúc nào trong cài đặt tài khoản.</p>
    `
        : `
      <div class="icon">❌</div>
      <h1>Có lỗi xảy ra</h1>
      <p class="error">${errorMessage}</p>
    `
    }
    <a href="https://pho.chat">Quay về Phở.chat</a>
  </div>
</body>
</html>
`.trim();
}

/**
 * GET /api/newsletter/unsubscribe?email=xxx
 * Unsubscribe a user from newsletter
 */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
      return new NextResponse(generateUnsubscribeHtml(false, 'Email không hợp lệ'), {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    const decodedEmail = decodeURIComponent(email);
    const serverDB = await getServerDB();

    // Find user by email
    const user = await serverDB.query.users.findFirst({
      where: eq(users.email, decodedEmail),
    });

    if (!user) {
      return new NextResponse(
        generateUnsubscribeHtml(false, 'Email không tìm thấy trong hệ thống'),
        { headers: { 'Content-Type': 'text/html' } },
      );
    }

    // Update user to unsubscribe from newsletter
    // Store unsubscribe flag in preference JSONB
    const currentPref = (user.preference || {}) as Record<string, unknown>;
    await serverDB
      .update(users)
      .set({
        preference: {
          ...currentPref,
          newsletterUnsubscribed: true,
        },
      })
      .where(eq(users.id, user.id));

    return new NextResponse(generateUnsubscribeHtml(true, ''), {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return new NextResponse(
      generateUnsubscribeHtml(false, 'Có lỗi xảy ra. Vui lòng thử lại sau.'),
      { headers: { 'Content-Type': 'text/html' } },
    );
  }
}
