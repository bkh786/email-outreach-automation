import { SupabaseClient } from '@supabase/supabase-js';
import { SmtpConfig } from './types';

export interface SuperAdminContext {
  id: string;
  email: string;
  companyName: string;
  role: string;
  config: any;
  profile: any;
}

const SUPER_ADMIN_EMAILS = [
  'bkh786@gmail.com',
  'admin@freightpulse.ai',
  'admin@marketpulse.ai',
];

/**
 * Finds and returns the Super Admin's context (id, profile, and user_configs)
 * guarantees that client tenant credentials are NEVER confused with Super Admin.
 */
export async function getSuperAdminContext(
  supabase: SupabaseClient,
  callerUserId?: string | null
): Promise<SuperAdminContext | null> {
  try {
    let superAdminId: string | null = null;
    let superAdminEmail: string = '';

    // 1. If callerUserId is provided, check if the caller is super_admin
    if (callerUserId) {
      const { data: callerProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', callerUserId)
        .maybeSingle();

      if (callerProfile?.role === 'super_admin' || callerProfile?.role === 'admin') {
        superAdminId = callerUserId;
      }
    }

    // 2. If not determined from caller, find profile with role = 'super_admin'
    if (!superAdminId) {
      const { data: adminProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'super_admin')
        .limit(1);

      if (adminProfiles && adminProfiles.length > 0) {
        superAdminId = adminProfiles[0].id;
      }
    }

    // 3. Fallback: Search auth users for known super admin emails or role metadata
    if (!superAdminId) {
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      if (users && users.length > 0) {
        const found = users.find(
          u =>
            (u.email && SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase())) ||
            u.user_metadata?.role === 'super_admin'
        );
        if (found) {
          superAdminId = found.id;
          superAdminEmail = found.email || '';
        }
      }
    }

    if (!superAdminId) {
      return null;
    }

    // Fetch Super Admin profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', superAdminId)
      .maybeSingle();

    // Fetch Super Admin user_configs
    const { data: config } = await supabase
      .from('user_configs')
      .select('*')
      .eq('id', superAdminId)
      .maybeSingle();

    if (!superAdminEmail) {
      const { data: { user } } = await supabase.auth.admin.getUserById(superAdminId);
      superAdminEmail = user?.email || config?.from_email || profile?.email || 'contact@digipresence.in';
    }

    return {
      id: superAdminId,
      email: superAdminEmail,
      companyName: profile?.company_name || 'Digi Presence Solutions',
      role: profile?.role || 'super_admin',
      profile: profile || {},
      config: config || {},
    };
  } catch (error) {
    console.error('Error resolving super admin context:', error);
    return null;
  }
}

/**
 * Returns the strictly isolated Super Admin SMTP configuration.
 * Returns null if Super Admin has not configured SMTP credentials.
 * NEVER falls back to client tenant credentials.
 */
export async function getSuperAdminSmtpConfig(
  supabase: SupabaseClient,
  callerUserId?: string | null
): Promise<{ smtpConfig: SmtpConfig; superAdmin: SuperAdminContext } | null> {
  const superAdmin = await getSuperAdminContext(supabase, callerUserId);
  if (!superAdmin || !superAdmin.config) {
    return null;
  }

  const cfg = superAdmin.config;
  if (!cfg.smtp_host || !cfg.smtp_user || !cfg.smtp_pass) {
    return null;
  }

  const ccVal = cfg['Cc-Email'] ?? cfg.cc_emails ?? '';
  const bccVal = cfg['Bcc-Email'] ?? cfg.bcc_emails ?? '';

  const isCcEnabled =
    cfg.cc_enabled !== undefined
      ? Boolean(cfg.cc_enabled)
      : Boolean(ccVal && String(ccVal).trim().length > 0);

  const isBccEnabled =
    cfg.bcc_enabled !== undefined
      ? Boolean(cfg.bcc_enabled)
      : Boolean(bccVal && String(bccVal).trim().length > 0);

  const smtpConfig: SmtpConfig = {
    host: cfg.smtp_host,
    port: Number(cfg.smtp_port) || 587,
    user: cfg.smtp_user,
    pass: cfg.smtp_pass,
    secure: cfg.smtp_secure ?? false,
    fromName: cfg.from_name || superAdmin.companyName || 'Digi Presence Solutions',
    fromEmail: cfg.from_email || cfg.smtp_user,
    cc_enabled: isCcEnabled,
    cc_emails: String(ccVal).trim(),
    bcc_enabled: isBccEnabled,
    bcc_emails: String(bccVal).trim(),
  };

  return { smtpConfig, superAdmin };
}
