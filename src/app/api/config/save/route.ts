import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { config, apiKey } = body;

    // 1. Identify user from SSR session or admin token
    let userId: string | null = null;
    try {
      const serverSupabase = createServerSupabaseClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        userId = user.id;
      }
    } catch {
      // ignore
    }

    if (!userId && body.userId) {
      userId = body.userId;
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User session not found. Please log in.' },
        { status: 401 }
      );
    }

    const adminSupabase = createAdminClient();

    // 2. Fetch existing config to merge partial updates (e.g. only gemini_api_key updated)
    const { data: existingConfig } = await adminSupabase
      .from('user_configs')
      .select('*')
      .eq('id', userId)
      .single();

    const newGeminiKey = apiKey !== undefined ? apiKey : config?.gemini_api_key;
    const finalGeminiKey = newGeminiKey !== undefined 
      ? (typeof newGeminiKey === 'string' ? newGeminiKey.trim().replace(/^['"]|['"]$/g, '') : newGeminiKey)
      : (existingConfig?.gemini_api_key || '');

    // Sync email_signature to profiles table if provided
    if (config?.email_signature !== undefined && userId) {
      try {
        const { error: updateErr } = await adminSupabase
          .from('profiles')
          .update({
            email_signature: config.email_signature,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (updateErr) {
          console.warn('Profiles update error, attempting upsert fallback:', updateErr);
          await adminSupabase.from('profiles').upsert({
            id: userId,
            email_signature: config.email_signature,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Error syncing email_signature to profiles table:', err);
      }
    }

    // Extract CC, BCC, and portfolio link with fallback across casing and aliases
    const ccVal = config?.cc_emails !== undefined 
      ? String(config.cc_emails).trim()
      : (config?.['Cc-Email'] !== undefined ? String(config['Cc-Email']).trim() : (existingConfig?.['Cc-Email'] ?? existingConfig?.cc_emails ?? ''));

    const bccVal = config?.bcc_emails !== undefined 
      ? String(config.bcc_emails).trim()
      : (config?.['Bcc-Email'] !== undefined ? String(config['Bcc-Email']).trim() : (existingConfig?.['Bcc-Email'] ?? existingConfig?.bcc_emails ?? ''));

    const portfolioVal = config?.portfolio_url !== undefined 
      ? String(config.portfolio_url).trim()
      : (config?.['portfolio-link'] !== undefined ? String(config['portfolio-link']).trim() : (existingConfig?.['portfolio-link'] ?? existingConfig?.portfolio_url ?? ''));

    const isCcEnabled = config?.cc_enabled !== undefined ? Boolean(config.cc_enabled) : Boolean(ccVal && ccVal.length > 0);
    const isBccEnabled = config?.bcc_enabled !== undefined ? Boolean(config.bcc_enabled) : Boolean(bccVal && bccVal.length > 0);

    const baseUpsertPayload: Record<string, any> = {
      id: userId,
      gemini_api_key: finalGeminiKey,
      smtp_host: config?.smtp_host ?? existingConfig?.smtp_host ?? 'smtp.gmail.com',
      smtp_port: config?.smtp_port !== undefined ? Number(config.smtp_port) : (existingConfig?.smtp_port ?? 587),
      smtp_user: config?.smtp_user ?? existingConfig?.smtp_user ?? '',
      smtp_pass: config?.smtp_pass ?? existingConfig?.smtp_pass ?? '',
      smtp_secure: config?.smtp_secure !== undefined ? Boolean(config.smtp_secure) : (existingConfig?.smtp_secure ?? false),
      from_name: config?.from_name ?? existingConfig?.from_name ?? 'Outreach Operations',
      from_email: config?.from_email ?? existingConfig?.from_email ?? '',
      auto_send_enabled: config?.auto_send_enabled !== undefined ? Boolean(config.auto_send_enabled) : (existingConfig?.auto_send_enabled ?? false),
      max_daily_emails: config?.max_daily_emails !== undefined ? Number(config.max_daily_emails) : (existingConfig?.max_daily_emails ?? 50),
      max_hourly_rate: config?.max_hourly_rate !== undefined ? Number(config.max_hourly_rate) : (existingConfig?.max_hourly_rate ?? 15),
      updated_at: new Date().toISOString(),
      // Custom user-defined columns in public.user_configs
      'Cc-Email': isCcEnabled ? ccVal : '',
      'Bcc-Email': isBccEnabled ? bccVal : '',
      'portfolio-link': portfolioVal,
    };

    // Full payload including optional columns if present in schema
    const fullUpsertPayload: Record<string, any> = {
      ...baseUpsertPayload,
      cc_enabled: isCcEnabled,
      cc_emails: ccVal,
      bcc_enabled: isBccEnabled,
      bcc_emails: bccVal,
    };

    let savedData: any = null;
    let saveError: any = null;

    // First attempt: try saving with optional columns
    const { data: fullData, error: fullError } = await adminSupabase
      .from('user_configs')
      .upsert(fullUpsertPayload, { onConflict: 'id' })
      .select()
      .single();

    if (!fullError) {
      savedData = fullData;
    } else {
      // Fallback: save with guaranteed columns including Cc-Email, Bcc-Email, and portfolio-link
      const { data: baseData, error: baseError } = await adminSupabase
        .from('user_configs')
        .upsert(baseUpsertPayload, { onConflict: 'id' })
        .select()
        .single();

      if (baseError) {
        saveError = baseError;
      } else {
        savedData = baseData;
      }
    }

    if (savedData) {
      savedData = {
        ...savedData,
        'Cc-Email': isCcEnabled ? ccVal : '',
        'Bcc-Email': isBccEnabled ? bccVal : '',
        'portfolio-link': portfolioVal,
        cc_emails: ccVal,
        bcc_emails: bccVal,
        portfolio_url: portfolioVal,
        cc_enabled: isCcEnabled,
        bcc_enabled: isBccEnabled,
        email_signature: config?.email_signature ?? existingConfig?.email_signature ?? '',
      };
    }

    if (saveError) {
      console.error('Supabase user_configs database save error:', saveError);
      return NextResponse.json(
        { success: false, error: saveError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration successfully persisted to database.',
      config: savedData,
    });
  } catch (error: any) {
    console.error('Server save config error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while saving configuration' },
      { status: 500 }
    );
  }
}
