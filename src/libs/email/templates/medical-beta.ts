export const generateMedicalBetaEmail = (name: string) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Phở Medical Beta</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0B0E14; color: #EEEEEE;">
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

          <!-- Main Content (English) -->
          <tr>
            <td style="padding: 0 40px 24px;">
              <h1 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #10B981; text-align: center; line-height: 1.3;">
                Welcome to Phở Medical Beta! 🏥
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: rgba(255,255,255,0.8);">
                Dear <strong>${name}</strong>,<br><br>
                Thank you for joining the <strong>Phở Medical Beta</strong> program. Your account has been upgraded, giving you priority access to our specialized medical AI assistant.
              </p>
              
              <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 12px; font-size: 14px; color: #34D399; font-weight: 600; text-transform: uppercase;">
                  WHAT'S INCLUDED
                </p>
                <ul style="margin: 0; padding: 0 0 0 20px; color: rgba(255,255,255,0.9); font-size: 15px; line-height: 1.8;">
                   <li><strong>6+ Specialized Medical Plugins:</strong>
                      <ul style="margin-top: 4px; color: rgba(255,255,255,0.7);">
                        <li>PubMed & ArXiv Search</li>
                        <li>Drug Interaction Check</li>
                        <li>Clinical Calculator</li>
                        <li>Semantic Scholar & DOI Resolver</li>
                      </ul>
                   </li>
                   <li><strong>Priority Processing:</strong> Skip the queue.</li>
                   <li><strong>Enhanced Privacy:</strong> Zero data retention option.</li>
                </ul>
              </div>

               <div style="text-align: center; margin-bottom: 32px;">
                <a href="https://pho.chat/chat" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #059669 0%, #10B981 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 10px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);">
                  Launch Medical Studio →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: rgba(0,0,0,0.3); border-top: 1px solid rgba(255,255,255,0.05); text-align: center;">
              <p style="margin: 0 0 8px; font-size: 13px; color: rgba(255,255,255,0.4);">
                Questions? Reply to this email.
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.3);">
                © 2026 Pho.chat · <a href="https://pho.chat/privacy" style="color: rgba(255,255,255,0.4); text-decoration: none;">Privacy</a> · <a href="https://pho.chat/terms" style="color: rgba(255,255,255,0.4); text-decoration: none;">Terms</a>
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
};
