'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Globe2, 
  Sparkles, 
  Save, 
  Award, 
  CheckCircle2, 
  Plus, 
  X, 
  Plane, 
  Ship, 
  ShieldCheck, 
  Layers, 
  FileText,
  Cpu,
  ArrowRight
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { Profile } from '@/lib/types';

const COMMON_SERVICES = [
  'Transpacific Ocean FCL/LCL',
  'Expedited Air Freight Charters',
  'Bonded CFS & Warehousing',
  'Automated Customs Clearance',
  'Project Cargo & Heavy Lift',
  'Cold Chain & Pharma Logistics',
  'DDP / DAP Delivery Services',
  'Cross-Border E-Commerce Sortation',
  'Dangerous Goods (DG) Handling'
];

const COMMON_MARKETS = [
  'Asia -> North America',
  'Europe -> North America',
  'Southeast Asia Transshipment',
  'China -> Europe Rail & Air',
  'Middle East Multimodal Corridors',
  'Latin America Agri-Trade'
];

export default function BrandProfilePage() {
  const { profile, updateProfile } = useApp();

  const [formData, setFormData] = useState<Profile>({ ...profile });
  const [newService, setNewService] = useState('');
  const [newMarket, setNewMarket] = useState('');
  const [isSaved, setIsSaved] = useState(false);

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

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-cyan-400" />
            Self Brand & Trade Lane Profile
          </h2>
          <p className="text-xs text-slate-400">
            Define your freight forwarding capabilities, USPs, accreditations, and outgoing signature to power tailored AI outreach.
          </p>
        </div>

        {isSaved && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile Synced to AI Engine!</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Form (Spans 2 columns) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* Card 1: Core Company Identity */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-800 shadow-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-cyan-400" />
              Company Identity & Credentials
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Freight Forwarding Agency Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g. Vanguard Global Logistics Ltd."
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Official Website URL
                </label>
                <input
                  type="text"
                  value={formData.website_url || ''}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://vanguardgloballogistics.com"
                  className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Unique Selling Proposition */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-300 mb-1.5">
                Unique Value Proposition (USP & Key Differentiators)
              </label>
              <textarea
                rows={3}
                value={formData.unique_selling_proposition}
                onChange={(e) => setFormData({ ...formData, unique_selling_proposition: e.target.value })}
                placeholder="e.g. Guaranteed space allocations during peak seasons, direct bonded CFS warehouse in LAX, real-time GPS telemetry..."
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-cyan-500 focus:outline-none leading-relaxed"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Gemini will dynamically cite these differentiators when pitching to prospects with matching trade pain points.
              </p>
            </div>

            {/* Accreditations */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Certifications, Network Licenses & Memberships
              </label>
              <input
                type="text"
                value={formData.strengths_and_certifications}
                onChange={(e) => setFormData({ ...formData, strengths_and_certifications: e.target.value })}
                placeholder="e.g. IATA Cargo Agent, FIATA Member, WCA Partner (ID: 92834), C-TPAT Tier 2, ISO 9001:2015"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Card 2: Core Logistics Strengths */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-800 shadow-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Plane className="w-4 h-4 text-cyan-400" />
              Core Logistics Services & Capabilities
            </h3>

            <div className="flex flex-wrap gap-2">
              {COMMON_SERVICES.map((service) => {
                const isSelected = (formData.services_offered || []).includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleToggleService(service)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{service}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
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
                placeholder="Add custom service (e.g. Breakbulk charter, AOG spares)..."
                className="flex-1 bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomService}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Add Service
              </button>
            </div>
          </div>

          {/* Card 3: Target Trade Corridors */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-800 shadow-2xl space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe2 className="w-4 h-4 text-amber-400" />
              Target Trade Lanes & Corridors
            </h3>

            <div className="flex flex-wrap gap-2">
              {COMMON_MARKETS.map((market) => {
                const isSelected = (formData.target_markets || []).includes(market);
                return (
                  <button
                    key={market}
                    type="button"
                    onClick={() => handleToggleMarket(market)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{market}</span>
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
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
                placeholder="Add custom trade lane (e.g. Vietnam -> US Gulf Coast)..."
                className="flex-1 bg-[#0B1120] border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomMarket}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
              >
                Add Corridor
              </button>
            </div>
          </div>

          {/* Card 4: Standard Email Signature */}
          <div className="rounded-3xl p-6 sm:p-8 bg-[#0F172A]/90 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              Standard Outgoing Email Signature
            </h3>

            <div className="text-xs space-y-1.5">
              <textarea
                rows={5}
                value={formData.email_signature}
                onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                placeholder="Best regards,&#10;&#10;John Doe | VP of Trade Lane Development&#10;Global Freight Logistics&#10;Direct: +1 (555) 019-4820&#10;www.globalfreight.com"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl p-3.5 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono leading-relaxed"
              />
              <p className="text-[11px] text-slate-500">
                This exact signature is automatically appended to every AI-drafted cold email pitch.
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync Self-Brand Profile</span>
            </button>
          </div>
        </form>

        {/* Live AI Prompt Benchmark Simulator (Right Column) */}
        <div className="space-y-6">
          <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-[#0B1322] to-[#080E1A] border border-cyan-500/30 shadow-2xl space-y-4 sticky top-24">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Live AI Prompt Benchmark
                </h4>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                System Context
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              This is the live brand benchmark injected into Gemini AI whenever it processes new prospects:
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-3 max-h-[420px] overflow-y-auto leading-relaxed">
              <div>
                <span className="text-cyan-400 font-bold"># SENDER_AGENCY:</span>
                <p className="text-white mt-0.5">{formData.company_name || 'Not Set'}</p>
              </div>

              <div>
                <span className="text-cyan-400 font-bold"># CORE_SERVICES:</span>
                <p className="text-slate-300 mt-0.5">
                  {(formData.services_offered || []).join(', ') || 'General freight'}
                </p>
              </div>

              <div>
                <span className="text-amber-400 font-bold"># TARGET_CORRIDORS:</span>
                <p className="text-slate-300 mt-0.5">
                  {(formData.target_markets || []).join(', ') || 'Global lanes'}
                </p>
              </div>

              <div>
                <span className="text-emerald-400 font-bold"># VALUE_PROPOSITION:</span>
                <p className="text-slate-300 mt-0.5">
                  {formData.unique_selling_proposition || 'Competitive freight rates'}
                </p>
              </div>

              <div>
                <span className="text-indigo-400 font-bold"># ACCREDITATIONS:</span>
                <p className="text-slate-300 mt-0.5">
                  {formData.strengths_and_certifications || 'Verified forwarder'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-slate-300 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span>Ensures 0% generic pitches — all outreach is hyper-targeted to your agency's actual capabilities.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
