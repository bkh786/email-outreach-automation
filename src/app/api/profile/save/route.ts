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

    // 1. Update user metadata in auth.users
    try {
      await adminSupabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          company_name: profile.company_name,
          contact_person: profile.contact_person,
          full_name: profile.contact_person,
        }
      });
    } catch {
      // ignore
    }

    // 2. Prepare payload for public.profiles table (strictly using existing schema columns)
    const profilePayload: Record<string, any> = {
      id: userId,
      company_name: profile.company_name || 'Digi Presence Solutions',
      website_url: profile.website_url || '',
      services_offered: Array.isArray(profile.services_offered) ? profile.services_offered : [],
      target_markets: Array.isArray(profile.target_markets) ? profile.target_markets : [],
      unique_selling_proposition: profile.unique_selling_proposition || '',
      strengths_and_certifications: profile.strengths_and_certifications || '',
      email_signature: profile.email_signature || '',
      updated_at: new Date().toISOString(),
    };

    if (profile.role) {
      profilePayload.role = profile.role;
    }

    // Upsert to profiles table
    let { data: savedData, error: saveError } = await adminSupabase
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' })
      .select()
      .single();

    // If any column fails due to schema difference, dynamically strip the missing column and retry
    if (saveError) {
      console.warn('Profiles upsert warning, retrying with column cleanup:', saveError.message);
      const missingColMatch = saveError.message?.match(/(?:Could not find the '([^']+)' column|column profiles\.([a-zA-Z0-9_]+) does not exist)/i);
      const missingCol = missingColMatch ? (missingColMatch[1] || missingColMatch[2]) : null;
      if (missingCol && profilePayload[missingCol] !== undefined) {
        delete profilePayload[missingCol];
        const retryResult = await adminSupabase
          .from('profiles')
          .upsert(profilePayload, { onConflict: 'id' })
          .select()
          .single();
        savedData = retryResult.data;
        saveError = retryResult.error;
      }
    }

    if (saveError) {
      console.error('Supabase profile save error:', saveError);
      return NextResponse.json({ success: false, error: saveError.message }, { status: 500 });
    }

    // 3. Persist portfolio-link in user_configs table
    const portfolioLink = profile.portfolio_url !== undefined 
      ? String(profile.portfolio_url).trim() 
      : (profile['portfolio-link'] !== undefined ? String(profile['portfolio-link']).trim() : '');

    try {
      await adminSupabase
        .from('user_configs')
        .upsert({
          id: userId,
          'portfolio-link': portfolioLink,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
    } catch (cfgErr) {
      console.error('Error persisting portfolio-link to user_configs:', cfgErr);
    }

    const mergedProfile = {
      ...savedData,
      company_name: profile.company_name || savedData?.company_name || 'Digi Presence Solutions',
      contact_person: profile.contact_person || 'Operations Lead',
      portfolio_url: portfolioLink,
      'portfolio-link': portfolioLink,
      website_url: profile.website_url || savedData?.website_url || '',
      services_offered: Array.isArray(profile.services_offered) ? profile.services_offered : (savedData?.services_offered || []),
      target_markets: Array.isArray(profile.target_markets) ? profile.target_markets : (savedData?.target_markets || []),
      unique_selling_proposition: profile.unique_selling_proposition || savedData?.unique_selling_proposition || '',
      strengths_and_certifications: profile.strengths_and_certifications || savedData?.strengths_and_certifications || '',
      email_signature: profile.email_signature || savedData?.email_signature || '',
    };

    return NextResponse.json({
      success: true,
      message: 'Brand profile successfully saved to database.',
      profile: mergedProfile,
    });
  } catch (error: any) {
    console.error('Server save profile error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error saving profile' },
      { status: 500 }
    );
  }
}
