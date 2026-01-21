import React from 'react';
import { ResolvedIncidentSummarySection } from './ResolvedIncidentSummarySection';
import { ResolvedIncidentResolutionSection } from './ResolvedIncidentResolutionSection';
import { IncidentItemsSection } from './IncidentItemsSection';
import { IncidentDocumentsSection } from './IncidentDocumentsSection';
import { ResolvedIncidentTimelineSection } from './ResolvedIncidentTimelineSection';
import { LogisticsIncident } from '../../../types/logistics';

interface ResolvedIncidentDetailSidePanelProps {
  incident: LogisticsIncident;
  onGoBack: () => void;
}

export const ResolvedIncidentDetailSidePanel: React.FC<ResolvedIncidentDetailSidePanelProps> = ({
  incident,
  onGoBack
}) => {
  return (
    <div className="bg-white shadow-lg h-screen overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onGoBack}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Detalle de Incidencia</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">Logística</span>
                <span className="text-gray-300">›</span>
                <span className="text-sm text-gray-500">Incidencias</span>
                <span className="text-gray-300">›</span>
                <span className="text-sm text-blue-600">{incident.incidentCode || incident.id}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Resuelta
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Incident Summary */}
        <ResolvedIncidentSummarySection incident={incident} />

        {/* Detailed Description */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Descripción detallada</h3>
          <p className="text-gray-700 leading-relaxed">{incident.description}</p>
          
          {incident.operationalImpacts.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Impactos operacionales:</h4>
              <ul className="list-disc list-inside space-y-1">
                {incident.operationalImpacts.map((impact, index) => (
                  <li key={index} className="text-sm text-gray-600">{impact}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Resolution Details */}
        <ResolvedIncidentResolutionSection resolutionDetails={incident.resolutionDetails} />

        {/* Involved Items */}
        <IncidentItemsSection items={incident.involvedItems || []} />

        {/* Attached Documents */}
        <IncidentDocumentsSection documents={incident.attachedDocuments || []} />

        {/* Change History */}
        <ResolvedIncidentTimelineSection changeHistory={incident.changeHistory || []} />
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Estado:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Resuelta
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
            >
              Editar
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
            >
              Reabrir
            </button>
            <button
              disabled
              className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 border border-gray-200 rounded-md cursor-not-allowed"
            >
              Anular
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
