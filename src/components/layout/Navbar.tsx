'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Plus, 
  RefreshCw,
  AlertCircle,
  Building2,
  User
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import ThemeSelector from './ThemeSelector';

export default function Navbar() {
  const router = useRouter();
  const { 
    profile,
    currentUserEmail,
    userConfig, 
    leads, 
    enrichBatchLeads, 
    isProcessingBatch, 
    refreshData 
  } = useApp();

  const [geminiStatus, setGeminiStatus] = useState<'checking' | 'active' | 'missing'>('checking');

  useEffect(() => {
    const checkGeminiStatus = async () => {
      if (userConfig.gemini_api_key && userConfig.gemini_api_key.trim().length > 5) {
        setGeminiStatus('active');
        return;
      }

      try {
        const res = await fetch('/api/test-gemini');
        const data = await res.json();
        if (data.configured) {
          setGeminiStatus('active');
        } else {
          setGeminiStatus('missing');
        }
      } catch {
        setGeminiStatus('missing');
      }
    };

    checkGeminiStatus();
  }, [userConfig.gemini_api_key]);

  const isSuperAdmin = 
    profile.role === 'super_admin' || 
    profile.role === 'admin' || 
    currentUserEmail === 'bkh786@gmail.com' || 
    currentUserEmail === 'admin@freightpulse.ai' || 
    currentUserEmail === 'admin@marketpulse.ai';

  const pendingLeads = leads.filter(l => l.status === 'pending');

  const displayName = profile.company_name && profile.company_name !== 'Freight Forwarding Agency'
    ? profile.company_name 
    : (currentUserEmail ? currentUserEmail.split('@')[0] : 'Workspace');

  const contactSubtitle = profile.contact_person
    ? `${profile.contact_person} • ${currentUserEmail || ''}`
    : (currentUserEmail || 'Autonomous Lead Intelligence & Cold Outreach');

  return (
    <header className="h-18 bg-white/95 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Company Name, Role Badge, Contact Person, & Accurate Gemini Status */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span>{displayName}</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-teal-100 dark:bg-cyan-500/20 text-teal-800 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30">
                {isSuperAdmin ? 'Super Admin' : 'Client'}
              </span>
            </h1>

            {/* Accurate Real-Time Gemini Connection Status */}
            {geminiStatus === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>{userConfig.gemini_api_key ? 'Gemini 1.5 (BYOK Active)' : 'Gemini 1.5 Active'}</span>
              </span>
            ) : geminiStatus === 'missing' ? (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                title="Configure Gemini API Key in Settings"
              >
                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Gemini Key Missing</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse" />
                <span>Checking AI...</span>
              </span>
            )}
          </div>

          {/* Subtitle: Contact Person / Client Email */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[320px] sm:max-w-none">
            {contactSubtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Refresh, Dark/Light Mode, & Add Lead */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Refresh Data Button */}
        <button
          onClick={() => refreshData()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors"
          title="Refresh leads and metrics"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>

        {/* Quick Batch AI Research Action (if pending leads exist) */}
        {pendingLeads.length > 0 && (
          <button
            onClick={() => enrichBatchLeads()}
            disabled={isProcessingBatch}
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-xs font-bold transition-all"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
            <span>AI Research ({pendingLeads.length})</span>
          </button>
        )}

        {/* Dark / Light Mode Toggle */}
        <ThemeSelector />

        {/* Add Lead Action Button */}
        <button
          onClick={() => router.push('/leads')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-bold shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Add Lead</span>
        </button>
      </div>
    </header>
  );
}
