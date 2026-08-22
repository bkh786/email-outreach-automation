'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Lead, Profile, UserConfig, CampaignLog, LeadStatus } from '../types';
import { DEFAULT_PROFILE, DEFAULT_USER_CONFIG, INITIAL_LEADS, INITIAL_LOGS } from './demo-store';
import { isSupabaseConfigured, createClient } from '../supabase/client';

interface AppContextType {
  leads: Lead[];
  profile: Profile;
  userConfig: UserConfig;
  logs: CampaignLog[];
  isDemoMode: boolean;
  isProcessingBatch: boolean;
  activeBatchProgress: { current: number; total: number } | null;
  addLeads: (newLeads: Partial<Lead>[]) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  deleteMultipleLeads: (ids: string[]) => Promise<void>;
  enrichSingleLead: (id: string) => Promise<boolean>;
  enrichBatchLeads: (ids?: string[]) => Promise<{ processed: number; failed: number }>;
  sendSingleEmail: (id: string) => Promise<{ success: boolean; message: string }>;
  updateProfile: (profile: Profile) => Promise<void>;
  updateUserConfig: (config: UserConfig) => Promise<void>;
  resetToDemoData: () => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [userConfig, setUserConfig] = useState<UserConfig>(DEFAULT_USER_CONFIG);
  const [logs, setLogs] = useState<CampaignLog[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [activeBatchProgress, setActiveBatchProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    if (typeof window === 'undefined') return;

    const supabaseReady = isSupabaseConfigured();
    setIsDemoMode(!supabaseReady);

    // Try reading from localStorage first
    try {
      const storedLeads = localStorage.getItem('freightpulse_leads');
      const storedProfile = localStorage.getItem('freightpulse_profile');
      const storedConfig = localStorage.getItem('freightpulse_config');
      const storedLogs = localStorage.getItem('freightpulse_logs');

      if (storedLeads) setLeads(JSON.parse(storedLeads));
      else {
        setLeads(INITIAL_LEADS);
        localStorage.setItem('freightpulse_leads', JSON.stringify(INITIAL_LEADS));
      }

      if (storedProfile) setProfile(JSON.parse(storedProfile));
      else {
        setProfile(DEFAULT_PROFILE);
        localStorage.setItem('freightpulse_profile', JSON.stringify(DEFAULT_PROFILE));
      }

      if (storedConfig) setUserConfig(JSON.parse(storedConfig));
      else {
        setUserConfig(DEFAULT_USER_CONFIG);
        localStorage.setItem('freightpulse_config', JSON.stringify(DEFAULT_USER_CONFIG));
      }

      if (storedLogs) setLogs(JSON.parse(storedLogs));
      else {
        setLogs(INITIAL_LOGS);
        localStorage.setItem('freightpulse_logs', JSON.stringify(INITIAL_LOGS));
      }
    } catch (e) {
      console.error('Error loading stored data:', e);
      setLeads(INITIAL_LEADS);
      setProfile(DEFAULT_PROFILE);
      setUserConfig(DEFAULT_USER_CONFIG);
      setLogs(INITIAL_LOGS);
    }
  };

  const persistLeads = (newLeads: Lead[]) => {
    setLeads(newLeads);
    if (typeof window !== 'undefined') {
      localStorage.setItem('freightpulse_leads', JSON.stringify(newLeads));
    }
  };

  const persistLogs = (newLogs: CampaignLog[]) => {
    setLogs(newLogs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('freightpulse_logs', JSON.stringify(newLogs));
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

    // Set lead status to enriching
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

      // If auto-send is enabled, immediately dispatch
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

      // Brief delay between batch items to avoid hitting rate limits
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
      localStorage.setItem('freightpulse_profile', JSON.stringify(newProfile));
    }
  };

  const updateUserConfig = async (newConfig: UserConfig) => {
    setUserConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('freightpulse_config', JSON.stringify(newConfig));
    }
  };

  const resetToDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('freightpulse_leads');
      localStorage.removeItem('freightpulse_profile');
      localStorage.removeItem('freightpulse_config');
      localStorage.removeItem('freightpulse_logs');
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
