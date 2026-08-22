'use client';

import React, { useState } from 'react';
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
  Lock
} from 'lucide-react';
import { useApp } from '@/lib/store/app-context';
import { UserConfig } from '@/lib/types';

export default function SettingsPage() {
  const { userConfig, updateUserConfig, resetToDemoData } = useApp();

  const [formData, setFormData] = useState<UserConfig>({ ...userConfig });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Gemini Test state
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // SMTP Test state
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [testRecipientEmail, setTestRecipientEmail] = useState(userConfig.from_email || '');
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    await updateUserConfig(formData);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestGeminiKey = async () => {
    setIsTestingGemini(true);
    setGeminiTestResult(null);

    try {
      const response = await fetch('/api/test-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: formData.gemini_api_key }),
      });

      const data = await response.json();
      setGeminiTestResult({
        success: data.success,
        message: data.message || data.error,
      });
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

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            Infrastructure & Outreach Settings
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure Google Gemini API credentials (BYOK), custom SMTP dispatch servers, and rate throttles.
          </p>
        </div>

        {saveSuccess && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Google Gemini AI (BYOK) */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <KeyRound className="w-5 h-5 text-amber-500" />
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
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <button
                type="button"
                onClick={handleTestGeminiKey}
                disabled={isTestingGemini}
                className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Zap className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin' : ''}`} />
                <span>{isTestingGemini ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {geminiTestResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
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

        {/* Card 2: Outreach SMTP Setup */}
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-teal-600 dark:text-cyan-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outbound SMTP Dispatch Configuration
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Send outreach directly from your Google Workspace, Microsoft 365, or transactional relay.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Host</label>
              <input
                type="text"
                value={formData.smtp_host || ''}
                onChange={(e) => setFormData({ ...formData, smtp_host: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Port</label>
              <input
                type="number"
                value={formData.smtp_port || 587}
                onChange={(e) => setFormData({ ...formData, smtp_port: Number(e.target.value) })}
                placeholder="587"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SSL / TLS Mode</label>
              <select
                value={formData.smtp_secure ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, smtp_secure: e.target.value === 'true' })}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="false">STARTTLS (Port 587 / 25)</option>
                <option value="true">Direct SSL/TLS (Port 465)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Username / Email</label>
              <input
                type="text"
                value={formData.smtp_user || ''}
                onChange={(e) => setFormData({ ...formData, smtp_user: e.target.value })}
                placeholder="outreach@agency.com"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">SMTP Password / App Password</label>
              <input
                type="password"
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
                placeholder="Alexander | Vanguard Logistics"
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Test SMTP Delivery Section */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="email"
                value={testRecipientEmail}
                onChange={(e) => setTestRecipientEmail(e.target.value)}
                placeholder="Enter email to receive test verification..."
                className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-teal-500 dark:focus:border-cyan-500 focus:outline-none font-mono"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTestSmtp(false)}
                  disabled={isTestingSmtp}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors"
                >
                  Verify Handshake
                </button>

                <button
                  type="button"
                  onClick={() => handleTestSmtp(true)}
                  disabled={isTestingSmtp}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/30 text-xs font-bold transition-colors"
                >
                  <Send className={`w-3 h-3 ${isTestingSmtp ? 'animate-spin' : ''}`} />
                  <span>Send Test Email</span>
                </button>
              </div>
            </div>

            {smtpTestResult && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
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
        <div className="rounded-2xl p-6 sm:p-8 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outreach Dispatch Safeguards & Throttling
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
            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-cyan-500 dark:to-teal-500 text-white dark:text-slate-950 font-extrabold text-sm shadow-md shadow-teal-600/20 dark:shadow-cyan-500/25 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
