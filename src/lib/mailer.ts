import nodemailer from 'nodemailer';
import { SmtpConfig } from './types';

export async function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: Number(config.port) || 587,
    secure: Boolean(config.secure), // true for 465, false for 587
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Prevents self-signed cert blocks on custom corporate relays
    },
    connectionTimeout: 10000,
  });
}

export async function verifySmtpConnection(config: SmtpConfig): Promise<{ success: boolean; message: string }> {
  try {
    if (!config.host || !config.user || !config.pass) {
      return { success: false, message: 'Host, username, and password are required.' };
    }

    const transporter = await createTransporter(config);
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Failed to authenticate with SMTP server.',
    };
  }
}

export async function sendEmail({
  config,
  to,
  subject,
  body,
}: {
  config: SmtpConfig;
  to: string;
  subject: string;
  body: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const transporter = await createTransporter(config);

    const fromAddress = config.fromName 
      ? `"${config.fromName}" <${config.fromEmail || config.user}>`
      : (config.fromEmail || config.user);

    // Check if the body contains HTML tags
    const isHtml = /<[a-z][\s\S]*>/i.test(body);

    let htmlBody = '';
    let textBody = '';

    if (isHtml) {
      // Convert HTML to simple plain text alternative for email clients that don't support HTML
      textBody = body
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/p>|<\/div>|<\/tr>|<br\s*\/?>/gi, '\n')
        .replace(/<\/td>|<\/th>/gi, '  ')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

      const hasFullHtmlDoc = /<html[\s\S]*>/i.test(body);
      htmlBody = hasFullHtmlDoc ? body : wrapEmailWithDesktopContainer(body);
    } else {
      textBody = body;
      const formattedTextHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;">
          ${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}
        </div>
      `;
      htmlBody = wrapEmailWithDesktopContainer(formattedTextHtml);
    }

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    };

    // Attach CC recipients if enabled
    if (config.cc_enabled && config.cc_emails) {
      const ccList = config.cc_emails
        .split(/[,;\s]+/)
        .map(e => e.trim())
        .filter(e => e.includes('@'));
      if (ccList.length > 0) {
        mailOptions.cc = ccList;
      }
    }

    // Attach BCC recipients if enabled
    if (config.bcc_enabled && config.bcc_emails) {
      const bccList = config.bcc_emails
        .split(/[,;\s]+/)
        .map(e => e.trim())
        .filter(e => e.includes('@'));
      if (bccList.length > 0) {
        mailOptions.bcc = bccList;
      }
    }

    if (Array.isArray(config.attachments) && config.attachments.length > 0) {
      mailOptions.attachments = config.attachments;
    }

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    return { success: false, error: error.message || 'Failed to dispatch email.' };
  }
}

/**
 * Wraps HTML email content inside a standard desktop container table (max-width 620px).
 * Prevents desktop email clients (especially Gmail and Outlook) from stretching emails across ultra-wide monitors.
 */
export function wrapEmailWithDesktopContainer(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
    }
    * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; box-sizing: border-box; }
    table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }
    img { -ms-interpolation-mode: bicubic; }
    p { margin: 0 0 16px 0; }
    a { color: #0d9488; }
  </style>
</head>
<body style="margin: 0; padding: 24px 16px; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b;">
  <!-- Desktop Max-Width Constraint Table (strictly prevents horizontal stretching on desktop Gmail/Outlook) -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width: 100%; max-width: 620px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14.5px; line-height: 1.65; color: #1e293b; padding: 0;">
        ${content}
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

