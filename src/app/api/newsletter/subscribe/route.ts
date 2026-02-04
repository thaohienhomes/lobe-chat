import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

interface SubscribeRequest {
  email: string;
  name?: string;
  source?: string;
}

export async function POST(req: Request) {
  try {
    const body: SubscribeRequest = await req.json();
    const { email, name, source = 'blog' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
    }

    // TODO: Save to database when newsletter_subscribers table is created
    // For now, just send welcome email via Resend

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured, skipping welcome email');
      return NextResponse.json({
        message: 'Đăng ký thành công! Cảm ơn bạn đã quan tâm.',
        success: true,
      });
    }

    // Send welcome email via Resend
    const welcomeHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a1a; color: #e0e0e0; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .header { text-align: center; margin-bottom: 32px; }
            .logo { font-size: 48px; }
            h1 { color: #a855f7; margin: 16px 0; }
            .content { background: rgba(255,255,255,0.05); border-radius: 16px; padding: 32px; }
            p { line-height: 1.8; color: #ccc; }
            .cta { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; }
            .footer { text-align: center; margin-top: 32px; color: #888; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">🍜</div>
              <h1>Chào mừng đến với Phở Chat!</h1>
            </div>
            <div class="content">
              <p>Xin chào${name ? ` ${name}` : ''},</p>
              <p>Cảm ơn bạn đã đăng ký nhận newsletter từ <strong>Phở Chat</strong>! Bạn sẽ nhận được các cập nhật về:</p>
              <ul>
                <li>🔬 Tin tức AI mới nhất trong nghiên cứu y sinh học</li>
                <li>🚀 Tính năng mới và cập nhật sản phẩm</li>
                <li>💡 Tips & tricks sử dụng AI hiệu quả</li>
                <li>📚 Hướng dẫn sử dụng các công cụ nghiên cứu</li>
              </ul>
              <p>Chúng tôi sẽ gửi newsletter <strong>mỗi tuần hoặc hai tuần một lần</strong>.</p>
              <p style="text-align: center;">
                <a href="https://pho.chat" class="cta">Khám phá Phở Chat</a>
              </p>
            </div>
            <div class="footer">
              <p>© 2026 Phở Chat - Made with 💜 in Vietnam</p>
              <p>Bạn nhận được email này vì đã đăng ký từ ${source}.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from: 'Phở Chat <hi@pho.chat>',
        html: welcomeHtml,
        subject: '🍜 Chào mừng đến với Phở Chat Newsletter!',
        to: email,
      }),
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.json();
      console.error('Resend API error:', errorData);
      // Still return success to user, just log the error
    }

    return NextResponse.json({
      message: 'Đăng ký thành công! Kiểm tra email để nhận thư chào mừng.',
      success: true,
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Có lỗi xảy ra, vui lòng thử lại sau.' }, { status: 500 });
  }
}
