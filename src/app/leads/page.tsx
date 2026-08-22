'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import LeadTable from '@/components/leads/LeadTable';
import CsvUploader from '@/components/leads/CsvUploader';
import LeadDrawer from '@/components/leads/LeadDrawer';
import ManualLeadModal from '@/components/leads/ManualLeadModal';
import { useApp } from '@/lib/store/app-context';
import { Users } from 'lucide-react';

function LeadsContent() {
  const searchParams = useSearchParams();
  const { addLeads, leads } = useApp();

  const [isUploaderOpen, setIsUploaderOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery && leads.some(l => l.id === idFromQuery)) {
      setActiveLeadId(idFromQuery);
    }
  }, [searchParams, leads]);

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header - Fully visible in both Light and Dark mode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600 dark:text-cyan-400" />
            <span>Lead Intelligence &amp; Outreach Manager</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Ingest logistics prospect lists, execute AI web crawling, and manage high-synergy cold email campaigns.
          </p>
        </div>
      </div>

      {/* Conditional Bulk Uploader Modal/Section */}
      {isUploaderOpen && (
        <CsvUploader
          onImportLeads={(newLeads) => {
            addLeads(newLeads);
            setIsUploaderOpen(false);
          }}
          onClose={() => setIsUploaderOpen(false)}
        />
      )}

      {/* Manual Lead Modal */}
      <ManualLeadModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onAddLead={(lead) => addLeads([lead])}
      />

      {/* Main Interactive Table Grid */}
      <LeadTable
        onSelectLead={(id) => setActiveLeadId(id)}
        onOpenUploader={() => setIsUploaderOpen(true)}
        onOpenManualAdd={() => setIsManualModalOpen(true)}
      />

      {/* Sliding Lead Detail & Email Editor Drawer */}
      <LeadDrawer
        leadId={activeLeadId}
        onClose={() => setActiveLeadId(null)}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading Lead Intelligence...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
