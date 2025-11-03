import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { ClientSummary } from '../../types';
import { apiRequest, handleApiError } from '../../utils';
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
  defaultType?: ClientType;
  ownerOptions?: string[];
  defaultOwner?: string;
  addressSuggestions?: AddressSuggestion[];
  onSearchAddress?: (term: string) => void;
  onSelectAddress?: (suggestion: AddressSuggestion) => Promise<AddressDetails>;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  cuit?: string;
  email?: string;
  phone?: string;
  address?: string;
  internalOwner?: string;
}

const INTERNAL_OWNER_FALLBACK = 'Operaciones';
const DEFAULT_OWNER_OPTIONS = ['Operaciones', 'Tesorería', 'Comercial', 'Backoffice'];

const initialFormState = {
  firstName: '',
  lastName: '',
  businessName: '',
  cuit: '',
  email: '',
  phone: '',
  contactType: 'client' as ClientType,
  addressSearch: '',
  internalOwner: INTERNAL_OWNER_FALLBACK,
};

export const NewClientModal: React.FC<NewClientModalProps> = ({
  open,
  onClose,
  onCreated,
  defaultType = 'client',
  ownerOptions = DEFAULT_OWNER_OPTIONS,
  defaultOwner,
  addressSuggestions,
  onSearchAddress,
  onSelectAddress,
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

  const [form, setForm] = useState(() => ({
    ...initialFormState,
    contactType: defaultType,
    internalOwner: defaultOwnerValue,
  }));
  const [addressDetails, setAddressDetails] = useState<AddressDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>(normalizedAddressSuggestions);
  const [addressLoading, setAddressLoading] = useState(false);

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
        // Only reset if the form has actually changed
        const newForm = {
          ...initialFormState,
          contactType: defaultType,
          internalOwner: resetOwner,
        };
        
        // Check if form actually needs to be reset
        if (JSON.stringify(prev) === JSON.stringify(newForm)) {
          return prev;
        }
        
        return newForm;
      });
      setAddressDetails(null);
      setError(null);
      setFieldErrors({});
      setLoading(false);
      setSuggestions((prev) => (prev.length > 0 ? [] : prev));
    }
  }, [open, defaultType, normalizedOwnerOptions]);

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
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return false;
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
      if (field === 'addressSearch') {
        setShowSuggestions(true);
        fetchSuggestions(value);
      }
    };

  const handleSelectAddress = async (suggestion: AddressSuggestion) => {
    setForm((prev) => ({ ...prev, addressSearch: suggestion.description }));
    setShowSuggestions(false);
    if (!onSelectAddress) {
      setAddressDetails({
        formatted: suggestion.description,
        description: suggestion.description,
        placeId: suggestion.placeId,
      });
      setSuggestions([]);
      return;
    }
    try {
      setLoading(true);
      const details = await onSelectAddress(suggestion);
      setAddressDetails(details);
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
      setError('Completá los campos obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      businessName: form.businessName.trim() || undefined,
      contactType: form.contactType,
      internalOwner: form.internalOwner,
      cuit: form.cuit.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      primaryAddress: addressDetails
        ? addressDetails
        : form.addressSearch
        ? { formatted: form.addressSearch }
        : undefined,
    };

    try {
      const response = await apiRequest<ClientSummary>('/api/clients', {
        method: 'POST',
        body: payload,
      });
      onCreated(response);
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
            <h2 className="text-xl font-semibold text-text-primary">Nuevo contacto</h2>
            <p className="text-sm text-gray-500">Registrá rápidamente un cliente o proveedor.</p>
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
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="businessName">
                Razón social (opcional)
              </label>
              <input
                id="businessName"
                type="text"
                value={form.businessName}
                onChange={handleChange('businessName')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Razón social"
              />
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
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="cuit">
                CUIT/CUIL (opcional)
              </label>
              <input
                id="cuit"
                type="text"
                value={form.cuit}
                onChange={handleChange('cuit')}
                className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.cuit ? 'border-danger' : 'border-gray-300'
                }`}
                placeholder="Sin guiones ni espacios"
              />
              {fieldErrors.cuit && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.cuit}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="email">
                Email (opcional)
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                  fieldErrors.email ? 'border-danger' : 'border-gray-300'
                }`}
                placeholder="correo@ejemplo.com"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-danger">{fieldErrors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2" htmlFor="phone">
                Teléfono (opcional)
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange('phone')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Ej. +54 11 5555 5555"
              />
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
                  onFocus={() => setShowSuggestions(true)}
                  className={`w-full rounded-lg border px-4 py-3 transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                    fieldErrors.address ? 'border-danger' : 'border-gray-300'
                  }`}
                  placeholder="Buscar dirección"
                  autoComplete="off"
                />
                {showSuggestions && (addressLoading || suggestions.length > 0) && (
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
                        onClick={() => handleSelectAddress(suggestion)}
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
