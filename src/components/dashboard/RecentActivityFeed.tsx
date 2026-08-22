'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Mail, 
  ExternalLink, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { LeadStatus } from '@/lib/types';

export default function RecentActivityFeed({ onOpenLead }: { onOpenLead?: (id: string) => void }) {
  const { leads, enrichSingleLead } = useApp();

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending AI
          </span>
        );
      case 'enriching':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse">
            <Sparkles className="w-3 h-3 animate-spin" />
            Researching
          </span>
        );
      case 'drafted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Mail className="w-3 h-3" />
            Pitch Drafted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Send className="w-3 h-3" />
            Dispatched
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
      if (diff < 60) return 'just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return 'recent';
    }
  };

  return (
    <div className="rounded-2xl bg-[#0F172A]/80 border border-slate-800 shadow-xl overflow-hidden">
      <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            Recent Ingested & Processed Leads
          </h3>
          <p className="text-xs text-slate-400">Live operational stream of target logistics partners</p>
        </div>

        <Link
          href="/leads"
          className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Open Full Lead Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0B1120]/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/80">
            <tr>
              <th className="py-3 px-6">Company & Corridor</th>
              <th className="py-3 px-6">Contact & Email</th>
              <th className="py-3 px-6">Source</th>
              <th className="py-3 px-6">Intelligence Status</th>
              <th className="py-3 px-6">Time</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            {recentLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                <td className="py-3.5 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                      {lead.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{lead.company_name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {lead.country || 'Global'}
                        </span>
                        {lead.website_url && (
                          <a 
                            href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-cyan-400 hover:underline flex items-center gap-0.5"
                          >
                            <span>Web</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-6">
                  <p className="font-medium text-slate-200">{lead.contact_person || 'Logistics Lead'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{lead.email}</p>
                </td>

                <td className="py-3.5 px-6">
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono uppercase">
                    {lead.source || 'Manual'}
                  </span>
                </td>

                <td className="py-3.5 px-6">
                  {getStatusBadge(lead.status)}
                </td>

                <td className="py-3.5 px-6 text-slate-400 text-[11px]">
                  {formatTimeAgo(lead.created_at)}
                </td>

                <td className="py-3.5 px-6 text-right">
                  {lead.status === 'pending' ? (
                    <button
                      onClick={() => enrichSingleLead(lead.id)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                    >
                      Enrich with AI
                    </button>
                  ) : (
                    <Link
                      href={`/leads?id=${lead.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
                    >
                      View Intelligence
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
