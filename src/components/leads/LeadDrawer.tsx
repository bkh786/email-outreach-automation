'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  ExternalLink, 
  Sparkles, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Eye, 
  Save, 
  Trash2,
  TrendingUp,
  Cpu,
  Check,
  User,
  Loader2
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useApp } from '@/lib/store/app-context';
import { HtmlEmailPreview } from '@/components/common/HtmlEmailPreview';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
}

export default function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { leads, updateLead, enrichSingleLead, sendSingleEmail, deleteLead, profile } = useApp();
  
  const lead = leads.find(l => l.id === leadId);

  // Email draft state
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  // Lead metadata edit mode state
  const [isEditingLead, setIsEditingLead] = useState(false);
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editContactPerson, setEditContactPerson] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editWebsiteUrl, setEditWebsiteUrl] = useState('');
  const [isSavingLeadMeta, setIsSavingLeadMeta] = useState(false);
  const [leadMetaSuccess, setLeadMetaSuccess] = useState(false);

  useEffect(() => {
    if (lead) {
      setSubject(lead.email_subject || '');
      setBody(lead.email_body || '');
      setEditCompanyName(lead.company_name || '');
      setEditContactPerson(lead.contact_person || '');
      setEditEmail(lead.email || '');
      setEditPhone(lead.phone || '');
      setEditCountry(lead.country || '');
      setEditWebsiteUrl(lead.website_url || '');
      setIsEditingLead(false);
      setSendSuccessMessage(null);
      setSendErrorMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  // Save Lead Metadata (Company Name, Contact Person, Email, Phone, Country, Website)
  const handleSaveLeadMeta = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editCompanyName.trim() || !editEmail.trim()) {
      alert('Company Name and Recipient Email are required.');
      return;
    }

    setIsSavingLeadMeta(true);
    try {
      await updateLead(lead.id, {
        company_name: editCompanyName.trim(),
        contact_person: editContactPerson.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        country: editCountry.trim(),
        website_url: editWebsiteUrl.trim(),
      });
      setIsEditingLead(false);
      setLeadMetaSuccess(true);
      setTimeout(() => setLeadMetaSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to update lead: ' + err.message);
    } finally {
      setIsSavingLeadMeta(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    await updateLead(lead.id, {
      company_name: editCompanyName.trim() || lead.company_name,
      contact_person: editContactPerson.trim() || lead.contact_person,
      email: editEmail.trim() || lead.email,
      phone: editPhone.trim() || lead.phone,
      country: editCountry.trim() || lead.country,
      website_url: editWebsiteUrl.trim() || lead.website_url,
      email_subject: subject,
      email_body: body,
      status: lead.status === 'pending' ? 'drafted' : lead.status,
    });
    setTimeout(() => setIsSaving(false), 400);
  };

  const handleRegenerateAI = async () => {
    setIsEnriching(true);
    setSendErrorMessage(null);
    await enrichSingleLead(lead.id);
    setIsEnriching(false);
  };

  const handleApproveAndSend = async () => {
    setIsSending(true);
    setSendErrorMessage(null);
    setSendSuccessMessage(null);

    await updateLead(lead.id, {
      email_subject: subject,
      email_body: body,
    });

    const result = await sendSingleEmail(lead.id);
    setIsSending(false);

    if (result.success) {
      setSendSuccessMessage(result.message);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0D9488', '#F59E0B', '#10B981', '#3B82F6'],
        });
      } catch {}
    } else {
      setSendErrorMessage(result.message);
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20';
      case 'enriching': return 'bg-cyan-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-500/20 animate-pulse';
      case 'drafted': return 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20';
      case 'approved': return 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20';
      case 'sent': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20';
      case 'failed': return 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-all">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#0B1120] border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#080D18] sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-700 dark:text-cyan-400 font-extrabold text-sm flex-shrink-0">
              {lead.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">{lead.company_name}</h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(lead.status)} flex-shrink-0`}>
                  {lead.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{lead.contact_person || 'Logistics Lead'} &bull; {lead.country || 'Global Corridor'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Edit Lead Details Button beside Delete Button */}
            <button
              onClick={() => setIsEditingLead(!isEditingLead)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                isEditingLead
                  ? 'bg-teal-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-teal-600 dark:border-cyan-500'
                  : 'bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
              title="Edit Lead Information"
            >
              <Edit3 className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
              <span>{isEditingLead ? 'Cancel Edit' : 'Edit Lead'}</span>
            </button>

            {/* Delete Lead Button */}
            <button
              onClick={() => {
                if (confirm(`Delete lead ${lead.company_name}?`)) {
                  deleteLead(lead.id);
                  onClose();
                }
              }}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-colors"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Drawer Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-lg"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6 flex-1 text-slate-900 dark:text-slate-100">
          {/* Status Notices */}
          {sendSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Outreach Dispatched Successfully!</p>
                <p className="text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">{sendSuccessMessage}</p>
              </div>
            </div>
          )}

          {sendErrorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Dispatch Error</p>
                <p className="text-rose-800/80 dark:text-rose-300/80 mt-0.5">{sendErrorMessage}</p>
              </div>
            </div>
          )}

          {leadMetaSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2 shadow-sm animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Lead information updated and saved to database successfully!</span>
            </div>
          )}

          {/* Quick Lead Meta Card (View Mode vs Edit Mode) */}
          {isEditingLead ? (
            /* EDIT LEAD FORM */
            <form onSubmit={handleSaveLeadMeta} className="p-5 rounded-2xl bg-white dark:bg-[#0F172A] border-2 border-teal-500/50 dark:border-cyan-500/50 shadow-md space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Edit Lead Details
                  </h4>
                </div>
                <span className="text-[10px] text-teal-600 dark:text-cyan-400 font-bold">Modifying Database Record</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={editCompanyName}
                      onChange={(e) => setEditCompanyName(e.target.value)}
                      placeholder="e.g. Confidence Cargo Limited"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editContactPerson}
                      onChange={(e) => setEditContactPerson(e.target.value)}
                      placeholder="e.g. OLUDAYO DADA AIGBE"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="dada@confidencecargo.com"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="+2349862828921"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Country / Corridor
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editCountry}
                      onChange={(e) => setEditCountry(e.target.value)}
                      placeholder="e.g. Nigeria"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Website URL
                  </label>
                  <div className="relative">
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={editWebsiteUrl}
                      onChange={(e) => setEditWebsiteUrl(e.target.value)}
                      placeholder="confidencecargo.com"
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons for Lead Edit */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingLead(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveLeadMeta}
                  disabled={isSavingLeadMeta}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 text-xs font-extrabold shadow-sm active:scale-95 transition-all"
                >
                  {isSavingLeadMeta ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Lead...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Lead Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* VIEW LEAD META GRID */
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Recipient Email:</span>
                <p className="font-mono text-teal-700 dark:text-cyan-400 font-bold mt-0.5 truncate">{lead.email}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Phone:</span>
                <p className="text-slate-800 dark:text-slate-200 font-mono mt-0.5">{lead.phone || 'N/A'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Country / Corridor:</span>
                <p className="text-slate-800 dark:text-slate-200 font-semibold mt-0.5">{lead.country || 'International'}</p>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 font-medium">Website URL:</span>
                {lead.website_url ? (
                  <a
                    href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-teal-600 dark:text-cyan-400 hover:underline flex items-center gap-1 font-mono mt-0.5 truncate font-medium"
                  >
                    <span>{lead.website_url.replace(/https?:\/\//, '')}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                ) : (
                  <p className="text-slate-400 mt-0.5">None provided</p>
                )}
              </div>
            </div>
          )}

          {/* AI Research & Intelligence Card */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  AI Company Intelligence & Scraped Footprint
                </h4>
              </div>

              <button
                onClick={handleRegenerateAI}
                disabled={isEnriching}
                className="flex items-center gap-1 text-xs text-teal-600 dark:text-cyan-400 hover:underline font-bold transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                <span>{isEnriching ? 'Researching...' : 'Re-synthesize Intelligence'}</span>
              </button>
            </div>

            {lead.company_profile ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <p className="font-bold text-slate-800 dark:text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                    Company Operational Synopsis
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{lead.company_profile}</p>
                </div>

                {lead.financial_info && (
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                    <p className="font-bold text-slate-800 dark:text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                      Scale Indicators & Capacity Bracket
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{lead.financial_info}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-2">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-500">No AI intelligence generated yet.</p>
                <button
                  onClick={handleRegenerateAI}
                  disabled={isEnriching}
                  className="px-4 py-1.5 rounded-lg bg-teal-50 dark:bg-cyan-500/20 hover:bg-teal-100 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-bold"
                >
                  Run Web Crawl & Gemini Analysis
                </button>
              </div>
            )}
          </div>

          {/* Cold Email Outreach Editor */}
          <div className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Tailored Cold Outreach Pitch
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {isPreviewMode ? <Edit3 className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />}
                  <span>{isPreviewMode ? 'Edit Draft' : 'Preview HTML'}</span>
                </button>
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Transpacific space allocations & rate benchmarks for Apex Cargo"
                className="w-full text-xs font-semibold bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Email Body Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Body (Matched to {profile.company_name} Profile)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {body.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {isPreviewMode ? (
                <HtmlEmailPreview
                  content={body || '<p style="color: #94a3b8; font-style: italic;">No email draft generated yet.</p>'}
                  title="Lead Email Preview"
                  minHeight="260px"
                  allowToggleView={true}
                />
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder="Personalized cold outreach email proposal..."
                  className="w-full text-xs bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-slate-200 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none transition-colors font-mono leading-relaxed resize-y"
                />
              )}
            </div>

            {/* Quick Helper Note */}
            <div className="p-2.5 rounded-lg bg-teal-50/70 dark:bg-slate-950/60 border border-teal-200/60 dark:border-slate-800 text-[11px] text-teal-900 dark:text-slate-400 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400 flex-shrink-0" />
              <span>Automatically includes trade lane synergies, certifications & sender signature.</span>
            </div>
          </div>
        </div>

        {/* Drawer Action Sticky Footer */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#080D18] sticky bottom-0 z-20 flex items-center justify-between gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            <Save className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAndSend}
              disabled={isSending || !subject || !body}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold transition-all shadow-md ${
                isSending || !subject || !body
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700'
                  : 'bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-emerald-500 dark:to-teal-500 text-white dark:text-slate-950 shadow-teal-600/20 active:scale-95'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-spin' : ''}`} />
              <span>{isSending ? 'Sending...' : lead.status === 'sent' ? 'Re-send Outreach' : 'Approve & Send Now'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
