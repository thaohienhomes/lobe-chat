import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

import { requireAdmin } from '@/app/api/admin/_shared/auth';
import { PHO_CHANGELOGS, PHO_CHANGELOG_CONTENT } from '@/const/changelog';
import { getServerDB } from '@/database/server';
import { checkRateLimit, newsletterRateLimiter } from '@/middleware/rate-limit';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hi@pho.chat';

interface NewsletterRequestBody {
  changelogId?: string;
  testEmail?: string; // For testing - send only to this email
}

/**
 * Generate newsletter email HTML
 */
function generateNewsletterHtml(title: string, content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0E14;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0B0E14; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #141821; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.08);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <img src="https://pho.chat/images/logo_text.png" alt="Pho.chat" width="140" style="display: block; margin: 0 auto;">
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 0 40px 16px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; text-align: center; line-height: 1.3;">
                ${title}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <div style="font-size: 15px; line-height: 1.7; color: rgba(255,255,255,0.8);">
                ${content
      .split('\n')
      .map((line) => {
        if (line.startsWith('## ')) {
          return `<h2 style="margin: 24px 0 12px; font-size: 18px; font-weight: 600; color: #a855f7;">${line.replace('## ', '')}</h2>`;
        }
        if (line.startsWith('### ')) {
          return `<h3 style="margin: 16px 0 8px; font-size: 16px; font-weight: 600; color: #ffffff;">${line.replace('### ', '')}</h3>`;
        }
        if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.+?)\*\*:?\s*(.+)?/);
          if (match) {
            return `<p style="margin: 8px 0; padding-left: 16px;">• <strong style="color: #22c55e;">${match[1]}</strong>${match[2] ? ': ' + match[2] : ''}</p>`;
          }
        }
        if (line.startsWith('- ')) {
          return `<p style="margin: 8px 0; padding-left: 16px;">• ${line.replace('- ', '')}</p>`;
        }
        if (line.trim() === '') return '';
        return `<p style="margin: 8px 0;">${line}</p>`;
      })
      .join('')}
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://pho.chat/changelog" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 20px rgba(124,58,237,0.4);">
                Xem Chi Tiết →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0,0,0,0.2); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.5);">
                Bạn nhận được email này vì đã đăng ký Phở.chat Newsletter.
              </p>
              <a href="https://pho.chat/api/newsletter/unsubscribe?email={{email}}" style="font-size: 12px; color: rgba(255,255,255,0.4); text-decoration: underline;">
                Hủy đăng ký nhận tin
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * POST /api/newsletter/send
 * Send newsletter to all subscribed users
 */
export async function POST(request: NextRequest) {
  try {
    // Admin-only access
    const denied = await requireAdmin();
    if (denied) return denied;

    // Rate limit (very strict — 3 per hour)
    const rl = await checkRateLimit(request, 'admin-newsletter', newsletterRateLimiter);
    if (!rl.allowed) {
      return NextResponse.json({ error: rl.reason }, { status: 429 });
    }

    const body: NewsletterRequestBody = await request.json();
    const { changelogId, testEmail } = body;

    // Get changelog content
    let title = 'Cập nhật mới từ Phở.chat';
    let content = '';

    if (changelogId && PHO_CHANGELOG_CONTENT[changelogId]) {
      const changelog = PHO_CHANGELOG_CONTENT[changelogId];
      title = changelog.titleVi || changelog.title;
      content = changelog.contentVi || changelog.content;
    } else if (PHO_CHANGELOGS.length > 0) {
      // Use latest changelog
      const latestId = PHO_CHANGELOGS[0].id;
      const latest = PHO_CHANGELOG_CONTENT[latestId];
      if (latest) {
        title = latest.titleVi || latest.title;
        content = latest.contentVi || latest.content;
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'No changelog content found' }, { status: 400 });
    }

    const emailHtml = generateNewsletterHtml(title, content);

    // If test email provided, only send to that email
    if (testEmail) {
      const { data, error } = await resend.emails.send({
        from: `Phở.chat <${FROM_EMAIL}>`,
        html: emailHtml.replace('{{email}}', encodeURIComponent(testEmail)),
        subject: `📬 ${title}`,
        to: testEmail,
      });

      if (error) {
        console.error('Failed to send test email:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        emailId: data?.id,
        message: 'Test email sent successfully',
      });
    }

    // Get database
    const serverDB = await getServerDB();

    // Get all users with email who haven't unsubscribed
    // Query from database
    const users = await serverDB.query.users.findMany({
      columns: {
        email: true,
        firstName: true,
        fullName: true,
      },
      limit: 100,
      where: (users, { isNotNull }) => isNotNull(users.email), // Limit for safety during initial testing
    });

    if (users.length === 0) {
      return NextResponse.json({
        message: 'No subscribers found',
        sentCount: 0,
      });
    }

    // Send batch emails using Resend
    const results = await Promise.allSettled(
      users.map(async (user) => {
        if (!user.email) return null;

        const { data, error } = await resend.emails.send({
          from: `Phở.chat <${FROM_EMAIL}>`,
          html: emailHtml.replace('{{email}}', encodeURIComponent(user.email)),
          subject: `📬 ${title}`,
          to: user.email,
        });

        if (error) {
          console.error(`Failed to send to ${user.email}:`, error);
          return { email: user.email, error: error.message };
        }

        return { email: user.email, id: data?.id };
      }),
    );

    let successful = 0;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value && !('error' in r.value)) {
        successful++;
      }
    }
    const failed = results.length - successful;

    return NextResponse.json({
      failedCount: failed,
      message: 'Newsletter sent',
      sentCount: successful,
      total: users.length,
    });
  } catch (error) {
    console.error('Newsletter send error:', error);
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 });
  }
}
