import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection, sendEmail } from '@/lib/mailer';

export async function POST(req: NextRequest) {
  try {
    const { config, sendTestMessage, testRecipient } = await req.json();

    if (!config || !config.host || !config.user || !config.pass) {
      return NextResponse.json(
        { success: false, error: 'SMTP Host, User, and Password are required.' },
        { status: 400 }
      );
    }

    const verification = await verifySmtpConnection(config);
    if (!verification.success) {
      return NextResponse.json(
        { success: false, error: verification.message },
        { status: 400 }
      );
    }

    if (sendTestMessage && testRecipient) {
      const dispatch = await sendEmail({
        config,
        to: testRecipient,
        subject: 'FreightPulse AI — SMTP Verification Test',
        body: `Hello,\n\nThis is a confirmation test email sent from FreightPulse AI using your custom SMTP configuration (${config.host}:${config.port}).\n\nYour outbound email automation pipeline is ready for production outreach!\n\nBest regards,\nFreightPulse System Engine`,
      });

      if (!dispatch.success) {
        return NextResponse.json(
          { success: false, error: `Connection OK, but test email failed: ${dispatch.error}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: sendTestMessage
        ? `SMTP verified and test email successfully dispatched to ${testRecipient}!`
        : 'SMTP connection verified successfully!',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'SMTP testing error' },
      { status: 500 }
    );
  }
}
