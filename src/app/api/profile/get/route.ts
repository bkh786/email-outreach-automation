import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    let userId: string | null = null;
    let userMeta: any = null;

    try {
      const serverSupabase = createServerSupabaseClient();
      const { data: { user } } = await serverSupabase.auth.getUser();
      if (user) {
        userId = user.id;
        userMeta = user.user_metadata;
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

    if (userId && !userMeta) {
      try {
        const { data: userData } = await adminSupabase.auth.admin.getUserById(userId);
        if (userData?.user) {
          userMeta = userData.user.user_metadata;
        }
      } catch {
        // ignore
      }
    }

    let query = adminSupabase.from('profiles').select('*');

    if (userId) {
      query = query.eq('id', userId);
    }

    const { data: profiles, error } = await query.limit(1);

    if (error) {
      console.error('Fetch profile error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    let profile = profiles && profiles.length > 0 ? profiles[0] : null;

    // Retrieve portfolio-link from user_configs if available
    if (userId) {
      try {
        const { data: userConfigData } = await adminSupabase
          .from('user_configs')
          .select('"portfolio-link"')
          .eq('id', userId)
          .single();
        if (userConfigData) {
          const cfgPort = userConfigData['portfolio-link'];
          profile = {
            ...(profile || { id: userId }),
            portfolio_url: cfgPort || profile?.portfolio_url || '',
            'portfolio-link': cfgPort || profile?.portfolio_url || '',
          };
        }
      } catch {
        // ignore
      }
    }

    if (profile && userMeta) {
      profile = {
        ...profile,
        contact_person: profile.contact_person || userMeta.contact_person || userMeta.full_name || 'Operations Contact',
        company_name: profile.company_name || userMeta.company_name || 'Logistics Agency',
      };
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
