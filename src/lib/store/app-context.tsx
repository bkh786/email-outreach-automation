'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, Profile, UserConfig, CampaignLog } from '@/lib/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

const DEFAULT_PROFILE: Profile = {
  id: 'master-profile',
  company_name: 'Freight Forwarding Agency',
  contact_person: 'Operations Lead',
  website_url: '',
  role: 'client',
  services_offered: [
    'Transpacific Ocean FCL/LCL',
    'Expedited Air Freight Charters',
    'Customs Clearance & Bonded CFS',
    'Cold Chain & Pharma Logistics'
  ],
  target_markets: [
    'Asia -> North America',
    'Europe -> North America',
    'Southeast Asia Transshipment'
  ],
  unique_selling_proposition: '',
  strengths_and_certifications: '',
  email_signature: ''
};

const DEFAULT_USER_CONFIG: UserConfig = {
  id: 'master-config',
  gemini_api_key: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: false,
  from_name: 'Outreach Operations',
  from_email: '',
  auto_send_enabled: false,
  max_daily_emails: 50,
  max_hourly_rate: 15,
};

interface AppContextType {
  leads: Lead[];
  profile: Profile;
  userConfig: UserConfig;
  logs: CampaignLog[];
  currentUserEmail?: string;
  isDemoMode: boolean;
  isProcessingBatch: boolean;
  activeBatchProgress: { current: number; total: number } | null;
  addLeads: (newLeads: Partial<Lead>[]) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  deleteMultipleLeads: (ids: string[]) => Promise<void>;
  enrichSingleLead: (id: string) => Promise<boolean>;
  enrichBatchLeads: (targetIds?: string[]) => Promise<{ processed: number; failed: number }>;
  sendSingleEmail: (id: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (newProfile: Profile) => Promise<void>;
  updateUserConfig: (newConfig: UserConfig) => Promise<void>;
  resetToDemoData: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [activeBatchProgress, setActiveBatchProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    // Clear legacy mock data caches
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freightpulse_leads');
      localStorage.removeItem('freightpulse_logs');
      localStorage.removeItem('freightpulse_profile');
      localStorage.removeItem('freightpulse_config');
    }
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (typeof window === 'undefined') return;

    const supabaseReady = isSupabaseConfigured();
    setIsDemoMode(!supabaseReady);

    // If Supabase is available, load user, profile, real leads and real logs
    if (supabaseReady) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          setCurrentUserEmail(user.email || '');
          const isSuperAdminEmail = 
            user.email === 'bkh786@gmail.com' || 
            user.email === 'admin@freightpulse.ai' || 
            user.email === 'admin@marketpulse.ai' ||
            user.user_metadata?.role === 'super_admin';

          // Extract company name and contact person from user metadata or email domain
          const metaCompanyName = user.user_metadata?.company_name || '';
          const metaContactPerson = user.user_metadata?.full_name || user.user_metadata?.contact_person || '';

          let domainCompanyFallback = '';
          if (user.email && user.email.includes('@')) {
            const domainPart = user.email.split('@')[1].split('.')[0];
            if (domainPart && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud'].includes(domainPart.toLowerCase())) {
              domainCompanyFallback = domainPart
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());
            }
          }

          // Fetch profile from database
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          const finalCompanyName = 
            profileData?.company_name || 
            metaCompanyName || 
            domainCompanyFallback || 
            (isSuperAdminEmail ? 'Super Admin Portal' : 'Logistics Company');

          const finalContactPerson = 
            profileData?.contact_person || 
            metaContactPerson || 
            (user.email ? user.email.split('@')[0].replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Operations Contact');

          const resolvedRole = isSuperAdminEmail ? 'super_admin' : (profileData?.role || user.user_metadata?.role || 'client');

          const resolvedProfile: Profile = {
            ...DEFAULT_PROFILE,
            ...(profileData || {}),
            company_name: finalCompanyName,
            contact_person: finalContactPerson,
            role: resolvedRole,
          };
          setProfile(resolvedProfile);
          localStorage.setItem('marketpulse_profile', JSON.stringify(resolvedProfile));

          // Fetch real user config
          const { data: configData } = await supabase
            .from('user_configs')
            .select('*')
            .eq('id', user.id)
            .single();

          if (configData) {
            setUserConfig(configData);
            localStorage.setItem('marketpulse_config', JSON.stringify(configData));
          }

          // Fetch real leads for this user/tenant from Supabase
          const { data: dbLeads } = await supabase
            .from('leads')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbLeads) {
            setLeads(dbLeads);
            localStorage.setItem('marketpulse_leads', JSON.stringify(dbLeads));
          } else {
            setLeads([]);
            localStorage.setItem('marketpulse_leads', JSON.stringify([]));
          }

          // Fetch real campaign activity logs from Supabase
          const { data: dbLogs } = await supabase
            .from('campaign_logs')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbLogs) {
            setLogs(dbLogs);
            localStorage.setItem('marketpulse_logs', JSON.stringify(dbLogs));
          } else {
            setLogs([]);
            localStorage.setItem('marketpulse_logs', JSON.stringify([]));
          }

          return;
        }
      } catch (e) {
        console.error('Error fetching Supabase auth user / data:', e);
      }
    }

    // Fallback: Read real user data from localStorage
    try {
      const storedLeads = localStorage.getItem('marketpulse_leads');
      const storedProfile = localStorage.getItem('marketpulse_profile');
      const storedConfig = localStorage.getItem('marketpulse_config');
      const storedLogs = localStorage.getItem('marketpulse_logs');

      if (storedLeads) setLeads(JSON.parse(storedLeads));
      else setLeads([]);

      if (storedProfile) setProfile(JSON.parse(storedProfile));
      else setProfile(DEFAULT_PROFILE);

      if (storedConfig) setUserConfig(JSON.parse(storedConfig));
      else setUserConfig(DEFAULT_USER_CONFIG);

      if (storedLogs) setLogs(JSON.parse(storedLogs));
      else setLogs([]);
    } catch (e) {
      console.error('Error loading stored data:', e);
      setLeads([]);
      setProfile(DEFAULT_PROFILE);
      setUserConfig(DEFAULT_USER_CONFIG);
      setLogs([]);
    }
  };

  const persistLeads = async (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_leads', JSON.stringify(newLeads));
    }
  };

  const persistLogs = async (newLogs: CampaignLog[]) => {
    setLogs(newLogs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_logs', JSON.stringify(newLogs));
    }
  };

  const addLeads = async (newLeadsData: Partial<Lead>[]) => {
    const supabaseReady = isSupabaseConfigured();
    const formattedLeads: Lead[] = newLeadsData.map((data, idx) => ({
      id: `lead-${Date.now()}-${idx}`,
      company_name: data.company_name || 'Unknown Company',
      contact_person: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      country: data.country || 'International',
      website_url: data.website_url || '',
      source: data.source || 'csv_import',
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    if (supabaseReady) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const insertPayload = formattedLeads.map(l => ({
            ...l,
            user_id: user.id,
          }));
          await supabase.from('leads').insert(insertPayload);
        }
      } catch (err) {
        console.error('Error inserting leads into Supabase:', err);
      }
    }

    const updated = [...formattedLeads, ...leads];
    await persistLeads(updated);

    const newLog: CampaignLog = {
      id: `log-${Date.now()}`,
      event_type: 'uploaded',
      lead_company: `${formattedLeads.length} Leads Ingested`,
      details: { count: formattedLeads.length },
      created_at: new Date().toISOString(),
    };
    await persistLogs([newLog, ...logs]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const updated = leads.map(lead => lead.id === id ? { ...lead, ...updates } : lead);
    await persistLeads(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('leads').update(updates).eq('id', id);
      } catch (err) {
        console.error('Error updating lead in Supabase:', err);
      }
    }
  };

  const deleteLead = async (id: string) => {
    const updated = leads.filter(lead => lead.id !== id);
    await persistLeads(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('leads').delete().eq('id', id);
      } catch (err) {
        console.error('Error deleting lead in Supabase:', err);
      }
    }
  };

  const deleteMultipleLeads = async (ids: string[]) => {
    const set = new Set(ids);
    const updated = leads.filter(lead => !set.has(lead.id));
    await persistLeads(updated);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        await supabase.from('leads').delete().in('id', ids);
      } catch (err) {
        console.error('Error deleting multiple leads in Supabase:', err);
      }
    }
  };

  const enrichSingleLead = async (id: string): Promise<boolean> => {
    const lead = leads.find(l => l.id === id);
    if (!lead) return false;

    updateLead(id, { status: 'enriching', error_message: undefined });

    try {
      const response = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          userProfile: profile,
          apiKey: userConfig.gemini_api_key,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Enrichment failed');
      }

      const enrichment = data.enrichment;
      updateLead(id, {
        company_profile: enrichment.company_profile,
        financial_info: enrichment.financial_info,
        email_subject: enrichment.email_subject,
        email_body: enrichment.email_body,
        status: userConfig.auto_send_enabled ? 'approved' : 'drafted',
      });

      const newLog: CampaignLog = {
        id: `log-${Date.now()}`,
        lead_id: id,
        event_type: 'researched',
        lead_company: lead.company_name,
        details: { subject: enrichment.email_subject },
        created_at: new Date().toISOString(),
      };
      persistLogs([newLog, ...logs]);

      if (userConfig.auto_send_enabled) {
        await sendSingleEmail(id);
      }

      return true;
    } catch (err: any) {
      updateLead(id, {
        status: 'failed',
        error_message: err.message || 'AI enrichment failed',
      });
      return false;
    }
  };

  const enrichBatchLeads = async (targetIds?: string[]): Promise<{ processed: number; failed: number }> => {
    setIsProcessingBatch(true);
    const candidates = targetIds && targetIds.length > 0
      ? leads.filter(l => targetIds.includes(l.id))
      : leads.filter(l => l.status === 'pending');

    let processed = 0;
    let failed = 0;

    setActiveBatchProgress({ current: 0, total: candidates.length });

    for (let i = 0; i < candidates.length; i++) {
      setActiveBatchProgress({ current: i + 1, total: candidates.length });
      const success = await enrichSingleLead(candidates[i].id);
      if (success) processed++;
      else failed++;

      await new Promise(r => setTimeout(r, 600));
    }

    setIsProcessingBatch(false);
    setActiveBatchProgress(null);
    return { processed, failed };
  };

  const sendSingleEmail = async (id: string): Promise<{ success: boolean; message: string }> => {
    const lead = leads.find(l => l.id === id);
    if (!lead || !lead.email_subject || !lead.email_body) {
      return { success: false, message: 'Lead has no draft email content' };
    }

    try {
      const response = await fetch('/api/leads/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead,
          userConfig,
          profile,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      updateLead(id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: undefined,
      });

      const newLog: CampaignLog = {
        id: `log-${Date.now()}`,
        lead_id: id,
        event_type: 'sent',
        lead_company: lead.company_name,
        details: { to: lead.email, subject: lead.email_subject },
        created_at: new Date().toISOString(),
      };
      persistLogs([newLog, ...logs]);

      return { success: true, message: 'Email dispatched successfully!' };
    } catch (err: any) {
      updateLead(id, {
        error_message: err.message,
      });
      return { success: false, message: err.message || 'Dispatch error' };
    }
  };

  const updateProfile = async (newProfile: Profile) => {
    setProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_profile', JSON.stringify(newProfile));
    }
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('profiles').upsert({
            id: user.id,
            company_name: newProfile.company_name,
            contact_person: newProfile.contact_person,
            website_url: newProfile.website_url,
            services_offered: newProfile.services_offered,
            target_markets: newProfile.target_markets,
            unique_selling_proposition: newProfile.unique_selling_proposition,
            strengths_and_certifications: newProfile.strengths_and_certifications,
            email_signature: newProfile.email_signature,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error updating profile in Supabase:', err);
      }
    }
  };

  const updateUserConfig = async (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_config', JSON.stringify(newConfig));
    }
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_configs').upsert({
            id: user.id,
            gemini_api_key: newConfig.gemini_api_key,
            smtp_host: newConfig.smtp_host,
            smtp_port: newConfig.smtp_port,
            smtp_user: newConfig.smtp_user,
            smtp_pass: newConfig.smtp_pass,
            smtp_secure: newConfig.smtp_secure,
            from_name: newConfig.from_name,
            from_email: newConfig.from_email,
            auto_send_enabled: newConfig.auto_send_enabled,
            max_daily_emails: newConfig.max_daily_emails,
            max_hourly_rate: newConfig.max_hourly_rate,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error updating config in Supabase:', err);
      }
    }
  };

  const resetToDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marketpulse_leads');
      localStorage.removeItem('marketpulse_profile');
      localStorage.removeItem('marketpulse_config');
      localStorage.removeItem('marketpulse_logs');
    }
    setLeads([]);
    setProfile(DEFAULT_PROFILE);
    setUserConfig(DEFAULT_USER_CONFIG);
    setLogs([]);
  };

  const refreshData = async () => {
    await loadInitialData();
  };

  return (
    <AppContext.Provider
      value={{
        leads,
        profile,
        userConfig,
        logs,
        currentUserEmail,
        isDemoMode,
        isProcessingBatch,
        activeBatchProgress,
        addLeads,
        updateLead,
        deleteLead,
        deleteMultipleLeads,
        enrichSingleLead,
        enrichBatchLeads,
        sendSingleEmail,
        updateProfile,
        updateUserConfig,
        resetToDemoData,
        refreshData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
