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

    let query = adminSupabase.from('leads').select('*').order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Fetch leads error:', error);
      return NextResponse.json({ success: false, error: error.message, leads: [] }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      leads: leads || [],
    });
  } catch (error: any) {
    console.error('List leads error:', error);
    return NextResponse.json({ success: false, error: error.message, leads: [] }, { status: 500 });
  }
}
