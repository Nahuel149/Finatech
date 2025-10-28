import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Alert } from '../../../ui';
import { useTransferPesos } from './TransferPesosContext';
import { formatCurrency } from './utils';
import { NewClientModal } from '../../../clients/NewClientModal';

interface ToastState {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

type BuilderStep = 'config' | 'amount' | 'distribution';

const STEP_INDEX: Record<BuilderStep, number> = {
  config: 1,
  amount: 2,
  distribution: 3,
};

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
  const { setQuery, suggestions, loading } = useClientSearch();
  const [searchValue, setSearchValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const term = searchValue.trim();
    if (term.length >= 2) {
      setQuery(term);
    } else {
      setQuery('');
    }
  }, [searchValue, setQuery]);

  useEffect(() => {
    if (contactId) {
      setShowSuggestions(false);
      setSearchValue('');
      setQuery('');
    }
  }, [contactId, setQuery]);

  const handleSelect = (client: ClientSummary) => {
    onContactSelect(client);
    setSearchValue('');
    setShowSuggestions(false);
  };

  const handleAmountInput = (value: string) => {
    const normalized = value.replace(/,/g, '.');
    const parsed = parseFloat(normalized);
    onAmountChange(Number.isFinite(parsed) ? parsed : 0);
  };

  return (
    <tr className="border-b border-gray-200">
      <td className="px-4 py-4 align-top text-sm text-gray-700">
        {contactId ? (
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-text-primary">{contactName}</div>
              <div className="text-xs text-gray-500 capitalize">
                {contactType || 'Sin tipo'}
                {cuit ? ` · ${cuit}` : ''}
              </div>
            </div>
            <button
              type="button"
              onClick={onClearContact}
              className="text-xs text-primary hover:text-blue-700"
            >
              Limpiar
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Buscar contacto"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {loading && (
                <i className="fa-solid fa-circle-notch animate-spin absolute right-3 top-3 text-gray-400" />
              )}
              {showSuggestions && (suggestions.length > 0 || loading) && (
                <div className="absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                  {suggestions.map((client) => (
                    <button
                      type="button"
                      key={client.id}
                      onClick={() => handleSelect(client)}
                      className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                    >
                      <div className="font-medium text-text-primary">{client.fullName}</div>
                      {client.cuit && (
                        <div className="text-xs text-gray-500">{client.cuit}</div>
                      )}
                    </button>
                  ))}
                  {!loading && suggestions.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Sin resultados. Creá un contacto nuevo.
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onRequestNewClient}
              className="inline-flex items-center text-xs text-primary hover:text-blue-700"
            >
              <i className="fa-solid fa-user-plus mr-2" />
              Nuevo contacto
            </button>
          </div>
        )}
      </td>
      <td className="px-4 py-4 align-top">
        <select
          value={method}
          onChange={(event) => onMethodChange(event.target.value as MovementMethod)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {Object.entries(METHOD_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </td>
      <td className="px-4 py-4 align-top">
        <input
          type="number"
          value={Number.isFinite(amount) ? amount : 0}
          onChange={(event) => handleAmountInput(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
          step="0.01"
          min="0"
        />
      </td>
      <td className="px-4 py-4 align-top text-right">
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-danger hover:text-red-700"
        >
          <i className="fa-solid fa-trash" />
        </button>
      </td>
    </tr>
  );
};

export const TransferPesosBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const [amountInput, setAmountInput] = useState<string>('');
  const [step, setStep] = useState<BuilderStep>('config');
  const [toast, setToast] = useState<ToastState | null>(null);
  const [clientModalLineId, setClientModalLineId] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const goToStep = useCallback(
    (nextStep: BuilderStep) => {
      setStep(nextStep);
      if (nextStep === 'config') {
        setSearchParams({}, { replace: true });
        return;
      }

      const params = new URLSearchParams();
      params.set('step', nextStep);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  useEffect(() => {
    const stepParam = searchParams.get('step');
    if (stepParam === 'distribution' || stepParam === 'amount') {
      setStep(stepParam as BuilderStep);
      return;
    }
    setStep('config');
  }, [searchParams]);

  useEffect(() => {
    if (draft.totalAmount > 0) {
      setAmountInput(
        draft.totalAmount.toLocaleString('es-AR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
    } else {
      setAmountInput('');
    }
  }, [draft.totalAmount]);

  useEffect(() => {
    if (step === 'distribution' && (!draft.totalAmount || draft.totalAmount <= 0)) {
      goToStep('amount');
    }
  }, [draft.totalAmount, step, goToStep]);

  useEffect(() => {
    if (step === 'distribution' && draft.distributionLines.length === 0) {
      addLine();
    }
  }, [step, draft.distributionLines.length, addLine]);

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

  const canConfirmDistribution =
    !!draft.movementType &&
    !!draft.direction &&
    !!draft.totalAmount &&
    draft.totalAmount > 0 &&
    draft.distributionLines.length > 0 &&
    progressStatus === 'complete';

  const handleAmountInputChange = (value: string) => {
    setAmountError(null);
    setAmountInput(value);
    const numericValue = sanitizeAmountInput(value);
    if (Number.isFinite(numericValue)) {
      setTotalAmount(numericValue);
    } else {
      setTotalAmount(0);
    }
  };

  const validateAmountValue = () => {
    const rawValue = amountInput.trim();
    if (!rawValue) {
      setAmountError('Este campo es obligatorio.');
      setTotalAmount(0);
      return false;
    }

    const numericValue = sanitizeAmountInput(rawValue);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setAmountError('Ingresá un monto válido en pesos argentinos.');
      setTotalAmount(0);
      return false;
    }

    if (numericValue > 999999999.99) {
      setAmountError('El monto ingresado es demasiado alto.');
      setTotalAmount(0);
      return false;
    }

    setAmountError(null);
    setTotalAmount(numericValue);
    setAmountInput(
      numericValue.toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
    return true;
  };

  const handleAmountBlur = () => {
    if (!amountInput.trim()) {
      setAmountError('Este campo es obligatorio.');
      setTotalAmount(0);
      return;
    }
    validateAmountValue();
  };

  const handleAmountContinue = () => {
    if (validateAmountValue()) {
      goToStep('distribution');
    }
  };

  const handleContinueFromConfig = () => {
    if (!draft.movementType || !draft.direction) {
      return;
    }
    goToStep('amount');
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
    if (step !== 'distribution') {
      goToStep('distribution');
    }
  };

  const handleClientCreated = (newClient: ClientSummary) => {
    if (!clientModalLineId) return;
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
  };

  const handleCloseClientModal = () => {
    setClientModalLineId(null);
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

  const currentStepIndex = STEP_INDEX[step];

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
                      index <= currentStepIndex
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-500'
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
            currentStepIndex >= 2 ? 'block' : 'hidden'
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
            {amountError && (
              <p className="text-sm text-danger mt-2">{amountError}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              La suma de los montos asignados debe coincidir con el total.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleAmountContinue}
              className={`px-6 py-3 rounded-lg transition-colors ${
                draft.totalAmount && draft.totalAmount > 0
                  ? 'bg-primary text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!draft.totalAmount || draft.totalAmount <= 0}
            >
              <i className="fa-solid fa-arrow-right mr-2" />
              Continuar con la distribución
            </button>
          </div>
        </section>

        {/* Step 3 */}
        <section
          className={`bg-white rounded-lg border border-gray-200 shadow-sm p-8 mb-8 ${
            currentStepIndex >= 3 ? 'block' : 'hidden'
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
              className={`px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                canConfirmDistribution
                  ? 'bg-primary text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!canConfirmDistribution}
            >
              <span className="mr-2">Confirmar distribución</span>
              <i className="fa-solid fa-arrow-right" />
            </button>
          </div>
        </div>
      </footer>

      <NewClientModal
        open={clientModalLineId !== null}
        onClose={handleCloseClientModal}
        onCreated={handleClientCreated}
        defaultType="client"
        ownerOptions={['Tesorería', 'Operaciones', 'Comercial']}
        defaultOwner="Tesorería"
      />

      {toast && (
        <div className="fixed top-4 right-4 z-[60] max-w-sm w-full">
          <Alert type={toast.type} message={toast.message} />
        </div>
      )}
    </div>
  );
};
