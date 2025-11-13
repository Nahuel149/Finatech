import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { useLogisticsIncidentDetail } from '../../../hooks/dashboard';
import { Alert } from '../../ui/Alert';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { ResolvedIncidentDetailSidePanel } from './ResolvedIncidentDetailSidePanel';

export const ResolvedIncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { incident, loading, error } = useLogisticsIncidentDetail(incidentId);

  const handleGoBack = () => navigate('/dashboard/logistica');

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

      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && <Alert type="error" message={error.message || 'No pudimos cargar la incidencia.'} />}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-gray-600">
          <LoadingSpinner size="lg" />
          <p>Cargando incidencia resuelta…</p>
        </div>
      ) : incident ? (
        <ResolvedIncidentDetailSidePanel incident={incident} onGoBack={handleGoBack} />
      ) : (
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-2xl text-center">
            <h1 className="text-2xl font-semibold text-text-primary">Incidencia no encontrada</h1>
            <p className="mt-4 text-gray-600">
              No pudimos encontrar la incidencia <span className="font-mono">{incidentId}</span>.
            </p>
            <button
              type="button"
              onClick={handleGoBack}
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
