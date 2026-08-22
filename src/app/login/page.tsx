'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ThemeSelector from '@/components/layout/ThemeSelector';
import Footer from '@/components/layout/Footer';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || 'Invalid email or password.');
        setLoading(false);
        return;
      }

      if (data?.session) {
        window.location.href = '/dashboard';
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050811] text-slate-900 dark:text-slate-100 flex flex-col justify-between items-center relative overflow-hidden transition-colors duration-300">
      {/* Background ambient glowing spheres (dark mode only) */}
      <div className="hidden dark:block absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="hidden dark:block absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Top Bar with Theme Toggle */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-end px-6 pt-5 pb-2 z-20">
        <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <ThemeSelector />
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] mx-4 bg-white dark:bg-[#0A101E]/90 border border-slate-200 dark:border-slate-800/90 rounded-[32px] p-8 sm:p-10 shadow-xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-2xl space-y-7 my-auto transition-colors">
        {/* Logo Squircle */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-[#0B1528] border-2 border-teal-500/40 dark:border-teal-400/60 flex items-center justify-center mx-auto shadow-md dark:shadow-[0_0_25px_rgba(13,148,136,0.35)] transition-transform hover:scale-105">
            <Activity className="w-8 h-8 text-teal-600 dark:text-teal-400" />
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">MarketPulse</h1>
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md bg-teal-600 text-white dark:bg-teal-400 dark:text-slate-950 shadow-sm">
                AI &amp; Automation
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">B2B Lead Intelligence &amp; Autonomous Cold Outreach</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@apexlogistics.com"
                className="w-full bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/60 rounded-2xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-50 dark:bg-[#111A2E] border border-slate-200 dark:border-slate-700/60 rounded-2xl pl-11 pr-4 py-3.5 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-teal-500 dark:focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 dark:bg-gradient-to-r dark:from-teal-400 dark:via-cyan-400 dark:to-teal-500 dark:hover:from-teal-300 dark:hover:to-cyan-300 text-white dark:text-slate-950 font-black text-xs shadow-md shadow-teal-600/20 dark:shadow-[0_8px_25px_rgba(13,148,136,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Shared Static Footer with light/dark theme support */}
      <Footer />
    </div>
  );
}
