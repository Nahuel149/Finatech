import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { LogisticsGeneralSummaryHeader } from './LogisticsGeneralSummaryHeader';
import { LogisticsSummaryStatsSection } from './LogisticsSummaryStatsSection';
import { LogisticsRecentMovementsSection } from './LogisticsRecentMovementsSection';
import { LogisticsActiveIncidentsSection } from './LogisticsActiveIncidentsSection';
import { LogisticsQuickActionsSection } from './LogisticsQuickActionsSection';
import { Footer } from '../operaciones/Footer';
import { useLogisticsIncidents } from '../../../hooks/dashboard/useLogisticsIncidents';
import { useLogisticsOperations } from '../../../hooks/dashboard/useLogisticsOperations';
import { LogisticsIncident, LogisticsOperation, OperationStatus, OperationType } from '../../../types/logistics';
import { Alert } from '../../ui/Alert';

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

const mapOperationType = (type: OperationType): MovementData['type'] => {
  switch (type) {
    case 'transferencia':
      return 'Transferencia';
    case 'retiro':
      return 'Recogida';
    case 'custodia':
      return 'Devolución';
    default:
      return 'Entrega';
  }
};

const mapOperationStatus = (status: OperationStatus): MovementData['status'] => {
  switch (status) {
    case 'completado':
      return 'Completado';
    case 'en-curso':
      return 'En tránsito';
    case 'anulado':
      return 'Cancelado';
    default:
      return 'Pendiente';
  }
};

export const LogisticsGeneralSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedMovementId, setSelectedMovementId] = useState<string | null>(null);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  const { operations, error, pagination } = useLogisticsOperations();
  const {
    incidents: activeIncidents,
    loading: incidentsLoading,
    error: incidentsError,
  } = useLogisticsIncidents({ status: 'en-proceso', limit: 10 });
  const { incidents: resolvedIncidents } = useLogisticsIncidents({ status: 'resuelta', limit: 20 });

  const movementRows: MovementData[] = useMemo(() => {
    return operations.map((operation: LogisticsOperation) => ({
      id: operation.operationCode || operation.id,
      date: operation.date,
      type: mapOperationType(operation.type),
      origin: operation.origin || operation.route?.split('→')[0]?.trim() || '—',
      destination: operation.destination || operation.route?.split('→')[1]?.trim() || '—',
      client: operation.contact || 'Sin contacto',
      driver: operation.responsible || 'Sin asignar',
      status: mapOperationStatus(operation.status),
      value: operation.amount ?? 0,
      estimatedTime: '—',
      actualTime: undefined,
      hasIncident: false,
      notes: operation.notes,
    }));
  }, [operations]);

  const summaryStats: SummaryStats = useMemo(() => {
    const totalMovements = pagination.totalItems || operations.length;
    const pendingMovements = operations.filter((op) => op.status === 'pendiente').length;
    const completedMovements = operations.filter((op) => op.status === 'completado').length;
    const totalValue = operations.reduce((acc, op) => acc + (op.amount || 0), 0);
    return {
      totalMovements,
      pendingMovements,
      completedMovements,
      totalValue,
      activeIncidents: activeIncidents.length,
      resolvedIncidents: resolvedIncidents.length,
    };
  }, [operations, pagination.totalItems, activeIncidents.length, resolvedIncidents.length]);

  const activeIncidentsCards = useMemo(() => {
    const severityMap: Record<string, 'low' | 'medium' | 'high'> = {
      baja: 'low',
      media: 'medium',
      alta: 'high',
      critica: 'high',
    };
    const statusLabels: Record<string, string> = {
      abierta: 'Abierta',
      'en-proceso': 'En investigación',
      resuelta: 'Resuelta',
      anulada: 'Anulada',
    };
    return activeIncidents.map((incident: LogisticsIncident) => ({
      id: incident.incidentCode || incident.id,
      title: incident.type || 'Incidencia logística',
      description: incident.description,
      severity: severityMap[incident.severity] || 'medium',
      status: statusLabels[incident.status] || incident.status,
      reportedDate: incident.reportDate,
      reportedBy: incident.reportedBy || 'Sistema',
      assignedTo: incident.responsible || 'Sin responsable',
      movementId: incident.associatedMovement || undefined,
      estimatedResolution: incident.resolutionDate || undefined,
    }));
  }, [activeIncidents]);

  useEffect(() => {
    if (selectedMovementId && !movementRows.some((movement) => movement.id === selectedMovementId)) {
      setSelectedMovementId(null);
      setIsDetailPanelOpen(false);
    }
  }, [movementRows, selectedMovementId]);

  const selectedMovement = useMemo(
    () => movementRows.find((movement) => movement.id === selectedMovementId) || null,
    [movementRows, selectedMovementId]
  );

  const handleMovementClick = (movementId: string) => {
    setSelectedMovementId(movementId);
    setIsDetailPanelOpen(true);
  };

  const handleCloseDetailPanel = () => {
    setIsDetailPanelOpen(false);
    setSelectedMovementId(null);
  };

  const handleNavigateToMovementDetail = (movementId: string) => {
    navigate(`/dashboard/logistica/movimiento/${movementId}`);
  };

  const handleNavigateToIncidentDetail = (clickedIncidentId: string) => {
    if (!clickedIncidentId) {
      return;
    }
    navigate(`/dashboard/logistica/incidencia/${clickedIncidentId}`);
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
          {(error || incidentsError) && (
            <div className="mb-4">
              <Alert
                type="error"
                message={
                  error?.message || incidentsError?.message || 'No pudimos cargar el resumen logístico.'
                }
              />
            </div>
          )}

          <LogisticsSummaryStatsSection stats={summaryStats} />
          
          {/* Quick Actions Section */}
          <LogisticsQuickActionsSection />
          
          {/* Active Incidents Section */}
          <LogisticsActiveIncidentsSection
            incidents={activeIncidentsCards}
            loading={incidentsLoading}
            onIncidentClick={handleNavigateToIncidentDetail}
          />
          
          {/* Recent Movements Section */}
          <LogisticsRecentMovementsSection
            movements={movementRows}
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
                    {formatCurrency(selectedMovement.value || 0)}
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
