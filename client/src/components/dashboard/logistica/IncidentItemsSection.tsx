import React from 'react';
import { LogisticsIncidentItem } from '../../../types';

interface IncidentItemsSectionProps {
  items: LogisticsIncidentItem[];
}

export const IncidentItemsSection: React.FC<IncidentItemsSectionProps> = ({ items }) => {
  const getStatusBadge = (status?: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    
    switch (status) {
      case 'affected':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'damaged':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'lost':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'recovered':
        return `${baseClasses} bg-green-100 text-green-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'affected':
        return 'Afectado';
      case 'damaged':
        return 'Dañado';
      case 'lost':
        return 'Perdido';
      case 'recovered':
        return 'Recuperado';
      default:
        return status || 'Sin estado';
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h3 className="mb-4 text-lg font-medium text-gray-900">Ítems involucrados</h3>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Código
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Descripción
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Cantidad
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                Ubicación
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {item.code}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  <div className="max-w-xs truncate" title={item.description}>
                    {item.description}
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  {item.quantity} {item.unit || ''}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  <span className={getStatusBadge(item.status)}>
                    {getStatusText(item.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {item.location || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No hay ítems involucrados en esta incidencia.</p>
          </div>
        )}
      </div>
    </div>
  );
};
