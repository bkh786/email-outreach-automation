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
      // column may not exist yet in table, fallback to user_metadata
    }

    // 2. Fallback to Super Admin user_metadata in auth.users
    try {
      const { data: { users } } = await adminSupabase.auth.admin.listUsers();
      const superAdmin = users.find(
        u => u.user_metadata?.role === 'super_admin' || 
             u.email === 'bkh786@gmail.com' || 
             u.email === 'admin@marketpulse.ai' ||
             u.email === 'admin@freightpulse.ai'
      );

      if (superAdmin?.user_metadata?.welcome_email_template) {
        return NextResponse.json({
          success: true,
          subject: superAdmin.user_metadata.welcome_email_subject || DEFAULT_WELCOME_SUBJECT,
          template: superAdmin.user_metadata.welcome_email_template,
          source: 'user_metadata',
        });
      }
    } catch (e) {
      console.error('Error fetching admin metadata for template:', e);
    }

    // 3. Default fallback
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

    // 1. Try to persist into user_configs table
    let savedToTable = false;
    try {
      // Find super admin config or any config
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
      // ignore schema error if column not added yet
    }

    // 2. Also persist into Super Admin user_metadata for 100% durability
    let savedToMetadata = false;
    try {
      const { data: { users } } = await adminSupabase.auth.admin.listUsers();
      const superAdmins = users.filter(
        u => u.user_metadata?.role === 'super_admin' || 
             u.email === 'bkh786@gmail.com' || 
             u.email === 'admin@marketpulse.ai' ||
             u.email === 'admin@freightpulse.ai'
      );

      for (const adminUser of superAdmins) {
        await adminSupabase.auth.admin.updateUserById(adminUser.id, {
          user_metadata: {
            ...adminUser.user_metadata,
            welcome_email_subject: cleanSubject,
            welcome_email_template: cleanTemplate,
          }
        });
      }
      savedToMetadata = true;
    } catch (e) {
      console.error('Error updating user_metadata for template:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email template saved successfully!',
      subject: cleanSubject,
      template: cleanTemplate,
      savedToTable,
      savedToMetadata,
    });
  } catch (error: any) {
    console.error('Failed to save welcome template:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save welcome template' },
      { status: 500 }
    );
  }
}
