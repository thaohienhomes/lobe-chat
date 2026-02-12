/**
 * Generic Welcome Email Template
 * Used for all plan subscriptions (VN plans, Global plans, Lifetime, Medical Beta)
 * Template auto-selects content based on planId
 */

interface WelcomeEmailConfig {
  accentColor: string;
  ctaText: string;
  ctaUrl: string;
  features: string[];
  planDisplayName: string;
  subject: string;
  tagline: string;
}

/**
 * Get email configuration based on planId
 */
function getEmailConfig(planId: string): WelcomeEmailConfig {
  // Lifetime plans (Polar)
  if (planId.startsWith('lifetime_') || planId === 'gl_lifetime') {
    return {
      accentColor: '#7c3aed',
      ctaText: 'Start Chatting →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        'GPT-4o, Claude 3.5, Gemini Pro & more',
        'Monthly credits that reset automatically',
        'All future platform updates',
        'Priority support access',
      ],
      planDisplayName: 'Lifetime Club',
      subject: '🎉 Welcome to Pho.chat Lifetime! Your access is ready',
      tagline: 'Your Lifetime Access is now active!',
    };
  }

  // Medical Beta
  if (planId === 'medical_beta') {
    return {
      accentColor: '#10B981',
      ctaText: 'Launch Medical Studio →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        '<strong>6+ Specialized Medical Plugins:</strong> PubMed, ArXiv, Drug Interaction Check, Clinical Calculator, Semantic Scholar & DOI Resolver',
        '<strong>Priority Processing:</strong> Skip the queue',
        '<strong>Enhanced Privacy:</strong> Zero data retention option',
        '500,000 Phở Points/month',
      ],
      planDisplayName: 'Medical Beta',
      subject: '🏥 Welcome to Phở Medical Beta!',
      tagline: 'Your Medical Beta access is now active!',
    };
  }

  // VN Ultimate (Phở Pro)
  if (planId === 'vn_ultimate') {
    return {
      accentColor: '#f59e0b',
      ctaText: 'Bắt đầu ngay →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        '5M Phở Points/tháng',
        'Unlimited Tier 1 & 2 models (GPT-4o, Claude 3.5, Gemini Pro)',
        '100 Tier 3 messages/day',
        'Phở Studio access ✨',
        'Priority support',
      ],
      planDisplayName: 'Phở Pro (Ultimate)',
      subject: '🍜 Chào mừng bạn đến với Phở Pro!',
      tagline: 'Gói Phở Pro (Ultimate) đã được kích hoạt!',
    };
  }

  // VN Pro (Phở Đặc Biệt / Premium)
  if (planId === 'vn_pro') {
    return {
      accentColor: '#8b5cf6',
      ctaText: 'Bắt đầu ngay →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        '2M Phở Points/tháng',
        'Unlimited Tier 1 & 2 models',
        '50 Tier 3 messages/day',
        'Phở Studio access ✨',
      ],
      planDisplayName: 'Phở Đặc Biệt (Premium)',
      subject: '🍜 Chào mừng bạn đến với Phở Đặc Biệt!',
      tagline: 'Gói Phở Đặc Biệt (Premium) đã được kích hoạt!',
    };
  }

  // VN Basic (Phở Tái / Starter)
  if (planId === 'vn_basic') {
    return {
      accentColor: '#06b6d4',
      ctaText: 'Bắt đầu ngay →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        '300,000 Phở Points/tháng',
        'Unlimited Tier 1 models',
        '30 Tier 2 messages/day',
        'File upload & conversation history',
      ],
      planDisplayName: 'Phở Tái (Starter)',
      subject: '🍜 Chào mừng bạn đến với Phở Tái!',
      tagline: 'Gói Phở Tái (Starter) đã được kích hoạt!',
    };
  }

  // VN Team
  if (planId === 'vn_team') {
    return {
      accentColor: '#ec4899',
      ctaText: 'Bắt đầu ngay →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        'All Premium features',
        'Admin Dashboard',
        'Pooled points for team',
        'User management & usage analytics',
      ],
      planDisplayName: 'Lẩu Phở (Team)',
      subject: '🍜 Chào mừng team bạn đến với Lẩu Phở!',
      tagline: 'Gói Lẩu Phở (Team) đã được kích hoạt!',
    };
  }

  // Global Premium
  if (planId === 'gl_premium') {
    return {
      accentColor: '#8b5cf6',
      ctaText: 'Start Chatting →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        'Unlimited Tier 1 & 2 models',
        '50 Tier 3 messages/day',
        '2M Phở Points/month',
        'Priority support',
      ],
      planDisplayName: 'Premium',
      subject: '🎉 Welcome to Pho.chat Premium!',
      tagline: 'Your Premium access is now active!',
    };
  }

  // Global Standard
  if (planId === 'gl_standard') {
    return {
      accentColor: '#06b6d4',
      ctaText: 'Start Chatting →',
      ctaUrl: 'https://pho.chat/chat',
      features: [
        'Unlimited Tier 1 models',
        '30 Tier 2 messages/day',
        '300K Phở Points/month',
        'Conversation history',
      ],
      planDisplayName: 'Standard',
      subject: '🎉 Welcome to Pho.chat Standard!',
      tagline: 'Your Standard plan is now active!',
    };
  }

  // Default fallback
  return {
    accentColor: '#7c3aed',
    ctaText: 'Start Chatting →',
    ctaUrl: 'https://pho.chat/chat',
    features: ['AI-powered conversations', 'Multiple AI models', 'Monthly credits allocation'],
    planDisplayName: planId,
    subject: '🎉 Welcome to Pho.chat!',
    tagline: 'Your account has been upgraded!',
  };
}

// ============================================================================
// Helper utilities
// ============================================================================

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function lightenColor(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
  const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Generate welcome email HTML for any plan
 */
export function generateWelcomeEmailHtml(name: string, planId: string): string {
  const config = getEmailConfig(planId);

  const featuresHtml = config.features.map((f) => `<li>${f}</li>`).join('\n                      ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Pho.chat</title>
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
                Welcome to ${config.planDisplayName}! 🎉
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.7; color: rgba(255,255,255,0.7); text-align: center;">
                Hey <strong>${name}</strong>,<br><br>
                ${config.tagline}
              </p>
            </td>
          </tr>

          <!-- Features Box -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${hexToRgba(config.accentColor, 0.1)}; border: 1px solid ${hexToRgba(config.accentColor, 0.2)}; border-radius: 12px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px; font-size: 14px; color: ${config.accentColor}; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
                      What's Included
                    </p>
                    <ul style="margin: 0; padding: 0 0 0 20px; color: rgba(255,255,255,0.8); font-size: 15px; line-height: 2;">
                      ${featuresHtml}
                    </ul>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 40px 40px; text-align: center;">
              <a href="${config.ctaUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, ${config.accentColor} 0%, ${lightenColor(config.accentColor)} 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 20px ${hexToRgba(config.accentColor, 0.4)};">
                ${config.ctaText}
              </a>
              <p style="margin: 16px 0 0; font-size: 13px; color: rgba(255,255,255,0.4);">
                Click above to start using your upgraded plan
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
                © 2026 Pho.chat · <a href="https://pho.chat/privacy" style="color: rgba(255,255,255,0.4); text-decoration: underline;">Privacy</a> · <a href="https://pho.chat/terms" style="color: rgba(255,255,255,0.4); text-decoration: underline;">Terms</a>
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

/**
 * Get the email subject line for a given planId
 */
export function getWelcomeEmailSubject(planId: string): string {
  return getEmailConfig(planId).subject;
}
