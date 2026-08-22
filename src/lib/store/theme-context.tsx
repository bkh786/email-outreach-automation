'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Mode = 'light' | 'dark';
export type AccentColor = 'teal' | 'cyan' | 'blue' | 'amber' | 'purple';

interface ThemeContextType {
  mode: Mode;
  accent: AccentColor;
  setMode: (mode: Mode) => void;
  setAccent: (accent: AccentColor) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('light'); // Default to light mode as requested!
  const [accent, setAccentState] = useState<AccentColor>('teal');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedMode = localStorage.getItem('freightpulse_mode') as Mode;
    const savedAccent = localStorage.getItem('freightpulse_accent') as AccentColor;

    if (savedMode) {
      setModeState(savedMode);
    } else {
      setModeState('light');
    }

    if (savedAccent) {
      setAccentState(savedAccent);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Toggle dark/light class
    if (mode === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    // Set data-accent attribute
    root.setAttribute('data-accent', accent);
    root.setAttribute('data-mode', mode);

    localStorage.setItem('freightpulse_mode', mode);
    localStorage.setItem('freightpulse_accent', accent);
  }, [mode, accent, mounted]);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
  };

  const setAccent = (newAccent: AccentColor) => {
    setAccentState(newAccent);
  };

  const toggleMode = () => {
    setModeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ mode, accent, setMode, setAccent, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
