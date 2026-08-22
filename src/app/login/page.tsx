'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
    <div className="min-h-screen bg-[#050811] flex flex-col justify-between items-center p-4 relative overflow-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-blue-600/8 rounded-full blur-[150px] pointer-events-none" />

      {/* Spacer */}
      <div className="h-6" />

      {/* Main Login Card */}
      <div className="w-full max-w-[440px] bg-[#0A101E]/90 border border-slate-800/90 rounded-[32px] p-8 sm:p-10 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-2xl space-y-7 my-auto">
        {/* Logo Squircle with Neon Cyan Glow */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#0B1528] border-2 border-teal-400/60 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(13,148,136,0.35)] transition-transform hover:scale-105">
            <Activity className="w-8 h-8 text-teal-400" />
          </div>

          <div className="flex flex-col items-center justify-center gap-1.5 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">MarketPulse</h1>
              <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-md bg-teal-400 text-slate-950 shadow-sm shadow-teal-400/40">
                AI &amp; Automation
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">B2B Lead Intelligence &amp; Autonomous Cold Outreach</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="bkh786@gmail.com"
                className="w-full bg-[#111A2E] border border-slate-700/60 rounded-2xl pl-11 pr-4 py-3.5 text-white text-xs placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111A2E] border border-slate-700/60 rounded-2xl pl-11 pr-4 py-3.5 text-white text-xs placeholder:text-slate-500 focus:border-teal-400 focus:ring-2 focus:ring-teal-500/20 focus:outline-none transition-all font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 hover:from-teal-300 hover:to-cyan-300 text-slate-950 font-black text-xs shadow-[0_8px_25px_rgba(13,148,136,0.35)] hover:shadow-[0_10px_30px_rgba(13,148,136,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Static Footer on Login Page */}
      <footer className="w-full py-4 text-center text-xs text-slate-500 z-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-[11px]">
          <span>
            Designed and developed by{' '}
            <a
              href="https://digipresence.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-teal-400 hover:underline"
            >
              DigiPresence Solutions
            </a>
          </span>
          <span className="hidden sm:inline text-slate-700">|</span>
          <a href="tel:+919064435909" className="hover:text-slate-300">
            Call: <strong>9064435909</strong>
          </a>
          <span className="text-slate-700">/</span>
          <a
            href="https://wa.me/919064435909"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline"
          >
            WhatsApp: <strong>9064435909</strong>
          </a>
          <span className="hidden sm:inline text-slate-700">|</span>
          <a href="mailto:contact@digipresence.in" className="text-teal-400 hover:underline">
            Email: <strong>contact@digipresence.in</strong>
          </a>
        </div>
      </footer>
    </div>
  );
}
