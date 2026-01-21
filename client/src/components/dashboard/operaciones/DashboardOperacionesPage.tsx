import React, { Suspense, useEffect, useRef, useState } from 'react';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { OperationsHeader } from './OperationsHeader';
import { FlowShortcuts } from './FlowShortcuts';
import { RecentValidations } from './RecentValidations';
import { RecentOperationsTable } from './RecentOperationsTable';
import { DashboardFooter } from './Footer';
const TransferPesosModal = React.lazy(() =>
  import('./TransferPesosModal').then((module) => ({ default: module.TransferPesosModal }))
);
const OperationsReportPanel = React.lazy(() =>
  import('./OperationsReportPanel').then((module) => ({ default: module.OperationsReportPanel }))
);
export const DashboardOperacionesPage: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchDebounceRef = useRef<number | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchInput]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={searchInput} onSearchChange={setSearchInput} />
      <BalanceStripe />

      {/* Main container (offset for fixed navbar + stripe) */}
      <main
        id="main-container"
        className="flex-grow pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-8"
      >
        {/* Header */}
        <OperationsHeader
          onTransferPesos={() => setTransferOpen(true)}
          onOpenReport={() => setReportOpen(true)}
        />

        {/* Shortcut cards */}
        <FlowShortcuts />

        {/* Validations */}
        <RecentValidations />

        {/* Recent operations table */}
        <div className="mt-8">
          <RecentOperationsTable search={debouncedSearch} />
        </div>

        {/* Placeholder sections to keep 1:1 structure */}
        <section id="system-status" className="mb-8" />
        <section id="quick-actions" className="mb-8" />
        <section id="market-info" className="mb-8" />
        <section id="activity-timeline" className="mb-8" />
        <section id="performance-metrics" className="mb-8" />
      </main>

      <DashboardFooter />

      {/* Transfer pesos modal */}
      <Suspense fallback={null}>
        <TransferPesosModal open={transferOpen} onClose={() => setTransferOpen(false)} />
        <OperationsReportPanel open={reportOpen} onClose={() => setReportOpen(false)} />
      </Suspense>
    </div>
  );
};
