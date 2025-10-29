import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui';
import { FilterPanel } from './FilterPanel';
import { OperationDetailPanel } from './OperationDetailPanel';
import { LogisticsOperationsSection } from './LogisticsOperationsSection';
import { TreasuryIntegrationSection } from './TreasuryIntegrationSection';
import { GeneralSummarySection } from './GeneralSummarySection';
import { PlusIcon } from '../../icons/HeroiconsOutline';
import NewMovementModal from './NewMovementModal';
import { LogisticsOperation, DEFAULT_LOGISTICS_FILTERS } from '../../../types/logistics';
import { useDashboardBalances } from '../../../hooks';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';
import { TreasuryBalance, ApiError } from '../../../types';

type ToastState = {
  type: 'success' | 'info';
  message: string;
};

const logisticsOperations: LogisticsOperation[] = [
  {
    id: 'FT-LOG-000345',
    operationCode: 'LOG-ENT-345',
    date: '2025-10-17T14:30:00Z',
    type: 'entrega',
    contact: 'María González',
    route: 'Sede Central → Sucursal Norte',
    status: 'en-curso',
    amount: 5250,
    currency: 'USD',
    responsible: 'Juan Pérez',
    notes:
      'Entrega de documentación legal y efectivo en caja fuerte. El mensajero confirmó salida a las 14:05.',
    timeline: [
      {
        id: '1',
        title: 'Operación registrada',
        description: 'Creada por Ana López',
        date: '2025-10-17T13:45:00Z',
        user: 'Sistema',
        state: 'completed',
      },
      {
        id: '2',
        title: 'En curso',
        description: 'Vehículo FT-03 en tránsito',
        date: '2025-10-17T14:20:00Z',
        user: 'Juan Pérez',
        state: 'current',
      },
      {
        id: '3',
        title: 'Recibida',
        description: 'Pendiente de confirmación',
        date: '2025-10-17T15:10:00Z',
        user: 'Sucursal Norte',
        state: 'upcoming',
      },
    ],
    attachments: [
      { id: '1', name: 'comprobante_entrega.pdf', type: 'pdf', size: '245 KB' },
      { id: '2', name: 'foto_mercaderia.jpg', type: 'image', size: '1.2 MB' },
    ],
  },
  {
    id: 'FT-LOG-000346',
    operationCode: 'LOG-TRF-346',
    date: '2025-10-17T13:15:00Z',
    type: 'transferencia',
    contact: 'Empresa ABC',
    route: 'Bóveda A → Bóveda B',
    status: 'completado',
    amount: 850000,
    currency: 'ARS',
    responsible: 'Ana López',
    notes:
      'Transferencia interna registrada en Tesorería con confirmación de cajero responsable.',
    timeline: [
      {
        id: '1',
        title: 'Operación registrada',
        description: 'Creada por Sistema',
        date: '2025-10-17T12:55:00Z',
        user: 'Sistema',
        state: 'completed',
      },
      {
        id: '2',
        title: 'Traslado en bóveda',
        description: 'Se realizó la compensación física',
        date: '2025-10-17T13:05:00Z',
        user: 'Ana López',
        state: 'completed',
      },
      {
        id: '3',
        title: 'Finalizada',
        description: 'Actualizado en Tesorería',
        date: '2025-10-17T13:15:00Z',
        user: 'Tesorería',
        state: 'completed',
      },
    ],
    attachments: [
      { id: '1', name: 'resumen_movimiento.pdf', type: 'pdf', size: '180 KB' },
    ],
  },
  {
    id: 'FT-LOG-000347',
    operationCode: 'LOG-RET-347',
    date: '2025-10-17T11:45:00Z',
    type: 'retiro',
    contact: 'Carlos Mendoza',
    route: 'Oficina Central → Oficina Principal',
    status: 'pendiente',
    amount: 2100,
    currency: 'USD',
    responsible: 'Luis García',
    notes:
      'Retiro programado para documentación y efectivo. Pendiente de confirmación de retiro.',
    timeline: [
      {
        id: '1',
        title: 'Programado',
        description: 'Agendado para las 12:15',
        date: '2025-10-17T11:45:00Z',
        user: 'Carlos Mendoza',
        state: 'completed',
      },
      {
        id: '2',
        title: 'Listo para retiro',
        description: 'Documentación en mostrador',
        date: '2025-10-17T12:00:00Z',
        user: 'Oficina Central',
        state: 'current',
      },
      {
        id: '3',
        title: 'Retirado',
        description: 'Pendiente de confirmación',
        date: '2025-10-17T12:30:00Z',
        user: 'Luis García',
        state: 'upcoming',
      },
    ],
    attachments: [],
  },
  {
    id: 'FT-LOG-000348',
    operationCode: 'LOG-CUS-348',
    date: '2025-10-17T10:20:00Z',
    type: 'custodia',
    contact: 'Proveedor XYZ',
    route: 'Depósito Av. Belgrano → Bóveda Principal',
    status: 'en-curso',
    amount: 1200000,
    currency: 'ARS',
    responsible: 'María Torres',
    notes:
      'Custodia de valores en tránsito. Vehículo FT-05 con seguimiento activo.',
    timeline: [
      {
        id: '1',
        title: 'Carga completada',
        description: 'Verificado por Proveedor XYZ',
        date: '2025-10-17T09:55:00Z',
        user: 'Proveedor XYZ',
        state: 'completed',
      },
      {
        id: '2',
        title: 'En tránsito',
        description: 'Trayecto monitorizado',
        date: '2025-10-17T10:15:00Z',
        user: 'María Torres',
        state: 'current',
      },
      {
        id: '3',
        title: 'Recepción',
        description: 'Esperando confirmación de bóveda',
        date: '2025-10-17T11:05:00Z',
        user: 'Bóveda Principal',
        state: 'upcoming',
      },
    ],
    attachments: [
      { id: '1', name: 'checklist_seguridad.pdf', type: 'pdf', size: '96 KB' },
    ],
  },
];

interface LogisticsBalanceStripeProps {
  onBalanceClick?: () => void;
  balances: TreasuryBalance[];
  loading: boolean;
  error: ApiError | null;
  refresh: () => Promise<void>;
  mapBalanceToCardData: (balance: TreasuryBalance) => BalanceCardData;
}

const LogisticsBalanceStripe: React.FC<LogisticsBalanceStripeProps> = ({ 
  onBalanceClick, 
  balances, 
  loading, 
  error, 
  refresh, 
  mapBalanceToCardData 
}) => {
  // Subscribe to balance refresh events
  useEffect(() => {
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      refresh().catch(() => {});
    });
    return unsubscribe;
  }, [refresh]);

  return (
    <div id="logistics-balance-stripe" className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40">
      <div className="px-6 py-4">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            balances.map((balance: TreasuryBalance) => (
              <BalanceCard
                key={balance.id}
                data={mapBalanceToCardData(balance)}
                onClick={onBalanceClick}
                onRetry={refresh}
              />
            ))}

          {!loading && error && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCard
                  key={i}
                  data={{
                    id: `error-${i}`,
                    label: 'Balance',
                    amount: 0,
                    currency: 'ARS',
                    status: 'error',
                    updatedAt: new Date().toISOString(),
                  }}
                  onClick={onBalanceClick}
                  onRetry={refresh}
                />
              ))}
            </>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="flex flex-col gap-3 md:gap-4">
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCardSkeleton key={i} />
                ))}
              </>
            )}

            {!loading && !error &&
              balances.map((balance: TreasuryBalance) => (
                <BalanceCard
                  key={balance.id}
                  data={mapBalanceToCardData(balance)}
                  onClick={onBalanceClick}
                  onRetry={refresh}
                />
              ))}

            {!loading && error && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCard
                    key={i}
                    data={{
                      id: `error-${i}`,
                      label: 'Balance',
                      amount: 0,
                      currency: 'ARS',
                      status: 'error',
                      updatedAt: new Date().toISOString(),
                    }}
                    onClick={onBalanceClick}
                    onRetry={refresh}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const LogisticaPanel: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<LogisticsOperation | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Add dashboard balances hook for mobile layout
  const { balances, loading, error, refresh } = useDashboardBalances();



  const handleBalanceClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  // Add mapBalanceToCardData function for mobile layout
  const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => ({
    id: balance.id,
    label: balance.label,
    amount: balance.amount,
    currency: balance.currency,
    status: balance.status as StatusType,
    updatedAt: balance.updatedAt,
  });
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);



  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleFilterToggle = () => {
    setFilterOpen((prev) => !prev);
  };

  const handleBulkAction = () => {
    if (!selectedOperations.length) {
      setToast({ type: 'info', message: 'Seleccioná operaciones antes de ejecutar acciones masivas.' });
      return;
    }
    setToast({ type: 'success', message: 'Acciones masivas aplicadas correctamente.' });
  };

  const handleSelectionChange = (ids: string[]) => {
    setSelectedOperations(ids);
  };

  const handleViewOperation = (operation: LogisticsOperation) => {
    setSelectedOperation(operation);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedOperation(null);
  };

  const handleApplyFilters = (_filters: unknown) => {
    setToast({ type: 'success', message: 'Filtros aplicados correctamente.' });
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setToast({ type: 'info', message: 'Filtros limpiados.' });
  };

  const handleRegisterNewMovement = () => {
    setIsNewMovementModalOpen(true);
  };

  const handleCloseNewMovementModal = () => {
    setIsNewMovementModalOpen(false);
  };

  const filteredOperations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return logisticsOperations;
    }
    return logisticsOperations.filter((operation) => {
      const haystack = [
        operation.id,
        operation.contact,
        operation.route,
        operation.status,
        operation.responsible,
        operation.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [searchTerm]);

  useEffect(() => {
    setSelectedOperations((prev) =>
      prev.filter((operationId) => filteredOperations.some((operation) => operation.id === operationId))
    );
  }, [filteredOperations]);

  const totalOperations = useMemo(() => filteredOperations.length, [filteredOperations]);

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={searchTerm} onSearchChange={handleSearchChange} />
      <LogisticsBalanceStripe 
        onBalanceClick={handleBalanceClick}
        balances={balances}
        loading={loading}
        error={error}
        refresh={refresh}
        mapBalanceToCardData={mapBalanceToCardData}
      />

      <main className="pt-[220px] pb-8 max-w-7xl mx-auto px-4 sm:px-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Logística</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Gestión integral de operaciones logísticas y movimientos de efectivo
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRegisterNewMovement}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Registrar nuevo movimiento logístico
            </button>
          </div>
        </header>

        <GeneralSummarySection 
            metrics={null}
            loading={false}
          />

        <LogisticsOperationsSection
          operations={filteredOperations}
          selectedOperations={selectedOperations}
          onSelectionChange={handleSelectionChange}
          onFilterClick={handleFilterToggle}
          onBulkAction={handleBulkAction}
          onViewOperation={handleViewOperation}
          totalOperations={totalOperations}
          loading={false}
          error={null}
        />

        <TreasuryIntegrationSection />
      </main>

      <FilterPanel
        isOpen={filterOpen}
        filters={DEFAULT_LOGISTICS_FILTERS}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
      />

      <OperationDetailPanel
        isOpen={detailOpen}
        onClose={handleCloseDetail}
        operation={selectedOperation}
      />

      <NewMovementModal isOpen={isNewMovementModalOpen} onClose={handleCloseNewMovementModal} />

      <Footer />

      {toast && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};

export default LogisticaPanel;
