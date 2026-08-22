'use client';

import React from 'react';
import Link from 'next/link';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import { 
  Sparkles, 
  UploadCloud, 
  Send, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Zap, 
  Globe2, 
  Flame,
  CheckCircle,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function DashboardPage() {
  const { leads, profile, userConfig, enrichBatchLeads, isProcessingBatch } = useApp();

  const pendingLeads = leads.filter(l => l.status === 'pending');
  const draftedLeads = leads.filter(l => l.status === 'drafted' || l.status === 'approved');

  return (
    <div className="space-y-6 pb-12">
      {/* Dynamic Action Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-[#0D1527] to-[#0A192F] border border-cyan-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Lead Enrichment Pipeline</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Scale Your Freight Forwarding Agency Outreach
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Research prospect web footprints, extract trade corridor volumes, and automatically draft high-converting cold pitches personalized with <span className="text-cyan-400 font-semibold">{profile.company_name}</span>'s USPs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/leads"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all shadow-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>Import CSV / Leads</span>
            </Link>

            <button
              onClick={() => enrichBatchLeads()}
              disabled={isProcessingBatch || pendingLeads.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isProcessingBatch
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                  : pendingLeads.length > 0
                  ? 'bg-gradient-to-r from-cyan-500 via-teal-400 to-amber-400 hover:opacity-90 text-slate-950 shadow-cyan-500/25 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Sparkles className={`w-4 h-4 ${isProcessingBatch ? 'animate-spin' : ''}`} />
              <span>
                {isProcessingBatch 
                  ? 'Researching in Background...' 
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

      {/* Recent Activity Table */}
      <RecentActivityFeed />
    </div>
  );
}
