import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { profile, userId: requestedUserId } = body;

    if (!profile) {
      return NextResponse.json({ success: false, error: 'No profile data provided' }, { status: 400 });
    }

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

    if (!userId && requestedUserId) {
      userId = requestedUserId;
    }

    const adminSupabase = createAdminClient();

    if (!userId) {
      const { data: firstProfile } = await adminSupabase.from('profiles').select('id').limit(1).single();
      if (firstProfile) {
        userId = firstProfile.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User session not found. Please log in.' }, { status: 401 });
    }

    const payload = {
      id: userId,
      company_name: profile.company_name || 'Logistics Company',
      contact_person: profile.contact_person || 'Operations Lead',
      website_url: profile.website_url || '',
      services_offered: Array.isArray(profile.services_offered) ? profile.services_offered : [],
      target_markets: Array.isArray(profile.target_markets) ? profile.target_markets : [],
      unique_selling_proposition: profile.unique_selling_proposition || '',
      strengths_and_certifications: profile.strengths_and_certifications || '',
      email_signature: profile.email_signature || '',
      updated_at: new Date().toISOString(),
    };

    const { data: savedData, error: saveError } = await adminSupabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select()
      .single();

    if (saveError) {
      console.error('Supabase profile save error:', saveError);
      return NextResponse.json({ success: false, error: saveError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Brand profile successfully saved to database.',
      profile: savedData,
    });
  } catch (error: any) {
    console.error('Server save profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error saving profile' },
      { status: 500 }
    );
  }
}
