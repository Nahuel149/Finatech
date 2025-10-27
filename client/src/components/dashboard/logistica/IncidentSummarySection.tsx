import React from 'react';

interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
}

interface IncidentSummarySectionProps {
  incident: IncidentData;
}

export const IncidentSummarySection: React.FC<IncidentSummarySectionProps> = ({ incident }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeverityStyles = (severity: string) => {
    const styles = {
      baja: 'bg-green-100 text-green-800',
      media: 'bg-yellow-100 text-yellow-800',
      alta: 'bg-orange-100 text-orange-800',
      critica: 'bg-red-100 text-red-800',
    };
    return styles[severity as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getStatusStyles = (status: string) => {
    const styles = {
      abierta: 'bg-blue-100 text-blue-800',
      'en-proceso': 'bg-yellow-100 text-yellow-800',
      resuelta: 'bg-green-100 text-green-800',
      anulada: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getSeverityLabel = (severity: string) => {
    const labels = {
      baja: 'Baja',
      media: 'Media',
      alta: 'Alta',
      critica: 'Crítica',
    };
    return labels[severity as keyof typeof labels] || severity;
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      abierta: 'Abierta',
      'en-proceso': 'En proceso',
      resuelta: 'Resuelta',
      anulada: 'Anulada',
    };
    return labels[status as keyof typeof labels] || status;
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Resumen de incidencia</h3>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* ID */}
        <div>
          <dt className="text-sm font-medium text-gray-500">ID de incidencia</dt>
          <dd className="mt-1 text-sm font-semibold text-gray-900">{incident.id}</dd>
        </div>

        {/* Type */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Tipo</dt>
          <dd className="mt-1 text-sm text-gray-900">{incident.type}</dd>
        </div>

        {/* Severity */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Severidad</dt>
          <dd className="mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getSeverityStyles(incident.severity)}`}>
              {getSeverityLabel(incident.severity)}
            </span>
          </dd>
        </div>

        {/* Status */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Estado</dt>
          <dd className="mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusStyles(incident.status)}`}>
              {getStatusLabel(incident.status)}
            </span>
          </dd>
        </div>

        {/* Report Date */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Fecha de reporte</dt>
          <dd className="mt-1 text-sm text-gray-900">{formatDate(incident.reportDate)}</dd>
        </div>

        {/* Resolution Date */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Fecha de resolución</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {incident.resolutionDate ? formatDate(incident.resolutionDate) : 'Pendiente'}
          </dd>
        </div>

        {/* Responsible */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Responsable</dt>
          <dd className="mt-1 text-sm text-gray-900">{incident.responsible}</dd>
        </div>

        {/* Associated Movement */}
        <div>
          <dt className="text-sm font-medium text-gray-500">Movimiento asociado</dt>
          <dd className="mt-1">
            <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
              {incident.associatedMovement}
            </button>
          </dd>
        </div>
      </div>
    </div>
  );
};