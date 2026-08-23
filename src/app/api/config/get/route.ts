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

    const config = configs && configs.length > 0 ? configs[0] : null;

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
