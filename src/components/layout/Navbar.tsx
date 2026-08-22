'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Sparkles, 
  UploadCloud, 
  Building, 
  RotateCcw, 
  Send,
  Zap,
  Globe2,
  CheckCircle,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { 
    profile, 
    leads, 
    enrichBatchLeads, 
    isProcessingBatch, 
    userConfig,
    resetToDemoData 
  } = useApp();

  const pendingLeads = leads.filter(l => l.status === 'pending');

  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Outreach Performance Dashboard';
    if (pathname.startsWith('/leads')) return 'Lead Intelligence & Outreach Center';
    if (pathname.startsWith('/brand')) return 'Self Brand & Trade Lane Profile';
    if (pathname.startsWith('/settings')) return 'BYOK & Infrastructure Settings';
    return 'FreightPulse AI Engine';
  };

  const getPageSubtitle = () => {
    if (pathname === '/dashboard') return 'Real-time campaign KPIs, corridor conversion analytics & prospect activity.';
    if (pathname.startsWith('/leads')) return 'Manage prospective logistics partners, run automated website crawls, and synthesize personalized pitches.';
    if (pathname.startsWith('/brand')) return 'Configure your freight forwarding capabilities, USPs, certifications, and prompt benchmarks.';
    if (pathname.startsWith('/settings')) return 'Configure Google Gemini API credentials, Nodemailer SMTP transport, and throttling.';
    return 'Multi-tenant freight forwarding outreach automation';
  };

  const handleBatchAI = async () => {
    if (pendingLeads.length === 0) {
      alert('No pending leads found to research! Upload new leads or add prospects in the Lead Intelligence view.');
      return;
    }
    await enrichBatchLeads();
  };

  return (
    <header className="h-20 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
          {getPageTitle()}
        </h1>
        <p className="text-xs text-slate-400 font-normal">
          {getPageSubtitle()}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Active Company Badge */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
          <Building className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-white max-w-[180px] truncate">
            {profile.company_name || 'Global Logistics'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        </div>

        {/* Batch AI Research Action */}
        <button
          onClick={handleBatchAI}
          disabled={isProcessingBatch || pendingLeads.length === 0}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md transition-all ${
            isProcessingBatch
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : pendingLeads.length > 0
              ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
              : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-slate-700/60'
          }`}
          title={pendingLeads.length > 0 ? `Enrich ${pendingLeads.length} pending leads with Gemini AI` : 'No pending leads'}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isProcessingBatch ? 'animate-spin' : ''}`} />
          <span>
            {isProcessingBatch 
              ? 'Researching...' 
              : pendingLeads.length > 0 
              ? `AI Research (${pendingLeads.length} Pending)`
              : 'AI Research Ready'}
          </span>
        </button>

        {/* Demo Reset Helper */}
        <button
          onClick={() => {
            if (confirm('Reset workspace leads and settings to initial logistics demo data?')) {
              resetToDemoData();
            }
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800 transition-colors"
          title="Reset to Demo Data"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
