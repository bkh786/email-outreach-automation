'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/store/theme-context';

export default function ThemeSelector() {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center shadow-sm"
      title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle Dark/Light Mode"
    >
      {mode === 'dark' ? (
        <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 hover:rotate-12 transition-transform" />
      )}
    </button>
  );
}
