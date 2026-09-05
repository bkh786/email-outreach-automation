'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Globe2, 
  Sparkles, 
  Save, 
  Award, 
  CheckCircle2, 
  Plane, 
  FileText,
  ShieldCheck,
  Database,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { Profile } from '@/lib/types';

const COMMON_SERVICES = [
  'Customs Clearance & Bonded CFS',
  'Air Freight Expedited & Charters',
  'Ocean FCL/LCL Consolidation',
  'Road Transport & Rail Freight',
  'Warehousing & 3PL Distribution',
  'Project Cargo & Heavy Lift',
  'Cold Chain & Pharma Logistics',
  'Cargo Insurance & Risk Management',
  'DDP / DAP Delivery Solutions',
  'Cross-Border E-Commerce Sortation'
];

const COMMON_MARKETS = [
  'India -> North America Air & Ocean FCL/LCL',
  'India -> Europe Multimodal Corridors',
  'India -> Middle East Supply Chain',
  'Domestic Pan-India Road & Rail Transport',
  'Asia -> North America',
  'Europe -> North America',
  'Southeast Asia Transshipment',
  'China -> Europe Rail & Air',
  'Latin America Agri-Trade'
];

export default function BrandProfilePage() {
  const { profile, updateProfile, userConfig } = useApp();

  const isSuperAdmin = profile.role === 'super_admin';

  const [formData, setFormData] = useState<Profile>({ ...profile });
  const [newService, setNewService] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [autofillMessage, setAutofillMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Synchronize when profile loads from database
  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const handleToggleService = (service: string) => {
    const current = formData.services_offered || [];
    if (current.includes(service)) {
      setFormData({ ...formData, services_offered: current.filter(s => s !== service) });
    } else {
      setFormData({ ...formData, services_offered: [...current, service] });
    }
  };

  const handleAddCustomService = () => {
    if (!newService.trim()) return;
    const current = formData.services_offered || [];
    if (!current.includes(newService.trim())) {
      setFormData({ ...formData, services_offered: [...current, newService.trim()] });
    }
    setNewService('');
  };

  const handleToggleMarket = (market: string) => {
    const current = formData.target_markets || [];
    if (current.includes(market)) {
      setFormData({ ...formData, target_markets: current.filter(m => m !== market) });
    } else {
      setFormData({ ...formData, target_markets: [...current, market] });
    }
  };

  const handleAddCustomMarket = () => {
    if (!newMarket.trim()) return;
    const current = formData.target_markets || [];
    if (!current.includes(newMarket.trim())) {
      setFormData({ ...formData, target_markets: [...current, newMarket.trim()] });
    }
    setNewMarket('');
  };

  // Explicit Save & Sync Button Handler
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        ...formData,
        email_signature: formData.email_signature || profile.email_signature || '',
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3500);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Smart Fill with AI: Fills the fields ONLY, does NOT write to database directly
  const handleSmartAiAutofill = async () => {
    if (!formData.website_url || formData.website_url.trim().length < 3) {
      setAutofillMessage({
        type: 'error',
        text: 'Please enter your Official Website URL first (e.g. https://aniriselogistics.com or www.aniriselogistics.com).'
      });
      return;
    }

    setIsAutofilling(true);
    setAutofillMessage(null);

    try {
      const res = await fetch('/api/brand/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          website_url: formData.website_url,
          company_name: formData.company_name,
          contact_person: profile.contact_person,
          apiKey: userConfig.gemini_api_key,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze website with Smart AI');
      }

      const generatedProfile: Profile = {
        ...formData,
        company_name: data.profile.company_name || formData.company_name,
        website_url: data.profile.website_url || formData.website_url,
        unique_selling_proposition: data.profile.unique_selling_proposition || formData.unique_selling_proposition,
        strengths_and_certifications: data.profile.strengths_and_certifications || formData.strengths_and_certifications,
        services_offered: data.profile.services_offered?.length ? data.profile.services_offered : formData.services_offered,
        target_markets: data.profile.target_markets?.length ? data.profile.target_markets : formData.target_markets,
        email_signature: profile.email_signature || formData.email_signature || data.profile.email_signature || '',
      };

      // Populate form state ONLY (does not save to DB until user clicks Save)
      setFormData(generatedProfile);

      setAutofillMessage({
        type: 'success',
        text: 'Fields populated with Smart AI! Review the details below and click "Save & Sync Self-Brand Profile" to save to the database.'
      });
    } catch (err: any) {
      setAutofillMessage({
        type: 'error',
        text: err.message || 'Smart AI Autofill encountered an issue.'
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const isUrlEntered = Boolean(formData.website_url && formData.website_url.trim().length > 2);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            <span>Self Brand &amp; Company Profile</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define your company capabilities, USPs, accreditations, and outgoing signature to power tailored AI outreach.
          </p>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Saved to Database &amp; Synced to AI Engine!</span>
          </div>
        )}
      </div>

      {/* Autofill Notification Banner */}
      {autofillMessage && (
        <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in shadow-sm ${
          autofillMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold'
            : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 font-semibold'
        }`}>
          <div className="flex items-center gap-2">
            {autofillMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />}
            <span>{autofillMessage.text}</span>
          </div>
          <button 
            onClick={() => setAutofillMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Core Company Identity & Smart Fill with AI */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <span>Company Identity &amp; Credentials</span>
              </h3>

              {/* ✨ Smart Fill with AI Action Button */}
              <button
                type="button"
                onClick={handleSmartAiAutofill}
                disabled={!isUrlEntered || isAutofilling}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  isUrlEntered
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-600/25 ring-2 ring-teal-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }`}
                title={isUrlEntered ? 'Crawl website with Gemini AI to auto-populate all profile fields' : 'Enter Official Website URL first to enable Smart Fill with AI'}
              >
                {isAutofilling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Crawling &amp; Populating Fields...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Smart Fill with AI</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Company / Business Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Digi Presence Solutions"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Website URL (Enables Smart Fill with AI)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.website_url || ''}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://digipresence.in/"
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Unique Selling Proposition */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Unique Value Proposition (USP &amp; Key Differentiators)
              </label>
              <textarea
                rows={3}
                value={formData.unique_selling_proposition}
                onChange={(e) => setFormData({ ...formData, unique_selling_proposition: e.target.value })}
                placeholder="e.g. Enterprise AI automation, custom digital marketing engines, and client acquisition pipelines with proven ROI."
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-slate-200 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Gemini dynamically cites these differentiators when pitching to prospects with matching business needs.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Accreditations */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>Certifications &amp; Accreditations</span>
                </label>
                <input
                  type="text"
                  value={formData.strengths_and_certifications}
                  onChange={(e) => setFormData({ ...formData, strengths_and_certifications: e.target.value })}
                  placeholder="e.g. ISO 9001:2015, Google Premier Partner, HubSpot Certified"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* Company Portfolio / Credential Deck Link */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                  <span>Company Credentials / Portfolio Deck (URL)</span>
                </label>
                <input
                  type="text"
                  value={formData.portfolio_url || ''}
                  onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                  placeholder="https://digipresence.in/portfolio or Google Drive PDF link"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Core Services & Capabilities */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Plane className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              <span>Core Business Services &amp; Capabilities</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {COMMON_SERVICES.map((service) => {
                const isSelected = (formData.services_offered || []).includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleToggleService(service)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-teal-600 dark:bg-cyan-500 text-white dark:text-slate-950 border-teal-600 dark:border-cyan-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{service}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-slate-950" />}
                  </button>
                );
              })}
            </div>

            {/* Custom service adder */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newService}
                onChange={(e) => setNewService(e.target.value)}
                placeholder="Add custom service (e.g. Appointment Systems, Custom CRM, PPC Funnels)..."
                className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                Add Service
              </button>
            </div>
          </div>

          {/* Card 3: Target Markets & Corridors */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Globe2 className="w-4 h-4 text-amber-500" />
              <span>Target Markets &amp; Client Segments</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {COMMON_MARKETS.map((market) => {
                const isSelected = (formData.target_markets || []).includes(market);
                return (
                  <button
                    key={market}
                    type="button"
                    onClick={() => handleToggleMarket(market)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      isSelected
                        ? 'bg-amber-500 text-white dark:text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{market}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white dark:text-slate-950" />}
                  </button>
                );
              })}
            </div>

            {/* Custom market adder */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="text"
                value={newMarket}
                onChange={(e) => setNewMarket(e.target.value)}
                placeholder="Add custom target market (e.g. Indian MSMEs, Doctors & Salons)..."
                className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomMarket}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                Add Segment
              </button>
            </div>
          </div>

          {/* Email Signature Location Update Banner */}
          <div className="rounded-3xl p-6 bg-slate-50 dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-cyan-500/10 border border-teal-200 dark:border-cyan-500/20 flex items-center justify-center text-teal-600 dark:text-cyan-400 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Standard Outgoing Email Signature</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 dark:bg-cyan-500/20 text-teal-800 dark:text-cyan-300 font-semibold">
                    Moved to Settings &amp; BYOK
                  </span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Standard outgoing signature and automated Cc &amp; Bcc are now configured under SMTP settings in <strong>Settings &amp; BYOK</strong> to manage all outbound dispatch preferences in one place.
                </p>
              </div>
            </div>

            <Link
              href="/settings"
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Manage in Settings &rarr;</span>
            </Link>
          </div>

          {/* Direct Action Button: Save & Sync Self-Brand Profile */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-extrabold text-sm shadow-lg shadow-teal-600/20 dark:shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save &amp; Sync Self-Brand Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live AI Prompt Benchmark Simulator (Updates live in real-time) */}
        <div className="space-y-6">
          <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4 sticky top-24 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live AI Prompt Benchmark
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20 font-mono font-bold">
                System Context
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This is the live brand benchmark injected into Gemini AI whenever it processes new prospects:
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-800 dark:text-slate-300 space-y-3.5 max-h-[460px] overflow-y-auto leading-relaxed shadow-inner">
              <div>
                <span className="text-teal-700 dark:text-cyan-400 font-bold"># SENDER_COMPANY:</span>
                <p className="text-slate-900 dark:text-white mt-0.5 font-sans font-bold">{formData.company_name || 'Digi Presence Solutions'}</p>
              </div>

              <div>
                <span className="text-teal-700 dark:text-cyan-400 font-bold"># CORE_SERVICES:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {(formData.services_offered || []).join(', ') || 'Website Engineering, Custom Automation, Lead Acquisition Engines, AI Strategy'}
                </p>
              </div>

              <div>
                <span className="text-amber-600 dark:text-amber-400 font-bold"># TARGET_MARKETS:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {(formData.target_markets || []).join(', ') || 'Indian MSMEs, Growing Enterprises, B2B Clients'}
                </p>
              </div>

              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold"># VALUE_PROPOSITION:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formData.unique_selling_proposition || 'Transforming local businesses into unignorable digital brands through high-performance engineering.'}
                </p>
              </div>

              <div>
                <span className="text-indigo-700 dark:text-indigo-400 font-bold"># CREDENTIALS &amp; ACCREDITATIONS:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formData.strengths_and_certifications || 'Google Certified Partner, Meta Certified Strategy, Enterprise Architecture'}
                </p>
              </div>

              {formData.portfolio_url && (
                <div>
                  <span className="text-sky-700 dark:text-sky-400 font-bold"># CREDENTIALS_DECK_LINK:</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 underline">
                    {formData.portfolio_url}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-cyan-500/5 border border-teal-200 dark:border-cyan-500/20 text-teal-900 dark:text-slate-300 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400 flex-shrink-0" />
              <span>Ensures 0% generic pitches — all outreach is hyper-targeted to your company's actual capabilities and credentials.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
