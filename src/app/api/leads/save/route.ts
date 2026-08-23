import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { leads: incomingLeads, userId: requestedUserId } = body;

    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No leads provided to save.' },
        { status: 400 }
      );
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

    // If userId not found, fallback to first user in profiles or auth
    if (!userId) {
      const { data: firstProfile } = await adminSupabase.from('profiles').select('id').limit(1).single();
      if (firstProfile) {
        userId = firstProfile.id;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User session not identified. Please log in.' },
        { status: 401 }
      );
    }

    const payload = incomingLeads.map((l: any) => ({
      id: l.id && l.id.length > 20 ? l.id : crypto.randomUUID(),
      user_id: userId,
      company_name: (l.company_name || 'Unknown Company').trim(),
      contact_person: l.contact_person ? l.contact_person.trim() : null,
      email: (l.email || '').trim(),
      phone: l.phone ? l.phone.trim() : null,
      country: l.country ? l.country.trim() : 'International',
      website_url: l.website_url ? l.website_url.trim() : null,
      source: l.source || 'manual_upload',
      status: l.status || 'pending',
      company_profile: l.company_profile || null,
      financial_info: l.financial_info || null,
      email_subject: l.email_subject || null,
      email_body: l.email_body || null,
      created_at: l.created_at || new Date().toISOString(),
    }));

    const { data: insertedData, error: insertError } = await adminSupabase
      .from('leads')
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (insertError) {
      console.error('Supabase admin leads insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 }
      );
    }

    // Insert campaign log
    await adminSupabase.from('campaign_logs').insert({
      id: crypto.randomUUID(),
      user_id: userId,
      event_type: 'uploaded',
      details: { count: payload.length },
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${payload.length} leads to database.`,
      leads: insertedData,
    });
  } catch (error: any) {
    console.error('Server save leads error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error saving leads' },
      { status: 500 }
    );
  }
}
