import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ClientSummary } from '../../types/client';
import { apiRequest, handleApiError } from '../../utils/api';
import { Alert } from '../ui/Alert';

export type ClientType = 'client' | 'provider';

export interface AddressSuggestion {
  description: string;
  placeId?: string;
}

export interface AddressDetails {
  formatted: string;
  description?: string;
  placeId?: string;
  street?: string;
  number?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface NewClientModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (client: ClientSummary) => void;
  onUpdated?: (client: ClientSummary) => void;
  defaultType?: ClientType;
  ownerOptions?: string[];
  defaultOwner?: string;
  addressSuggestions?: AddressSuggestion[];
  onSearchAddress?: (term: string) => void;
  onSelectAddress?: (suggestion: AddressSuggestion) => Promise<AddressDetails>;
  clientToEdit?: ClientSummary | null;
  loadingClient?: boolean;
  clientError?: string | null;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  address?: string;
  secondaryAddress?: string;
  internalOwner?: string;
  contactType?: string;
}

const INTERNAL_OWNER_FALLBACK = 'Operaciones';
const DEFAULT_OWNER_OPTIONS = ['Operaciones', 'Tesorería', 'Comercial', 'Backoffice'];

const initialFormState = {
  firstName: '',
  lastName: '',
  contactType: 'client' as ClientType,
  addressSearch: '',
  secondaryAddressSearch: '',
  internalOwner: INTERNAL_OWNER_FALLBACK,
};

export const NewClientModal: React.FC<NewClientModalProps> = ({
  open,
  onClose,
  onCreated,
  onUpdated,
  defaultType = 'client',
  ownerOptions = DEFAULT_OWNER_OPTIONS,
  defaultOwner,
  addressSuggestions,
  onSearchAddress,
  onSelectAddress,
  clientToEdit = null,
  loadingClient = false,
  clientError = null,
}) => {
  const normalizedOwnerOptions = useMemo(() => {
    if (Array.isArray(ownerOptions) && ownerOptions.length > 0) {
      return ownerOptions;
    }
    return DEFAULT_OWNER_OPTIONS;
  }, [ownerOptions]);
  
  const normalizedAddressSuggestions = useMemo(
    () => addressSuggestions ?? [],
    [addressSuggestions]
  );

  const defaultOwnerValue = useMemo(() => {
    if (defaultOwner && normalizedOwnerOptions.includes(defaultOwner)) {
      return defaultOwner;
    }
    return normalizedOwnerOptions[0] ?? INTERNAL_OWNER_FALLBACK;
  }, [defaultOwner, normalizedOwnerOptions]);

  const isEditMode = Boolean(clientToEdit || loadingClient || clientError);

  const [form, setForm] = useState(() => ({
    ...initialFormState,
    contactType: defaultType,
    internalOwner: defaultOwnerValue,
  }));
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);
  const [secondaryAddressDetails, setSecondaryAddressDetails] = useState<AddressDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>(normalizedAddressSuggestions);
  const [addressLoading, setAddressLoading] = useState(false);
  const [activeAddressField, setActiveAddressField] = useState<'primary' | 'secondary'>('primary');

  useEffect(() => {
    setSuggestions((prev) =>
      prev === normalizedAddressSuggestions ? prev : normalizedAddressSuggestions
    );
  }, [normalizedAddressSuggestions]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      const resetOwner = normalizedOwnerOptions[0] ?? INTERNAL_OWNER_FALLBACK;
      setForm((prev) => {
        const newForm = {
          ...initialFormState,
          contactType: defaultType,
          internalOwner: resetOwner,
        };
        if (JSON.stringify(prev) === JSON.stringify(newForm)) {
          return prev;
        }
        return newForm;
      });
      setAddressDetails(null);
      setSecondaryAddressDetails(null);
      setError(null);
      setFieldErrors({});
      setLoading(false);
      setSuggestions((prev) => (prev.length > 0 ? [] : prev));
      setShowSuggestions(false);
      setActiveAddressField('primary');
      return;
    }

    if (clientToEdit) {
      setForm((prev) => ({
        ...prev,
        firstName: clientToEdit.firstName || '',
        lastName: clientToEdit.lastName || '',
        contactType: (clientToEdit.contactType as ClientType) || defaultType,
        internalOwner: clientToEdit.internalOwner || defaultOwnerValue,
        addressSearch: clientToEdit.primaryAddress?.formatted || clientToEdit.primaryAddress?.description || '',
        secondaryAddressSearch: clientToEdit.secondaryAddress?.formatted || clientToEdit.secondaryAddress?.description || '',
      }));
      setAddressDetails(
        clientToEdit.primaryAddress
          ? {
              formatted: clientToEdit.primaryAddress.formatted || clientToEdit.primaryAddress.description || '',
              description: clientToEdit.primaryAddress.description || clientToEdit.primaryAddress.formatted || '',
              placeId: clientToEdit.primaryAddress.placeId || undefined,
              latitude: clientToEdit.primaryAddress.latitude || undefined,
              longitude: clientToEdit.primaryAddress.longitude || undefined,
            }
          : null,
      );
      setSecondaryAddressDetails(
        clientToEdit.secondaryAddress
          ? {
              formatted: clientToEdit.secondaryAddress.formatted || clientToEdit.secondaryAddress.description || '',
              description: clientToEdit.secondaryAddress.description || clientToEdit.secondaryAddress.formatted || '',
              placeId: clientToEdit.secondaryAddress.placeId || undefined,
              latitude: clientToEdit.secondaryAddress.latitude || undefined,
              longitude: clientToEdit.secondaryAddress.longitude || undefined,
            }
          : null,
      );
      setError(null);
      setFieldErrors({});
    }
  }, [open, defaultType, normalizedOwnerOptions, clientToEdit, defaultOwnerValue]);

  // Update form when defaultOwner changes (only when modal is open)
  useEffect(() => {
    if (!open || !defaultOwner) return;
    
    const newOwner = normalizedOwnerOptions.includes(defaultOwner)
      ? defaultOwner
      : normalizedOwnerOptions[0] ?? INTERNAL_OWNER_FALLBACK;
    
    setForm((prev) => {
      // Guard against unnecessary state updates to prevent render loops
      if (prev.internalOwner === newOwner) return prev;
      return {
        ...prev,
        internalOwner: newOwner,
      };
    });
  }, [open, defaultOwner, normalizedOwnerOptions]);

  const canSubmit = useMemo(() => {
    if (!form.firstName.trim() || !form.lastName.trim()) return false;
    if (!form.contactType.trim()) return false;
    if (!form.internalOwner.trim()) return false;
    return true;
  }, [form]);

  const fetchSuggestions = useCallback(
    async (term: string) => {
      const query = term.trim();
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      if (onSearchAddress) {
        onSearchAddress(query);
      }

      try {
        setAddressLoading(true);
        const response = await fetch(
          `/api/geocoding/autocomplete?input=${encodeURIComponent(query)}`,
          {
            credentials: 'include',
          }
        );
        if (!response.ok) {
          throw new Error('No se pudo obtener la dirección.');
        }
        const payload = await response.json();
        const predictions = Array.isArray(payload.predictions)
          ? payload.predictions.map((prediction: any) => ({
              description: prediction.description,
              placeId: prediction.placeId || prediction.place_id || null,
            }))
          : [];
        setSuggestions(predictions);
      } catch {
        setSuggestions([]);
      } finally {
        setAddressLoading(false);
      }
    },
    [onSearchAddress]
  );

  const handleChange = (field: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
      if (field === 'addressSearch' || field === 'secondaryAddressSearch') {
        if (field === 'addressSearch') {
          setAddressDetails(null);
        } else {
          setSecondaryAddressDetails(null);
        }
        setActiveAddressField(field === 'addressSearch' ? 'primary' : 'secondary');
        setShowSuggestions(true);
        fetchSuggestions(value);
      }
    };

  const handleSelectAddress = async (suggestion: AddressSuggestion, target?: 'primary' | 'secondary') => {
    const destination = target ?? activeAddressField;
    if (destination === 'secondary') {
      setForm((prev) => ({ ...prev, secondaryAddressSearch: suggestion.description }));
    } else {
      setForm((prev) => ({ ...prev, addressSearch: suggestion.description }));
    }
    setShowSuggestions(false);
    if (!onSelectAddress) {
      const detailPayload: AddressDetails = {
        formatted: suggestion.description,
        description: suggestion.description,
        placeId: suggestion.placeId,
      };
      if (destination === 'secondary') {
        setSecondaryAddressDetails(detailPayload);
      } else {
        setAddressDetails(detailPayload);
      }
      setSuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const details = await onSelectAddress(suggestion);
      if (destination === 'secondary') {
        setSecondaryAddressDetails(details);
      } else {
        setAddressDetails(details);
      }
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message || 'No pudimos obtener la dirección seleccionada.');
    } finally {
      setLoading(false);
      setSuggestions([]);
    }
  };

  const mapFieldErrors = (details?: Array<{ field: string; message: string }>): FieldErrors => {
    if (!details) return {};
    return details.reduce((acc, entry) => {
      if (entry.field && entry.message) {
        acc[entry.field as keyof FieldErrors] = entry.message;
      }
      return acc;
    }, {} as FieldErrors);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) {
      const nextFieldErrors: FieldErrors = {};
      if (!form.firstName.trim()) {
        nextFieldErrors.firstName = 'Ingresá el nombre.';
      }
      if (!form.lastName.trim()) {
        nextFieldErrors.lastName = 'Ingresá el apellido.';
      }
      if (!form.internalOwner.trim()) {
        nextFieldErrors.internalOwner = 'Indicá el responsable interno.';
      }
      if (!form.contactType.trim()) {
        nextFieldErrors.contactType = 'Seleccioná el tipo de contacto.';
      }
      setFieldErrors((prev) => ({ ...prev, ...nextFieldErrors }));
      setError('Completá los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      contactType: form.contactType,
      internalOwner: form.internalOwner,
      primaryAddress: addressDetails
        ? addressDetails
        : form.addressSearch
        ? { formatted: form.addressSearch }
        : undefined,
      secondaryAddress: secondaryAddressDetails
        ? secondaryAddressDetails
        : form.secondaryAddressSearch
        ? { formatted: form.secondaryAddressSearch }
        : undefined,
    };

    try {
      const isEditMode = Boolean(clientToEdit?.id);
      const endpoint = isEditMode ? `/api/clients/${clientToEdit?.id}` : '/api/clients';
      const response = await apiRequest<ClientSummary>(endpoint, {
        method: isEditMode ? 'PUT' : 'POST',
        body: payload,
      });
      if (isEditMode && onUpdated) {
        onUpdated(response);
      } else {
        onCreated(response);
      }
      onClose();
    } catch (err) {
      const apiError = handleApiError(err);
      setError(apiError.message);
      setFieldErrors(mapFieldErrors(apiError.details));
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div
      id="new-client-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">
              {isEditMode ? 'Editar contacto' : 'Nuevo contacto'}
            </h2>
            <p className="text-sm text-gray-500">
              {isEditMode ? "Actualiza los datos del cliente o proveedor seleccionado." : "Registra rapidamente un cliente o proveedor."}
            </p>
            {loadingClient && (
              <p className="text-xs text-gray-500 mt-1 flex items-center">
                <i className="fa-solid fa-circle-notch animate-spin mr-1" />
                Cargando datos del contacto...
              </p>
            )}
            {clientError && (
              <p className="text-xs text-danger mt-1 flex items-center">
                <i className="fa-solid fa-circle-exclamation mr-1" />
                {clientError}
              </p>
            )}
          </div>


          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Cerrar modal"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="firstName">
                Nombre
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={handleChange('firstName')}
                className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.firstName ? 'border-danger' : 'border-gray-300'
                }`}
                placeholder="Nombre"
                required
              />
              {fieldErrors.firstName && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="lastName">
                Apellido
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={handleChange('lastName')}
                className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.lastName ? 'border-danger' : 'border-gray-300'
                }`}
                placeholder="Apellido"
                required
              />
              {fieldErrors.lastName && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.lastName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="internalOwner">
                Responsable interno
              </label>
              <select
                id="internalOwner"
                value={form.internalOwner}
                onChange={handleChange('internalOwner')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {normalizedOwnerOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.internalOwner && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.internalOwner}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="contactType">
                Tipo de contacto
              </label>
              <select
                id="contactType"
                value={form.contactType}
                onChange={handleChange('contactType')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="client">Cliente</option>
                <option value="provider">Proveedor</option>
              </select>
              {fieldErrors.contactType && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.contactType}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="addressSearch">
                Domicilio principal
              </label>
              <div className="relative">
                <input
                  id="addressSearch"
                  type="text"
                  value={form.addressSearch}
                  onChange={handleChange('addressSearch')}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => {
                    setActiveAddressField('primary');
                    setShowSuggestions(true);
                  }}
                  className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.address ? 'border-danger' : 'border-gray-300'
                  }`}
                  placeholder="Buscar dirección"
                  autoComplete="off"
                />
                {showSuggestions && activeAddressField === 'primary' && (addressLoading || suggestions.length > 0) && (
                  <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {addressLoading && (
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                        <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                        Buscando direcciones…
                      </div>
                    )}
                    {!addressLoading && suggestions.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Sin sugerencias por el momento.
                      </div>
                    )}
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.placeId ?? suggestion.description}
                        type="button"
                        onClick={() => handleSelectAddress(suggestion, 'primary')}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fieldErrors.address && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.address}</p>
              )}
              {addressDetails?.formatted && (
                <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                  <strong>Dirección seleccionada:</strong> {addressDetails.formatted}
                </div>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="secondaryAddressSearch">
                Domicilio secundario
              </label>
              <div className="relative">
                <input
                  id="secondaryAddressSearch"
                  type="text"
                  value={form.secondaryAddressSearch}
                  onChange={handleChange('secondaryAddressSearch')}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => {
                    setActiveAddressField('secondary');
                    setShowSuggestions(true);
                  }}
                  className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.secondaryAddress ? 'border-danger' : 'border-gray-300'
                  }`}
                  placeholder="Buscar dirección"
                  autoComplete="off"
                />
                {showSuggestions && activeAddressField === 'secondary' && (addressLoading || suggestions.length > 0) && (
                  <div className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {addressLoading && (
                      <div className="px-4 py-2 text-sm text-gray-500 flex items-center">
                        <i className="fa-solid fa-circle-notch animate-spin mr-2" />
                        Buscando direcciones…
                      </div>
                    )}
                    {!addressLoading && suggestions.length === 0 && (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        Sin sugerencias por el momento.
                      </div>
                    )}
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.placeId ?? suggestion.description}-secondary`}
                        type="button"
                        onClick={() => handleSelectAddress(suggestion, 'secondary')}
                        className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {fieldErrors.secondaryAddress && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.secondaryAddress}</p>
              )}
              {secondaryAddressDetails?.formatted && (
                <div className="mt-2 rounded-md bg-blue-50 p-3 text-sm text-blue-700">
                  <strong>Dirección seleccionada:</strong> {secondaryAddressDetails.formatted}
                </div>
              )}
            </div>
          </div>

          {error && (
            <Alert type="error" message={error} className="mt-6" />
          )}

          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-6 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || !canSubmit}
            >
              {loading ? (
                <>
                  Creando
                  <i className="fa-solid fa-circle-notch ml-2 animate-spin" />
                </>
              ) : (
                'Crear contacto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


