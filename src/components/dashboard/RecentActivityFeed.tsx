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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending AI
          </span>
        );
      case 'enriching':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 animate-pulse">
            <Sparkles className="w-3 h-3 animate-spin" />
            Researching
          </span>
        );
      case 'drafted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
            <Mail className="w-3 h-3" />
            Pitch Drafted
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Send className="w-3 h-3" />
            Dispatched
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
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
    <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            Recent Ingested &amp; Processed Leads
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Live operational stream of target logistics partners</p>
        </div>

        <Link
          href="/leads"
          className="flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-cyan-400 hover:underline transition-colors"
        >
          <span>Open Full Lead Manager</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="py-3 px-6">Company &amp; Corridor</th>
              <th className="py-3 px-6">Contact &amp; Email</th>
              <th className="py-3 px-6">Source</th>
              <th className="py-3 px-6">Intelligence Status</th>
              <th className="py-3 px-6">Time</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
            {recentLeads.length > 0 ? (
              recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-700 dark:text-cyan-400 font-bold text-xs">
                        {lead.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-sm">{lead.company_name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {lead.country || 'Global'}
                          </span>
                          {lead.website_url && (
                            <a 
                              href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-0.5 font-medium"
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
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{lead.contact_person || 'Logistics Lead'}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{lead.email}</p>
                  </td>

                  <td className="py-3.5 px-6">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono uppercase font-medium">
                      {lead.source || 'Manual'}
                    </span>
                  </td>

                  <td className="py-3.5 px-6">
                    {getStatusBadge(lead.status)}
                  </td>

                  <td className="py-3.5 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                    {formatTimeAgo(lead.created_at)}
                  </td>

                  <td className="py-3.5 px-6 text-right">
                    {lead.status === 'pending' ? (
                      <button
                        onClick={() => enrichSingleLead(lead.id)}
                        className="px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-bold transition-all"
                      >
                        Enrich with AI
                      </button>
                    ) : (
                      <button
                        onClick={() => onOpenLead ? onOpenLead(lead.id) : null}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
                      >
                        View Intelligence
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No leads ingested yet</p>
                  <p className="text-xs text-slate-500 mt-1">Upload a CSV or add prospects to view live research activity.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
