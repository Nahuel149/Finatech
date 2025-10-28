import React, { useState } from 'react';
import { DashboardNavbar } from './Navbar';
import { BalanceStripe } from './BalanceStripe';
import { OperationsHeader } from './OperationsHeader';
import { FlowShortcuts } from './FlowShortcuts';
import { RecentValidations } from './RecentValidations';
import { RecentOperationsTable } from './RecentOperationsTable';
import { DashboardFooter } from './Footer';
import { TransferPesosModal } from './TransferPesosModal';
export const DashboardOperacionesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [transferOpen, setTransferOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      {/* Main container (offset for fixed navbar + stripe) */}
      <main
        id="main-container"
        className="flex-grow pt-[145px] px-6 pb-8"
      >
        {/* Header */}
        <OperationsHeader onTransferPesos={() => setTransferOpen(true)} />

        {/* Shortcut cards */}
        <FlowShortcuts />

        {/* Validations */}
        <RecentValidations />

        {/* Recent operations table */}
        <RecentOperationsTable search={search} />

        {/* Placeholder sections to keep 1:1 structure */}
        <section id="system-status" className="mb-8" />
        <section id="quick-actions" className="mb-8" />
        <section id="market-info" className="mb-8" />
        <section id="activity-timeline" className="mb-8" />
        <section id="performance-metrics" className="mb-8" />
      </main>

      <DashboardFooter />

      {/* Transfer pesos modal */}
      <TransferPesosModal open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  );
};
