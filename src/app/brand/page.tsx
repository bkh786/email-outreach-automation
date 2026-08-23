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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // AI Autofill from Website Crawling
  const handleAiAutofill = async () => {
    if (!formData.website_url || formData.website_url.trim().length < 4) {
      setAutofillMessage({
        type: 'error',
        text: 'Please enter your Official Website URL first (e.g. https://aniriselogistics.com).'
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
        throw new Error(data.error || 'Failed to analyze website with AI');
      }

      const generatedProfile: Profile = {
        ...formData,
        company_name: data.profile.company_name || formData.company_name,
        website_url: data.profile.website_url || formData.website_url,
        unique_selling_proposition: data.profile.unique_selling_proposition || formData.unique_selling_proposition,
        strengths_and_certifications: data.profile.strengths_and_certifications || formData.strengths_and_certifications,
        services_offered: data.profile.services_offered?.length ? data.profile.services_offered : formData.services_offered,
        target_markets: data.profile.target_markets?.length ? data.profile.target_markets : formData.target_markets,
        email_signature: data.profile.email_signature || formData.email_signature,
      };

      setFormData(generatedProfile);
      await updateProfile(generatedProfile);

      setAutofillMessage({
        type: 'success',
        text: 'Website scraped & brand profile synthesized with Gemini AI successfully!'
      });
    } catch (err: any) {
      setAutofillMessage({
        type: 'error',
        text: err.message || 'AI Autofill encountered an error. Please verify your Gemini Key in Settings.'
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const isUrlEntered = Boolean(formData.website_url && formData.website_url.trim().length > 3);

  if (isSuperAdmin) {
    return (
      <div className="space-y-6 pb-16">
        <div className="rounded-3xl p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20 flex items-center justify-center mx-auto">
            <Database className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
            Super Admin Portal
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            As a Super Admin, self-brand profiles are configured independently for each client tenant in the multi-tenant system. Manage or provision individual client tenant brand profiles under <strong>Client Tenants (Admin)</strong>.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/tenants"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 text-white dark:text-slate-950 font-bold text-xs shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20 transition-all"
            >
              <span>Go to Client Tenants (Admin)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            <span>Self Brand &amp; Trade Lane Profile</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Define your freight forwarding capabilities, USPs, accreditations, and outgoing signature to power tailored AI outreach.
          </p>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Synced to AI Engine &amp; Database!</span>
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
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Card 1: Core Company Identity & Fill with AI */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 flex-wrap gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <span>Company Identity &amp; Credentials</span>
              </h3>

              {/* ✨ Fill with AI Action Button */}
              <button
                type="button"
                onClick={handleAiAutofill}
                disabled={!isUrlEntered || isAutofilling}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 ${
                  isUrlEntered
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-500 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-600/25 ring-2 ring-teal-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700'
                }`}
                title={isUrlEntered ? 'Crawl website with Gemini AI to auto-populate all profile fields' : 'Enter Official Website URL first to enable AI autofill'}
              >
                {isAutofilling ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Crawling &amp; Synthesizing with AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>Fill with AI</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Freight Forwarding Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Anirise Logistics Pvt. Ltd."
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Official Website URL (Enables AI Autofill)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.website_url || ''}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://aniriselogistics.com/"
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
                placeholder="e.g. 23+ years of experience delivering fast, certified, and flexible global logistics. A client-centered, technology-driven approach offering highly personalized, end-to-end supply chain and warehousing solutions."
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-slate-200 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Gemini dynamically cites these differentiators when pitching to prospects with matching trade pain points.
              </p>
            </div>

            {/* Accreditations */}
            <div className="text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Certifications, Network Licenses &amp; Memberships</span>
              </label>
              <input
                type="text"
                value={formData.strengths_and_certifications}
                onChange={(e) => setFormData({ ...formData, strengths_and_certifications: e.target.value })}
                placeholder="e.g. IATA Cargo Agent, FIATA Member, WCA Partner, ISO 9001:2015, Customs Broker License"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Core Logistics Strengths */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Plane className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              <span>Core Logistics Services &amp; Capabilities</span>
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
                placeholder="Add custom service (e.g. Breakbulk charter, AOG spares, DDP Consolidation)..."
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

          {/* Card 3: Target Trade Corridors */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <Globe2 className="w-4 h-4 text-amber-500" />
              <span>Target Trade Lanes &amp; Corridors</span>
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
                placeholder="Add custom trade corridor (e.g. India -> Middle East Air Expedited)..."
                className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomMarket}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
              >
                Add Corridor
              </button>
            </div>
          </div>

          {/* Card 4: Standard Email Signature */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <FileText className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
              <span>Standard Outgoing Email Signature</span>
            </h3>

            <div className="text-xs space-y-1.5">
              <textarea
                rows={6}
                value={formData.email_signature}
                onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                placeholder={`Best regards,\n\nHimanshu Kumar Singh\nAnirise Logistics Pvt. Ltd.\nEmail: info@aniriselogistics.com\nPlot No-62 & 62A, Ground Floor, Block-WE, Mohan Garden, Uttam Nagar, New Delhi-110059 | Phone: +91-1143466415 | Website: www.aniriselogistics.com`}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-slate-900 dark:text-slate-200 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono leading-relaxed text-xs"
              />
              <p className="text-[11px] text-slate-400">
                This exact signature is automatically appended to every AI-drafted cold email pitch.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-extrabold text-sm shadow-md shadow-teal-600/20 dark:shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save &amp; Sync Self-Brand Profile</span>
            </button>
          </div>
        </form>

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
                <span className="text-teal-700 dark:text-cyan-400 font-bold"># SENDER_AGENCY:</span>
                <p className="text-slate-900 dark:text-white mt-0.5 font-sans font-bold">{formData.company_name || 'Not Set'}</p>
              </div>

              <div>
                <span className="text-teal-700 dark:text-cyan-400 font-bold"># CORE_SERVICES:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {(formData.services_offered || []).join(', ') || 'Customs Clearance & Bonded CFS, Air Freight, Sea Freight, Road Transport, Rail Freight'}
                </p>
              </div>

              <div>
                <span className="text-amber-600 dark:text-amber-400 font-bold"># TARGET_CORRIDORS:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {(formData.target_markets || []).join(', ') || 'India -> North America, India -> Europe, Asia -> North America'}
                </p>
              </div>

              <div>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold"># VALUE_PROPOSITION:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formData.unique_selling_proposition || 'Competitive freight rates and dedicated logistics operations.'}
                </p>
              </div>

              <div>
                <span className="text-indigo-700 dark:text-indigo-400 font-bold"># ACCREDITATIONS:</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5">
                  {formData.strengths_and_certifications || 'Verified Logistics Partner, ISO 9001:2015, IATA, WCA Operations.'}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-cyan-500/5 border border-teal-200 dark:border-cyan-500/20 text-teal-900 dark:text-slate-300 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400 flex-shrink-0" />
              <span>Ensures 0% generic pitches — all outreach is hyper-targeted to your agency's actual capabilities.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
