'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings, 
  Plane, 
  Sparkles, 
  Send, 
  Activity,
  Database,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function Sidebar() {
  const pathname = usePathname();
  const { leads, userConfig, isProcessingBatch, activeBatchProgress, isDemoMode } = useApp();

  const navItems = [
    {
      name: 'Overview Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Lead Intelligence',
      href: '/leads',
      icon: Users,
      badge: leads.filter(l => l.status === 'pending').length > 0 
        ? `${leads.filter(l => l.status === 'pending').length} new` 
        : null,
      badgeColor: 'bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30',
    },
    {
      name: 'Self Brand Profile',
      href: '/brand',
      icon: Building2,
      badge: null,
    },
    {
      name: 'Client Tenants (Admin)',
      href: '/admin/tenants',
      icon: Database,
      badge: 'Admin',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30',
    },
    {
      name: 'Settings & BYOK',
      href: '/settings',
      icon: Settings,
      badge: userConfig.gemini_api_key ? 'Active' : null,
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30',
    },
  ];

  const pendingCount = leads.filter(l => l.status === 'pending').length;
  const draftedCount = leads.filter(l => l.status === 'drafted' || l.status === 'approved').length;
  const sentCount = leads.filter(l => l.status === 'sent').length;

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-[#0B1120] border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none z-30 transition-colors">
      <div>
        {/* Brand Header */}
        <div className="h-18 flex items-center px-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080D18]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-teal-600 dark:bg-gradient-to-tr dark:from-cyan-600 dark:via-teal-500 dark:to-amber-500 p-[2px] shadow-md shadow-teal-600/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-teal-600 dark:bg-[#0B1120] rounded-[10px] flex items-center justify-center">
                <Plane className="w-5 h-5 text-white dark:text-cyan-400 rotate-[-15deg] group-hover:rotate-0 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">FreightPulse</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-400 dark:text-slate-950">AI</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">B2B Logistics Outreach</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-50 dark:bg-cyan-500/15 text-teal-700 dark:text-cyan-400 border-l-4 border-teal-600 dark:border-cyan-400 font-bold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-teal-600 dark:text-cyan-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pipeline Status & Metrics */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#080D18]/70 space-y-3">
        {/* Batch Processing Indicator */}
        {isProcessingBatch && activeBatchProgress && (
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-cyan-950/40 border border-teal-200 dark:border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-teal-700 dark:text-cyan-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-600 dark:text-cyan-400" />
                AI Researching Leads
              </span>
              <span className="text-teal-800 dark:text-cyan-300 font-mono text-[11px]">
                {activeBatchProgress.current}/{activeBatchProgress.total}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-teal-600 dark:bg-gradient-to-r dark:from-cyan-400 dark:to-teal-400 h-full transition-all duration-300"
                style={{ width: `${(activeBatchProgress.current / activeBatchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Pipeline Snapshot */}
        <div className="bg-white dark:bg-slate-900/90 rounded-xl p-3 border border-slate-200 dark:border-slate-800 text-xs space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
              Live Pipeline
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-150 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Pending</p>
              <p className="text-sm font-extrabold text-amber-600 dark:text-amber-400">{pendingCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-150 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Drafted</p>
              <p className="text-sm font-extrabold text-teal-600 dark:text-cyan-400">{draftedCount}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-150 dark:border-slate-700/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">Sent</p>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{sentCount}</p>
            </div>
          </div>
        </div>

        {/* Multi-Tenant / System Status Badge & Sign Out */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {isDemoMode ? 'Sandbox' : 'Supabase'}
          </span>

          <button
            onClick={async () => {
              if (confirm('Sign out of FreightPulse AI?')) {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }
            }}
            className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-semibold transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3 h-3" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
