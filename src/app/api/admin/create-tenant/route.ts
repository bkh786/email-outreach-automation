import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      company_name, 
      email, 
      password, 
      contact_person, 
      target_markets,
      services_offered,
      max_daily_emails 
    } = body;

    if (!company_name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Company Name, Email, and Password are required.' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Create the tenant user in Supabase Auth (auto-confirmed)
    const { data: userData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        company_name,
        full_name: contact_person || 'Client Operations',
        role: 'client',
      },
    });

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      );
    }

    const userId = userData.user.id;

    // 2. Insert/Update Tenant Profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      company_name,
      role: 'client',
      services_offered: services_offered || ['Air Freight Expedited', 'Ocean FCL/LCL', 'Customs Clearance'],
      target_markets: target_markets || ['USA', 'Europe', 'Asia'],
      unique_selling_proposition: `Dedicated freight operations and trade corridor solutions for ${company_name}.`,
      strengths_and_certifications: 'Verified Logistics Partner, IATA/WCA Network Operations.',
      email_signature: `Best regards,\n\n${contact_person || 'Operations Lead'}\n${company_name}\n${email}`,
      updated_at: new Date().toISOString(),
    });

    // 3. Insert/Update Tenant Config
    const { error: configError } = await supabase.from('user_configs').upsert({
      id: userId,
      from_name: `${contact_person || 'Operations'} | ${company_name}`,
      from_email: email,
      auto_send_enabled: false,
      max_daily_emails: Number(max_daily_emails) || 50,
      max_hourly_rate: 15,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Tenant client '${company_name}' successfully provisioned!`,
      tenant: {
        id: userId,
        company_name,
        email,
        created_at: userData.user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Tenant provisioning error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while creating tenant' },
      { status: 500 }
    );
  }
}
