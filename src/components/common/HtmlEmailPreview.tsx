'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Eye, Code, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { buildEmailDocument } from '@/lib/email-formatter';

interface HtmlEmailPreviewProps {
  content: string;
  sampleData?: Record<string, string>;
  title?: string;
  minHeight?: string;
  allowToggleView?: boolean;
}

export function HtmlEmailPreview({
  content,
  sampleData,
  title = 'Email Preview',
  minHeight = '360px',
  allowToggleView = true,
}: HtmlEmailPreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [viewSource, setViewSource] = useState(false);

  const fullHtml = useMemo(() => {
    return buildEmailDocument(content, sampleData);
  }, [content, sampleData]);

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070C16] overflow-hidden shadow-inner flex flex-col transition-all">
      {/* Top Preview Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="font-bold text-slate-700 dark:text-slate-300">
            {viewSource ? 'Raw Source Preview' : 'Interactive HTML Rendering'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20 font-mono font-medium">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Device viewport toggle */}
          <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 border border-slate-300 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Desktop View (100% width)"
            >
              <Monitor className="w-3 h-3" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceMode === 'mobile'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
              title="Mobile View (375px simulated)"
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {allowToggleView && (
            <button
              type="button"
              onClick={() => setViewSource(!viewSource)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                viewSource
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Toggle between HTML Render and Raw Code"
            >
              {viewSource ? <Eye className="w-3 h-3 text-teal-400" /> : <Code className="w-3 h-3 text-teal-600 dark:text-cyan-400" />}
              <span>{viewSource ? 'Visual View' : 'HTML Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="w-full flex-1 flex justify-center p-3 sm:p-5 overflow-auto bg-slate-200/60 dark:bg-slate-950/80">
        <div
          className={`transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[390px] min-h-[460px] border-4 border-slate-800 rounded-3xl'
              : 'w-full max-w-3xl'
          }`}
          style={{ minHeight }}
        >
          {viewSource ? (
            <pre className="p-4 text-xs font-mono bg-slate-900 text-emerald-400 overflow-x-auto whitespace-pre-wrap selection:bg-teal-700 h-full leading-relaxed">
              <code>{content || '<!-- Template is currently blank -->'}</code>
            </pre>
          ) : (
            <iframe
              title={title}
              srcDoc={fullHtml}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              className="w-full h-full border-0 bg-white"
              style={{ minHeight, display: 'block' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
