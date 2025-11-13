import React from 'react';
import { LogisticsIncident } from '../../../types';

interface ResolvedIncidentSummarySectionProps {
  incident: LogisticsIncident;
}

export const ResolvedIncidentSummarySection: React.FC<ResolvedIncidentSummarySectionProps> = ({
  incident
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'baja':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-yellow-100 text-yellow-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'critica':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateResolutionTime = (reportDate: string, resolutionDate: string) => {
    const start = new Date(reportDate);
    const end = new Date(resolutionDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 día';
    } else if (diffDays < 1) {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return `${diffHours} horas`;
    } else {
      return `${diffDays} días`;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de la incidencia</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500">ID de Incidencia</label>
            <p className="mt-1 text-sm text-gray-900 font-mono">{incident.incidentCode || incident.id}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Tipo</label>
            <p className="mt-1 text-sm text-gray-900">{incident.type || 'Incidente'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Severidad</label>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize mt-1 ${getSeverityColor(incident.severity)}`}>
              {incident.severity}
            </span>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Estado</label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
              Resuelta
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-500">Fecha de reporte</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(incident.reportDate)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Fecha de resolución</label>
            <p className="mt-1 text-sm text-gray-900">{incident.resolutionDate ? formatDate(incident.resolutionDate) : 'Pendiente'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Tiempo de resolución</label>
            <p className="mt-1 text-sm text-gray-900 font-medium text-green-600">
              {incident.resolutionDate ? calculateResolutionTime(incident.reportDate, incident.resolutionDate) : '—'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500">Responsable</label>
            <p className="mt-1 text-sm text-gray-900">{incident.responsible || 'Sin responsable'}</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-500">Movimiento asociado</label>
          <p className="mt-1 text-sm text-blue-600 hover:text-blue-800 cursor-pointer font-mono">
            {incident.associatedMovement || '—'}
          </p>
        </div>
      </div>
    </div>
  );
};
