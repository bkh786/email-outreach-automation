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

    // Convert plain text newlines into HTML paragraphs while preserving plain text
    const htmlBody = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.6; color: #222222; max-width: 600px;">
        ${body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}
      </div>
    `;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text: body,
      html: htmlBody,
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email dispatch error:', error);
    return { success: false, error: error.message || 'Failed to dispatch email.' };
  }
}
