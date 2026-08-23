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
  Server
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { UserConfig } from '@/lib/types';

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
  const { userConfig, updateUserConfig, resetToDemoData } = useApp();

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

  // Synchronize form whenever userConfig loads or updates from database
  useEffect(() => {
    setFormData({ ...userConfig });
    if (userConfig.from_email && !testRecipientEmail) {
      setTestRecipientEmail(userConfig.from_email);
    }
    // Auto-detect preset if matches
    const matched = SMTP_PRESETS.find(p => p.host && p.host.toLowerCase() === (userConfig.smtp_host || '').toLowerCase());
    if (matched) {
      setSelectedPresetId(matched.id);
    } else if (userConfig.smtp_host) {
      setSelectedPresetId('custom');
    }
  }, [userConfig]);

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
