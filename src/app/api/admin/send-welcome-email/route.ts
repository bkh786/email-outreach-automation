import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/mailer';
import { DEFAULT_WELCOME_SUBJECT, DEFAULT_WELCOME_TEMPLATE } from '@/lib/welcome-constants';
import { getSuperAdminContext, getSuperAdminSmtpConfig } from '@/lib/super-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      tenantId,
      email,
      company_name,
      contact_person,
      contact_number,
      temporary_password,
      customSubject,
      customBody,
    } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Recipient email is required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let callerUserId: string | null = null;
    try {
      const serverSupabase = createServerSupabaseClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        callerUserId = user.id;
      }
    } catch {
      // ignore
    }

    // Determine platform URL
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://marketpulse.ai';
    const loginUrl = `${origin}/login`;

    // 1. Fetch Welcome Email Template if not directly provided
    let rawSubject = customSubject || DEFAULT_WELCOME_SUBJECT;
    let rawTemplate = customBody || DEFAULT_WELCOME_TEMPLATE;

    if (!customSubject || !customBody) {
      try {
        const superAdminCtx = await getSuperAdminContext(supabase, callerUserId);
        if (superAdminCtx?.config?.welcome_email_template) {
          rawTemplate = customBody || superAdminCtx.config.welcome_email_template;
          if (!customSubject && superAdminCtx.config.welcome_email_subject) {
            rawSubject = superAdminCtx.config.welcome_email_subject;
          }
        }
      } catch (e) {
        console.error('Error loading template for resend:', e);
      }
    }

    // 2. Interpolate Dynamic Variables
    const safeContactPerson = contact_person || 'Operations Lead';
    const safeContactNumber = contact_number || 'N/A';
    const safeCompanyName = company_name || 'Partner Agency';
    const safePassword = temporary_password || '•••••••••••• (Encrypted on file)';

    const interpolate = (str: string) => {
      return str
        .replace(/{{\s*name\s*}}/gi, safeContactPerson)
        .replace(/{{\s*contact_person\s*}}/gi, safeContactPerson)
        .replace(/{{\s*business_name\s*}}/gi, safeCompanyName)
        .replace(/{{\s*company_name\s*}}/gi, safeCompanyName)
        .replace(/{{\s*contact_number\s*}}/gi, safeContactNumber)
        .replace(/{{\s*phone\s*}}/gi, safeContactNumber)
        .replace(/{{\s*login_email\s*}}/gi, email)
        .replace(/{{\s*email\s*}}/gi, email)
        .replace(/{{\s*temporary_password\s*}}/gi, safePassword)
        .replace(/{{\s*password\s*}}/gi, safePassword)
        .replace(/{{\s*login_url\s*}}/gi, loginUrl);
    };

    const finalSubject = interpolate(rawSubject);
    const finalBody = interpolate(rawTemplate);

    // 3. Dispatch via strictly isolated Super Admin SMTP
    const superAdminSmtpRes = await getSuperAdminSmtpConfig(supabase, callerUserId);

    if (!superAdminSmtpRes || !superAdminSmtpRes.smtpConfig) {
      return NextResponse.json({
        success: false,
        error: 'Super Admin SMTP credentials are not configured in Settings & BYOK.',
        simulated: true,
        subject: finalSubject,
        body: finalBody,
      }, { status: 400 });
    }

    const { smtpConfig } = superAdminSmtpRes;
    const result = await sendEmail({
      config: smtpConfig,
      to: email,
      subject: finalSubject,
      body: finalBody,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error || 'Super Admin SMTP dispatch failed',
        subject: finalSubject,
        body: finalBody,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Welcome onboarding email successfully dispatched to ${email} via Super Admin SMTP (${smtpConfig.host})!`,
      messageId: result.messageId,
      provider: smtpConfig.host,
      fromAddress: `${smtpConfig.fromName} <${smtpConfig.fromEmail || smtpConfig.user}>`,
      subject: finalSubject,
      body: finalBody,
    });
  } catch (error: any) {
    console.error('Send welcome email error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send welcome email' },
      { status: 500 }
    );
  }
}
