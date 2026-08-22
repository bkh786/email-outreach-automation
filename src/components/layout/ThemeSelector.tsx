'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Palette, Check } from 'lucide-react';
import { useTheme, AccentColor, Mode } from '@/lib/store/theme-context';

export default function ThemeSelector() {
  const { mode, accent, setMode, setAccent, toggleMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const colorThemes: { key: AccentColor; label: string; bg: string; dot: string }[] = [
    { key: 'teal', label: 'Teal & Emerald', bg: 'bg-teal-500', dot: '#0D9488' },
    { key: 'cyan', label: 'Electric Cyan', bg: 'bg-cyan-500', dot: '#06B6D4' },
    { key: 'blue', label: 'Ocean Blue', bg: 'bg-blue-600', dot: '#2563EB' },
    { key: 'amber', label: 'Sunset Amber', bg: 'bg-amber-500', dot: '#D97706' },
    { key: 'purple', label: 'Indigo Royale', bg: 'bg-purple-600', dot: '#7C3AED' },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700">
        {/* Quick Light/Dark Toggle */}
        <button
          onClick={toggleMode}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
          title={`Switch to ${mode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {mode === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-700" />
          )}
        </button>

        {/* Palette Dropdown Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
          title="Change Color Theme"
        >
          <Palette className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
        </button>
      </div>

      {/* Theme Picker Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 p-3 rounded-2xl bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 text-xs">
          <p className="font-bold text-slate-900 dark:text-white mb-2 px-1 text-[11px] uppercase tracking-wider">
            Appearance Mode
          </p>

          {/* Mode Switcher Buttons */}
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => setMode('light')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold border transition-all ${
                mode === 'light'
                  ? 'bg-teal-50 dark:bg-slate-800 text-teal-700 dark:text-cyan-400 border-teal-300 dark:border-cyan-500/40 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>

            <button
              onClick={() => setMode('dark')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold border transition-all ${
                mode === 'dark'
                  ? 'bg-slate-800 text-cyan-400 border-cyan-500/40 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
          </div>

          <p className="font-bold text-slate-900 dark:text-white mb-2 px-1 text-[11px] uppercase tracking-wider border-t border-slate-100 dark:border-slate-800 pt-2.5">
            Accent Color Theme
          </p>

          {/* Color Palettes */}
          <div className="space-y-1">
            {colorThemes.map((c) => (
              <button
                key={c.key}
                onClick={() => {
                  setAccent(c.key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left font-medium transition-colors ${
                  accent === c.key
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${c.bg}`} />
                  <span>{c.label}</span>
                </div>
                {accent === c.key && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
