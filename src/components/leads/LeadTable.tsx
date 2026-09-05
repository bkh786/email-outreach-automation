'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  Download, 
  Trash2, 
  ExternalLink, 
  Building2, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Mail, 
  CheckSquare, 
  Square, 
  Plus,
  Zap
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useApp } from '@/lib/store/app-context';
import { createClient } from '@/lib/supabase/client';
import Papa from 'papaparse';

interface LeadTableProps {
  onSelectLead: (id: string) => void;
  onOpenUploader: () => void;
  onOpenManualAdd: () => void;
}

export default function LeadTable({ onSelectLead, onOpenUploader, onOpenManualAdd }: LeadTableProps) {
  const { 
    leads, 
    userConfig,
    enrichSingleLead, 
    enrichBatchLeads, 
    deleteMultipleLeads, 
    isProcessingBatch,
    refreshData
  } = useApp();

  const [isDispatchingNow, setIsDispatchingNow] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  const pendingCount = leads.filter(l => l.status === 'pending').length;

  const handleRunAutonomousDispatch = async () => {
    setIsDispatchingNow(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const url = user?.id ? `/api/cron/process-leads?userId=${user.id}` : '/api/cron/process-leads';
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await refreshData();
      }
    } catch (e) {
      console.error('Dispatch error:', e);
    } finally {
      setIsDispatchingNow(false);
    }
  };

  const countries = Array.from(new Set(leads.map(l => l.country).filter(Boolean))) as string[];
  const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean))) as string[];

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.contact_person && lead.contact_person.toLowerCase().includes(searchQuery.toLowerCase())) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.country && lead.country.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = selectedStatus === 'all' || lead.status === selectedStatus;
    const matchesCountry = selectedCountry === 'all' || lead.country === selectedCountry;
    const matchesSource = selectedSource === 'all' || lead.source === selectedSource;

    return matchesSearch && matchesStatus && matchesCountry && matchesSource;
  });

  const isAllSelected = filteredLeads.length > 0 && selectedIds.length === filteredLeads.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredLeads.map(l => l.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(item => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredLeads.map(l => ({
      'Company Name': l.company_name,
      'Contact Person': l.contact_person || '',
      'Email': l.email,
      'Phone': l.phone || '',
      'Country': l.country || '',
      'Website': l.website_url || '',
      'Status': l.status,
      'AI Company Synopsis': l.company_profile || '',
      'AI Scale Indicators': l.financial_info || '',
      'Draft Subject': l.email_subject || '',
      'Draft Email Body': l.email_body || '',
      'Sent At': l.sent_at || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `marketpulse_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBatchAI = async () => {
    await enrichBatchLeads(selectedIds.length > 0 ? selectedIds : undefined);
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (confirm(`Delete ${selectedIds.length} selected leads?`)) {
      await deleteMultipleLeads(selectedIds);
      setSelectedIds([]);
    }
  };

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
            <CheckCircle2 className="w-3 h-3" />
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

  const statusTabs = [
    { key: 'all', label: 'All Leads', count: leads.length },
    { key: 'pending', label: 'Pending AI', count: leads.filter(l => l.status === 'pending').length },
    { key: 'drafted', label: 'Drafted', count: leads.filter(l => l.status === 'drafted').length },
    { key: 'approved', label: 'Approved', count: leads.filter(l => l.status === 'approved').length },
    { key: 'sent', label: 'Sent', count: leads.filter(l => l.status === 'sent').length },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action & Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                selectedStatus === tab.key
                  ? 'bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                selectedStatus === tab.key 
                  ? 'bg-white/20 dark:bg-slate-950/20 text-white dark:text-slate-950' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {pendingCount > 0 && (
            <button
              onClick={handleRunAutonomousDispatch}
              disabled={isDispatchingNow}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-60"
              title="Synthesize AI research and generate drafts for pending leads"
            >
              <Zap className={`w-3.5 h-3.5 ${isDispatchingNow ? 'animate-spin' : ''}`} />
              <span>{isDispatchingNow ? 'Researching...' : `Research Leads (${pendingCount})`}</span>
            </button>
          )}

          <button
            onClick={onOpenManualAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            <span>Add Single Lead</span>
          </button>

          <button
            onClick={onOpenUploader}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20"
          >
            <span>Bulk Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, contact person, corridor, status, email..."
            className="w-full text-xs bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Corridors</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Sources</option>
            {sources.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Export to CSV */}
          <button
            onClick={handleExportCsv}
            disabled={filteredLeads.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 font-medium"
            title="Export filtered list to CSV"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Batch Actions Bar (Visible when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-cyan-950/50 border border-teal-200 dark:border-cyan-500/40 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-900 dark:text-cyan-300">
            <CheckSquare className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
            <span>{selectedIds.length} leads selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchAI}
              disabled={isProcessingBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 text-xs font-bold hover:opacity-90 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Research Selected</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Table View */}
      <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="py-3.5 px-4">Company & Corridor</th>
                <th className="py-3.5 px-4">Contact & Email</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Outreach Status</th>
                <th className="py-3.5 px-4">Subject Preview</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-teal-50/50 dark:bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelect(lead.id, e)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-teal-600 dark:text-cyan-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Company & Country */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-700 dark:text-cyan-400 font-bold text-xs">
                            {lead.company_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">{lead.company_name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                {lead.country || 'International'}
                              </span>
                              {lead.website_url && (
                                <a
                                  href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
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

                      {/* Contact & Email */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{lead.contact_person || 'Logistics Team'}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{lead.email}</p>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono uppercase">
                          {lead.source || 'Manual'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {getStatusBadge(lead.status)}
                      </td>

                      {/* Subject Preview */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {lead.email_subject ? (
                          <p className="text-xs text-slate-700 dark:text-slate-300 truncate font-medium">
                            {lead.email_subject}
                          </p>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No pitch drafted yet</span>
                        )}
                      </td>

                      {/* Actions - Always show both AI Research and Open Draft */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => enrichSingleLead(lead.id)}
                            disabled={lead.status === 'enriching'}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1 shadow-sm active:scale-95"
                            title={lead.email_subject ? 'Re-run AI Research & regenerate pitch' : 'Enrich Lead with Gemini AI'}
                          >
                            <Sparkles className={`w-3 h-3 ${lead.status === 'enriching' ? 'animate-spin' : ''}`} />
                            <span>{lead.status === 'enriching' ? 'Researching...' : 'AI Research'}</span>
                          </button>

                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all shadow-sm active:scale-95"
                            title="Open Lead Drawer & Email Pitch Editor"
                          >
                            Open Draft
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No matching leads found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or upload a new prospect batch.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Showing {filteredLeads.length} of {leads.length} total logistics leads</span>
          <span>Click any lead row to edit AI pitch & review scraped intelligence</span>
        </div>
      </div>
    </div>
  );
}
