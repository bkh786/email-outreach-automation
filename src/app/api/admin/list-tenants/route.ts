import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient();

    // 1. Fetch all users from Supabase Auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      return NextResponse.json({ success: false, error: authError.message }, { status: 400 });
    }

    // 2. Fetch profiles
    const { data: profiles, error: profileError } = await supabase.from('profiles').select('*');
    
    // 3. Fetch lead counts per user
    const { data: leads, error: leadError } = await supabase.from('leads').select('user_id, status');

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    
    const leadStatsMap = new Map<string, { total: number; sent: number; pending: number }>();
    (leads || []).forEach(l => {
      if (!l.user_id) return;
      const stat = leadStatsMap.get(l.user_id) || { total: 0, sent: 0, pending: 0 };
      stat.total++;
      if (l.status === 'sent') stat.sent++;
      if (l.status === 'pending') stat.pending++;
      leadStatsMap.set(l.user_id, stat);
    });

    const tenantList = (users || []).map(u => {
      const p = profileMap.get(u.id);
      const stats = leadStatsMap.get(u.id) || { total: 0, sent: 0, pending: 0 };
      return {
        id: u.id,
        email: u.email,
        company_name: p?.company_name || u.user_metadata?.company_name || 'Client Agency',
        role: p?.role || u.user_metadata?.role || 'client',
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        stats,
        services_offered: p?.services_offered || [],
        target_markets: p?.target_markets || [],
        contact_person: p?.contact_person || u.user_metadata?.contact_person || u.user_metadata?.full_name || '',
        contact_number: u.user_metadata?.contact_number || (p as any)?.phone || '',
      };
    });

    return NextResponse.json({
      success: true,
      tenants: tenantList,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list tenants' },
      { status: 500 }
    );
  }
}
