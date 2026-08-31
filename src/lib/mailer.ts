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
      htmlBody = body;
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
    } else {
      textBody = body;
      htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px;">
          ${body.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}
        </div>
      `;
    }

    const mailOptions: any = {
      from: fromAddress,
      to,
      subject,
      text: textBody,
      html: htmlBody,
    };

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
