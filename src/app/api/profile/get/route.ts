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

    let query = adminSupabase.from('profiles').select('*');

    if (userId) {
      query = query.eq('id', userId);
    }

    const { data: profiles, error } = await query.limit(1);

    if (error) {
      console.error('Fetch profile error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const profile = profiles && profiles.length > 0 ? profiles[0] : null;

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
