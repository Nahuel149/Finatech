import React from 'react';
import { 
  DocumentIcon, 
  ArrowDownTrayIcon,
  EyeIcon 
} from '../../icons/HeroiconsOutline';
import { LogisticsIncidentDocument } from '../../../types';
import { devLog } from '../../../utils/devLogger';

interface IncidentDocumentsSectionProps {
  documents: LogisticsIncidentDocument[];
  onDownload?: (document: LogisticsIncidentDocument) => void;
  onView?: (document: LogisticsIncidentDocument) => void;
}

export const IncidentDocumentsSection: React.FC<IncidentDocumentsSectionProps> = ({ 
  documents, 
  onDownload,
  onView 
}) => {
  const formatDate = (dateString?: string | null) => {
    if (!dateString) {
      return '—';
    }
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (type: string) => {
    return <DocumentIcon className="h-5 w-5 text-gray-400" />;
  };

  const handleDownload = (document: LogisticsIncidentDocument) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Default download behavior
      devLog('Downloading document:', document.name);
    }
  };

  const handleView = (document: LogisticsIncidentDocument) => {
    if (onView) {
      onView(document);
    } else {
      // Default view behavior
      devLog('Viewing document:', document.name);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Documentos adjuntos</h3>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Documento
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Tipo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Tamaño
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Fecha
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Subido por
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Acciones</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {documents.map((document) => (
              <tr key={document.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="flex items-center">
                    {getFileIcon(document.type)}
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{document.name}</div>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {(document.type || 'DOC').toUpperCase()}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {document.size || '—'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(document.uploadedAt)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {document.uploadedBy || '—'}
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleView(document)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <EyeIcon className="mr-1 h-3 w-3" />
                      Ver
                    </button>
                    <button
                      onClick={() => handleDownload(document)}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <ArrowDownTrayIcon className="mr-1 h-3 w-3" />
                      Descargar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {documents.length === 0 && (
          <div className="py-12 text-center">
            <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay documentos</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se han adjuntado documentos a esta incidencia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
