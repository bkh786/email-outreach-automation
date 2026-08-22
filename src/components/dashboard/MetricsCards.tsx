'use client';

import React from 'react';
import { 
  Users, 
  Sparkles, 
  Send, 
  TrendingUp, 
  Layers, 
  Clock, 
  Flame, 
  Target 
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function MetricsCards() {
  const { leads } = useApp();

  const totalLeads = leads.length;
  const enrichedAndDrafted = leads.filter(l => l.status === 'drafted' || l.status === 'approved' || l.status === 'sent').length;
  const highPriority = leads.filter(l => l.status === 'drafted' || l.status === 'approved').length;
  const sentCount = leads.filter(l => l.status === 'sent').length;
  const pendingCount = leads.filter(l => l.status === 'pending').length;

  const metrics = [
    {
      title: 'BRANDS / LEADS TRACKED',
      value: totalLeads.toString(),
      subtitle: `${totalLeads} active forwarder accounts`,
      icon: Layers,
      iconBg: 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-200/60 dark:border-teal-500/20',
      numColor: 'text-slate-900 dark:text-white',
    },
    {
      title: 'OPEN OPPORTUNITIES',
      value: (enrichedAndDrafted || 0).toString(),
      subtitle: `${enrichedAndDrafted} scored freight pitches`,
      icon: Sparkles,
      iconBg: 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-cyan-400 border border-sky-200/60 dark:border-sky-500/20',
      numColor: 'text-sky-600 dark:text-cyan-400',
    },
    {
      title: 'HIGH PRIORITY (4-5)',
      value: (highPriority || 0).toString(),
      subtitle: 'Immediate outreach ready',
      icon: Flame,
      iconBg: 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-500/20',
      numColor: 'text-rose-600 dark:text-rose-400',
    },
    {
      title: 'OUTREACH DISPATCHED',
      value: (sentCount || 0).toString(),
      subtitle: `${pendingCount} awaiting research`,
      icon: Send,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20',
      numColor: 'text-emerald-600 dark:text-emerald-400',
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
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                {metric.title}
              </span>
              <div className={`w-8 h-8 rounded-xl ${metric.iconBg} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="my-1">
              <h3 className={`text-3xl font-black tracking-tight ${metric.numColor}`}>
                {metric.value}
              </h3>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {metric.subtitle}
            </div>
          </div>
        );
      })}
    </div>
  );
}
