import React from 'react';
import { ClientSummary } from '../../../../types';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';

interface Props {
  value: string;
  onChange: (value: string) => void;
  clients: ClientSummary[];
  onNewClient: () => void;
  marginInfo?: string;
  loading?: boolean;
  error?: string | null;
}

const renderOptionLabel = (client: ClientSummary) => {
  const cuit = client.cuit ? ` - CUIT: ${client.cuit}` : '';
  return `${client.fullName}${cuit}`;
};

export const ClientSelection: React.FC<Props> = ({
  value,
  onChange,
  clients,
  onNewClient,
  marginInfo,
  loading = false,
  error = null,
}) => {
  console.log('ClientSelection - value:', value, 'type:', typeof value, 'clients count:', clients.length);
  
  return (
  <div id="client-selection" className="mb-6">
    <label className="block text-sm font-medium text-text-primary mb-2">Cliente</label>
    <div className="flex space-x-3">
      <div className="flex-1">
        <div className="relative">
          <select
            value={value}
            onChange={(event) => {
              console.log('ClientSelection onChange - new value:', event.target.value);
              onChange(event.target.value);
            }}
            className="w-full appearance-none px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors pr-10"
            disabled={loading}
          >
            <option value="">Seleccionar cliente...</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {renderOptionLabel(client)}
              </option>
            ))}
          </select>
          {loading && (
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <LoadingSpinner size="sm" color="gray" />
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onNewClient}
        className="px-4 py-3 bg-white border border-primary text-primary rounded-lg hover:bg-blue-50 transition-colors flex items-center"
      >
        <i className="fa-solid fa-plus mr-2" />
        Nuevo cliente
      </button>
    </div>
    {error && (
      <div className="mt-2 text-sm text-danger flex items-center">
        <i className="fa-solid fa-circle-exclamation mr-2" />
        {error}
      </div>
    )}
    {marginInfo && !error && (
      <div className="mt-2 text-sm text-gray-600 flex items-center">
        <i className="fa-solid fa-circle-info mr-1" />
        Último margen con este cliente: {marginInfo}
      </div>
    )}
  </div>
  );
};
