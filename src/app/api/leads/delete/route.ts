import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ids } = body;

    const adminSupabase = createAdminClient();

    if (ids && Array.isArray(ids) && ids.length > 0) {
      const { error } = await adminSupabase.from('leads').delete().in('id', ids);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: `Deleted ${ids.length} leads.` });
    }

    if (id) {
      const { error } = await adminSupabase.from('leads').delete().eq('id', id);
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Lead deleted successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Lead ID required.' }, { status: 400 });
  } catch (error: any) {
    console.error('Delete lead error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
