export const DEFAULT_WELCOME_SUBJECT = 'Welcome to {{business_name}} — Your Outreach Portal Credentials';

export const DEFAULT_WELCOME_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to {{business_name}}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #0891b2 100%); padding: 32px 36px; text-align: left;">
              <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Welcome to Your Logistics Workspace</h1>
              <p style="margin: 0; color: #ccfbf1; font-size: 14px; font-weight: 500;">Provisioned for {{business_name}}</p>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 36px;">
              <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Dear <strong>{{name}}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Your dedicated client tenant workspace on the <strong>MarketPulse Outreach & Automation Portal</strong> has been successfully provisioned. You can now access your portal to configure trade lanes, enrich freight prospects, and run automated client acquisition pipelines.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0d9488; border-radius: 10px; margin: 24px 0;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #0d9488; letter-spacing: 0.5px;">
                      Your Isolated Access Credentials
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="4" border="0" style="font-size: 13px;">
                      <tr>
                        <td width="38%" style="color: #64748b; font-weight: 600;">Portal URL:</td>
                        <td style="color: #0f172a; font-family: monospace; font-weight: 600;">
                          <a href="{{login_url}}" target="_blank" style="color: #0d9488; text-decoration: none;">{{login_url}}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Login Email:</td>
                        <td style="color: #0f172a; font-family: monospace; font-weight: 600;">{{login_email}}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Temporary Password:</td>
                        <td style="color: #059669; font-family: monospace; font-weight: 700;">{{temporary_password}}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Contact Phone:</td>
                        <td style="color: #0f172a; font-family: monospace;">{{contact_number}}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="{{login_url}}" target="_blank" style="display: inline-block; background-color: #0d9488; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 8px rgba(13,148,136,0.3);">
                      Log In to Your Workspace &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps Checklist -->
              <p style="margin: 20px 0 8px 0; font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                Recommended Onboarding Steps:
              </p>
              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 13px; color: #475569; line-height: 1.7;">
                <li>Log in to your workspace and change your temporary password under <strong>Settings &amp; BYOK</strong>.</li>
                <li>Connect your outbound corporate email account (M365, Google Workspace, or SMTP).</li>
                <li>Customize your trade corridors and freight service capabilities.</li>
              </ul>

              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b;">
                Need help or have questions? Simply reply directly to this email or contact our support team.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                &copy; MarketPulse AI Automation Platform &bull; Dedicated Freight Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
