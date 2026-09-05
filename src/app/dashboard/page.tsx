'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import LeadDrawer from '@/components/leads/LeadDrawer';
import { 
  Sparkles, 
  Send, 
  FileSpreadsheet, 
  ArrowRight 
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function DashboardPage() {
  const { leads, profile, enrichBatchLeads, isProcessingBatch } = useApp();
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  const pendingLeads = leads.filter(l => l.status === 'pending');

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Action Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 dark:from-slate-900 dark:via-[#0D1527] dark:to-[#0A192F] text-white border border-teal-600/30 dark:border-cyan-500/20 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 dark:bg-cyan-500/10 border border-white/20 dark:border-cyan-500/30 text-teal-100 dark:text-cyan-400 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Lead Enrichment Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scale Your Business Outreach
            </h2>
            <p className="mt-2 text-sm text-teal-50 dark:text-slate-300 leading-relaxed">
              Research prospect web footprints, extract company intelligence, and automatically draft high-converting cold pitches personalized with <span className="font-bold underline text-white dark:text-cyan-400">{profile.company_name}</span>'s USPs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leads"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 dark:bg-slate-800/90 dark:hover:bg-slate-700 text-white dark:text-slate-200 border border-white/30 dark:border-slate-700 text-xs font-bold transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-200 dark:text-cyan-400" />
              <span>Import CSV / Leads</span>
            </Link>

            <button
              onClick={() => enrichBatchLeads()}
              disabled={isProcessingBatch || pendingLeads.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-lg ${
                isProcessingBatch
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : pendingLeads.length > 0
                  ? 'bg-white text-teal-900 hover:bg-teal-50 dark:bg-gradient-to-r dark:from-cyan-500 dark:via-teal-400 dark:to-amber-400 dark:text-slate-950 shadow-cyan-500/25 active:scale-95'
                  : 'bg-white/20 text-white/60 cursor-not-allowed border border-white/10'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              <span>
                {isProcessingBatch 
                  ? 'Researching...' 
                  : pendingLeads.length > 0
                  ? `AI Research ${pendingLeads.length} Pending Leads`
                  : 'All Leads Researched'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <MetricsCards />

      {/* Analytics Visuals */}
      <AnalyticsCharts />

      {/* Recent Activity Live Feed Table */}
      <RecentActivityFeed onOpenLead={(id) => setActiveLeadId(id)} />

      {/* Lead Drawer */}
      {activeLeadId && (
        <LeadDrawer
          key={activeLeadId}
          leadId={activeLeadId}
          onClose={() => setActiveLeadId(null)}
        />
      )}
    </div>
  );
}
