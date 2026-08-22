'use client';

import React from 'react';
import { Phone, Mail, MessageCircle, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#080D18]/90 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-400 select-none z-20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] sm:text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span>Designed and developed by</span>
          <a
            href="https://digipresence.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            DigiPresence Solutions
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-slate-400">
          <span className="hidden sm:inline text-slate-700">|</span>
          <a
            href="tel:+919064435909"
            className="flex items-center gap-1 hover:text-slate-200 transition-colors"
          >
            <Phone className="w-3 h-3 text-cyan-400" />
            <span>Call: <strong className="text-slate-300">9064435909</strong></span>
          </a>

          <span className="text-slate-700">/</span>

          <a
            href="https://wa.me/919064435909"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle className="w-3 h-3" />
            <span>WhatsApp: <strong>9064435909</strong></span>
          </a>

          <span className="hidden sm:inline text-slate-700">|</span>

          <a
            href="mailto:contact@digipresence.in"
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <Mail className="w-3 h-3" />
            <span>Email: <strong>contact@digipresence.in</strong></span>
          </a>
        </div>
      </div>
    </footer>
  );
}
