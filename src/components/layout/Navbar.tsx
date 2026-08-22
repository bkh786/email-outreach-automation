'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import ThemeSelector from './ThemeSelector';

export default function Navbar() {
  const router = useRouter();
  const { 
    userConfig, 
    leads, 
    enrichBatchLeads, 
    isProcessingBatch, 
    refreshData 
  } = useApp();

  const pendingLeads = leads.filter(l => l.status === 'pending');

  return (
    <header className="h-18 bg-white/95 dark:bg-[#0B1120]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors">
      {/* Left: Email Outreach Automation Title & Gemini Connection Status */}
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Email Outreach Automation
            </h1>

            {/* Gemini Live Connection Status */}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20">
              <Sparkles className="w-3 h-3 text-teal-600 dark:text-cyan-400" />
              <span>{userConfig.gemini_api_key ? 'Gemini 1.5 Flash (BYOK Active)' : 'Gemini 1.5 Live'}</span>
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Multi-Tenant Lead Research & Cold Outreach Platform
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
