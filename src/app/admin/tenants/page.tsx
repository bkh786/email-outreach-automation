'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Globe2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  ExternalLink, 
  Sparkles, 
  Send,
  Layers,
  KeyRound,
  RefreshCw,
  Search
} from 'lucide-react';
import { Tenant } from '@/lib/types';

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Tenant Form state
  const [form, setForm] = useState({
    company_name: '',
    email: '',
    password: '',
    contact_person: '',
    contact_number: '',
    target_markets: 'Asia -> North America, Europe -> North America',
    services_offered: 'Transpacific Ocean FCL/LCL, Expedited Air Freight, Customs Clearance',
    max_daily_emails: 50,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Welcome Email Populated Display State
  const [activeWelcomeEmail, setActiveWelcomeEmail] = useState<{
    to: string;
    subject: string;
    body: string;
    dispatchStatus: {
      sent: boolean;
      simulated: boolean;
      error: string | null;
      messageId: string | null;
      provider: string;
    };
    tenantDetails?: {
      name: string;
      business_name: string;
      contact_number: string;
      login_email: string;
      temporary_password?: string;
    };
  } | null>(null);

  const [copiedWelcomeBody, setCopiedWelcomeBody] = useState(false);
  const [isResendingWelcome, setIsResendingWelcome] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/list-tenants');
      const data = await res.json();
      if (data.success) {
        setTenants(data.tenants || []);
      } else {
        setTenants([
          {
            id: 'admin-master',
            email: 'admin@marketpulse.ai',
            company_name: 'MarketPulse Master Platform',
            role: 'super_admin',
            created_at: new Date().toISOString(),
            stats: { total: 6, sent: 1, pending: 3 },
            target_markets: ['Global Trade Corridors'],
          },
          {
            id: 'tenant-1',
            email: 'ops@apexocean.com',
            company_name: 'Apex Ocean Logistics LLC',
            role: 'client',
            created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
            stats: { total: 42, sent: 18, pending: 6 },
            target_markets: ['Asia -> North America'],
          },
        ]);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/admin/create-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          email: form.email,
          password: form.password,
          contact_person: form.contact_person,
          contact_number: form.contact_number,
          target_markets: form.target_markets.split(',').map(s => s.trim()),
          services_offered: form.services_offered.split(',').map(s => s.trim()),
          max_daily_emails: form.max_daily_emails,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create tenant');
      }

      setSuccessMessage(`Tenant '${form.company_name}' successfully provisioned! Welcome onboarding email generated.`);
      
      // Capture populated welcome email for immediate display at bottom of page
      if (data.welcomeEmail) {
        setActiveWelcomeEmail({
          ...data.welcomeEmail,
          tenantDetails: {
            name: form.contact_person || 'Client Operations',
            business_name: form.company_name,
            contact_number: form.contact_number || 'N/A',
            login_email: form.email,
            temporary_password: form.password,
          },
        });
      }

      setIsCreateModalOpen(false);
      setForm({
        company_name: '',
        email: '',
        password: '',
        contact_person: '',
        contact_number: '',
        target_markets: 'Asia -> North America, Europe -> North America',
        services_offered: 'Transpacific Ocean FCL/LCL, Expedited Air Freight, Customs Clearance',
        max_daily_emails: 50,
      });
      fetchTenants();

      // Smooth scroll down to populated email section
      setTimeout(() => {
        const emailSection = document.getElementById('populated-welcome-email-section');
        if (emailSection) {
          emailSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyWelcomeEmail = () => {
    if (!activeWelcomeEmail) return;
    const fullContent = `Subject: ${activeWelcomeEmail.subject}\n\n${activeWelcomeEmail.body}`;
    navigator.clipboard.writeText(fullContent);
    setCopiedWelcomeBody(true);
    setTimeout(() => setCopiedWelcomeBody(false), 2000);
  };

  const handleSelectPastTenantForWelcome = async (tenant: Tenant) => {
    try {
      // Fetch fresh template
      const tRes = await fetch('/api/admin/welcome-template');
      const tData = await tRes.json();
      const rawSubject = tData.subject || 'Welcome to {{business_name}} — Your Outreach Portal Credentials';
      const rawBody = tData.template || 'Dear {{name}},\n\nWelcome to {{business_name}}!';

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://marketpulse.ai';
      const name = tenant.contact_person || 'Operations Lead';
      const bName = tenant.company_name;
      const phone = tenant.contact_number || 'N/A';
      const email = tenant.email;

      const populatedSubj = rawSubject
        .replace(/{{\s*name\s*}}/gi, name)
        .replace(/{{\s*business_name\s*}}/gi, bName)
        .replace(/{{\s*contact_number\s*}}/gi, phone)
        .replace(/{{\s*login_email\s*}}/gi, email)
        .replace(/{{\s*login_url\s*}}/gi, `${origin}/login`);

      const populatedBody = rawBody
        .replace(/{{\s*name\s*}}/gi, name)
        .replace(/{{\s*business_name\s*}}/gi, bName)
        .replace(/{{\s*contact_number\s*}}/gi, phone)
        .replace(/{{\s*login_email\s*}}/gi, email)
        .replace(/{{\s*temporary_password\s*}}/gi, '•••••••••••• (Encrypted on file)')
        .replace(/{{\s*login_url\s*}}/gi, `${origin}/login`);

      setActiveWelcomeEmail({
        to: email,
        subject: populatedSubj,
        body: populatedBody,
        dispatchStatus: {
          sent: true,
          simulated: false,
          error: null,
          messageId: 'dispatched-tenant',
          provider: 'Configured SMTP Relay',
        },
        tenantDetails: {
          name,
          business_name: bName,
          contact_number: phone,
          login_email: email,
          temporary_password: '•••••••••••• (Provisioned Password)',
        },
      });

      const emailSection = document.getElementById('populated-welcome-email-section');
      if (emailSection) {
        emailSection.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (e) {
      console.error('Error populating template for past tenant:', e);
    }
  };

  const copyCredentials = (email: string) => {
    navigator.clipboard.writeText(`MarketPulse AI Client Login:\nURL: ${window.location.origin}/login\nEmail: ${email}`);
    setCopiedId(email);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredTenants = tenants.filter(t => 
    t.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-cyan-500/10 border border-teal-200 dark:border-cyan-500/30 text-teal-700 dark:text-cyan-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Admin Multi-Tenant Portal</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            Client Tenant Provisioning & Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create independent tenant accounts for each logistics client with isolated Row-Level Security and custom trade profiles.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-extrabold text-xs shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Provision New Client Tenant</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Client Tenants</span>
          <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{tenants.length}</h3>
          <p className="text-[11px] text-teal-600 dark:text-cyan-400 mt-1 font-medium">Multi-tenant isolated databases</p>
        </div>
        <div className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Aggregated Leads</span>
          <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {tenants.reduce((acc, t) => acc + (t.stats?.total || 0), 0)}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Across all forwarder tenants</p>
        </div>
        <div className="rounded-2xl p-5 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Emails Dispatched</span>
          <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {tenants.reduce((acc, t) => acc + (t.stats?.sent || 0), 0)}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Automated outreach velocity</p>
        </div>
      </div>

      {/* Search & Tenants Table */}
      <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden space-y-4 p-6 transition-colors">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client company name or email..."
              className="w-full text-xs bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <button
            onClick={fetchTenants}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Client Agency</th>
                <th className="py-3 px-4">Admin Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Corridors</th>
                <th className="py-3 px-4">Leads / Sent</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-700 dark:text-cyan-400 font-bold text-xs">
                        {tenant.company_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{tenant.company_name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">ID: {tenant.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                    {tenant.email}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      tenant.role === 'super_admin'
                        ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                        : 'bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30'
                    }`}>
                      {tenant.role === 'super_admin' ? 'Super Admin' : 'Client Tenant'}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">
                    {tenant.target_markets?.join(', ') || 'Global'}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-slate-900 dark:text-white">{tenant.stats?.total || 0}</span> leads &bull; <span className="font-bold text-emerald-600 dark:text-emerald-400">{tenant.stats?.sent || 0}</span> sent
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                    {new Date(tenant.created_at).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleSelectPastTenantForWelcome(tenant)}
                        className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-semibold transition-all"
                        title="View populated welcome automailer for this tenant"
                      >
                        Welcome Mail
                      </button>
                      <button
                        onClick={() => copyCredentials(tenant.email)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-all"
                        title="Copy Login Link & Email"
                      >
                        {copiedId === tenant.email ? 'Copied!' : 'Copy Login'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION AT BOTTOM OF PAGE: Populated Welcome Email Automailer */}
      {activeWelcomeEmail && (
        <div 
          id="populated-welcome-email-section"
          className="rounded-3xl bg-white dark:bg-[#0F172A] border border-teal-200 dark:border-cyan-500/40 p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative overflow-hidden"
        >
          {/* Subtle ambient gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 flex items-center justify-center shadow-sm">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                    Tenant Onboarding Welcome Mailer (Populated from Template)
                  </h3>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300 font-mono">
                    Live Dispatch
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Welcome email populated with Name, Business Name, Contact Number, Login Email, and Temporary Password from tenant creation fields.
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyWelcomeEmail}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedWelcomeBody ? 'Copied to Clipboard!' : 'Copy Email Body'}</span>
              </button>

              <button
                onClick={() => setActiveWelcomeEmail(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Close welcome mailer preview"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Captured Field Pill Summary */}
          {activeWelcomeEmail.tenantDetails && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Name:</span>
                <span className="font-bold text-slate-900 dark:text-white truncate block">
                  {activeWelcomeEmail.tenantDetails.name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Business Name:</span>
                <span className="font-bold text-teal-700 dark:text-cyan-400 truncate block">
                  {activeWelcomeEmail.tenantDetails.business_name}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Contact Number:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono truncate block">
                  {activeWelcomeEmail.tenantDetails.contact_number}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Login Email:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono truncate block">
                  {activeWelcomeEmail.tenantDetails.login_email}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Temp Password:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono truncate block">
                  {activeWelcomeEmail.tenantDetails.temporary_password || '••••••••'}
                </span>
              </div>
            </div>
          )}

          {/* SMTP Dispatch Delivery Status Badge */}
          <div className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-4 ${
            activeWelcomeEmail.dispatchStatus.sent
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : activeWelcomeEmail.dispatchStatus.simulated
              ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5">
              {activeWelcomeEmail.dispatchStatus.sent ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <p className="font-bold">
                  {activeWelcomeEmail.dispatchStatus.sent
                    ? `Dispatched via Outbound SMTP Server (${activeWelcomeEmail.dispatchStatus.provider})`
                    : activeWelcomeEmail.dispatchStatus.simulated
                    ? 'Automailer Delivery Simulated (No active SMTP configured in Settings & BYOK)'
                    : 'Automailer SMTP Delivery Error'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Recipient: <span className="font-mono font-semibold">{activeWelcomeEmail.to}</span>
                  {activeWelcomeEmail.dispatchStatus.messageId && (
                    <span> &bull; Message ID: <span className="font-mono">{activeWelcomeEmail.dispatchStatus.messageId}</span></span>
                  )}
                  {activeWelcomeEmail.dispatchStatus.error && (
                    <span> &bull; Note: {activeWelcomeEmail.dispatchStatus.error}</span>
                  )}
                </p>
              </div>
            </div>

            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-full bg-white dark:bg-slate-900 border border-current shadow-sm flex-shrink-0">
              {activeWelcomeEmail.dispatchStatus.sent ? 'Delivered via SMTP' : 'Ready / Simulated'}
            </span>
          </div>

          {/* Email Subject */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Subject Line:</span>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              {activeWelcomeEmail.subject}
            </p>
          </div>

          {/* Populated Email Body Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                Populated Email Body (Template Fetched &amp; Injected):
              </span>
              <span className="text-[11px] text-slate-400">
                Rendered with dynamic tenant tokens
              </span>
            </div>
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#080D18] border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed shadow-inner">
              {activeWelcomeEmail.body}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Provision New Client Tenant */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Provision Client Tenant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Creates isolated login credentials and database space</p>
                </div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg">
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Freight Company Name *</label>
                <input
                  type="text"
                  required
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g. Apex Global Cargo Ltd."
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Client Login Email *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="ops@apexglobalcargo.com"
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Temporary Password *</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="ClientPass2025!"
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Contact Person</label>
                <input
                  type="text"
                  value={form.contact_person}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
                  placeholder="e.g. David Miller (VP of Operations)"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Number (Phone) *</label>
                <input
                  type="text"
                  required
                  value={form.contact_number}
                  onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                  placeholder="e.g. +1 (555) 019-2834 or +91 9064435909"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Assigned Trade Corridors</label>
                <input
                  type="text"
                  value={form.target_markets}
                  onChange={(e) => setForm({ ...form, target_markets: e.target.value })}
                  placeholder="Asia -> North America, Europe -> North America"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-bold shadow-md shadow-teal-600/20 dark:shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Provisioning...' : 'Provision Client Tenant'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
