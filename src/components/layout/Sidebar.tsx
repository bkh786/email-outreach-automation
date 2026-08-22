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
  Ship, 
  Sparkles, 
  Send, 
  Activity,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function Sidebar() {
  const pathname = usePathname();
  const { leads, userConfig, isProcessingBatch, activeBatchProgress, isDemoMode } = useApp();

  const navItems = [
    {
      name: 'Dashboard',
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
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
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
      badge: 'Super Admin',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    },
    {
      name: 'Settings & BYOK',
      href: '/settings',
      icon: Settings,
      badge: userConfig.gemini_api_key ? 'BYOK Active' : null,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
  ];

  const pendingCount = leads.filter(l => l.status === 'pending').length;
  const draftedCount = leads.filter(l => l.status === 'drafted' || l.status === 'approved').length;
  const sentCount = leads.filter(l => l.status === 'sent').length;

  return (
    <aside className="w-64 flex-shrink-0 bg-[#0B1120] border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none z-30">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-5 border-b border-slate-800/80 bg-[#080D18]">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-500 p-[2px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0B1120] rounded-[10px] flex items-center justify-center">
                <Plane className="w-5 h-5 text-cyan-400 rotate-[-15deg] group-hover:rotate-0 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">FreightPulse</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950">AI</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">B2B Logistics Outreach</p>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">Main Navigation</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/15 to-transparent text-cyan-400 border-l-4 border-cyan-400 font-semibold shadow-sm shadow-cyan-500/5'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Pipeline Status & Metrics */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080D18]/70 space-y-3">
        {/* Batch Processing Indicator */}
        {isProcessingBatch && activeBatchProgress && (
          <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyan-400 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                AI Researching Leads
              </span>
              <span className="text-cyan-300 font-mono text-[11px]">
                {activeBatchProgress.current}/{activeBatchProgress.total}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-400 to-teal-400 h-full transition-all duration-300"
                style={{ width: `${(activeBatchProgress.current / activeBatchProgress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Live Pipeline Snapshot */}
        <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 text-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Live Pipeline
            </span>
            <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 text-center pt-1">
            <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-medium">Pending</p>
              <p className="text-sm font-bold text-amber-400">{pendingCount}</p>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-medium">Drafted</p>
              <p className="text-sm font-bold text-cyan-400">{draftedCount}</p>
            </div>
            <div className="bg-slate-800/60 p-1.5 rounded-lg border border-slate-700/50">
              <p className="text-[10px] text-slate-400 font-medium">Sent</p>
              <p className="text-sm font-bold text-emerald-400">{sentCount}</p>
            </div>
          </div>
        </div>

        {/* Multi-Tenant / System Status Badge */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {isDemoMode ? 'Sandbox Ready' : 'Supabase Live'}
          </span>
          <span className="text-slate-400">v1.2.0</span>
        </div>
      </div>
    </aside>
  );
}
