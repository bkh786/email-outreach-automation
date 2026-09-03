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
        await adminSupabase.from('profiles').update({
          email_signature: config.email_signature,
          updated_at: new Date().toISOString(),
        }).eq('id', userId);
      } catch (err) {
        console.error('Error syncing email_signature to profiles table:', err);
      }
    }

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
    };

    const fullUpsertPayload: Record<string, any> = {
      ...baseUpsertPayload,
      cc_enabled: config?.cc_enabled !== undefined ? Boolean(config.cc_enabled) : (existingConfig?.cc_enabled ?? false),
      cc_emails: config?.cc_emails !== undefined ? String(config.cc_emails) : (existingConfig?.cc_emails ?? ''),
      bcc_enabled: config?.bcc_enabled !== undefined ? Boolean(config.bcc_enabled) : (existingConfig?.bcc_enabled ?? false),
      bcc_emails: config?.bcc_emails !== undefined ? String(config.bcc_emails) : (existingConfig?.bcc_emails ?? ''),
      email_signature: config?.email_signature !== undefined ? String(config.email_signature) : (existingConfig?.email_signature ?? ''),
    };

    let savedData: any = null;
    let saveError: any = null;

    // First attempt: try saving with new CC/BCC and signature columns
    const { data: fullData, error: fullError } = await adminSupabase
      .from('user_configs')
      .upsert(fullUpsertPayload, { onConflict: 'id' })
      .select()
      .single();

    if (!fullError) {
      savedData = fullData;
    } else {
      // Fallback: save standard base columns if new columns have not been added yet via migration
      const { data: baseData, error: baseError } = await adminSupabase
        .from('user_configs')
        .upsert(baseUpsertPayload, { onConflict: 'id' })
        .select()
        .single();

      if (baseError) {
        saveError = baseError;
      } else {
        savedData = {
          ...baseData,
          cc_enabled: fullUpsertPayload.cc_enabled,
          cc_emails: fullUpsertPayload.cc_emails,
          bcc_enabled: fullUpsertPayload.bcc_enabled,
          bcc_emails: fullUpsertPayload.bcc_emails,
          email_signature: fullUpsertPayload.email_signature,
        };
      }
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
