'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Sparkles, 
  Send, 
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
  RefreshCw
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useApp } from '@/lib/store/app-context';
import Papa from 'papaparse';

interface LeadTableProps {
  onSelectLead: (id: string) => void;
  onOpenUploader: () => void;
  onOpenManualAdd: () => void;
}

export default function LeadTable({ onSelectLead, onOpenUploader, onOpenManualAdd }: LeadTableProps) {
  const { 
    leads, 
    enrichSingleLead, 
    enrichBatchLeads, 
    deleteLead, 
    deleteMultipleLeads, 
    isProcessingBatch 
  } = useApp();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');

  // Unique countries and sources for filters
  const countries = Array.from(new Set(leads.map(l => l.country).filter(Boolean))) as string[];
  const sources = Array.from(new Set(leads.map(l => l.source).filter(Boolean))) as string[];

  // Filtered leads
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
    link.setAttribute('download', `freightpulse_leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
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
            Drafted
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
            Sent
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

  const statusTabs = [
    { key: 'all', label: 'All Leads', count: leads.length },
    { key: 'pending', label: 'Pending', count: leads.filter(l => l.status === 'pending').length },
    { key: 'drafted', label: 'Drafted', count: leads.filter(l => l.status === 'drafted').length },
    { key: 'approved', label: 'Approved', count: leads.filter(l => l.status === 'approved').length },
    { key: 'sent', label: 'Sent', count: leads.filter(l => l.status === 'sent').length },
  ];

  return (
    <div className="space-y-4">
      {/* Top Action & Status Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
                selectedStatus === tab.key
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedStatus === tab.key ? 'bg-slate-950/20 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onOpenManualAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Single Lead</span>
          </button>

          <button
            onClick={onOpenUploader}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-cyan-500/20"
          >
            <span>Bulk Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, contact person, corridor, email..."
            className="w-full text-xs bg-[#0B1120] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Country Filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
          >
            <option value="all">All Countries / Corridors</option>
            {countries.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Source Filter */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="bg-[#0B1120] border border-slate-800 rounded-xl px-3 py-2 text-slate-300 focus:border-cyan-500 focus:outline-none"
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
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50"
            title="Export filtered list to CSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Batch Actions Bar (Visible when rows selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-cyan-950/50 border border-cyan-500/40 flex items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span>{selectedIds.length} leads selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchAI}
              disabled={isProcessingBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 text-xs font-bold hover:bg-cyan-400 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Research Selected</span>
            </button>

            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Leads Table */}
      <div className="rounded-2xl bg-[#0F172A]/90 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1120] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-white">
                    {isAllSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
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

            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => {
                  const isSelected = selectedIds.includes(lead.id);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead.id)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        isSelected ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleToggleSelect(lead.id, e)}
                          className="text-slate-400 hover:text-white"
                        >
                          {isSelected ? <CheckSquare className="w-4 h-4 text-cyan-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      {/* Company & Country */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs">
                            {lead.company_name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-sm">{lead.company_name}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-slate-400" />
                                {lead.country || 'International'}
                              </span>
                              {lead.website_url && (
                                <a
                                  href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
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

                      {/* Contact & Email */}
                      <td className="py-3.5 px-4">
                        <p className="font-medium text-slate-200">{lead.contact_person || 'Logistics Team'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{lead.email}</p>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono uppercase">
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
                          <p className="text-xs text-slate-300 truncate font-medium">
                            {lead.email_subject}
                          </p>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">No pitch drafted yet</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {lead.status === 'pending' && (
                            <button
                              onClick={() => enrichSingleLead(lead.id)}
                              className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all"
                              title="Enrich Lead with Gemini AI"
                            >
                              AI Research
                            </button>
                          )}

                          <button
                            onClick={() => onSelectLead(lead.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
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
                    <Building2 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                    <p className="text-sm font-semibold text-slate-300">No matching leads found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or upload a new prospect batch.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 bg-[#0B1120] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filteredLeads.length} of {leads.length} total logistics leads</span>
          <span>Double-click or click Open Draft to edit AI pitch & review scraped intelligence</span>
        </div>
      </div>
    </div>
  );
}
