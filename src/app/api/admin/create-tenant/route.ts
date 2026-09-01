import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/mailer';
import { DEFAULT_WELCOME_SUBJECT, DEFAULT_WELCOME_TEMPLATE } from '@/lib/welcome-constants';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      company_name, 
      email, 
      password, 
      contact_person, 
      contact_number,
      target_markets,
      services_offered,
      max_daily_emails 
    } = body;

    if (!company_name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Email, and Password are required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create the tenant user in Supabase Auth (auto-confirmed)
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name,
        contact_person: contact_person || 'Client Operations',
        full_name: contact_person || 'Client Operations',
        contact_number: contact_number || '',
        phone: contact_number || '',
        role: 'client',
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // 2. Insert/Update Tenant Profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      company_name,
      contact_person: contact_person || '',
      role: 'client',
      services_offered: services_offered || ['Air Freight Expedited', 'Ocean FCL/LCL', 'Customs Clearance'],
      target_markets: target_markets || ['USA', 'Europe', 'Asia'],
      unique_selling_proposition: `Dedicated freight operations and trade corridor solutions for ${company_name}.`,
      strengths_and_certifications: 'Verified Logistics Partner, IATA/WCA Network Operations.',
      email_signature: `Best regards,\n\n${contact_person || 'Operations Lead'}\n${company_name}\n${email}${contact_number ? `\nPhone: ${contact_number}` : ''}`,
      updated_at: new Date().toISOString(),
    });

    // 3. Insert/Update Tenant Config
    const { error: configError } = await supabase.from('user_configs').upsert({
      id: userId,
      from_name: `${contact_person || 'Operations'} | ${company_name}`,
      from_email: email,
      auto_send_enabled: false,
      max_daily_emails: Number(max_daily_emails) || 50,
      max_hourly_rate: 15,
      updated_at: new Date().toISOString(),
    });

    // 4. Fetch Welcome Email Template
    let rawSubject = DEFAULT_WELCOME_SUBJECT;
    let rawTemplate = DEFAULT_WELCOME_TEMPLATE;

    try {
      // Check user_configs for custom template
      const { data: configs } = await supabase
        .from('user_configs')
        .select('welcome_email_template, welcome_email_subject')
        .not('welcome_email_template', 'is', null)
        .limit(1);

      if (configs && configs[0]?.welcome_email_template) {
        rawTemplate = configs[0].welcome_email_template;
        if (configs[0].welcome_email_subject) {
          rawSubject = configs[0].welcome_email_subject;
        }
      }
    } catch (e) {
      console.error('Error loading template for tenant welcome:', e);
    }

    // Determine platform URL
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://marketpulse.ai';
    const loginUrl = `${origin}/login`;

    // 5. Interpolate Dynamic Variables into Template
    const safeContactPerson = contact_person || 'Operations Lead';
    const safeContactNumber = contact_number || 'N/A';

    const interpolate = (str: string) => {
      return str
        .replace(/{{\s*name\s*}}/gi, safeContactPerson)
        .replace(/{{\s*contact_person\s*}}/gi, safeContactPerson)
        .replace(/{{\s*business_name\s*}}/gi, company_name)
        .replace(/{{\s*company_name\s*}}/gi, company_name)
        .replace(/{{\s*contact_number\s*}}/gi, safeContactNumber)
        .replace(/{{\s*phone\s*}}/gi, safeContactNumber)
        .replace(/{{\s*login_email\s*}}/gi, email)
        .replace(/{{\s*email\s*}}/gi, email)
        .replace(/{{\s*temporary_password\s*}}/gi, password)
        .replace(/{{\s*password\s*}}/gi, password)
        .replace(/{{\s*login_url\s*}}/gi, loginUrl);
    };

    const finalSubject = interpolate(rawSubject);
    const finalBody = interpolate(rawTemplate);

    // 6. Fetch configured SMTP provider from Settings to dispatch welcome email
    let emailDispatchStatus = {
      sent: false,
      simulated: false,
      error: null as string | null,
      messageId: null as string | null,
      provider: 'None',
    };

    try {
      // Find configured SMTP settings from super admin or active user_configs
      const { data: smtpConfigs } = await supabase
        .from('user_configs')
        .select('*')
        .not('smtp_host', 'is', null)
        .not('smtp_user', 'is', null)
        .not('smtp_pass', 'is', null)
        .order('updated_at', { ascending: false });

      const activeSmtpConfig = smtpConfigs && smtpConfigs.length > 0 
        ? smtpConfigs.find(c => c.smtp_host && c.smtp_user && c.smtp_pass)
        : null;

      if (activeSmtpConfig && activeSmtpConfig.smtp_host && activeSmtpConfig.smtp_user && activeSmtpConfig.smtp_pass) {
        emailDispatchStatus.provider = activeSmtpConfig.smtp_host;

        const smtpPayload = {
          host: activeSmtpConfig.smtp_host,
          port: activeSmtpConfig.smtp_port || 587,
          user: activeSmtpConfig.smtp_user,
          pass: activeSmtpConfig.smtp_pass,
          secure: activeSmtpConfig.smtp_secure ?? false,
          fromName: activeSmtpConfig.from_name || 'MarketPulse Operations',
          fromEmail: activeSmtpConfig.from_email || activeSmtpConfig.smtp_user,
        };

        const result = await sendEmail({
          config: smtpPayload,
          to: email,
          subject: finalSubject,
          body: finalBody,
        });

        if (result.success) {
          emailDispatchStatus.sent = true;
          emailDispatchStatus.messageId = result.messageId || `msg-${Date.now()}`;
        } else {
          emailDispatchStatus.sent = false;
          emailDispatchStatus.error = result.error || 'SMTP delivery failed';
        }
      } else {
        // No active SMTP credentials yet in Settings & BYOK
        emailDispatchStatus.simulated = true;
        emailDispatchStatus.error = 'SMTP account not yet configured in Settings & BYOK (email delivery simulated).';
      }
    } catch (smtpErr: any) {
      console.error('Welcome email dispatch error:', smtpErr);
      emailDispatchStatus.error = smtpErr.message || 'SMTP error during welcome mailer dispatch';
    }

    return NextResponse.json({
      success: true,
      message: `Tenant client '${company_name}' successfully provisioned!`,
      tenant: {
        id: userId,
        company_name,
        email,
        contact_person: safeContactPerson,
        contact_number: safeContactNumber,
        created_at: userData.user.created_at,
      },
      welcomeEmail: {
        to: email,
        subject: finalSubject,
        body: finalBody,
        dispatchStatus: emailDispatchStatus,
      },
    });
  } catch (error: any) {
    console.error('Tenant provisioning error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while creating tenant' },
      { status: 500 }
    );
  }
}

