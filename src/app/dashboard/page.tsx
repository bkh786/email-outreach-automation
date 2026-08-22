'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MetricsCards from '@/components/dashboard/MetricsCards';
import AnalyticsCharts from '@/components/dashboard/AnalyticsCharts';
import LeadCardGrid from '@/components/leads/LeadCardGrid';
import LeadDrawer from '@/components/leads/LeadDrawer';
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed';
import { 
  Sparkles, 
  Send, 
  Layers, 
  ArrowRight, 
  LayoutGrid, 
  Table as TableIcon,
  Search,
  Filter,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';

export default function DashboardPage() {
  const { leads, profile, enrichBatchLeads, isProcessingBatch } = useApp();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [activeDrawerLeadId, setActiveDrawerLeadId] = useState<string | null>(null);

  const pendingLeads = leads.filter(l => l.status === 'pending');

  const corridors = Array.from(new Set(leads.map(l => l.country).filter(Boolean))) as string[];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.contact_person && lead.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.country && lead.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const matchesCorridor = selectedCorridor === 'all' || lead.country === selectedCorridor;

    return matchesSearch && matchesStatus && matchesCorridor;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* KPI Metrics Cards (matching top bar in screenshot) */}
      <MetricsCards />

      {/* Search & Filter Toolbar with [ Cards | Table ] Switcher */}
      <div className="rounded-2xl p-4 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any brand, segment, corridor, status, opportunity..."
            className="w-full text-xs bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filters and View Switcher Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Corridor Filter */}
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Corridors</option>
            {corridors.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Stages</option>
            <option value="pending">Pending AI</option>
            <option value="drafted">Drafted</option>
            <option value="approved">Approved</option>
            <option value="sent">Dispatched</option>
          </select>

          {/* Cards vs Table View Toggle (matching screenshot) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'cards'
                  ? 'bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Card Grid View or Table View */}
      {viewMode === 'cards' ? (
        <LeadCardGrid
          leads={filteredLeads}
          onSelectLead={(id) => setActiveDrawerLeadId(id)}
        />
      ) : (
        <RecentActivityFeed
          onOpenLead={(id) => setActiveDrawerLeadId(id)}
        />
      )}

      {/* Velocity Analytics Charts */}
      <AnalyticsCharts />

      {/* Sliding Lead Detail & Email Editor Drawer */}
      <LeadDrawer
        leadId={activeDrawerLeadId}
        onClose={() => setActiveDrawerLeadId(null)}
      />
    </div>
  );
}
