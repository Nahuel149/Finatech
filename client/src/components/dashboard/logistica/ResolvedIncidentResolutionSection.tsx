import React from 'react';
import { LogisticsIncidentResolutionDetails } from '../../../types';

interface ResolvedIncidentResolutionSectionProps {
  resolutionDetails?: LogisticsIncidentResolutionDetails | null;
}

export const ResolvedIncidentResolutionSection: React.FC<ResolvedIncidentResolutionSectionProps> = ({
  resolutionDetails
}) => {
  if (!resolutionDetails) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 border border-dashed border-gray-200 text-sm text-gray-600">
        No se registraron detalles de resolución para esta incidencia.
      </div>
    );
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return '—';
    }
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="ml-3 text-lg font-medium text-green-900">Detalles de la resolución</h3>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-700">Tipo de resolución</label>
            <p className="mt-1 text-sm text-green-900 font-medium">{resolutionDetails.resolutionType}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-green-700">Resuelto por</label>
            <p className="mt-1 text-sm text-green-900">{resolutionDetails.resolvedBy}</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-green-700">Fecha de resolución</label>
          <p className="mt-1 text-sm text-green-900">{formatDate(resolutionDetails.resolutionDate)}</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-green-700">Descripción de la resolución</label>
          <p className="mt-1 text-sm text-green-900 leading-relaxed">{resolutionDetails.resolutionDescription}</p>
        </div>
        
        {(resolutionDetails.followUpActions || []).length > 0 && (
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Acciones de seguimiento</label>
            <ul className="space-y-2">
              {(resolutionDetails.followUpActions || []).map((action, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 mt-1">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="ml-2 text-sm text-green-900">{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
