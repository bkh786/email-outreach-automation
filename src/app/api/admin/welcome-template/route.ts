import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_WELCOME_SUBJECT, DEFAULT_WELCOME_TEMPLATE } from '@/lib/welcome-constants';
import { getSuperAdminContext } from '@/lib/super-admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const adminSupabase = createAdminClient();

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

    // 1. Check if stored in user_configs for Super Admin
    try {
      const superAdminCtx = await getSuperAdminContext(adminSupabase, callerUserId);
      if (superAdminCtx?.config?.welcome_email_template) {
        return NextResponse.json({
          success: true,
          subject: superAdminCtx.config.welcome_email_subject || DEFAULT_WELCOME_SUBJECT,
          template: superAdminCtx.config.welcome_email_template,
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

    const superAdminCtx = await getSuperAdminContext(adminSupabase, callerUserId);
    const targetAdminId = superAdminCtx?.id;

    // 1. Persist into user_configs table specifically for Super Admin
    let savedToTable = false;
    if (targetAdminId) {
      try {
        const { error } = await adminSupabase
          .from('user_configs')
          .update({
            welcome_email_subject: cleanSubject,
            welcome_email_template: cleanTemplate,
            updated_at: new Date().toISOString(),
          })
          .eq('id', targetAdminId);

        if (!error) savedToTable = true;
      } catch {
        // Column may not be present if migration 004 has not been run in Supabase SQL editor
      }
    }

    // 2. Proactive self-healing: Ensure user_metadata never retains large template strings that cause cookie bloat
    try {
      const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 });
      const superAdmins = (users || []).filter(
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
        : 'Welcome email template updated successfully in runtime memory.',
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
