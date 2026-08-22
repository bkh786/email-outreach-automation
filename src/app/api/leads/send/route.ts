import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, userConfig, profile } = body;

    if (!lead || !lead.email) {
      return NextResponse.json(
        { success: false, error: 'Recipient email address is required' },
        { status: 400 }
      );
    }

    if (!lead.email_subject || !lead.email_body) {
      return NextResponse.json(
        { success: false, error: 'Draft subject and body are required to send' },
        { status: 400 }
      );
    }

    // Check if user has provided active SMTP credentials
    const hasSmtpCredentials = 
      userConfig?.smtp_host && 
      userConfig?.smtp_user && 
      userConfig?.smtp_pass;

    if (!hasSmtpCredentials) {
      // In demo mode or without live SMTP, simulate a successful dispatch
      console.log(`[DEMO DISPATCH] To: ${lead.email} | Subject: ${lead.email_subject}`);
      return NextResponse.json({
        success: true,
        simulated: true,
        message: 'Email dispatch simulated successfully (configure SMTP in Settings to send via real inbox)',
        messageId: `sim-${Date.now()}`,
      });
    }

    const smtpConfig = {
      host: userConfig.smtp_host,
      port: userConfig.smtp_port || 587,
      user: userConfig.smtp_user,
      pass: userConfig.smtp_pass,
      secure: userConfig.smtp_secure ?? false,
      fromName: userConfig.from_name || profile?.company_name || 'Freight Operations',
      fromEmail: userConfig.from_email || userConfig.smtp_user,
    };

    const dispatchResult = await sendEmail({
      config: smtpConfig,
      to: lead.email,
      subject: lead.email_subject,
      body: lead.email_body,
    });

    if (!dispatchResult.success) {
      return NextResponse.json(
        { success: false, error: dispatchResult.error || 'SMTP delivery failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      simulated: false,
      messageId: dispatchResult.messageId,
      message: 'Email delivered via SMTP transport!',
    });
  } catch (error: any) {
    console.error('Send API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error during email dispatch' },
      { status: 500 }
    );
  }
}
