import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
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

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    if (!userId && requestedUserId) {
      userId = requestedUserId;
    }

    const adminSupabase = createAdminClient();

    let query = adminSupabase.from('user_configs').select('*');

    if (userId) {
      query = query.eq('id', userId);
    }

    const { data: configs, error } = await query.limit(1);

    if (error) {
      console.error('Fetch user_config error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let config = configs && configs.length > 0 ? configs[0] : null;

    if (config) {
      const cc = config['Cc-Email'] ?? config.cc_emails ?? '';
      const bcc = config['Bcc-Email'] ?? config.bcc_emails ?? '';
      const portfolio = config['portfolio-link'] ?? config.portfolio_url ?? '';

      config = {
        ...config,
        'Cc-Email': cc,
        'Bcc-Email': bcc,
        'portfolio-link': portfolio,
        cc_emails: cc,
        bcc_emails: bcc,
        portfolio_url: portfolio,
        cc_enabled: config.cc_enabled !== undefined ? config.cc_enabled : Boolean(cc && String(cc).trim().length > 0),
        bcc_enabled: config.bcc_enabled !== undefined ? config.bcc_enabled : Boolean(bcc && String(bcc).trim().length > 0),
      };
    }

    // Pull signature from profiles if available
    if (userId) {
      try {
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('email_signature')
          .eq('id', userId)
          .single();
        if (profile) {
          config = {
            ...(config || { id: userId }),
            email_signature: config?.email_signature || profile.email_signature || '',
          };
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
