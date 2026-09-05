'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  KeyRound, 
  Mail, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Send, 
  RotateCcw, 
  ExternalLink,
  Sliders,
  Lock,
  Info,
  Server,
  Sparkles,
  Edit3,
  ShieldCheck,
  FileText,
  Check,
  Eye,
  Code2,
  Copy
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { UserConfig } from '@/lib/types';
import { HtmlEmailPreview } from '@/components/common/HtmlEmailPreview';
import { DEFAULT_SAMPLE_DATA } from '@/lib/email-formatter';

interface SmtpPreset {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  hint: string;
}

const SMTP_PRESETS: SmtpPreset[] = [
  {
    id: 'gmail',
    name: 'Google Workspace / Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    hint: 'Requires a Google 16-character App Password (generate at myaccount.google.com/apppasswords).',
  },
  {
    id: 'm365',
    name: 'Microsoft 365 / Office 365',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    hint: 'Use your work email & password. Ensure "Authenticated SMTP" is enabled for your mailbox in M365 Admin.',
  },
  {
    id: 'outlook',
    name: 'Outlook.com / Live',
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    hint: 'Use your personal Outlook.com address and Microsoft App Password.',
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    hint: 'Use your Zoho email address and Application-Specific Password.',
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    hint: 'Use your AWS SES SMTP Username and SMTP Password generated in the AWS SES Console.',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    hint: 'Username must be "apikey" and password is your full SendGrid API Key (SG...).',
  },
  {
    id: 'custom',
    name: 'Custom SMTP Server',
    host: '',
    port: 587,
    secure: false,
    hint: 'Enter your custom corporate mail relay, Postfix, cPanel, or on-premise Exchange server details.',
  },
];

export default function SettingsPage() {
  const { userConfig, updateUserConfig, resetToDemoData, profile, currentUserEmail } = useApp();

  const isSuperAdmin = 
    profile.role === 'super_admin' || 
    profile.role === 'admin' || 
    currentUserEmail === 'bkh786@gmail.com' || 
    currentUserEmail === 'admin@freightpulse.ai' || 
    currentUserEmail === 'admin@marketpulse.ai';

  const [formData, setFormData] = useState<UserConfig>({ ...userConfig });
  const [selectedPresetId, setSelectedPresetId] = useState<string>('gmail');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gemini Test state
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // SMTP Test state
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState(userConfig.from_email || '');
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Welcome Email Template State (Super Admin Only)
  const [welcomeSubject, setWelcomeSubject] = useState('Welcome to {{business_name}} — Your Outreach Portal Credentials');
  const [welcomeTemplate, setWelcomeTemplate] = useState('');
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [isRewritingTemplate, setIsRewritingTemplate] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateFeedback, setTemplateFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Load welcome email template on initial mount
  useEffect(() => {
    if (isSuperAdmin) {
      fetch('/api/admin/welcome-template')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            if (data.subject) setWelcomeSubject(data.subject);
            if (data.template) setWelcomeTemplate(data.template);
          }
        })
        .catch(err => console.error('Failed to load welcome template:', err));
    }
  }, [isSuperAdmin]);

  // Synchronize form whenever userConfig loads or updates from database
  useEffect(() => {
    const ccVal = userConfig.cc_emails || userConfig['Cc-Email'] || '';
    const bccVal = userConfig.bcc_emails || userConfig['Bcc-Email'] || '';
    const portfolioVal = userConfig.portfolio_url || userConfig['portfolio-link'] || profile.portfolio_url || '';

    setFormData({
      ...userConfig,
      email_signature: userConfig.email_signature || profile.email_signature || '',
      cc_emails: ccVal,
      bcc_emails: bccVal,
      cc_enabled: userConfig.cc_enabled !== undefined 
        ? userConfig.cc_enabled 
        : Boolean(ccVal && ccVal.trim().length > 0),
      bcc_enabled: userConfig.bcc_enabled !== undefined 
        ? userConfig.bcc_enabled 
        : Boolean(bccVal && bccVal.trim().length > 0),
      portfolio_url: portfolioVal,
      'Cc-Email': ccVal,
      'Bcc-Email': bccVal,
      'portfolio-link': portfolioVal,
    });
    if (userConfig.from_email && !testRecipientEmail) {
      setTestRecipientEmail(userConfig.from_email);
    }
    if (userConfig.welcome_email_subject && !welcomeSubject) {
      setWelcomeSubject(userConfig.welcome_email_subject);
    }
    if (userConfig.welcome_email_template && !welcomeTemplate) {
      setWelcomeTemplate(userConfig.welcome_email_template);
    }
    // Auto-detect preset if matches
    const matched = SMTP_PRESETS.find(p => p.host && p.host.toLowerCase() === (userConfig.smtp_host || '').toLowerCase());
    if (matched) {
      setSelectedPresetId(matched.id);
    } else if (userConfig.smtp_host) {
      setSelectedPresetId('custom');
    }
  }, [userConfig, profile.email_signature]);

  const handleRewriteWithGemini = async () => {
    setIsRewritingTemplate(true);
    setTemplateFeedback(null);
    try {
      const res = await fetch('/api/admin/generate-welcome-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentTemplate: welcomeTemplate,
          promptInstructions: 'Create a warm, highly professional, enterprise-grade welcome and onboarding email template for new freight forwarding and B2B client tenants. Clearly highlight their login credentials and direct access portal.',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to rewrite with Gemini');
      }

      if (data.subject) setWelcomeSubject(data.subject);
      if (data.template) setWelcomeTemplate(data.template);
      setIsEditingTemplate(true);
      setTemplateFeedback({
        success: true,
        message: 'Welcome message successfully written by Gemini AI! Review, edit if needed, and click Save.',
      });
      setTimeout(() => setTemplateFeedback(null), 5000);
    } catch (err: any) {
      setTemplateFeedback({
        success: false,
        message: err.message || 'Gemini rewrite failed',
      });
    } finally {
      setIsRewritingTemplate(false);
    }
  };

  const handleSaveWelcomeTemplate = async () => {
    setIsSavingTemplate(true);
    setTemplateFeedback(null);
    try {
      const res = await fetch('/api/admin/welcome-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: welcomeSubject,
          template: welcomeTemplate,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save welcome template');
      }

      setIsEditingTemplate(false);
      setTemplateFeedback({
        success: true,
        message: 'Welcome Email Template saved successfully! New tenants will receive this template automatically upon creation.',
      });
      setTimeout(() => setTemplateFeedback(null), 4000);
    } catch (err: any) {
      setTemplateFeedback({
        success: false,
        message: err.message || 'Failed to save template',
      });
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const insertVariable = (tag: string) => {
    setWelcomeTemplate(prev => prev + ` ${tag} `);
    setIsEditingTemplate(true);
  };

  const handleApplyPreset = (preset: SmtpPreset) => {
    setSelectedPresetId(preset.id);
    if (preset.id !== 'custom') {
      setFormData(prev => ({
        ...prev,
        smtp_host: preset.host,
        smtp_port: preset.port,
        smtp_secure: preset.secure,
      }));
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserConfig(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestGeminiKey = async () => {
    if (!formData.gemini_api_key || formData.gemini_api_key.trim() === '') {
      setGeminiTestResult({
        success: false,
        message: 'Please paste your Google Gemini API key first.',
      });
      return;
    }

    setIsTestingGemini(true);
    setGeminiTestResult(null);

    const cleanedKey = formData.gemini_api_key.trim().replace(/^['"]|['"]$/g, '');

    try {
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanedKey }),
      });

      const data = await response.json();
      setGeminiTestResult({
        success: data.success,
        message: data.message || data.error,
      });

      if (data.success) {
        // Automatically save verified key to Supabase database & context
        const updated = { ...formData, gemini_api_key: cleanedKey };
        setFormData(updated);
        await updateUserConfig(updated);
      }
    } catch (err: any) {
      setGeminiTestResult({
        success: false,
        message: err.message || 'Failed to connect to Gemini API',
      });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestSmtp = async (sendRealMessage: boolean = false) => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      const response = await fetch('/api/test-smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: formData.smtp_host,
            port: formData.smtp_port,
            user: formData.smtp_user,
            pass: formData.smtp_pass,
            secure: formData.smtp_secure,
            fromName: formData.from_name,
            fromEmail: formData.from_email,
          },
          sendTestMessage: sendRealMessage,
          testRecipient: testRecipientEmail || formData.smtp_user,
        }),
      });

      const data = await response.json();
      setSmtpTestResult({
        success: data.success,
        message: data.message || data.error,
      });
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'SMTP Connection failed',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const currentPreset = SMTP_PRESETS.find(p => p.id === selectedPresetId) || SMTP_PRESETS[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            <span>Infrastructure &amp; Outreach Settings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure Google Gemini API credentials (BYOK), universal SMTP dispatch servers (M365, Gmail, Outlook, Zoho, SES), and rate throttles.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in shadow-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully to Database!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Google Gemini AI (BYOK) */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Google Gemini AI (BYOK - Free Tier Supported)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Zero runtime fees: use your personal Google AI Studio free tier key.</p>
              </div>
            </div>

            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-teal-600 dark:text-cyan-400 hover:underline font-bold transition-colors"
            >
              <span>Get Free Gemini Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block font-bold text-slate-700 dark:text-slate-300">
              Google Gemini API Key
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={formData.gemini_api_key || ''}
                  onChange={(e) => setFormData({ ...formData, gemini_api_key: e.target.value })}
                  placeholder="AIzaSy..."
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-3 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={isTestingGemini}
                className="px-5 py-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 font-bold transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 flex-shrink-0"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
                <span>{isTestingGemini ? 'Testing Connection...' : 'Test Connection'}</span>
              </button>
            </div>

            {geminiTestResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                geminiTestResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-medium'
              }`}>
                {geminiTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{geminiTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Outreach SMTP Setup with 1-Click Provider Presets */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-6 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outbound SMTP Dispatch Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Send cold outreach from Microsoft 365, Google Workspace, Outlook, Zoho Mail, Amazon SES, or custom mail servers.
                </p>
              </div>
            </div>
          </div>

          {/* 1-Click Provider Preset Bar */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1-Click Email Provider Presets:
            </label>
            <div className="flex flex-wrap gap-2">
              {SMTP_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-teal-600 text-white dark:bg-cyan-500 dark:text-slate-950 border-teal-600 dark:border-cyan-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#0B1120] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>

            {/* Provider Configuration Tip */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 mt-2">
              <Info className="w-4 h-4 text-teal-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
              <span><strong>{currentPreset.name} Setup Note:</strong> {currentPreset.hint}</span>
            </div>
          </div>

          {/* Input Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Host *</label>
              <div className="relative">
                <Server className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={formData.smtp_host || ''}
                  onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                  placeholder="smtp.office365.com"
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Port *</label>
              <input
                type="number"
                required
                value={formData.smtp_port || 587}
                onChange={(e) => setFormData({ ...formData, smtp_port: Number(e.target.value) })}
                placeholder="587"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Encryption / SSL Mode</label>
              <select
                value={formData.smtp_secure ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.value === 'true' })}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="false">STARTTLS (Port 587 / 25) - Standard for M365/Gmail</option>
                <option value="true">Direct SSL/TLS (Port 465) - Standard for Zoho/SSL</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Username / Email *</label>
              <input
                type="text"
                required
                value={formData.smtp_user || ''}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                placeholder="outreach@aniriselogistics.com"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Password / App Password *</label>
              <input
                type="password"
                required
                value={formData.smtp_pass || ''}
                onChange={(e) => setFormData({ ...formData, smtp_pass: e.target.value })}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sender Display Name</label>
              <input
                type="text"
                value={formData.from_name || ''}
                onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                placeholder="Himanshu | Anirise Logistics"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">Sender From Email (Optional)</label>
              <input
                type="email"
                value={formData.from_email || ''}
                onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                placeholder="outreach@company.com"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Automated Outgoing Cc & Bcc Configuration */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Automated Outgoing Cc &amp; Bcc Configuration
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Automatically attaches to each outgoing email dispatched via SMTP
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Cc Configuration */}
              <div className={`p-4 rounded-2xl border transition-all ${
                formData.cc_enabled 
                  ? 'bg-teal-50/40 dark:bg-cyan-950/20 border-teal-200 dark:border-cyan-500/30 shadow-xs' 
                  : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.cc_enabled || false}
                      onChange={(e) => setFormData({ ...formData, cc_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Enable Cc (Carbon Copy)</span>
                  </label>
                  {formData.cc_enabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                      Active
                    </span>
                  )}
                </div>

                {formData.cc_enabled && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Cc Recipients (Multiple Allowed)
                    </label>
                    <input
                      type="text"
                      value={formData.cc_emails || ''}
                      onChange={(e) => setFormData({ ...formData, cc_emails: e.target.value })}
                      placeholder="e.g. ops@company.com, audit@company.com"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter one or multiple email addresses separated by commas, semicolons, or spaces.
                    </p>
                  </div>
                )}
              </div>

              {/* Bcc Configuration */}
              <div className={`p-4 rounded-2xl border transition-all ${
                formData.bcc_enabled 
                  ? 'bg-teal-50/40 dark:bg-cyan-950/20 border-teal-200 dark:border-cyan-500/30 shadow-xs' 
                  : 'bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formData.bcc_enabled || false}
                      onChange={(e) => setFormData({ ...formData, bcc_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-700 dark:bg-slate-900 cursor-pointer"
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Enable Bcc (Blind Carbon Copy)</span>
                  </label>
                  {formData.bcc_enabled && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-cyan-500/20 dark:text-cyan-300">
                      Active
                    </span>
                  )}
                </div>

                {formData.bcc_enabled && (
                  <div className="space-y-1.5 pt-2 animate-in fade-in">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Bcc Recipients (Multiple Allowed)
                    </label>
                    <input
                      type="text"
                      value={formData.bcc_emails || ''}
                      onChange={(e) => setFormData({ ...formData, bcc_emails: e.target.value })}
                      placeholder="e.g. crm-inbox@hubspot.com, archive@company.com"
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                    />
                    <p className="text-[10px] text-slate-400">
                      Enter one or multiple email addresses separated by commas, semicolons, or spaces.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Standard Outgoing Email Signature Section */}
          <div className="pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Standard Outgoing Email Signature
                </h4>
              </div>
              <span className="text-[11px] text-teal-600 dark:text-cyan-400 font-semibold">
                Strictly applied to all AI-generated outreach drafts
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <textarea
                rows={6}
                value={formData.email_signature ?? profile.email_signature ?? ''}
                onChange={(e) => setFormData({ ...formData, email_signature: e.target.value })}
                placeholder={`Thanks & Regards\nOperations & Growth Team\nDigi Presence Solutions\nEmail: contact@digipresence.in\nAddress: Registered Office | Phone No.: +91 9064435909 | https://www.digipresence.in\nLinkedIn: https://linkedin.com/company/digipresence-solutions`}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-slate-200 focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono leading-relaxed text-xs shadow-inner"
              />
              <p className="text-[11px] text-slate-400">
                Pattern: Thanks &amp; Regards &bull; [Name / Team] &bull; [Company Name] &bull; [Email] &bull; [Address | Phone | Website] &bull; [Portfolio / Social Links]
              </p>
            </div>
          </div>

          {/* Test SMTP Delivery Section */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs">
              Test SMTP Dispatch Server &amp; Handshake
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                placeholder="Enter email to receive test verification message..."
                className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestSmtp(false)}
                  disabled={isTestingSmtp}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors shadow-sm"
                >
                  Verify Handshake
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSmtp(true)}
                  disabled={isTestingSmtp}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-bold transition-colors shadow-sm"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                  <span>Send Real Test Email</span>
                </button>
              </div>
            </div>

            {smtpTestResult && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                smtpTestResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium' 
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-medium'
              }`}>
                {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{smtpTestResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Super Admin Welcome Email Template Section */}
        {isSuperAdmin && (
          <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-teal-200/70 dark:border-cyan-500/30 shadow-lg space-y-6 transition-all relative overflow-hidden">
            {/* Ambient background glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-teal-500/5 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header with Title & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tenant Onboarding Welcome Email Template
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-mono">
                      Super Admin Only
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Automatically triggered and populated with tenant credentials upon client creation via configured outbound SMTP.
                  </p>
                </div>
              </div>

              {/* Action Buttons: Rewrite with Gemini, Edit, Save */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleRewriteWithGemini}
                  disabled={isRewritingTemplate}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 active:scale-95 transition-all disabled:opacity-50"
                  title="Generate or optimize welcome copy using Google Gemini AI"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isRewritingTemplate ? 'animate-spin' : ''}`} />
                  <span>{isRewritingTemplate ? 'Rewriting with Gemini...' : 'Rewrite with Gemini'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditingTemplate(!isEditingTemplate)}
                  className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                    isEditingTemplate
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {isEditingTemplate ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  <span>{isEditingTemplate ? 'Preview Template' : 'Edit Template'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveWelcomeTemplate}
                  disabled={isSavingTemplate}
                  className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Save className={`w-3.5 h-3.5 ${isSavingTemplate ? 'animate-spin' : ''}`} />
                  <span>{isSavingTemplate ? 'Saving...' : 'Save Template'}</span>
                </button>
              </div>
            </div>

            {/* Feedback alert */}
            {templateFeedback && (
              <div className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
                templateFeedback.success
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-medium'
                  : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-medium'
              }`}>
                {templateFeedback.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <span>{templateFeedback.message}</span>
              </div>
            )}

            {/* Dynamic Variable Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Click to Insert Dynamic Tenant Field:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { tag: '{{name}}', label: 'Contact Person Name' },
                  { tag: '{{business_name}}', label: 'Tenant Company Name' },
                  { tag: '{{contact_number}}', label: 'Phone / Contact Number' },
                  { tag: '{{login_email}}', label: 'Login Email' },
                  { tag: '{{temporary_password}}', label: 'Temporary Password' },
                  { tag: '{{login_url}}', label: 'Portal Login Link' },
                ].map((item) => (
                  <button
                    key={item.tag}
                    type="button"
                    onClick={() => insertVariable(item.tag)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-cyan-500/20 text-slate-700 dark:text-slate-300 hover:text-teal-700 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 hover:border-teal-300 dark:hover:border-cyan-500/40 text-[11px] font-mono transition-all"
                  >
                    <span>{item.tag}</span>
                    <span className="text-[10px] text-slate-400 font-sans">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Email Subject Line */}
            <div className="space-y-1.5 text-xs">
              <label className="block font-bold text-slate-700 dark:text-slate-300">
                Welcome Email Subject Line
              </label>
              <input
                type="text"
                value={welcomeSubject}
                onChange={(e) => setWelcomeSubject(e.target.value)}
                placeholder="Welcome to {{business_name}} — Your Outreach Portal Credentials"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white font-medium focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Email Body Window */}
            <div className="space-y-2 text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                  <span>Welcome Message Body Template (HTML &amp; Responsive Layout Supported)</span>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">
                    {welcomeTemplate ? `${welcomeTemplate.length} chars` : 'Blank Template'}
                  </span>
                  <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 border border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsEditingTemplate(true)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        isEditingTemplate
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Code2 className="w-3 h-3" />
                      <span>Edit HTML / Code</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingTemplate(false)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        !isEditingTemplate
                          ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>Live HTML Preview</span>
                    </button>
                  </div>
                </div>
              </div>

              {isEditingTemplate ? (
                <div className="space-y-2">
                  <textarea
                    rows={14}
                    value={welcomeTemplate}
                    onChange={(e) => setWelcomeTemplate(e.target.value)}
                    placeholder="Enter HTML or text with dynamic tokens: {{name}}, {{business_name}}, {{contact_number}}, {{login_email}}, {{temporary_password}}, {{login_url}}..."
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-mono text-xs focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none transition-colors leading-relaxed shadow-inner"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span>Pro tip: You can write full HTML with inline styles or click <strong>Live HTML Preview</strong> to see the rendered email in real time.</span>
                    <button
                      type="button"
                      onClick={() => setIsEditingTemplate(false)}
                      className="text-teal-600 dark:text-cyan-400 hover:underline font-semibold"
                    >
                      Switch to Visual Preview &rarr;
                    </button>
                  </div>
                </div>
              ) : (
                <HtmlEmailPreview
                  content={welcomeTemplate}
                  sampleData={{
                    ...DEFAULT_SAMPLE_DATA,
                    login_url: typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://marketpulse.ai/login',
                  }}
                  title="Tenant Welcome Email Live Preview"
                  minHeight="520px"
                  allowToggleView={true}
                  allowVariableControls={true}
                />
              )}
            </div>

            {/* Info footer */}
            <div className="flex items-center justify-between pt-2 text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
                <span>Full HTML and mobile responsive rendering enabled with dynamic placeholder interpolation</span>
              </span>
              <span>Triggers via configured Outbound SMTP whenever a new client tenant is provisioned</span>
            </div>
          </div>
        )}

        {/* Card 3: Automation Preferences & Throttling */}
        <div className="rounded-3xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-md space-y-6 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outreach Dispatch Safeguards &amp; Throttling
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Prevent spam flags and maintain high sender reputation.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Auto Send Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Autonomous Dispatch (Auto-Send)</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  When enabled, pending leads are enriched and immediately sent via SMTP without manual drawer approval.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={formData.auto_send_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_send_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* Max Hourly Throttle */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Hourly Dispatch Throttle:</span>
                <span className="font-mono text-teal-700 dark:text-cyan-400 font-bold">{formData.max_hourly_rate || 15} emails/hr</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={formData.max_hourly_rate || 15}
                onChange={(e) => setFormData({ ...formData, max_hourly_rate: Number(e.target.value) })}
                className="w-full accent-teal-600 dark:accent-cyan-400 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">Recommended: 15–20 emails/hour for pristine domain health.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset workspace database and restore demo logistics dataset?')) {
                resetToDemoData();
                alert('Workspace reset to initial logistics dataset.');
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>Reset Demo Workspace</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-extrabold text-sm shadow-md shadow-teal-600/20 dark:shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Database...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
