import React from 'react';
import { XMarkIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '../../icons/HeroiconsOutline';
import { IncidentSummarySection } from './IncidentSummarySection';
import { IncidentTimelineSection } from './IncidentTimelineSection';
import { IncidentItemsSection } from './IncidentItemsSection';
import { IncidentDocumentsSection } from './IncidentDocumentsSection';

interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'resolved' | 'cancelled';
  }>;
}

interface IncidentDetailSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  incident: IncidentData;
  onEditIncident: () => void;
  onMarkAsResolved: () => void;
  onCancelIncident: () => void;
}

export const IncidentDetailSidePanel: React.FC<IncidentDetailSidePanelProps> = ({
  isOpen,
  onClose,
  incident,
  onEditIncident,
  onMarkAsResolved,
  onCancelIncident,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Detalle de incidencia</h2>
              <div className="mt-1 flex items-center space-x-2 text-sm text-gray-500">
                <span>Logística</span>
                <span>›</span>
                <span>Incidencias</span>
                <span>›</span>
                <span className="font-medium text-gray-900">{incident.id}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6 p-6">
              {/* Incident Summary */}
              <IncidentSummarySection incident={incident} />

              {/* Detailed Description */}
              <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-medium text-gray-900">Descripción detallada</h3>
                <p className="mb-4 text-gray-700">{incident.description}</p>
                
                <div>
                  <h4 className="mb-2 font-medium text-gray-900">Impactos operacionales:</h4>
                  <ul className="space-y-1">
                    {incident.operationalImpacts.map((impact, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2 mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-400"></span>
                        <span className="text-gray-700">{impact}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Involved Items */}
              <IncidentItemsSection items={incident.involvedItems} />

              {/* Attached Documents */}
              <IncidentDocumentsSection documents={incident.attachedDocuments} />

              {/* Change History */}
              <IncidentTimelineSection history={incident.changeHistory} />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={onEditIncident}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <PencilIcon className="mr-2 h-4 w-4" />
                  Editar incidencia
                </button>
                
                {incident.status !== 'resuelta' && incident.status !== 'anulada' && (
                  <button
                    onClick={onMarkAsResolved}
                    className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <CheckCircleIcon className="mr-2 h-4 w-4" />
                    Marcar como resuelta
                  </button>
                )}
                
                {incident.status !== 'anulada' && incident.status !== 'resuelta' && (
                  <button
                    onClick={onCancelIncident}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    <XCircleIcon className="mr-2 h-4 w-4" />
                    Anular incidencia
                  </button>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cerrar panel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
