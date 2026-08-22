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
  Clock, 
  Edit3, 
  Eye, 
  Save, 
  Trash2,
  TrendingUp,
  Cpu,
  Layers,
  Check
} from 'lucide-react';
import { Lead, LeadStatus } from '@/lib/types';
import { useApp } from '@/lib/store/app-context';

interface LeadDrawerProps {
  leadId: string | null;
  onClose: () => void;
}

export default function LeadDrawer({ leadId, onClose }: LeadDrawerProps) {
  const { leads, updateLead, enrichSingleLead, sendSingleEmail, deleteLead, profile } = useApp();
  
  const lead = leads.find(l => l.id === leadId);

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setSubject(lead.email_subject || '');
      setBody(lead.email_body || '');
      setSendSuccessMessage(null);
      setSendErrorMessage(null);
    }
  }, [lead]);

  if (!lead) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await updateLead(lead.id, {
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

    // Save any pending text edits first
    await updateLead(lead.id, {
      email_subject: subject,
      email_body: body,
    });

    const result = await sendSingleEmail(lead.id);
    setIsSending(false);

    if (result.success) {
      setSendSuccessMessage(result.message);
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#06B6D4', '#F59E0B', '#10B981', '#38BDF8'],
        });
      } catch {}
    } else {
      setSendErrorMessage(result.message);
    }
  };

  const getStatusColor = (status: LeadStatus) => {
    switch (status) {
      case 'pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'enriching': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse';
      case 'drafted': return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'approved': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'sent': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'failed': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end transition-all">
      <div 
        className="w-full max-w-2xl bg-[#0B1120] border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 bg-[#080D18] sticky top-0 z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 font-extrabold text-sm">
              {lead.company_name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{lead.company_name}</h3>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusColor(lead.status)}`}>
                  {lead.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400">{lead.contact_person || 'Logistics Lead'} &bull; {lead.country || 'Global Corridor'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm(`Delete lead ${lead.company_name}?`)) {
                  deleteLead(lead.id);
                  onClose();
                }
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Delete Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body Content */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status Notices */}
          {sendSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shadow-lg">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Outreach Dispatched Successfully!</p>
                <p className="text-emerald-300/80 mt-0.5">{sendSuccessMessage}</p>
              </div>
            </div>
          )}

          {sendErrorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Dispatch Error</p>
                <p className="text-rose-300/80 mt-0.5">{sendErrorMessage}</p>
              </div>
            </div>
          )}

          {/* Quick Lead Meta Grid */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-slate-400">Recipient Email:</span>
              <p className="font-mono text-cyan-400 font-semibold mt-0.5 truncate">{lead.email}</p>
            </div>
            <div>
              <span className="text-slate-400">Phone:</span>
              <p className="text-slate-200 font-mono mt-0.5">{lead.phone || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400">Country / Corridor:</span>
              <p className="text-slate-200 font-semibold mt-0.5">{lead.country || 'International'}</p>
            </div>
            <div>
              <span className="text-slate-400">Website URL:</span>
              {lead.website_url ? (
                <a
                  href={lead.website_url.startsWith('http') ? lead.website_url : `https://${lead.website_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono mt-0.5 truncate"
                >
                  <span>{lead.website_url.replace(/https?:\/\//, '')}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              ) : (
                <p className="text-slate-500 mt-0.5">None provided</p>
              )}
            </div>
          </div>

          {/* AI Research & Intelligence Card */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-[#0E1726] to-[#0A1322] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Freight Intelligence & Scraped Footprint
                </h4>
              </div>

              <button
                onClick={handleRegenerateAI}
                disabled={isEnriching}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isEnriching ? 'animate-spin' : ''}`} />
                <span>{isEnriching ? 'Researching...' : 'Re-synthesize Intelligence'}</span>
              </button>
            </div>

            {lead.company_profile ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                  <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                    Company Operational Synopsis
                  </p>
                  <p className="text-slate-300 leading-relaxed">{lead.company_profile}</p>
                </div>

                {lead.financial_info && (
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
                    <p className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Scale Indicators & Capacity Bracket
                    </p>
                    <p className="text-slate-300 leading-relaxed">{lead.financial_info}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400">No AI intelligence generated yet.</p>
                <button
                  onClick={handleRegenerateAI}
                  disabled={isEnriching}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold"
                >
                  Run Web Crawl & Gemini Analysis
                </button>
              </div>
            )}
          </div>

          {/* Cold Email Outreach Editor */}
          <div className="rounded-2xl p-5 bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Tailored Cold Outreach Pitch
                </h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  {isPreviewMode ? <Edit3 className="w-3.5 h-3.5 text-cyan-400" /> : <Eye className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{isPreviewMode ? 'Edit Draft' : 'Preview HTML'}</span>
                </button>
              </div>
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Email Subject Line
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Transpacific space allocations & rate benchmarks for Apex Cargo"
                className="w-full text-xs font-medium bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Email Body Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Email Body (Matched to {profile.company_name} Profile)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {body.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              {isPreviewMode ? (
                <div className="p-4 rounded-xl bg-white text-slate-900 text-xs font-sans leading-relaxed min-h-[220px] shadow-inner whitespace-pre-wrap select-text">
                  {body || <span className="text-slate-400 italic">No email draft generated yet.</span>}
                </div>
              ) : (
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={10}
                  placeholder="Personalized cold outreach email proposal..."
                  className="w-full text-xs bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-cyan-500 focus:outline-none transition-colors font-mono leading-relaxed resize-y"
                />
              )}
            </div>

            {/* Quick Helper Note */}
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Automatically includes trade lane synergies, certifications & sender signature.</span>
            </div>
          </div>
        </div>

        {/* Drawer Action Sticky Footer */}
        <div className="p-5 border-t border-slate-800 bg-[#080D18] sticky bottom-0 z-20 flex items-center justify-between gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApproveAndSend}
              disabled={isSending || !subject || !body}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isSending || !subject || !body
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
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
