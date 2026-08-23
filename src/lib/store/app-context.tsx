'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, Profile, UserConfig, CampaignLog } from '@/lib/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const DEFAULT_PROFILE: Profile = {
  id: 'master-profile',
  company_name: 'Logistics Company',
  contact_person: 'Operations Lead',
  website_url: '',
  role: 'client',
  services_offered: [
    'Customs Clearance & Bonded CFS',
    'Air Freight Expedited & Charters',
    'Ocean FCL/LCL Consolidation',
    'Road Transport & Rail Freight',
    'Warehousing & 3PL Distribution'
  ],
  target_markets: [
    'India -> North America Air & Ocean FCL/LCL',
    'India -> Europe Multimodal Corridors',
    'India -> Middle East Supply Chain',
    'Domestic Pan-India Road & Rail Transport'
  ],
  unique_selling_proposition: '23+ years of experience delivering fast, certified, and flexible global logistics.',
  strengths_and_certifications: 'IATA Cargo Agent, FIATA Member, WCA Partner, ISO 9001:2015',
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
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (typeof window === 'undefined') return;

    const supabaseReady = isSupabaseConfigured();
    setIsDemoMode(!supabaseReady);

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

          const metaCompanyName = user.user_metadata?.company_name || '';
          const metaContactPerson = user.user_metadata?.full_name || user.user_metadata?.contact_person || '';

          let domainCompanyFallback = '';
          if (user.email && user.email.includes('@')) {
            const domainPart = user.email.split('@')[1]?.split('.')[0];
            if (domainPart && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud'].includes(domainPart.toLowerCase())) {
              domainCompanyFallback = domainPart
                .replace(/[-_]/g, ' ')
                .replace(/\b\w/g, (c: string) => c.toUpperCase());
            }
          }

          // 1. Fetch profile from database
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          const finalCompanyName = 
            profileData?.company_name || 
            metaCompanyName || 
            domainCompanyFallback || 
            (isSuperAdminEmail ? 'MarketPulse Master Platform' : 'Logistics Agency');

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

          // 2. Fetch real user config from Supabase database via dedicated server API
          try {
            const configRes = await fetch(`/api/config/get?userId=${user.id}`);
            const configJson = await configRes.json();
            if (configJson.success && configJson.config) {
              setUserConfig(configJson.config);
              localStorage.setItem('marketpulse_config', JSON.stringify(configJson.config));
            } else {
              const { data: configData } = await supabase
                .from('user_configs')
                .select('*')
                .eq('id', user.id)
                .single();
              if (configData) {
                setUserConfig(configData);
                localStorage.setItem('marketpulse_config', JSON.stringify(configData));
              }
            }
          } catch {
            const { data: configData } = await supabase
              .from('user_configs')
              .select('*')
              .eq('id', user.id)
              .single();
            if (configData) {
              setUserConfig(configData);
              localStorage.setItem('marketpulse_config', JSON.stringify(configData));
            }
          }

          // 3. Fetch real leads via dedicated server API
          try {
            const leadsRes = await fetch(`/api/leads/list?userId=${user.id}`);
            const leadsJson = await leadsRes.json();
            if (leadsJson.success && Array.isArray(leadsJson.leads)) {
              setLeads(leadsJson.leads);
              localStorage.setItem('marketpulse_leads', JSON.stringify(leadsJson.leads));
            } else {
              // fallback direct Supabase query
              const { data: directLeads } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });
              if (directLeads) {
                setLeads(directLeads);
                localStorage.setItem('marketpulse_leads', JSON.stringify(directLeads));
              }
            }
          } catch {
            const { data: directLeads } = await supabase
              .from('leads')
              .select('*')
              .order('created_at', { ascending: false });
            if (directLeads) {
              setLeads(directLeads);
              localStorage.setItem('marketpulse_leads', JSON.stringify(directLeads));
            }
          }

          // 4. Fetch real campaign activity logs from Supabase
          const { data: dbLogs } = await supabase
            .from('campaign_logs')
            .select('*')
            .order('created_at', { ascending: false });

          if (dbLogs) {
            setLogs(dbLogs);
            localStorage.setItem('marketpulse_logs', JSON.stringify(dbLogs));
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
    let formattedLeads: Lead[] = newLeadsData.map((data) => ({
      id: generateUuid(),
      company_name: data.company_name?.trim() || 'Unknown Company',
      contact_person: data.contact_person?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      country: data.country?.trim() || 'International',
      website_url: data.website_url?.trim() || '',
      source: data.source || 'manual_upload',
      status: 'pending',
      created_at: new Date().toISOString(),
    }));

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/leads/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads: formattedLeads,
          userId: user?.id,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.leads && resData.leads.length > 0) {
        formattedLeads = resData.leads;
      }
    } catch (err: any) {
      console.error('Error saving leads via server API:', err);
    }

    const updated = [...formattedLeads, ...leads];
    await persistLeads(updated);

    const newLog: CampaignLog = {
      id: generateUuid(),
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

    try {
      await fetch('/api/leads/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
    } catch (err) {
      console.error('Error updating lead via API:', err);
    }
  };

  const deleteLead = async (id: string) => {
    const updated = leads.filter(lead => lead.id !== id);
    await persistLeads(updated);

    try {
      await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (err) {
      console.error('Error deleting lead via API:', err);
    }
  };

  const deleteMultipleLeads = async (ids: string[]) => {
    const set = new Set(ids);
    const updated = leads.filter(lead => !set.has(lead.id));
    await persistLeads(updated);

    try {
      await fetch('/api/leads/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.error('Error deleting multiple leads via API:', err);
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
      const updates: Partial<Lead> = {
        company_profile: enrichment.company_profile,
        financial_info: enrichment.financial_info,
        email_subject: enrichment.email_subject,
        email_body: enrichment.email_body,
        status: userConfig.auto_send_enabled ? 'approved' : 'drafted',
      };
      await updateLead(id, updates);

      const logId = generateUuid();
      const newLog: CampaignLog = {
        id: logId,
        lead_id: id,
        event_type: 'researched',
        lead_company: lead.company_name,
        details: { subject: enrichment.email_subject },
        created_at: new Date().toISOString(),
      };
      await persistLogs([newLog, ...logs]);

      if (userConfig.auto_send_enabled) {
        await sendSingleEmail(id);
      }

      return true;
    } catch (err: any) {
      await updateLead(id, {
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

      await updateLead(id, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        error_message: undefined,
      });

      const logId = generateUuid();
      const newLog: CampaignLog = {
        id: logId,
        lead_id: id,
        event_type: 'sent',
        lead_company: lead.company_name,
        details: { to: lead.email, subject: lead.email_subject },
        created_at: new Date().toISOString(),
      };
      await persistLogs([newLog, ...logs]);

      return { success: true, message: 'Email dispatched successfully!' };
    } catch (err: any) {
      await updateLead(id, {
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

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const response = await fetch('/api/config/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: newConfig,
          userId: user?.id,
        }),
      });

      const data = await response.json();
      if (data.success && data.config) {
        setUserConfig(data.config);
        if (typeof window !== 'undefined') {
          localStorage.setItem('marketpulse_config', JSON.stringify(data.config));
        }
      }
    } catch (err) {
      console.error('Error updating config in database:', err);
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
