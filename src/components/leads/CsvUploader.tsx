'use client';

import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  Sparkles,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { Lead } from '@/lib/types';

interface CsvUploaderProps {
  onImportLeads: (leads: Partial<Lead>[]) => void;
  onClose?: () => void;
}

export default function CsvUploader({ onImportLeads, onClose }: CsvUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    country: '',
    website_url: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sampleCsvData = `Company Name,Contact Person,Email,Phone,Website,Country
Pacific Ocean Freightways,David Miller,david@pacificoceanfreight.com,+1 (206) 555-0199,https://pacificoceanfreight.com,United States
Hamburg Cargo Logistics GmbH,Stefan Müller,s.mueller@hamburgcargo.de,+49 40 334455,https://hamburgcargo.de,Germany
Shanghai Trans-Air Express,Lin Wei,lin.wei@shanghai-transair.cn,+86 21 6889 0012,https://shanghai-transair.cn,China
Dubai Trade & Ocean Services,Rashid Al-Nuaimi,rashid@dubaitradeocean.ae,+971 4 332 9901,https://dubaitradeocean.ae,United Arab Emirates
Rotterdam Port Forwarders BV,Jan de Vries,jan@rotterdamforwarders.nl,+31 10 498 7654,https://rotterdamforwarders.nl,Netherlands`;

  const downloadSampleCsv = () => {
    const blob = new Blob([sampleCsvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'freight_leads_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const autoMapHeaders = (detectedHeaders: string[]) => {
    const mapping = {
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      country: '',
      website_url: '',
    };

    detectedHeaders.forEach((h) => {
      const lower = h.toLowerCase().trim().replace(/[-_ ]/g, '');
      if (lower.includes('company') || lower.includes('organization') || lower.includes('shipper') || lower.includes('name') && !lower.includes('contact') && !lower.includes('person')) {
        if (!mapping.company_name) mapping.company_name = h;
      }
      if (lower.includes('contact') || lower.includes('person') || lower.includes('fullname') || lower.includes('representative')) {
        mapping.contact_person = h;
      }
      if (lower.includes('email') || lower.includes('mail')) {
        mapping.email = h;
      }
      if (lower.includes('phone') || lower.includes('mobile') || lower.includes('tel') || lower.includes('contactno')) {
        mapping.phone = h;
      }
      if (lower.includes('country') || lower.includes('nation') || lower.includes('region') || lower.includes('location')) {
        mapping.country = h;
      }
      if (lower.includes('website') || lower.includes('url') || lower.includes('domain') || lower.includes('web')) {
        mapping.website_url = h;
      }
    });

    setColumnMap(mapping);
  };

  const handleFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsProcessing(true);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonRows: any[] = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });

          if (jsonRows.length === 0) {
            setError('The uploaded Excel file contains no data rows.');
            setIsProcessing(false);
            return;
          }

          const detectedHeaders = Object.keys(jsonRows[0]);
          setHeaders(detectedHeaders);
          setRawRows(jsonRows);
          autoMapHeaders(detectedHeaders);
          setIsProcessing(false);
        } catch (err: any) {
          setError(`Failed to parse Excel: ${err.message}`);
          setIsProcessing(false);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            setError('The CSV file is empty or could not be parsed.');
            setIsProcessing(false);
            return;
          }
          const detectedHeaders = results.meta.fields || Object.keys(results.data[0] as any);
          setHeaders(detectedHeaders);
          setRawRows(results.data);
          autoMapHeaders(detectedHeaders);
          setIsProcessing(false);
        },
        error: (err) => {
          setError(`CSV parse error: ${err.message}`);
          setIsProcessing(false);
        },
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (!columnMap.company_name && !columnMap.email) {
      setError('Please map at least the Company Name or Email column.');
      return;
    }

    const formatted: Partial<Lead>[] = rawRows.map((row) => ({
      company_name: (columnMap.company_name ? String(row[columnMap.company_name]) : '').trim() || 'Unnamed Logistics Lead',
      contact_person: columnMap.contact_person ? String(row[columnMap.contact_person]).trim() : undefined,
      email: (columnMap.email ? String(row[columnMap.email]) : '').trim() || 'info@prospect.com',
      phone: columnMap.phone ? String(row[columnMap.phone]).trim() : undefined,
      country: columnMap.country ? String(row[columnMap.country]).trim() : 'International',
      website_url: columnMap.website_url ? String(row[columnMap.website_url]).trim() : undefined,
      source: 'csv_import',
    })).filter(lead => lead.company_name && lead.email);

    if (formatted.length === 0) {
      setError('No valid leads could be extracted based on your column mapping.');
      return;
    }

    onImportLeads(formatted);
    if (onClose) onClose();
  };

  return (
    <div className="rounded-3xl p-6 sm:p-8 bg-[#0F172A] border border-cyan-500/30 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Bulk Lead Ingestion Wizard</h3>
            <p className="text-xs text-slate-400">Upload your logistics prospect database (.csv or .xlsx) for autonomous AI enrichment</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Sample CSV</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {!rawRows.length ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
              : 'border-slate-700/80 hover:border-cyan-500/50 bg-[#0B1120]/60 hover:bg-[#0B1120]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-4 border border-cyan-500/20 shadow-inner">
            <FileSpreadsheet className="w-8 h-8" />
          </div>

          <p className="text-base font-bold text-white">
            Click to upload or drag & drop spreadsheet
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Supports CSV, XLSX, XLS with automatic header detection (Company Name, Contact, Email, Phone, Website, Country)
          </p>

          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700">
            <span>Supports JCtrans exports, LinkedIn Sales Nav CSVs, customs manifests</span>
          </div>
        </div>
      ) : (
        /* Column Mapping & Preview Section */
        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm font-bold text-white">{fileName}</p>
                <p className="text-xs text-slate-400">{rawRows.length} prospects detected in file</p>
              </div>
            </div>

            <button
              onClick={() => {
                setRawRows([]);
                setFileName(null);
                setHeaders([]);
              }}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Choose Different File</span>
            </button>
          </div>

          {/* Column Mapping Selectors */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Verify Field Mapping
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { key: 'company_name', label: 'Company Name *', required: true },
                { key: 'contact_person', label: 'Contact Person', required: false },
                { key: 'email', label: 'Email Address *', required: true },
                { key: 'country', label: 'Country / Corridor', required: false },
                { key: 'website_url', label: 'Website URL (for AI Scraper)', required: false },
                { key: 'phone', label: 'Phone Number', required: false },
              ].map((field) => (
                <div key={field.key} className="p-3 rounded-xl bg-[#0B1120] border border-slate-800">
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {field.label}
                  </label>
                  <select
                    value={(columnMap as any)[field.key] || ''}
                    onChange={(e) => setColumnMap({ ...columnMap, [field.key]: e.target.value })}
                    className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="">-- Select Column --</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table (First 3 rows) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Data Preview (First 3 Rows)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0B1120]/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Company</th>
                    <th className="py-2.5 px-4">Contact</th>
                    <th className="py-2.5 px-4">Email</th>
                    <th className="py-2.5 px-4">Country</th>
                    <th className="py-2.5 px-4">Website</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {rawRows.slice(0, 3).map((row, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-4 font-semibold text-white">
                        {columnMap.company_name ? row[columnMap.company_name] || '-' : '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        {columnMap.contact_person ? row[columnMap.contact_person] || '-' : '-'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-cyan-400">
                        {columnMap.email ? row[columnMap.email] || '-' : '-'}
                      </td>
                      <td className="py-2.5 px-4">
                        {columnMap.country ? row[columnMap.country] || '-' : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 truncate max-w-[150px]">
                        {columnMap.website_url ? row[columnMap.website_url] || '-' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleConfirmImport}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Confirm & Ingest {rawRows.length} Leads</span>
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
