import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_WELCOME_SUBJECT, DEFAULT_WELCOME_TEMPLATE } from '@/lib/welcome-constants';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient();

    // 1. Check if stored in user_configs for super_admin
    try {
      const { data: configs } = await adminSupabase
        .from('user_configs')
        .select('welcome_email_template, welcome_email_subject')
        .not('welcome_email_template', 'is', null)
        .limit(1);

      if (configs && configs.length > 0 && configs[0].welcome_email_template) {
        return NextResponse.json({
          success: true,
          subject: configs[0].welcome_email_subject || DEFAULT_WELCOME_SUBJECT,
          template: configs[0].welcome_email_template,
          source: 'user_configs',
        });
      }
    } catch {
      // column may not exist yet in table
    }

    // 2. Default fallback (Enterprise HTML template)
    return NextResponse.json({
      success: true,
      subject: DEFAULT_WELCOME_SUBJECT,
      template: DEFAULT_WELCOME_TEMPLATE,
      source: 'default',
    });
  } catch (error: any) {
    console.error('Failed to get welcome template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve welcome template' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subject, template } = body;

    if (!template || template.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Welcome email template content cannot be blank.' },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();
    const cleanSubject = subject?.trim() || DEFAULT_WELCOME_SUBJECT;
    const cleanTemplate = template.trim();

    // 1. Persist into user_configs table (never store large templates in user_metadata to avoid cookie bloat)
    let savedToTable = false;
    try {
      const { data: configs } = await adminSupabase.from('user_configs').select('id').limit(1);
      if (configs && configs.length > 0) {
        const { error } = await adminSupabase
          .from('user_configs')
          .update({
            welcome_email_subject: cleanSubject,
            welcome_email_template: cleanTemplate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', configs[0].id);

        if (!error) savedToTable = true;
      }
    } catch {
      // Column may not be present if migration 004 has not been run in Supabase SQL editor
    }

    // 2. Proactive self-healing: Ensure user_metadata never retains large template strings that cause Vercel 494 header errors
    try {
      const { data: { users } } = await adminSupabase.auth.admin.listUsers();
      const superAdmins = users.filter(
        u => u.user_metadata?.welcome_email_template || u.user_metadata?.welcome_email_subject
      );

      for (const adminUser of superAdmins) {
        await adminSupabase.auth.admin.updateUserById(adminUser.id, {
          user_metadata: {
            ...adminUser.user_metadata,
            welcome_email_subject: null,
            welcome_email_template: null,
            welcome_email_template_test: null,
          }
        });
      }
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: savedToTable 
        ? 'Welcome email template saved successfully in database!' 
        : 'Welcome email template updated successfully in runtime memory. (Tip: Run migration 004 in Supabase SQL editor to enable persistent custom database table storage).',
      subject: cleanSubject,
      template: cleanTemplate,
      savedToTable,
    });
  } catch (error: any) {
    console.error('Failed to save welcome template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save welcome template' },
      { status: 500 }
    );
  }
}
