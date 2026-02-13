import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { MovementDetailSidePanel } from './MovementDetailSidePanel';
import CompletionConfirmationModal from './CompletionConfirmationModal';
import { IncidentRegistrationModal } from './IncidentRegistrationModal';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui/Alert';
import { ApiError } from '../../../types/auth';
import { LogisticsOperationRecord } from '../../../types/logistics';
import { api, handleApiError } from '../../../utils/api';
import { useLogisticsOperationDetail } from '../../../hooks/dashboard/useLogisticsOperations';

interface MovementDetailPageProps {
  movementId?: string;
}

const mapOperationToMovement = (operation: LogisticsOperationRecord) => ({
  id: operation.operationCode || operation.id,
  type: operation.type,
  date: operation.datetime,
  responsible: operation.responsible || 'Sin responsable',
  contact: operation.contact,
  reference: operation.route,
  status: operation.state,
  origin: operation.origin,
  destination: operation.destination,
  currency: operation.amount?.currency,
  totalAmount: operation.amount?.value ?? null,
  timeline: (operation.timeline || []).map((step, index) => ({
    id: `${operation.id}-timeline-${index}`,
    title: step.label,
    description: step.status === 'pending' ? 'Pendiente de ejecución' : null,
    date: step.timestamp ? new Date(step.timestamp).toISOString() : null,
    user: step.author || null,
    type: step.status,
  })),
  associatedItems: [],
  attachments: (operation.attachments || []).map((attachment, index) => ({
    id: `${operation.id}-attachment-${index}`,
    name: attachment.name || 'Adjunto',
    type: attachment.type || attachment.icon || 'documento',
    size: attachment.size ?? null,
    url: attachment.url || null,
  })),
  audit: {
    createdBy: operation.responsible || null,
    createdAt: operation.createdAt || null,
    lastModifiedBy: operation.responsible || null,
    lastModifiedAt: operation.updatedAt || null,
    ipAddress: null,
  },
});

export const MovementDetailPage: React.FC<MovementDetailPageProps> = ({ movementId: propMovementId }) => {
  const { movementId: paramMovementId } = useParams<{ movementId: string }>();
  const navigate = useNavigate();
  const movementId = propMovementId || paramMovementId;

  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [updating, setUpdating] = useState(false);
  const [search, setSearch] = useState('');

  const { operation, loading, error, refresh } = useLogisticsOperationDetail(movementId);

  const movement = useMemo(() => (operation ? mapOperationToMovement(operation) : null), [operation]);

  const handleMarkAsCompleted = () => {
    if (!movement) return;
    setIsCompletionModalOpen(true);
  };

  const handleConfirmCompletion = async () => {
    const operationId = operation?.id || movementId;
    if (!operationId) return;
    try {
      setUpdating(true);
      setActionError(null);
      await api.updateLogisticsOperationState(operationId, { state: 'completado' });
      await refresh();
    } catch (err) {
      setActionError(handleApiError(err));
    } finally {
      setUpdating(false);
      setIsCompletionModalOpen(false);
    }
  };

  const handleBackToLogistics = () => {
    navigate('/dashboard/logistica');
  };

  const handleEditMovement = () => {
    // Placeholder for future edit functionality
    console.info('Edit movement:', movementId);
  };

  const handleCancelMovement = async () => {
    const operationId = operation?.id || movementId;
    if (!operationId) return;
    try {
      setUpdating(true);
      setActionError(null);
      await api.updateLogisticsOperationState(operationId, { state: 'anulado' });
      await refresh();
    } catch (err) {
      setActionError(handleApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  const handleRegisterIncident = () => {
    setIsIncidentModalOpen(true);
  };

  if (!movementId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={search} onSearchChange={setSearch} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No se especificó un ID de movimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Alert type="error" message={error.message || 'No pudimos cargar el movimiento logístico.'} />
        )}
        {actionError && (
          <Alert type="error" message={actionError.message || 'No pudimos actualizar el movimiento.'} />
        )}
      </div>

      <MovementDetailSidePanel
        isOpen
        movement={movement}
        isLoading={loading || updating}
        onClose={handleBackToLogistics}
        onMarkAsCompleted={handleMarkAsCompleted}
        onEdit={handleEditMovement}
        onCancel={handleCancelMovement}
        onRegisterIncident={handleRegisterIncident}
      />

      <CompletionConfirmationModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        movementId={movement?.id || ''}
        movementType={movement?.type}
        reference={movement?.reference}
      />

      <IncidentRegistrationModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        movementId={movementId}
      />

      <Footer />
    </div>
  );
};
