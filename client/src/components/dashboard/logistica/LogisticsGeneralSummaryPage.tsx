import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { LogisticsGeneralSummaryHeader } from './LogisticsGeneralSummaryHeader';
import { LogisticsSummaryStatsSection } from './LogisticsSummaryStatsSection';
import { LogisticsRecentMovementsSection } from './LogisticsRecentMovementsSection';
import { LogisticsActiveIncidentsSection } from './LogisticsActiveIncidentsSection';
import { LogisticsQuickActionsSection } from './LogisticsQuickActionsSection';
import { Footer } from '../operaciones/Footer';

interface MovementData {
  id: string;
  date: string;
  type: 'Entrega' | 'Recogida' | 'Transferencia' | 'Devolución';
  origin: string;
  destination: string;
  client: string;
  driver: string;
  status: 'Completado' | 'En tránsito' | 'Pendiente' | 'Cancelado' | 'Con incidencia';
  value: number;
  estimatedTime: string;
  actualTime?: string;
  hasIncident: boolean;
  incidentId?: string;
  notes?: string;
}

interface SummaryStats {
  totalMovements: number;
  pendingMovements: number;
  completedMovements: number;
  totalValue: number;
  activeIncidents: number;
  resolvedIncidents: number;
}

export const LogisticsGeneralSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedMovement, setSelectedMovement] = useState<MovementData | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Mock data for summary statistics
  const summaryStats: SummaryStats = {
    totalMovements: 1247,
    pendingMovements: 23,
    completedMovements: 1224,
    totalValue: 2847650,
    activeIncidents: 3,
    resolvedIncidents: 47
  };

  const movements: MovementData[] = useMemo(
    () => [
      {
        id: 'MOV-2024-001',
        date: '2024-01-15T13:30:00Z',
        type: 'Entrega',
        origin: 'Centro de Distribución CABA',
        destination: 'Sucursal Rosario',
        client: 'Juan Pérez',
        driver: 'María García',
        status: 'En tránsito',
        value: 125000,
        estimatedTime: '02:45',
        hasIncident: false,
        notes: 'Entrega programada para el mediodía.'
      },
      {
        id: 'MOV-2024-002',
        date: '2024-01-14T09:15:00Z',
        type: 'Recogida',
        origin: 'Sucursal Córdoba',
        destination: 'Centro de Distribución CABA',
        client: 'Ana López',
        driver: 'Carlos Rodríguez',
        status: 'Completado',
        value: 89500,
        estimatedTime: '03:10',
        actualTime: '03:05',
        hasIncident: false,
        notes: 'Mercadería consolidada sin novedades.'
      },
      {
        id: 'MOV-2024-003',
        date: '2024-01-13T16:00:00Z',
        type: 'Transferencia',
        origin: 'Depósito Norte',
        destination: 'Depósito Sur',
        client: 'Roberto Silva',
        driver: 'Laura Martínez',
        status: 'Pendiente',
        value: 67800,
        estimatedTime: '01:50',
        hasIncident: true,
        incidentId: 'INC-2024-045',
        notes: 'Requiere confirmación de disponibilidad en destino.'
      }
    ],
    []
  );

  const handleMovementClick = (movementId: string) => {
    const movement = movements.find(item => item.id === movementId);
    if (movement) {
      setSelectedMovement(movement);
      setIsDetailPanelOpen(true);
    }
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedMovement(null);
  };

  const handleNavigateToMovementDetail = (movementId: string) => {
    navigate(`/dashboard/logistica/movimiento/${movementId}`);
  };

  const handleNavigateToIncidentDetail = (incidentId: string) => {
    navigate(`/dashboard/logistica/incidencia/${incidentId}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />
      
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <LogisticsGeneralSummaryHeader />
        
        <div className="space-y-6">
          {/* Summary Statistics Section */}
          <LogisticsSummaryStatsSection stats={summaryStats} />
          
          {/* Quick Actions Section */}
          <LogisticsQuickActionsSection />
          
          {/* Active Incidents Section */}
          <LogisticsActiveIncidentsSection 
            onIncidentClick={handleNavigateToIncidentDetail}
          />
          
          {/* Recent Movements Section */}
          <LogisticsRecentMovementsSection
            movements={movements}
            onMovementClick={handleMovementClick}
            onIncidentClick={handleNavigateToIncidentDetail}
          />
        </div>
      </div>

      {/* Movement Detail Side Panel */}
      {isDetailPanelOpen && selectedMovement && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div 
              className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={handleCloseDetailPanel}
            />
            <section className="absolute right-0 flex h-full w-full max-w-md flex-col overflow-y-scroll bg-white py-6 shadow-xl">
              <div className="px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Detalle del Movimiento
                  </h2>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={handleCloseDetailPanel}
                  >
                    <span className="sr-only">Cerrar panel</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="relative mt-6 flex-1 px-4 sm:px-6">
                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">ID de movimiento</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{selectedMovement.id}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.type}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          selectedMovement.status === 'Completado'
                            ? 'bg-green-100 text-green-800'
                            : selectedMovement.status === 'En tránsito'
                            ? 'bg-blue-100 text-blue-800'
                            : selectedMovement.status === 'Pendiente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : selectedMovement.status === 'Con incidencia'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {selectedMovement.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.client}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Conductor asignado</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.driver}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Origen</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.origin}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Destino</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.destination}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Fecha programada</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatDateTime(selectedMovement.date)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tiempo estimado</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.estimatedTime}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Tiempo real</h3>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedMovement.actualTime ?? 'En curso'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Valor declarado</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {formatCurrency(selectedMovement.value)}
                    </p>
                  </div>

                  {selectedMovement.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Observaciones</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedMovement.notes}</p>
                    </div>
                  )}

                  {selectedMovement.hasIncident && selectedMovement.incidentId && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-red-800">Incidencia asociada</h4>
                          <p className="mt-1 text-sm text-red-700">
                            Se detectó una incidencia vinculada a este movimiento.
                          </p>
                        </div>
                        <button
                          onClick={() => handleNavigateToIncidentDetail(selectedMovement.incidentId!)}
                          className="inline-flex items-center rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Ver incidencia
                        </button>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleNavigateToMovementDetail(selectedMovement.id)}
                    className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                  >
                    Ver detalle completo
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};
