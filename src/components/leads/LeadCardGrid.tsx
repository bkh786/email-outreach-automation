'use client';

import React from 'react';
import { 
  Building2, 
  ExternalLink, 
  Sparkles, 
  Send, 
  ArrowRight, 
  Star, 
  Share2, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Globe 
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useApp } from '@/lib/store/app-context';

interface LeadCardGridProps {
  leads: Lead[];
  onSelectLead: (id: string) => void;
}

export default function LeadCardGrid({ leads, onSelectLead }: LeadCardGridProps) {
  const { enrichSingleLead } = useApp();

  const getPriorityBadge = (lead: Lead) => {
    if (lead.status === 'sent') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
          Sent
        </span>
      );
    }
    if (lead.status === 'drafted' || lead.status === 'approved') {
      return (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
          High Priority
        </span>
      );
    }
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
        Medium Priority
      </span>
    );
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'sent':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-semibold">Dispatched</span>;
      case 'drafted':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100/80 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-semibold">Pitch Ready</span>;
      case 'approved':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100/80 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold">Approved</span>;
      case 'enriching':
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-cyan-100/80 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400 font-semibold animate-pulse">Researching...</span>;
      default:
        return <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">Prospect</span>;
    }
  };

  if (leads.length === 0) {
    return (
      <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
        <Building2 className="w-12 h-12 mx-auto text-slate-400 dark:text-slate-600 mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">No Matching Leads Found</h3>
        <p className="text-xs text-slate-500 mt-1">Try clearing your search query or upload a new prospect batch.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
      {leads.map((lead) => {
        const headline = lead.email_subject || `[V2 Forwarding Scope] Corridor Capacity & Space Allocation`;
        const synopsis = lead.company_profile || `Active logistics and shipping footprint in ${lead.country || 'international corridors'}. Potential freight forwarder synergy for direct trade lane routing.`;

        return (
          <div
            key={lead.id}
            onClick={() => onSelectLead(lead.id)}
            className="group rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800/80 hover:border-teal-500/50 dark:hover:border-cyan-500/50 shadow-sm hover:shadow-xl transition-all duration-200 p-5 flex flex-col justify-between cursor-pointer relative overflow-hidden"
          >
            <div>
              {/* Card Header Row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-extrabold text-teal-600 dark:text-cyan-400 text-sm shadow-inner flex-shrink-0">
                    {lead.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate leading-tight group-hover:text-teal-600 dark:group-hover:text-cyan-400 transition-colors">
                      {lead.company_name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {lead.country || 'Global Corridor'} &bull; {lead.source || 'Manual'}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {getPriorityBadge(lead)}
                </div>
              </div>

              {/* Score & Status Row */}
              <div className="flex items-center gap-2 mb-3.5 pt-1">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-200/60 dark:border-rose-800/40">
                  <Star className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                  <span>Score: 5/5</span>
                </div>

                {getStatusBadge(lead.status)}
              </div>

              {/* Top Opportunity / Strategy Snippet */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-150 dark:border-slate-800/80 mb-4 space-y-1.5">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-600 dark:text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Top Opportunity</span>
                </p>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                  {headline}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                  {synopsis}
                </p>
              </div>
            </div>

            {/* Action Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onSelectLead(lead.id)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-teal-700 dark:text-cyan-400 text-xs font-bold transition-colors flex items-center justify-center gap-1"
              >
                <span>View Brand Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {lead.status === 'pending' ? (
                <button
                  onClick={() => enrichSingleLead(lead.id)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Run AI Research"
                >
                  <Sparkles className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                </button>
              ) : (
                <button
                  onClick={() => onSelectLead(lead.id)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                  title="Review Outreach Draft"
                >
                  <Mail className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
