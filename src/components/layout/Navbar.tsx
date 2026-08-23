'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Plus, 
  RefreshCw,
  AlertCircle
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

  // 1. Resolve Company Name (Primary Title Only)
  let companyTitle = profile.company_name;
  if (!companyTitle || companyTitle === 'Freight Forwarding Agency' || companyTitle === 'Logistics Company') {
    if (currentUserEmail && currentUserEmail.includes('@')) {
      const domainPart = currentUserEmail.split('@')[1]?.split('.')[0];
      if (domainPart && !['gmail', 'yahoo', 'outlook', 'hotmail', 'icloud'].includes(domainPart.toLowerCase())) {
        companyTitle = domainPart
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
      } else {
        companyTitle = isSuperAdmin ? 'MarketPulse Master Platform' : 'Logistics Company';
      }
    } else {
      companyTitle = isSuperAdmin ? 'MarketPulse Master Platform' : 'Logistics Company';
    }
  }

  // 2. Resolve Contact Person Name (Subtitle Only)
  let contactSubtitle = profile.contact_person;
  if (!contactSubtitle || contactSubtitle === 'Operations Lead' || contactSubtitle === 'Operations Contact') {
    if (currentUserEmail && currentUserEmail.includes('@')) {
      const localPart = currentUserEmail.split('@')[0];
      contactSubtitle = localPart
        .replace(/[-_.]/g, ' ')
        .replace(/\b\w/g, (c: string) => c.toUpperCase());
    } else {
      contactSubtitle = isSuperAdmin ? 'Super Administrator' : 'Client Operations';
    }
  }

  return (
    <header className="h-20 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors shadow-sm">
      {/* Left: Company Name & Contact Person Subtitle */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
              {companyTitle}
            </h1>

            {/* Accurate Real-Time Gemini Connection Status */}
            {geminiStatus === 'active' ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-sm flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{userConfig.gemini_api_key ? 'Gemini 1.5 (BYOK Active)' : 'Gemini 1.5 Active'}</span>
              </span>
            ) : geminiStatus === 'missing' ? (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors shadow-sm flex-shrink-0"
                title="Configure Gemini API Key in Settings"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Gemini Key Missing</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-pulse" />
                <span>Checking AI...</span>
              </span>
            )}
          </div>

          {/* Subtitle: Contact Person Name Only */}
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
            {contactSubtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions, Refresh, Dark/Light Mode, & Add Lead */}
      <div className="flex items-center gap-3 sm:gap-3.5 flex-shrink-0">
        {/* Refresh Data Button */}
        <button
          onClick={() => refreshData()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm active:scale-95"
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
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-700 text-xs font-bold transition-all shadow-sm active:scale-95"
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
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 text-xs font-extrabold shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Lead</span>
        </button>
      </div>
    </header>
  );
}
