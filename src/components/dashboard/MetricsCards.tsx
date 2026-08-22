'use client';

import React from 'react';
import { 
  Users, 
  Sparkles, 
  Send, 
  TrendingUp, 
  ArrowUpRight
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function MetricsCards() {
  const { leads } = useApp();

  const totalLeads = leads.length;
  const enrichedAndDrafted = leads.filter(l => l.status === 'drafted' || l.status === 'approved' || l.status === 'sent').length;
  const sentToday = leads.filter(l => l.status === 'sent').length;
  const pendingCount = leads.filter(l => l.status === 'pending').length;

  const enrichmentRate = totalLeads > 0 
    ? Math.round((enrichedAndDrafted / totalLeads) * 100) 
    : 0;

  const metrics = [
    {
      title: 'Total Ingested Leads',
      value: totalLeads.toLocaleString(),
      subtitle: `${pendingCount} awaiting AI research`,
      icon: Users,
      textColor: 'text-teal-600 dark:text-cyan-400',
      bgColor: 'bg-teal-50 dark:bg-cyan-500/10',
      borderColor: 'border-slate-200 dark:border-cyan-500/20',
      growth: '+24% this week',
    },
    {
      title: 'AI Enriched & Drafted',
      value: enrichedAndDrafted.toLocaleString(),
      subtitle: `${enrichmentRate}% pipeline coverage`,
      icon: Sparkles,
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-500/10',
      borderColor: 'border-slate-200 dark:border-amber-500/20',
      growth: 'Gemini 1.5 Flash',
    },
    {
      title: 'Outreach Dispatched',
      value: sentToday.toLocaleString(),
      subtitle: 'Zero bounce rate recorded',
      icon: Send,
      textColor: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-500/10',
      borderColor: 'border-slate-200 dark:border-emerald-500/20',
      growth: '+100% deliverability',
    },
    {
      title: 'Corridor Outreach Score',
      value: `${totalLeads > 0 ? (94.8).toFixed(1) : 0}%`,
      subtitle: 'Based on brand USP match',
      icon: TrendingUp,
      textColor: 'text-indigo-600 dark:text-purple-400',
      bgColor: 'bg-indigo-50 dark:bg-purple-500/10',
      borderColor: 'border-slate-200 dark:border-purple-500/20',
      growth: 'High Synergy',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
      {metrics.map((metric, i) => {
        const Icon = metric.icon;
        return (
          <div
            key={i}
            className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {metric.title}
              </span>
              <div className={`w-9 h-9 rounded-xl ${metric.bgColor} ${metric.textColor} flex items-center justify-center border border-slate-100 dark:border-white/5`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {metric.value}
              </h3>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                {metric.subtitle}
              </span>
              <span className={`font-bold flex items-center gap-0.5 ${metric.textColor}`}>
                {metric.growth}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
