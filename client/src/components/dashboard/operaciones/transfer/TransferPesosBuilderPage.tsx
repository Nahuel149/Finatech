import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClientSummary,
  MovementDirection,
  MovementMethod,
  MovementType,
} from '../../../../types';
import { DashboardNavbar } from '../Navbar';
import { BalanceStripe } from '../BalanceStripe';
import { useClientSearch } from '../../../../hooks/dashboard';
import { useCreateClient } from '../../../../hooks';
import { Alert } from '../../../ui';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';

interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

const MOVEMENT_TYPE_OPTIONS: Array<{
  id: MovementType;
  title: string;
  description: string;
  icon: string;
}> = [
  {
    id: 'transfer',
    title: 'Transferencia bancaria',
    description: 'Impacta en saldos de transferencias',
    icon: 'fa-money-check-dollar',
  },
  {
    id: 'cash',
    title: 'Efectivo en caja',
    description: 'Impacta en saldos de caja física',
    icon: 'fa-vault',
  },
];

const DIRECTION_OPTIONS: Array<{
  id: MovementDirection;
  title: string;
  description: string;
  icon: string;
  toneClass: string;
  backgroundClass: string;
}> = [
  {
    id: 'incoming',
    title: 'Entrante',
    description: 'Aumenta el saldo de Tesorería',
    icon: 'fa-arrow-down',
    toneClass: 'text-success',
    backgroundClass: 'bg-green-100',
  },
  {
    id: 'outgoing',
    title: 'Saliente',
    description: 'Disminuye el saldo de Tesorería',
    icon: 'fa-arrow-up',
    toneClass: 'text-danger',
    backgroundClass: 'bg-red-100',
  },
];

const METHOD_LABEL: Record<MovementMethod, string> = {
  ARS: 'ARS (Transferencia)',
  USD: 'USD',
};

const sanitizeAmountInput = (value: string) => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

interface DistributionRowProps {
  lineId: string;
  contactId: string | null;
  contactName: string;
  contactType: string | null;
  cuit: string | null;
  method: MovementMethod;
  amount: number;
  onContactSelect: (client: ClientSummary) => void;
  onClearContact: () => void;
  onMethodChange: (method: MovementMethod) => void;
  onAmountChange: (amount: number) => void;
  onRemove: () => void;
  onRequestNewClient: () => void;
}

interface NewClientModalProps {
  open: boolean;
  loading: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (payload: { firstName: string; lastName: string; internalOwner: string; contactType: 'client' | 'provider' }) => Promise<void>;
}

const NewClientModal: React.FC<NewClientModalProps> = ({ open, loading, errorMessage, onClose, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactType, setContactType] = useState<'client' | 'provider'>('client');
  const [internalOwner, setInternalOwner] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleClose = () => {
    if (loading) return;
    setFirstName('');
    setLastName('');
    setContactType('client');
    setInternalOwner('');
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !internalOwner.trim()) {
      setLocalError('Completá nombre, apellido y responsable interno.');
      return;
    }
    setLocalError(null);
    await onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      internalOwner: internalOwner.trim(),
      contactType,
    });
    setFirstName('');
    setLastName('');
    setContactType('client');
    setInternalOwner('');
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Nuevo contacto</h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                <i className="fa-solid fa-times" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsable interno</label>
                <input
                  type="text"
                  value={internalOwner}
                  onChange={(event) => setInternalOwner(event.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={contactType}
                  onChange={(event) => setContactType(event.target.value as 'client' | 'provider')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
                  disabled={loading}
                >
                  <option value="client">Cliente</option>
                  <option value="provider">Proveedor</option>
                </select>
              </div>
              {(localError || errorMessage) && (
                <div className="text-sm text-danger">
                  {localError || errorMessage}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-text-primary transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-70"
              disabled={loading}
            >
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DistributionRow: React.FC<DistributionRowProps> = ({
  contactId,
  contactName,
  contactType,
  cuit,
  method,
  amount,
  onContactSelect,
  onClearContact,
  onMethodChange,
  onAmountChange,
  onRemove,
  onRequestNewClient,
}) => {
  const [inputValue, setInputValue] = useState<string>(contactName || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { setQuery, suggestions, loading, error } = useClientSearch('');

  useEffect(() => {
    if (contactName && contactName !== inputValue) {
      setInputValue(contactName);
    }
  }, [contactName]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setQuery(value);
    setShowSuggestions(Boolean(value.trim()));
    if (!value.trim()) {
      onClearContact();
    }
  };

  const handleSuggestionClick = (client: ClientSummary) => {
    onContactSelect(client);
    setInputValue(client.fullName);
    setShowSuggestions(false);
  };

  return (
    <tr className="border-b border-gray-100 last:border-b-0">
      <td className="px-4 py-4 align-top">
        <div className="relative">
          <label className="block text-xs font-medium text-gray-500 mb-1">Contacto</label>
          <input
            type="text"
            value={inputValue}
            onChange={(event) => handleInputChange(event.target.value)}
            onFocus={() => {
              if (inputValue.trim()) {
                setQuery(inputValue);
                setShowSuggestions(true);
              }
            }}
            placeholder="Buscar cliente"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
            autoComplete="off"
          />
          {contactId && (
            <button
              type="button"
              onClick={() => {
                setInputValue('');
                onClearContact();
              }}
              className="absolute right-2 top-7 text-gray-400 hover:text-danger"
              aria-label="Quitar contacto"
            >
              <i className="fa-solid fa-times" />
            </button>
          )}
          <button
            type="button"
            onClick={onRequestNewClient}
            className="absolute right-10 top-7 text-primary hover:text-blue-700 text-sm"
          >
            <i className="fa-solid fa-user-plus" />
          </button>
          {showSuggestions && (
            <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {loading && (
                <div className="px-3 py-2 text-xs text-gray-500">Buscando…</div>
              )}
              {!loading && suggestions.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-500">Sin resultados</div>
              )}
              {!loading &&
                suggestions.map((client) => (
                  <button
                    type="button"
                    key={client.id}
                    onClick={() => handleSuggestionClick(client)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium text-text-primary">
                      {client.fullName}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>{client.contactType === 'provider' ? 'Proveedor' : 'Cliente'}</span>
                      {client.cuit && <span>CUIT {client.cuit}</span>}
                    </div>
                  </button>
                ))}
              {error && (
                <div className="px-3 py-2 text-xs text-danger">
                  {error.message || 'No pudimos buscar clientes.'}
                </div>
              )}
            </div>
          )}
          {(contactType || cuit) && (
            <div className="mt-2 text-xs text-gray-500 flex items-center space-x-2">
              {contactType && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                  {contactType === 'provider' ? 'Proveedor' : 'Cliente'}
                </span>
              )}
              {cuit && <span>CUIT {cuit}</span>}
            </div>
          )}
        </div>
      </td>

      <td className="px-4 py-4 align-top w-44">
        <label className="block text-xs font-medium text-gray-500 mb-1">Medio</label>
        <select
          value={method}
          onChange={(event) => onMethodChange(event.target.value as MovementMethod)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          {Object.entries(METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>

      <td className="px-4 py-4 align-top w-40">
        <label className="block text-xs font-medium text-gray-500 mb-1">Monto</label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount ? amount.toString() : ''}
          onChange={(event) => onAmountChange(parseFloat(event.target.value) || 0)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="0.00"
        />
      </td>

      <td className="px-4 py-4 align-top w-12">
        <button
          type="button"
          onClick={onRemove}
          className="mt-6 text-danger hover:text-red-600"
          aria-label="Eliminar contacto"
        >
          <i className="fa-solid fa-trash" />
        </button>
      </td>
    </tr>
  );
};

export const TransferPesosBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    draft,
    setMovementType,
    setDirection,
    setTotalAmount,
    addLine,
    updateLineAmount,
    updateLineMethod,
    setLineContact,
    removeLine,
    reset,
  } = useTransferPesos();
  const {
    execute: createClient,
    loading: creatingClient,
    error: createClientError,
    reset: resetCreateClient,
  } = useCreateClient();

  const [amountInput, setAmountInput] = useState<string>('');
  const [step, setStep] = useState<number>(1);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [clientModalLineId, setClientModalLineId] = useState<string | null>(null);

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'amount') {
      setStep(2);
    } else if (stepParam === 'distribution') {
      setStep(3);
    }
  }, [searchParams]);

  useEffect(() => {
    if (draft.totalAmount > 0) {
      setAmountInput(
        draft.totalAmount.toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    }
  }, [draft.totalAmount]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const totalAssigned = useMemo(
    () => draft.distributionLines.reduce((sum, line) => sum + (line.amount || 0), 0),
    [draft.distributionLines]
  );

  const progressDifference = useMemo(
    () => totalAssigned - (draft.totalAmount || 0),
    [draft.totalAmount, totalAssigned]
  );

  const progressStatus = useMemo(() => {
    if (!draft.totalAmount || draft.totalAmount <= 0 || !draft.distributionLines.length) {
      return 'idle';
    }
    if (Math.abs(progressDifference) < 0.01) {
      return 'complete';
    }
    if (progressDifference > 0) {
      return 'exceeded';
    }
    return 'pending';
  }, [draft.distributionLines.length, draft.totalAmount, progressDifference]);

  const handleAmountInputChange = (value: string) => {
    setAmountInput(value);
    const numericValue = sanitizeAmountInput(value);
    setTotalAmount(numericValue);
  };

  const handleAmountBlur = () => {
    if (!amountInput) {
      setTotalAmount(0);
      return;
    }
    const numericValue = sanitizeAmountInput(amountInput);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setTotalAmount(0);
      setAmountInput('');
      setToast({
        type: 'error',
        message: 'Ingresá un monto total mayor a 0.',
      });
      return;
    }

    setTotalAmount(numericValue);
    setAmountInput(
      numericValue.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    if (step < 3) {
      setStep(3);
      if (draft.distributionLines.length === 0) {
        addLine();
      }
    }
  };

  const handleContinueFromConfig = () => {
    if (!draft.movementType || !draft.direction) {
      return;
    }
    setStep(2);
  };

  const handleAddLine = () => {
    if (!draft.totalAmount || draft.totalAmount <= 0) {
      setToast({
        type: 'warning',
        message: 'Ingresá el monto total antes de agregar contactos.',
      });
      return;
    }
    addLine();
    if (step < 3) {
      setStep(3);
    }
  };

  const handleCreateClientSubmit = async (payload: {
    firstName: string;
    lastName: string;
    internalOwner: string;
    contactType: 'client' | 'provider';
  }) => {
    try {
      const newClient = await createClient(payload);
      if (clientModalLineId) {
        setLineContact(clientModalLineId, {
          contactId: newClient.id,
          contactName: newClient.fullName,
          contactType: newClient.contactType,
          cuit: newClient.cuit || null,
        });
        setToast({
          type: 'success',
          message: 'Contacto creado correctamente.',
        });
        setClientModalLineId(null);
        resetCreateClient();
      }
    } catch {
      // error handled via hook
    }
  };

  const handleCloseClientModal = () => {
    if (creatingClient) return;
    setClientModalLineId(null);
    resetCreateClient();
  };

  const handleOpenConfirm = () => {
    if (!draft.movementType || !draft.direction) {
      setToast({
        type: 'error',
        message: 'Seleccioná el tipo de movimiento y la dirección antes de continuar.',
      });
      return;
    }
    if (!draft.totalAmount || draft.totalAmount <= 0) {
      setToast({
        type: 'error',
        message: 'Ingresá un monto total válido.',
      });
      return;
    }
    if (!draft.distributionLines.length) {
      setToast({
        type: 'error',
        message: 'Agregá al menos un contacto a la distribución.',
      });
      return;
    }
    const invalidLine = draft.distributionLines.find(
      (line) => !line.contactId || !line.amount || line.amount <= 0
    );
    if (invalidLine) {
      setToast({
        type: 'error',
        message: 'Completá los datos de cada contacto y asigná montos mayores a cero.',
      });
      return;
    }
    if (Math.abs(progressDifference) >= 0.01) {
      setToast({
        type: 'warning',
        message: 'La suma de asignaciones debe coincidir con el monto total.',
      });
      return;
    }
    navigate('/dashboard/operaciones/transfer-pesos/confirmacion');
  };

  const handleCancel = () => {
    const confirmed = window.confirm(
      '¿Estás seguro de cancelar? Se perderán los datos cargados.'
    );
    if (!confirmed) return;
    reset();
    navigate('/dashboard/operaciones');
  };

  const handleSaveDraft = () => {
    setToast({
      type: 'info',
      message: 'Próximamente podrás guardar borradores. Mantené la pestaña abierta.',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search="" onSearchChange={() => {}} />
      <BalanceStripe />

      <main className="pt-[200px] px-6 pb-32 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Transferencia en pesos</h1>
              <p className="text-gray-600">
                Definí el tipo de movimiento, distribuí por contactos y confirmá la operación
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm">
              <div className="text-xs uppercase text-gray-500 mb-1">Progreso</div>
              <div className="flex items-center space-x-3">
                {[1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index <= step ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Step 1 */}
        <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">1</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Configuración</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {MOVEMENT_TYPE_OPTIONS.map((option) => {
              const selected = draft.movementType === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMovementType(option.id)}
                  className={`radio-card border-2 rounded-lg p-4 text-left transition-all ${
                    selected ? 'border-primary shadow-lg selected' : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center mr-3">
                      <i className={`fa-solid ${option.icon} text-primary`} />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{option.title}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {DIRECTION_OPTIONS.map((option) => {
              const selected = draft.direction === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setDirection(option.id)}
                  className={`radio-card border-2 rounded-lg p-4 text-left transition-all ${
                    selected ? 'border-primary shadow-lg selected' : 'border-gray-200 hover:border-primary'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className={`w-10 h-10 ${option.backgroundClass} rounded-lg flex items-center justify-center mr-3`}>
                      <i className={`fa-solid ${option.icon} ${option.toneClass}`} />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{option.title}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <i className="fa-solid fa-info-circle text-blue-600 mr-2 mt-0.5" />
              <p className="text-sm text-blue-800">
                Esta configuración define el impacto en saldos de Tesorería.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleContinueFromConfig}
              disabled={!draft.movementType || !draft.direction}
              className={`px-6 py-3 rounded-lg transition-colors ${
                draft.movementType && draft.direction
                  ? 'bg-primary text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <i className="fa-solid fa-arrow-right mr-2" />
              Continuar
            </button>
          </div>
        </section>

        {/* Step 2 */}
        <section
          className={`bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8 ${
            step >= 2 ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">2</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Monto total</h2>
          </div>

          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto total (ARS)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-lg">$</span>
              </div>
              <input
                type="text"
                value={amountInput}
                onChange={(event) => handleAmountInputChange(event.target.value)}
                onBlur={handleAmountBlur}
                placeholder="0,00"
                className="amount-input w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                inputMode="decimal"
                autoComplete="off"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              La suma de los montos asignados debe coincidir con el total.
            </p>
          </div>
        </section>

        {/* Step 3 */}
        <section
          className={`bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8 ${
            step >= 3 ? 'block' : 'hidden'
          }`}
        >
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center mr-3">
              <span className="text-white font-semibold text-sm">3</span>
            </div>
            <h2 className="text-lg font-semibold text-text-primary">Distribución por contactos</h2>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso de asignación</span>
              <span className="text-sm text-gray-600">
                {formatCurrency(totalAssigned)} de {formatCurrency(draft.totalAmount)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`progress-bar h-3 rounded-full ${
                  progressStatus === 'complete'
                    ? 'bg-success'
                    : progressStatus === 'exceeded'
                    ? 'bg-danger'
                    : progressStatus === 'pending'
                    ? 'bg-warning'
                    : 'bg-gray-400'
                }`}
                style={{
                  width: draft.totalAmount
                    ? `${Math.min(100, (totalAssigned / draft.totalAmount) * 100)}%`
                    : '0%',
                }}
              />
            </div>
            <div className="text-sm mt-2">
              {progressStatus === 'idle' && (
                <span className="text-gray-600">
                  Agregá contactos para comenzar la distribución.
                </span>
              )}
              {progressStatus === 'pending' && (
                <span className="text-warning">
                  <i className="fa-solid fa-clock mr-1" />
                  Faltan {formatCurrency(Math.abs(progressDifference))}
                </span>
              )}
              {progressStatus === 'exceeded' && (
                <span className="text-danger">
                  <i className="fa-solid fa-exclamation-triangle mr-1" />
                  Excede por {formatCurrency(Math.abs(progressDifference))}
                </span>
              )}
              {progressStatus === 'complete' && (
                <span className="text-success">
                  <i className="fa-solid fa-check mr-1" />
                  Total asignado correctamente
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto mb-4 border border-gray-200 rounded-lg">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Medio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {draft.distributionLines.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-gray-500 text-sm" colSpan={4}>
                      <i className="fa-solid fa-users text-2xl mb-2 block" />
                      No hay contactos agregados
                    </td>
                  </tr>
                ) : (
                  draft.distributionLines.map((line) => (
                    <DistributionRow
                      key={line.id}
                      lineId={line.id}
                      contactId={line.contactId}
                      contactName={line.contactName}
                      contactType={line.contactType}
                      cuit={line.cuit}
                      method={line.method}
                      amount={line.amount}
                      onContactSelect={(client) =>
                        setLineContact(line.id, {
                          contactId: client.id,
                          contactName: client.fullName,
                          contactType: client.contactType,
                          cuit: client.cuit || null,
                        })
                      }
                      onClearContact={() =>
                        setLineContact(line.id, {
                          contactId: '',
                          contactName: '',
                          contactType: null,
                          cuit: null,
                        })
                      }
                      onMethodChange={(nextMethod) => updateLineMethod(line.id, nextMethod)}
                      onAmountChange={(nextAmount) => updateLineAmount(line.id, nextAmount)}
                      onRemove={() => removeLine(line.id)}
                      onRequestNewClient={() => setClientModalLineId(line.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleAddLine}
              className="text-primary hover:text-blue-700 text-sm font-medium"
            >
              <i className="fa-solid fa-user-plus mr-2" />
              Agregar contacto
            </button>
            <div className="text-sm text-gray-600">
              Total distribuido{' '}
              <span className="font-semibold text-text-primary">
                {formatCurrency(totalAssigned)}
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between max-w-5xl mx-auto space-y-3 md:space-y-0">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-6 py-3 text-gray-700 hover:text-text-primary transition-colors font-medium"
              >
                <i className="fa-solid fa-arrow-left mr-2" />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                <i className="fa-solid fa-save mr-2" />
                Guardar borrador
              </button>
            </div>
            <button
              type="button"
              onClick={handleOpenConfirm}
              className="px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-primary text-white hover:bg-blue-700"
              disabled={
                !draft.movementType ||
                !draft.direction ||
                !draft.totalAmount ||
                draft.totalAmount <= 0 ||
                !draft.distributionLines.length
              }
            >
              <span className="mr-2">Confirmar distribución</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </footer>

      <NewClientModal
        open={clientModalLineId !== null}
        loading={creatingClient}
        errorMessage={createClientError?.message || null}
        onClose={handleCloseClientModal}
        onSubmit={handleCreateClientSubmit}
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
