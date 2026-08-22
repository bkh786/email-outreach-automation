'use client';

import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#080D18]/90 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-600 dark:text-slate-400 select-none z-20 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs">
        {/* Email Outreach Automation Prefix & DigiPresence Attribution */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="font-extrabold text-slate-900 dark:text-white tracking-tight">
            Email Outreach Automation
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="text-slate-500 dark:text-slate-400">Designed and developed by</span>
          <a
            href="https://digipresence.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-teal-600 dark:text-cyan-400 hover:underline transition-colors"
          >
            DigiPresence Solutions
          </a>
        </div>

        {/* Contact Numbers, WhatsApp, & Email */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-600 dark:text-slate-400">
          <span className="hidden md:inline text-slate-300 dark:text-slate-700">|</span>
          <a
            href="tel:+919064435909"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <Phone className="w-3 h-3 text-teal-600 dark:text-cyan-400" />
            <span>Call: <strong className="text-slate-800 dark:text-slate-300">9064435909</strong></span>
          </a>

          <span className="text-slate-300 dark:text-slate-700">/</span>

          <a
            href="https://wa.me/919064435909"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp: <strong>9064435909</strong></span>
          </a>

          <span className="hidden sm:inline text-slate-300 dark:text-slate-700">|</span>

          <a
            href="mailto:contact@digipresence.in"
            className="flex items-center gap-1 text-teal-600 dark:text-cyan-400 hover:underline transition-colors"
          >
            <Mail className="w-3 h-3" />
            <span>Email: <strong>contact@digipresence.in</strong></span>
          </a>
        </div>
      </div>
    </footer>
  );
}
