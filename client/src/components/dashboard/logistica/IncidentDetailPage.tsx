import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { IncidentDetailSidePanel } from './IncidentDetailSidePanel';
import { Alert } from '../../ui/Alert';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { useLogisticsIncidentDetail } from '../../../hooks/dashboard/useLogisticsIncidents';
import { api, handleApiError } from '../../../utils/api';
import { ApiError } from '../../../types/auth';

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState<ApiError | null>(null);
  const [updating, setUpdating] = useState(false);

  const { incident, loading, error, refresh } = useLogisticsIncidentDetail(incidentId);

  const handleClosePanel = () => {
    navigate('/dashboard/logistica');
  };

  const handleUpdateStatus = async (status: 'resuelta' | 'anulada') => {
    if (!incidentId) return;
    try {
      setUpdating(true);
      setActionError(null);
      await api.updateLogisticsIncidentStatus(incidentId, { status });
      await refresh();
    } catch (err) {
      setActionError(handleApiError(err));
    } finally {
      setUpdating(false);
    }
  };

  if (!incidentId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={searchTerm} onSearchChange={setSearchTerm} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-64 px-4">
          <Alert type="error" message="No se indicó una incidencia válida." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={searchTerm} onSearchChange={setSearchTerm} />
      <BalanceStripe />

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {error && <Alert type="error" message={error.message || 'No pudimos cargar la incidencia.'} />}
        {actionError && <Alert type="error" message={actionError.message || 'No pudimos actualizar la incidencia.'} />}
        {updating && (
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <LoadingSpinner size="sm" />
            <span>Actualizando incidencia…</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-600">
          <LoadingSpinner size="lg" />
          <p>Cargando detalle de la incidencia…</p>
        </div>
      ) : incident ? (
        <IncidentDetailSidePanel
          isOpen
          onClose={handleClosePanel}
          incident={incident}
          onEditIncident={() => {}}
          onMarkAsResolved={() => handleUpdateStatus('resuelta')}
          onCancelIncident={() => handleUpdateStatus('anulada')}
        />
      ) : (
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl text-center">
            <h1 className="text-2xl font-semibold text-text-primary">Incidencia no encontrada</h1>
            <p className="mt-4 text-gray-600">
              No pudimos encontrar la incidencia <span className="font-mono">{incidentId}</span>. Es posible que haya sido
              eliminada o que no tengas permisos para verla.
            </p>
            <button
              type="button"
              onClick={handleClosePanel}
              className="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Volver al panel logístico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
