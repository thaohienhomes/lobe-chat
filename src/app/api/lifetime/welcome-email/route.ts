import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const SEGMENT_ID = process.env.RESEND_SEGMENT_ID || '820dd0bd-dee5-4361-92ef-2775a6124686';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hi@pho.chat';

// In-memory cache for idempotency (in production, use Redis or DB)
const processedEmails = new Set<string>();

// Generate HTML email template
function generateWelcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Pho.chat Lifetime</title>
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

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 700; color: #ffffff; text-align: center; line-height: 1.3;">
                Welcome to the Lifetime Club! 🎉
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.7); text-align: center;">
                Hey ${name},<br><br>
                Your payment was successful and your <strong style="color: #22c55e;">Lifetime Access</strong> is now active!
              </p>
            </td>
          </tr>

          <!-- Features Box -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.2); border-radius: 12px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; font-size: 14px; color: #a855f7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      What's Included
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 2;">
                      <li>GPT-4o, Claude 3.5, Gemini Pro & more</li>
                      <li>Monthly credits that reset automatically</li>
                      <li>All future platform updates</li>
                      <li>Priority support access</li>
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="https://pho.chat/chat" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 20px rgba(124,58,237,0.4);">
                Get Started →
              </a>
              <p style="margin: 16px 0 0; font-size: 13px; color: rgba(255,255,255,0.4);">
                Click above to start chatting with AI
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05);">
              <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.4); text-align: center;">
                Questions? Just reply to this email - we're here to help!
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3); text-align: center;">
                © 2025 Pho.chat · <a href="https://pho.chat/privacy" style="color: rgba(255,255,255,0.4); text-decoration: underline;">Privacy</a> · <a href="https://pho.chat/terms" style="color: rgba(255,255,255,0.4); text-decoration: underline;">Terms</a>
              </p>
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { checkout_id, email, name } = body;

    // Validate required fields
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Idempotency check - prevent duplicate processing
    const idempotencyKey = `${checkout_id || email}`;
    if (processedEmails.has(idempotencyKey)) {
      console.log(`[Welcome Email] Skipping duplicate for: ${email}`);
      return NextResponse.json({ message: 'Already processed', skipped: true });
    }

    console.log(`[Welcome Email] Processing for: ${email}`);

    // Step 1: Add contact to Resend audience/segment
    try {
      await resend.contacts.create({
        audienceId: SEGMENT_ID,
        email: email,
        firstName: name || 'Lifetime Member',
        unsubscribed: false,
      });
      console.log(`[Welcome Email] Contact added to segment: ${email}`);
    } catch (contactError: unknown) {
      // If contact already exists, continue (not an error)
      const errorMessage = contactError instanceof Error ? contactError.message : '';
      if (errorMessage.includes('already exists')) {
        console.log(`[Welcome Email] Contact already exists: ${email}`);
      } else {
        console.error('[Welcome Email] Error adding contact:', contactError);
      }
    }

    // Step 2: Send welcome email
    const { data, error } = await resend.emails.send({
      from: `Pho.chat <${FROM_EMAIL}>`,
      html: generateWelcomeEmailHtml(name || 'there'),
      subject: '🎉 Welcome to Pho.chat Lifetime! Your access is ready',
      to: email,
    });

    if (error) {
      console.error('[Welcome Email] Send error:', error);
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    // Mark as processed
    processedEmails.add(idempotencyKey);

    console.log(`[Welcome Email] Sent successfully to: ${email}, ID: ${data?.id}`);

    return NextResponse.json({
      emailId: data?.id,
      message: 'Welcome email sent successfully',
      success: true,
    });
  } catch (error) {
    console.error('[Welcome Email] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
