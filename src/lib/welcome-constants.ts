export const DEFAULT_WELCOME_SUBJECT = 'Welcome to MarketPulse AI & Automation — Your Workspace Credentials';

export const DEFAULT_WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to MarketPulse AI & Automation</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F1F5F9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="650" cellpadding="0" cellspacing="0" border="0" style="max-width: 650px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 6px 24px rgba(0,0,0,0.07); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td align="left" style="background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%); padding: 36px 40px; color: #ffffff;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.3px; color: #ffffff;">Welcome to MarketPulse</h1>
              <p style="margin: 0; font-size: 14px; color: #94A3B8; font-weight: 500;">
                AI &amp; Workflow Automation Platform for <strong>{{business_name}}</strong>
              </p>
            </td>
          </tr>

          <!-- Welcome Message -->
          <tr>
            <td style="padding: 36px 40px 20px;">
              <p style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 14px 0;">
                Dear <strong>{{name}}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 1.7; color: #475569; margin: 0 0 20px 0;">
                Welcome to <strong>MarketPulse AI &amp; Automation</strong>! Your dedicated organization workspace for <strong>{{business_name}}</strong> has been successfully provisioned.
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
                Below are your official account credentials to access your isolated workspace:
              </p>

              <!-- Credentials Box -->
              <table role="presentation" width="100%" cellpadding="10" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #0D9488; border-radius: 10px; margin: 20px 0; font-size: 13px;">
                <tr>
                  <td width="35%" style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Platform:</td>
                  <td style="color: #0F172A; font-weight: 700; border-bottom: 1px solid #E2E8F0;">MarketPulse AI &amp; Automation</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Portal Login URL:</td>
                  <td style="border-bottom: 1px solid #E2E8F0;">
                    <a href="{{login_url}}" target="_blank" style="color: #0D9488; text-decoration: none; font-family: monospace; font-weight: 600;">
                      {{login_url}}
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Login Email:</td>
                  <td style="color: #0F172A; font-family: monospace; font-weight: 600; border-bottom: 1px solid #E2E8F0;">{{login_email}}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600; border-bottom: 1px solid #E2E8F0;">Temporary Password:</td>
                  <td style="color: #059669; font-family: monospace; font-weight: 700; border-bottom: 1px solid #E2E8F0;">{{temporary_password}}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; font-weight: 600;">Contact Phone:</td>
                  <td style="color: #0F172A; font-family: monospace;">{{contact_number}}</td>
                </tr>
              </table>

              <!-- Action CTA -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" target="_blank" style="display: inline-block; background-color: #0D9488; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 30px; border-radius: 8px; box-shadow: 0 3px 10px rgba(13,148,136,0.3);">
                      Log In to Your Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <div style="margin-top: 18px; padding: 12px 16px; background-color: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 6px; font-size: 13px; color: #92400E; line-height: 1.5;">
                <strong>Security Tip:</strong> Please change your temporary password immediately upon your first login under <em>Settings &amp; BYOK</em>.
              </div>
            </td>
          </tr>

          <!-- Getting Started -->
          <tr>
            <td style="padding: 24px 40px 10px;">
              <h2 style="font-size: 18px; color: #0F172A; border-bottom: 2px solid #E2E8F0; padding-bottom: 8px; margin: 0 0 14px 0;">
                Recommended Onboarding Steps
              </h2>
              <ol style="margin: 0 0 16px 0; padding-left: 22px; font-size: 13px; color: #475569; line-height: 1.9;">
                <li>Sign in using the credentials provided above.</li>
                <li>Navigate to <strong>Settings &rarr; AI Configuration</strong> and add your <strong>Google Gemini API Key</strong>.</li>
                <li>Navigate to <strong>Settings &rarr; Email Configuration</strong> and connect your outbound <strong>SMTP credentials</strong>.</li>
                <li>Launch your trade corridor searches and lead acquisition pipelines.</li>
              </ol>
            </td>
          </tr>

          <!-- Support -->
          <tr>
            <td style="padding: 20px 40px; background-color: #F8FAFC; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #0F172A;">Need Assistance?</p>
              <p style="margin: 0; font-size: 12px; color: #64748B; line-height: 1.6;">
                Our team is always available to assist with workflow setups and outbound integrations.<br>
                Email: <a href="mailto:contact@digipresence.in" style="color: #0D9488; text-decoration: none;">contact@digipresence.in</a> &bull; WhatsApp: <a href="https://wa.me/919064435909" style="color: #0D9488; text-decoration: none;">+91 90644 35909</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background: #0F172A; padding: 24px 30px; color: #94A3B8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #ffffff;">MarketPulse AI &amp; Automation</p>
              <p style="margin: 0;">Designed &amp; Engineered by Digi Presence Solutions &bull; <a href="https://www.digipresence.in" style="color: #5EEAD4; text-decoration: none;">www.digipresence.in</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
