'use client';

import React, { useState, useMemo } from 'react';
import { 
  Eye, 
  Code, 
  Smartphone, 
  Monitor, 
  SlidersHorizontal, 
  Tags, 
  UserCheck, 
  RotateCcw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { buildEmailDocument, DEFAULT_SAMPLE_DATA } from '@/lib/email-formatter';

interface HtmlEmailPreviewProps {
  content: string;
  sampleData?: Record<string, string>;
  title?: string;
  minHeight?: string;
  allowToggleView?: boolean;
  allowVariableControls?: boolean;
}

export function HtmlEmailPreview({
  content,
  sampleData = DEFAULT_SAMPLE_DATA,
  title = 'Email Preview',
  minHeight = '420px',
  allowToggleView = true,
  allowVariableControls = true,
}: HtmlEmailPreviewProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [viewSource, setViewSource] = useState(false);
  const [variableMode, setVariableMode] = useState<'sample' | 'tokens'>('sample');
  const [showVariableCustomizer, setShowVariableCustomizer] = useState(false);

  // Editable sample variables
  const [customVars, setCustomVars] = useState<Record<string, string>>({
    name: sampleData?.name || DEFAULT_SAMPLE_DATA.name,
    business_name: sampleData?.business_name || DEFAULT_SAMPLE_DATA.business_name,
    login_email: sampleData?.login_email || DEFAULT_SAMPLE_DATA.login_email,
    temporary_password: sampleData?.temporary_password || DEFAULT_SAMPLE_DATA.temporary_password,
    contact_number: sampleData?.contact_number || DEFAULT_SAMPLE_DATA.contact_number,
    login_url: sampleData?.login_url || DEFAULT_SAMPLE_DATA.login_url,
  });

  const activeSampleData = useMemo(() => {
    return {
      name: customVars.name,
      contact_person: customVars.name,
      business_name: customVars.business_name,
      company_name: customVars.business_name,
      login_email: customVars.login_email,
      email: customVars.login_email,
      temporary_password: customVars.temporary_password,
      password: customVars.temporary_password,
      contact_number: customVars.contact_number,
      phone: customVars.contact_number,
      login_url: customVars.login_url,
    };
  }, [customVars]);

  const fullHtml = useMemo(() => {
    if (variableMode === 'tokens') {
      return buildEmailDocument(content, null, true);
    }
    return buildEmailDocument(content, activeSampleData, false);
  }, [content, activeSampleData, variableMode]);

  const handleResetVars = () => {
    setCustomVars({
      name: DEFAULT_SAMPLE_DATA.name,
      business_name: DEFAULT_SAMPLE_DATA.business_name,
      login_email: DEFAULT_SAMPLE_DATA.login_email,
      temporary_password: DEFAULT_SAMPLE_DATA.temporary_password,
      contact_number: DEFAULT_SAMPLE_DATA.contact_number,
      login_url: DEFAULT_SAMPLE_DATA.login_url,
    });
  };

  return (
    <div className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070C16] overflow-hidden shadow-inner flex flex-col transition-all">
      {/* Top Preview Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {viewSource ? 'Raw Source Preview' : 'Interactive HTML Rendering'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-50 dark:bg-cyan-500/10 text-teal-700 dark:text-cyan-400 border border-teal-200 dark:border-cyan-500/20 font-mono font-medium hidden sm:inline-block">
            {variableMode === 'sample' ? 'Sample Data Substituted' : 'Raw Tokens Highlighted'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Variable Mode Switch: Sample Values vs Raw Tokens */}
          {allowVariableControls && !viewSource && (
            <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-300/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setVariableMode('sample')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  variableMode === 'sample'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Preview with sample client tenant data"
              >
                <UserCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Sample Values</span>
              </button>
              <button
                type="button"
                onClick={() => setVariableMode('tokens')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                  variableMode === 'tokens'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View dynamic placeholder tokens (e.g. {{name}}, {{login_email}})"
              >
                <Tags className="w-3 h-3" />
                <span className="hidden sm:inline">Raw Tags {'{{...}}'}</span>
              </button>
            </div>
          )}

          {/* Customize Variables Button */}
          {allowVariableControls && !viewSource && variableMode === 'sample' && (
            <button
              type="button"
              onClick={() => setShowVariableCustomizer(!showVariableCustomizer)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                showVariableCustomizer
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Customize test tenant variables for preview"
            >
              <SlidersHorizontal className="w-3 h-3" />
              <span>Test Values</span>
              {showVariableCustomizer ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
            </button>
          )}

          {/* Device viewport toggle */}
          <div className="inline-flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 border border-slate-300/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all ${
                deviceMode === 'desktop'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-cyan-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Desktop View (Full width)"
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Mobile View (390px phone container)"
            >
              <Smartphone className="w-3 h-3" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Visual / Code Toggle */}
          {allowToggleView && (
            <button
              type="button"
              onClick={() => setViewSource(!viewSource)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-all ${
                viewSource
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
              }`}
              title="Toggle between HTML Render and Raw Code"
            >
              {viewSource ? <Eye className="w-3 h-3 text-teal-400" /> : <Code className="w-3 h-3 text-teal-600 dark:text-cyan-400" />}
              <span>{viewSource ? 'Visual View' : 'HTML Code'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Variable Customizer Bar */}
      {showVariableCustomizer && !viewSource && (
        <div className="p-3.5 bg-slate-200/90 dark:bg-slate-900/90 border-b border-slate-300 dark:border-slate-800 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Info className="w-3.5 h-3.5 text-teal-600 dark:text-cyan-400" />
              <span>Simulated Tenant Test Variables (Changes reflect immediately in the Live Preview below):</span>
            </div>
            <button
              type="button"
              onClick={handleResetVars}
              className="flex items-center gap-1 text-[11px] text-teal-600 dark:text-cyan-400 hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Values</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{name}}'} (Contact Person)
              </label>
              <input
                type="text"
                value={customVars.name}
                onChange={(e) => setCustomVars(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{business_name}}'} (Tenant Company)
              </label>
              <input
                type="text"
                value={customVars.business_name}
                onChange={(e) => setCustomVars(prev => ({ ...prev, business_name: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{login_email}}'} (Login Email)
              </label>
              <input
                type="text"
                value={customVars.login_email}
                onChange={(e) => setCustomVars(prev => ({ ...prev, login_email: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{temporary_password}}'} (Password)
              </label>
              <input
                type="text"
                value={customVars.temporary_password}
                onChange={(e) => setCustomVars(prev => ({ ...prev, temporary_password: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{contact_number}}'} (Phone)
              </label>
              <input
                type="text"
                value={customVars.contact_number}
                onChange={(e) => setCustomVars(prev => ({ ...prev, contact_number: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                {'{{login_url}}'} (Login Link)
              </label>
              <input
                type="text"
                value={customVars.login_url}
                onChange={(e) => setCustomVars(prev => ({ ...prev, login_url: e.target.value }))}
                className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Content Area */}
      <div className="w-full flex-1 flex justify-center p-3 sm:p-5 overflow-auto bg-slate-200/60 dark:bg-slate-950/80">
        <div
          className={`transition-all duration-300 bg-white rounded-xl shadow-md overflow-hidden border border-slate-200 ${
            deviceMode === 'mobile'
              ? 'w-full max-w-[390px] min-h-[480px] border-4 border-slate-800 rounded-3xl'
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
              style={{ minHeight, display: 'block', width: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
