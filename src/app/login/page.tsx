'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
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
        // Full navigation ensures middleware and cookies sync across SSR immediately
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
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#0F172A]/95 border border-slate-800 rounded-3xl p-8 sm:p-10 shadow-2xl relative z-10 backdrop-blur-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-500 p-[2px] mx-auto shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-[#0B1120] rounded-[14px] flex items-center justify-center">
              <Plane className="w-6 h-6 text-cyan-400 rotate-[-15deg]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-1">
            <h1 className="text-2xl font-black text-white tracking-tight">FreightPulse</h1>
            <span className="text-xs uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950">AI</span>
          </div>
          <p className="text-xs text-slate-400">Autonomous B2B Lead Intelligence for Freight Forwarders</p>
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
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Work Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">Password</label>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#0B1120] border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Enterprise Notice */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400/70" />
            <span>Private Enterprise Portal &bull; Client Access by Invitation Only</span>
          </div>
        </div>
      </div>
    </div>
  );
}
