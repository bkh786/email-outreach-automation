'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lead, Profile, UserConfig, CampaignLog } from '@/lib/types';
import { isSupabaseConfigured, createClient } from '@/lib/supabase/client';

const DEFAULT_PROFILE: Profile = {
  id: 'master-profile',
  company_name: 'Global Freight Dynamics Ltd.',
  website_url: 'https://globalfreightdynamics.com',
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
  unique_selling_proposition: 'Specialized in transpacific expedited air charters and guaranteed space allocations during peak shipping seasons with real-time GPS telemetry.',
  strengths_and_certifications: 'IATA Cargo Agent, FIATA Member, WCA First-Tier Partner, ISO 9001:2015',
  email_signature: `Best regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820 | ops@globalfreightdynamics.com\nwww.globalfreightdynamics.com`
};

const DEFAULT_USER_CONFIG: UserConfig = {
  id: 'master-config',
  gemini_api_key: '',
  smtp_host: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_user: '',
  smtp_pass: '',
  smtp_secure: false,
  from_name: 'FreightPulse Operations',
  from_email: 'outreach@freightpulse.ai',
  auto_send_enabled: false,
  max_daily_emails: 50,
  max_hourly_rate: 15,
};

const INITIAL_LEADS: Lead[] = [
  {
    id: 'lead-1',
    company_name: 'Apex Transpacific Cargo',
    contact_person: 'Marcus Vance',
    email: 'm.vance@apextranspacific.com',
    phone: '+1 (415) 890-1200',
    country: 'United States',
    website_url: 'https://apextranspacific.com',
    source: 'jctrans',
    company_profile: 'Mid-sized freight forwarder specializing in transpacific ocean container imports from Shenzhen and Ningbo to West Coast ports (LAX/Long Beach). High volume in electronics and consumer goods.',
    financial_info: 'Estimated 8,500+ TEU annual volume across Pacific routes with bonded warehousing in Southern California.',
    email_subject: 'Guaranteed space allocations & expedited transpacific benchmarks for Apex Transpacific',
    email_body: `Hi Marcus,\n\nNoticed Apex Transpacific's consistent container throughput across the Shenzhen-Long Beach corridor.\n\nAt Global Freight Dynamics Ltd., we specialize in guaranteed peak-season allocations and dedicated transpacific air charter capacity with bonded CFS warehousing in LAX. We've helped regional forwarders reduce transit delays by 35% on transpacific lanes.\n\nWould you be open to a quick 5-minute comparison on current Q3 space allocations and contract rates?\n\nBest regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820\nwww.globalfreightdynamics.com`,
    status: 'sent',
    sent_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
  {
    id: 'lead-2',
    company_name: 'Bavaria Forwarding GmbH',
    contact_person: 'Klaus Schneider',
    email: 'klaus.schneider@bavariaforwarding.de',
    phone: '+49 89 4501 229',
    country: 'Germany',
    website_url: 'https://bavariaforwarding.de',
    source: 'csv_import',
    company_profile: 'European freight consolidator focusing on automotive components, heavy industrial machinery, and precision tools between Germany, Central Europe, and US East Coast ports.',
    financial_info: 'Handling ~12,000 air cargo shipments annually with IATA bonded facilities near Munich (MUC) and Frankfurt (FRA).',
    email_subject: 'High-frequency transatlantic air charter & bonded CFS support for Bavaria Forwarding',
    email_body: `Hi Klaus,\n\nSaw Bavaria Forwarding's leadership in high-value automotive and machinery consolidation across Central Europe.\n\nGlobal Freight Dynamics Ltd. operates bonded CFS facilities and priority transatlantic air charter routes with guaranteed temperature control and real-time telemetry.\n\nAre you looking for reliable capacity partners into North American hubs this quarter?\n\nBest regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820\nwww.globalfreightdynamics.com`,
    status: 'approved',
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'lead-3',
    company_name: 'SinoTech Global Supply Chain',
    contact_person: 'Zhang Wei',
    email: 'zhang.wei@sinotechsupply.cn',
    phone: '+86 21 6889 4410',
    country: 'China',
    website_url: 'https://sinotechsupply.cn',
    source: 'manual_upload',
    company_profile: 'Major cross-border e-commerce and electronics logistics provider operating multi-modal air-sea corridors from Shanghai and Shenzhen into European and North American fulfillment hubs.',
    financial_info: 'Over 25,000 tons of air freight processed annually, holding NVOCC tier-one certifications.',
    email_subject: 'Direct LAX & FRA customs clearance & DDP solutions for SinoTech Global',
    email_body: `Hi Zhang Wei,\n\nFollowing SinoTech's fast expansion in cross-border e-commerce freight from Shanghai into US hubs.\n\nGlobal Freight Dynamics Ltd. provides automated customs clearance, DDP/DAP solutions, and bonded sortation directly adjacent to LAX and FRA.\n\nCould we explore a bilateral rate benchmark for your upcoming peak season volumes?\n\nBest regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820\nwww.globalfreightdynamics.com`,
    status: 'sent',
    sent_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
  {
    id: 'lead-4',
    company_name: 'Emirates Intermodal Logistics',
    contact_person: 'Tariq Mansoor',
    email: 'tariq@emiratesintermodal.ae',
    phone: '+971 4 881 2900',
    country: 'United Arab Emirates',
    website_url: 'https://emiratesintermodal.ae',
    source: 'jctrans',
    company_profile: 'Dubai-based logistics hub managing sea-air transshipment between Southeast Asia, the Indian Subcontinent, and European distribution networks via Jebel Ali Port.',
    financial_info: 'Managing 150,000+ sqm bonded logistics park in JAFZA with sea-air transshipment facilities.',
    email_subject: 'Fast-track sea-air transpacific connection benchmarks for Emirates Intermodal',
    email_body: `Hi Tariq,\n\nImpressed by Emirates Intermodal's sea-air connectivity through Jebel Ali.\n\nGlobal Freight Dynamics Ltd. works as a premier US & EU partner providing rapid air charter connections and bonded CFS sortation with zero customs clearance delays.\n\nLet's schedule a brief call this week to review synergy on your transpacific and transatlantic routes.\n\nBest regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820\nwww.globalfreightdynamics.com`,
    status: 'sent',
    sent_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString(),
  },
  {
    id: 'lead-5',
    company_name: 'Nordic SeaAir Forwarding AS',
    contact_person: 'Henrik Lindqvist',
    email: 'henrik@nordicseaair.no',
    phone: '+47 22 99 10 40',
    country: 'Norway',
    website_url: 'https://nordicseaair.no',
    source: 'csv_import',
    company_profile: 'Scandinavian freight forwarder with deep expertise in perishable seafood air freight, maritime spare parts, and offshore project cargo across transatlantic routes.',
    financial_info: 'Processes over 300 metric tons of fresh seafood weekly with certified cold chain infrastructure.',
    email_subject: 'Cold-chain air charter & temperature-monitored space for Nordic SeaAir',
    email_body: `Hi Henrik,\n\nSaw Nordic SeaAir's exceptional cold-chain transport footprint across transatlantic routes.\n\nGlobal Freight Dynamics Ltd. offers certified temperature-controlled air charter capacity and direct bonded CFS storage in North America.\n\nWould you be open to reviewing our guaranteed temperature-controlled space allocations for Q3?\n\nBest regards,\n\nTrade Lane Development Team\nGlobal Freight Dynamics\nDirect: +1 (555) 019-4820\nwww.globalfreightdynamics.com`,
    status: 'drafted',
    created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString(),
  },
  {
    id: 'lead-6',
    company_name: 'Tokyo Express Freight Lines',
    contact_person: 'Kenji Sato',
    email: 'k.sato@tokyoexpressfreight.jp',
    phone: '+81 3 5540 8821',
    country: 'Japan',
    website_url: 'https://tokyoexpressfreight.jp',
    source: 'jctrans',
    company_profile: 'Japanese international freight forwarder specializing in high-precision electronics, optical instruments, and automotive parts into the US Midwest and East Coast.',
    financial_info: 'Key partner for top-tier Japanese industrial manufacturers with ISO 9001:2015 and AEO certifications.',
    status: 'pending',
    created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
  },
];

const INITIAL_LOGS: CampaignLog[] = [
  {
    id: 'log-1',
    event_type: 'sent',
    lead_company: 'Apex Transpacific Cargo',
    details: { to: 'm.vance@apextranspacific.com', subject: 'Guaranteed space allocations & expedited transpacific benchmarks' },
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  },
  {
    id: 'log-2',
    event_type: 'sent',
    lead_company: 'SinoTech Global Supply Chain',
    details: { to: 'zhang.wei@sinotechsupply.cn', subject: 'Direct LAX & FRA customs clearance & DDP solutions' },
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
  },
  {
    id: 'log-3',
    event_type: 'sent',
    lead_company: 'Emirates Intermodal Logistics',
    details: { to: 'tariq@emiratesintermodal.ae', subject: 'Fast-track sea-air transpacific connection benchmarks' },
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
  {
    id: 'log-4',
    event_type: 'researched',
    lead_company: 'Bavaria Forwarding GmbH',
    details: { subject: 'High-frequency transatlantic air charter & bonded CFS support' },
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'log-5',
    event_type: 'uploaded',
    lead_company: '6 Leads Ingested via Multi-Channel Sync',
    details: { count: 6 },
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];

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
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [logs, setLogs] = useState<CampaignLog[]>(INITIAL_LOGS);
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

    // If Supabase is available, check authenticated user and their real role
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

          // Fetch profile from database
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (profileData) {
            const resolvedRole = isSuperAdminEmail ? 'super_admin' : (profileData.role || 'client');
            const resolvedProfile: Profile = {
              ...DEFAULT_PROFILE,
              ...profileData,
              role: resolvedRole,
            };
            setProfile(resolvedProfile);
            localStorage.setItem('marketpulse_profile', JSON.stringify(resolvedProfile));
          } else {
            const resolvedRole = isSuperAdminEmail ? 'super_admin' : 'client';
            const resolvedProfile: Profile = {
              ...DEFAULT_PROFILE,
              role: resolvedRole,
            };
            setProfile(resolvedProfile);
            localStorage.setItem('marketpulse_profile', JSON.stringify(resolvedProfile));
          }
        }
      } catch (e) {
        console.error('Error fetching Supabase auth user:', e);
      }
    }

    // Try reading from localStorage for leads and config
    try {
      const storedLeads = localStorage.getItem('marketpulse_leads') || localStorage.getItem('freightpulse_leads');
      const storedConfig = localStorage.getItem('marketpulse_config') || localStorage.getItem('freightpulse_config');
      const storedLogs = localStorage.getItem('marketpulse_logs') || localStorage.getItem('freightpulse_logs');

      if (storedLeads) setLeads(JSON.parse(storedLeads));
      else {
        setLeads(INITIAL_LEADS);
        localStorage.setItem('marketpulse_leads', JSON.stringify(INITIAL_LEADS));
      }

      if (storedConfig) setUserConfig(JSON.parse(storedConfig));
      else {
        setUserConfig(DEFAULT_USER_CONFIG);
        localStorage.setItem('marketpulse_config', JSON.stringify(DEFAULT_USER_CONFIG));
      }

      if (storedLogs) setLogs(JSON.parse(storedLogs));
      else {
        setLogs(INITIAL_LOGS);
        localStorage.setItem('marketpulse_logs', JSON.stringify(INITIAL_LOGS));
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
      setLeads(INITIAL_LEADS);
      setUserConfig(DEFAULT_USER_CONFIG);
      setLogs(INITIAL_LOGS);
    }
  };

  const persistLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_leads', JSON.stringify(newLeads));
    }
  };

  const persistLogs = (newLogs: CampaignLog[]) => {
    setLogs(newLogs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_logs', JSON.stringify(newLogs));
    }
  };

  const addLeads = async (newLeadsData: Partial<Lead>[]) => {
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

    const updated = [...formattedLeads, ...leads];
    persistLeads(updated);

    const newLog: CampaignLog = {
      id: `log-${Date.now()}`,
      event_type: 'uploaded',
      lead_company: `${formattedLeads.length} Leads Ingested`,
      details: { count: formattedLeads.length },
      created_at: new Date().toISOString(),
    };
    persistLogs([newLog, ...logs]);
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => {
    const updated = leads.map(lead => lead.id === id ? { ...lead, ...updates } : lead);
    persistLeads(updated);
  };

  const deleteLead = async (id: string) => {
    const updated = leads.filter(lead => lead.id !== id);
    persistLeads(updated);
  };

  const deleteMultipleLeads = async (ids: string[]) => {
    const set = new Set(ids);
    const updated = leads.filter(lead => !set.has(lead.id));
    persistLeads(updated);
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
  };

  const updateUserConfig = async (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketpulse_config', JSON.stringify(newConfig));
    }
  };

  const resetToDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('marketpulse_leads');
      localStorage.removeItem('marketpulse_profile');
      localStorage.removeItem('marketpulse_config');
      localStorage.removeItem('marketpulse_logs');
    }
    setLeads(INITIAL_LEADS);
    setProfile(DEFAULT_PROFILE);
    setUserConfig(DEFAULT_USER_CONFIG);
    setLogs(INITIAL_LOGS);
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
