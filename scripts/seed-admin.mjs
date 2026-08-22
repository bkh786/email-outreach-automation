import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env.local manually
function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        let key = match[1];
        let value = match[2] || '';
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        process.env[key] = value.trim();
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const adminEmail = process.argv[2] || 'admin@freightpulse.ai';
  const adminPassword = process.argv[3] || 'AdminFreight2025!';
  const companyName = process.argv[4] || 'FreightPulse Master Platform';
  const fullName = 'Super Admin';

  console.log(`\n🚀 Connecting to Supabase at: ${supabaseUrl}`);
  console.log(`   Admin Email:    ${adminEmail}`);
  console.log(`   Admin Password: ${adminPassword}`);
  console.log(`   Admin Company:  ${companyName}\n`);

  // 1. Check if user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error('Error checking users:', listError.message);
  }

  const existingUser = users?.find(u => u.email === adminEmail);
  let userId;

  if (existingUser) {
    console.log(`ℹ️ User ${adminEmail} already exists (ID: ${existingUser.id}). Updating password & metadata...`);
    userId = existingUser.id;
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        full_name: fullName,
        role: 'super_admin',
      },
    });
    if (updateError) {
      console.error('Failed to update user:', updateError.message);
      return;
    }
  } else {
    // 2. Create user with email_confirm: true so it can log in immediately
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        company_name: companyName,
        full_name: fullName,
        role: 'super_admin',
      },
    });

    if (createError) {
      console.error('❌ Failed to create user:', createError.message);
      return;
    }

    userId = newUser.user.id;
    console.log(`✅ Super Admin created in auth.users! (ID: ${userId})`);
  }

  // 3. Ensure profile and user_config exist
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    company_name: companyName,
    role: 'super_admin',
    services_offered: [
      'Transpacific Ocean FCL/LCL',
      'Expedited Air Freight Charters',
      'Bonded CFS & Warehousing',
      'Automated Customs Clearance',
      'Project Cargo & Heavy Lift'
    ],
    target_markets: [
      'Asia -> North America',
      'Europe -> North America',
      'Southeast Asia Transshipment',
      'Middle East Corridors'
    ],
    unique_selling_proposition: 'Multi-tenant master logistics intelligence & outreach orchestration platform.',
    strengths_and_certifications: 'IATA Cargo Agent, FIATA Member, WCA First-Tier Partner, C-TPAT Certified.',
    email_signature: `Best regards,\n\nOperations & Client Management Team\nFreightPulse Master Platform\nops@freightpulse.ai\nwww.freightpulse.ai`,
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    console.warn('Note on profile upsert:', profileError.message);
  }

  const { error: configError } = await supabase.from('user_configs').upsert({
    id: userId,
    from_name: 'FreightPulse Operations',
    from_email: adminEmail,
    auto_send_enabled: false,
    max_daily_emails: 100,
    max_hourly_rate: 25,
    updated_at: new Date().toISOString(),
  });

  if (configError) {
    console.warn('Note on config upsert:', configError.message);
  }

  console.log(`\n🎉 Super Admin provisioned successfully!`);
  console.log(`==================================================`);
  console.log(`🔐 LOGIN CREDENTIALS:`);
  console.log(`   Email:    ${adminEmail}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`==================================================\n`);
}

main().catch(console.error);
