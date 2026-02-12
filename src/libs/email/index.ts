import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hi@pho.chat';

export interface EmailOptions {
  html: string;
  subject: string;
  text?: string;
  to: string;
}

export const EmailService = {
  /**
   * Send an email using Resend
   */
  send: async ({ to, subject, html, text }: EmailOptions) => {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.warn('⚠️ RESEND_API_KEY not found. Email sending skipped.');
        return { error: 'Missing API Key', success: false };
      }

      const { data, error } = await resend.emails.send({
        from: `Phở Chat <${FROM_EMAIL}>`,
        html,
        subject,
        text,
        to,
      });

      if (error) {
        console.error('❌ EmailService Error:', error);
        return { error, success: false };
      }

      console.log(`✅ Email sent to ${to} (ID: ${data?.id})`);
      return { data, success: true };
    } catch (err) {
      console.error('❌ EmailService Unexpected Error:', err);
      return { error: err, success: false };
    }
  },
};

// ============================================================================
// Centralized Welcome Email
// ============================================================================

export interface WelcomeEmailParams {
  /** User's email address */
  email: string;
  /** User's display name (firstName, fullName, or fallback) */
  name: string;
  /** The plan that was activated (e.g. 'lifetime_early_bird', 'medical_beta', 'vn_pro') */
  planId: string;
}

/**
 * Send a welcome email to a user after successful payment/activation.
 *
 * This function is plan-aware — it selects the correct template and subject
 * based on planId. It is designed to be NON-BLOCKING: all errors are caught
 * and logged internally, so it never fails the calling webhook.
 *
 * Usage from webhooks:
 * ```ts
 * const { sendWelcomeEmail } = await import('@/libs/email');
 * await sendWelcomeEmail({ email, name, planId });
 * ```
 */
export async function sendWelcomeEmail({ email, name, planId }: WelcomeEmailParams): Promise<{
  emailId?: string;
  error?: unknown;
  success: boolean;
}> {
  try {
    console.log(`📧 [WelcomeEmail] Sending for plan "${planId}" to: ${email}`);

    const { generateWelcomeEmailHtml, getWelcomeEmailSubject } = await import(
      './templates/welcome'
    );

    const subject = getWelcomeEmailSubject(planId);
    const html = generateWelcomeEmailHtml(name || 'there', planId);

    const result = await EmailService.send({
      html,
      subject,
      to: email,
    });

    if (result.success) {
      console.log(`✅ [WelcomeEmail] Sent successfully to ${email} for plan "${planId}"`);
      return { emailId: result.data?.id, success: true };
    } else {
      console.error(`⚠️ [WelcomeEmail] Failed for ${email}:`, result.error);
      return { error: result.error, success: false };
    }
  } catch (err) {
    // NEVER throw — this must be non-blocking for webhooks
    console.error(`⚠️ [WelcomeEmail] Unexpected error for ${email}:`, err);
    return { error: err, success: false };
  }
}
