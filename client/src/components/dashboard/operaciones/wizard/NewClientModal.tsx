import React, { FormEvent, useEffect, useState } from 'react';
import { ClientSummary } from '../../../../types';
import { apiRequest, handleApiError } from '../../../../utils/api';
import { Alert } from '../../../ui/Alert';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
}

const INTERNAL_OWNER_FALLBACK = 'Operaciones';

export const NewClientModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [cuit, setCuit] = useState('');
  const [contactType, setContactType] = useState<'client' | 'provider'>('client');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setFirstName('');
      setLastName('');
      setCuit('');
      setContactType('client');
      setAddress('');
      setError(null);
      setLoading(false);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Completá nombre y apellido para continuar.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        contactType,
        internalOwner: INTERNAL_OWNER_FALLBACK,
        cuit: cuit.trim() || undefined,
        primaryAddress: address
          ? {
              formatted: address,
              description: address,
            }
          : undefined,
      };

      const response = await apiRequest<ClientSummary>('/api/clients', {
        method: 'POST',
        body: payload,
      });

      onCreated(response);
      onClose();
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || 'No pudimos crear el cliente. Intentalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="new-client-modal"
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-text-primary">Nuevo Cliente</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="fa-solid fa-xmark text-xl" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Nombre</label>
              <input
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Nombre"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Apellido</label>
              <input
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Apellido"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                CUIT/CUIL
              </label>
              <input
                type="text"
                value={cuit}
                onChange={(event) => setCuit(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Opcional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Tipo</label>
              <select
                value={contactType}
                onChange={(event) =>
                  setContactType(event.target.value === 'provider' ? 'provider' : 'client')
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              >
                <option value="client">Cliente</option>
                <option value="provider">Proveedor</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Domicilio (Opcional)
              </label>
              <input
                type="text"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Dirección principal"
              />
            </div>
          </div>
          {error && (
            <Alert type="error" message={error} className="mt-6" />
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  Creando
                  <i className="fa-solid fa-circle-notch ml-2 animate-spin" />
                </>
              ) : (
                <>
                  Crear cliente
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
