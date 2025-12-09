import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  LogisticsOrder,
  LogisticsOrderBalance,
  LogisticsOrderOperationContext,
  LogisticsOrderOperationAssets,
  LogisticsOrderStatus,
  LogisticsAddressOption,
} from '../../../../types';
import { Modal } from '../../../ui/Modal';
import { Alert } from '../../../ui/Alert';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';
import { useCreateOrUpdateLogisticsOrder } from '../../../../hooks/dashboard';
import { OrderWizardStep1 } from './OrderWizardStep1';
import { OrderWizardStep2 } from './OrderWizardStep2';
import { OrderWizardSummary } from './OrderWizardSummary';
import {
  FormFieldErrors,
  FormItemErrors,
  LogisticsOrderFormItem,
  LogisticsOrderFormState,
  WizardSubmissionMode,
  MessengerOption,
} from './types';
import { api } from '../../../../utils/api';

interface LogisticsOrderWizardProps {
  isOpen: boolean;
  onClose: () => void;
  operation: LogisticsOrderOperationContext | null;
  balances: LogisticsOrderBalance[];
  onCompleted: (order: LogisticsOrder, status: LogisticsOrderStatus) => void;
  editingOrder?: LogisticsOrder | null;
}

const MIN_WINDOW_OFFSET_MINUTES = 30;

const buildDefaultDate = (minutesFromNow: number) => {
  const date = new Date(Date.now() + minutesFromNow * 60 * 1000);
  date.setSeconds(0, 0);
  return date.toISOString().slice(0, 16);
};

const createItemId = () => `order-item-${Math.random().toString(36).slice(2, 9)}`;

const buildInitialForm = (
  operation: LogisticsOrderOperationContext | null,
  editingOrder?: LogisticsOrder | null
): LogisticsOrderFormState => {
  if (editingOrder) {
    return {
      type: editingOrder.type,
      origin: editingOrder.origin,
      originAddressId: editingOrder.originAddressId || null,
      destination: editingOrder.destination,
      destinationAddressId: editingOrder.destinationAddressId || null,
      contactName: editingOrder.contactName,
      contactPhone: editingOrder.contactPhone,
      windowStart: editingOrder.windowStart?.slice(0, 16) || buildDefaultDate(MIN_WINDOW_OFFSET_MINUTES + 30),
      windowEnd: editingOrder.windowEnd?.slice(0, 16) || buildDefaultDate(MIN_WINDOW_OFFSET_MINUTES + 90),
      messengerId: editingOrder.messengerId || null,
      messenger: editingOrder.messenger || '',
      notes: editingOrder.notes || '',
      internalNotes: editingOrder.internalNotes || '',
      items: editingOrder.items.map((item) => ({
        id: item.id || createItemId(),
        assetCode: item.assetCode,
        assetType: item.assetType,
        expectedAmount: item.expectedAmount,
        metadata: item.metadata || {},
        notes: item.notes || '',
      })),
    };
  }
  const defaultAsset = operation?.balances?.[0]?.assetCode || operation?.assets?.outgoing?.code || 'ARS';
  const isSellOperation = operation?.type === 'sell';
  const preferredAddress = operation?.clientAddresses?.[0] || null;
  const defaultOrderType: LogisticsOrderFormState['type'] = isSellOperation ? 'ENTREGA' : 'RETIRO';
  return {
    type: defaultOrderType,
    origin: isSellOperation ? '' : preferredAddress?.formatted || '',
    originAddressId: isSellOperation ? null : preferredAddress?.id || null,
    destination: isSellOperation ? preferredAddress?.formatted || '' : '',
    destinationAddressId: isSellOperation ? preferredAddress?.id || null : null,
    contactName: operation?.clientName || '',
    contactPhone: operation?.clientPhone || '',
    windowStart: buildDefaultDate(MIN_WINDOW_OFFSET_MINUTES + 30),
    windowEnd: buildDefaultDate(MIN_WINDOW_OFFSET_MINUTES + 90),
    messengerId: null,
    messenger: '',
    notes: '',
    internalNotes: '',
    items: [
      {
        id: createItemId(),
        assetCode: defaultAsset,
        assetType: 'CURRENCY',
        expectedAmount: '',
        metadata: {},
        notes: '',
      },
    ],
  };
};

const validateStep1 = (form: LogisticsOrderFormState): FormFieldErrors => {
  const errors: FormFieldErrors = {};
  if (!form.origin.trim()) {
    errors.origin = 'IngresÃ¡ el origen.';
  }
  if (!form.destination.trim()) {
    errors.destination = 'IngresÃ¡ el destino.';
  }
  if (!errors.origin && !errors.destination && form.origin.trim() && form.destination.trim()) {
    if (form.origin.trim().toLowerCase() === form.destination.trim().toLowerCase()) {
      errors.destination = 'Elegi direcciones distintas para origen y destino.';
    }
  }
  if (!form.contactName.trim()) {
    errors.contactName = 'IndicÃ¡ el nombre del contacto.';
  }
  if (!form.contactPhone.trim()) {
    errors.contactPhone = 'IndicÃ¡ el telÃ©fono del contacto.';
  }
  const start = new Date(form.windowStart);
  const end = new Date(form.windowEnd);
  if (Number.isNaN(start.getTime())) {
    errors.windowStart = 'Fecha invÃ¡lida.';
  }
  if (Number.isNaN(end.getTime())) {
    errors.windowEnd = 'Fecha invÃ¡lida.';
  }
  if (!errors.windowStart && !errors.windowEnd && start >= end) {
    errors.windowEnd = 'La ventana debe finalizar despuÃ©s del inicio.';
  }
  const minStart = Date.now() + MIN_WINDOW_OFFSET_MINUTES * 60 * 1000;
  if (!errors.windowStart && start.getTime() < minStart) {
    errors.windowStart = `La ventana debe comenzar al menos ${MIN_WINDOW_OFFSET_MINUTES} minutos en el futuro.`;
  }
  return errors;
};

const validateItems = (
  form: LogisticsOrderFormState,
  balances: LogisticsOrderBalance[],
  getAvailableAmount: (assetCode: string, itemId: string) => number
): FormItemErrors => {
  const errors: FormItemErrors = {};
  const balanceMap = new Map(balances.map((entry) => [entry.assetCode, entry]));
  form.items.forEach((item) => {
    const currentErrors: Record<string, string> = {};
    if (!item.assetCode) {
      currentErrors.assetCode = 'ElegÃ­ la divisa/activo.';
    } else if (!balanceMap.has(item.assetCode)) {
      currentErrors.assetCode = 'El activo no pertenece a esta operaciÃ³n.';
    }

    const numericAmount = Number(item.expectedAmount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      currentErrors.expectedAmount = 'IngresÃ¡ un monto mayor a 0.';
    } else if (item.assetCode) {
      const available = getAvailableAmount(item.assetCode, item.id);
      if (numericAmount - available > 0.01) {
        currentErrors.expectedAmount = 'Supera el saldo pendiente de la operaciÃ³n.';
      }
    }

    if (item.assetType === 'CHEQUE') {
      if (!item.metadata.bank?.trim()) {
        currentErrors.bank = 'IndicÃ¡ el banco.';
      }
      if (!item.metadata.number?.trim()) {
        currentErrors.number = 'IndicÃ¡ el nÃºmero de cheque.';
      }
      if (!item.metadata.dueDate) {
        currentErrors.dueDate = 'IndicÃ¡ la fecha de cobro.';
      }
    }

    if (item.assetType === 'METAL') {
      if (!item.metadata.metalType?.trim()) {
        currentErrors.metalType = 'IndicÃ¡ el metal.';
      }
      if (!item.metadata.purity?.trim()) {
        currentErrors.purity = 'IndicÃ¡ la pureza.';
      }
      if (!item.metadata.weight || Number(item.metadata.weight) <= 0) {
        currentErrors.weight = 'IndicÃ¡ el peso.';
      }
    }

    if (item.assetType === 'OTHER' && !item.metadata.description?.trim()) {
      currentErrors.description = 'DescribÃ­ el valor a trasladar.';
    }

    if (Object.keys(currentErrors).length) {
      errors[item.id] = currentErrors;
    }
  });
  return errors;
};

const mapFormToPayload = (form: LogisticsOrderFormState, status: WizardSubmissionMode) => ({
  type: form.type,
  origin: form.origin.trim(),
  destination: form.destination.trim(),
  contactName: form.contactName.trim(),
  contactPhone: form.contactPhone.trim(),
  windowStart: form.windowStart,
  windowEnd: form.windowEnd,
  status,
  notes: form.notes?.trim() || null,
  internalNotes: form.internalNotes?.trim() || null,
  originAddressId: form.originAddressId,
  destinationAddressId: form.destinationAddressId,
  messengerId: form.messengerId,
  messenger: form.messenger?.trim() || null,
  items: form.items.map((item) => ({
    assetCode: item.assetCode,
    assetType: item.assetType,
    expectedAmount: Number(item.expectedAmount) || 0,
    metadata: item.metadata,
    notes: item.notes?.trim() || null,
  })),
});

export const LogisticsOrderWizard: React.FC<LogisticsOrderWizardProps> = ({
  isOpen,
  onClose,
  operation,
  balances,
  onCompleted,
  editingOrder,
}) => {
  const [form, setForm] = useState<LogisticsOrderFormState>(buildInitialForm(operation, editingOrder));
  const [step, setStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});
  const [itemErrors, setItemErrors] = useState<FormItemErrors>({});
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [messengerOptions, setMessengerOptions] = useState<MessengerOption[]>([]);
  const [messengersLoading, setMessengersLoading] = useState(false);

  const { createOrder, updateOrder, saving, error, resetError } = useCreateOrUpdateLogisticsOrder(operation?.id);

  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialForm(operation, editingOrder));
      setStep(1);
      setFieldErrors({});
      setItemErrors({});
      setBannerError(null);
      resetError();
    }
  }, [isOpen, operation, editingOrder, resetError]);

  const addressOptions = useMemo<LogisticsAddressOption[]>(() => {
    const list = operation?.clientAddresses || [];
    return list.map((address) => ({
      ...address,
      label: address.label || (address.id === 'primary' ? 'Principal' : address.label || 'Dirección'),
    }));
  }, [operation]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let active = true;
    const loadMessengers = async () => {
      setMessengersLoading(true);
      try {
        const response = await api.getLogisticsMessengers();
        if (!active) {
          return;
        }
        let next: MessengerOption[] = Array.isArray(response?.messengers)
          ? (response.messengers as MessengerOption[])
          : [];
        if (form.messengerId && !next.some((option) => option.id === form.messengerId)) {
          next = [
            ...next,
            {
              id: form.messengerId,
              name: form.messenger || 'Mensajero seleccionado',
              type: 'user',
            },
          ];
        } else if (!form.messengerId && form.messenger) {
          const existingSeed = next.find((option) => option.name === form.messenger);
          if (!existingSeed) {
            next = [
              ...next,
              {
                id: `seed-${form.messenger}`,
                name: form.messenger,
                type: 'seed',
              },
            ];
          }
        }
        setMessengerOptions(next);
      } catch {
        if (active) {
          setMessengerOptions((prev) => (prev.length ? prev : []));
        }
      } finally {
        if (active) {
          setMessengersLoading(false);
        }
      }
    };
    loadMessengers();
    return () => {
      active = false;
    };
  }, [isOpen, form.messenger, form.messengerId]);

  const effectiveBalances = useMemo(() => {
    if (!editingOrder) {
      return balances;
    }
    const map = new Map<string, LogisticsOrderBalance>(
      balances.map((entry) => [entry.assetCode, { ...entry }])
    );
    editingOrder.items.forEach((item) => {
      const entry = map.get(item.assetCode);
      if (entry) {
        entry.pendingAmount = Number(entry.pendingAmount || 0) + (Number(item.expectedAmount) || 0);
      } else {
        map.set(item.assetCode, {
          assetCode: item.assetCode,
          assetLabel: item.assetCode,
          role: 'incoming',
          totalAmount: Number(item.expectedAmount) || 0,
          allocatedAmount: 0,
          pendingAmount: Number(item.expectedAmount) || 0,
        });
      }
    });
    return Array.from(map.values());
  }, [balances, editingOrder]);

  const balancesMap = useMemo(
    () => new Map(effectiveBalances.map((entry) => [entry.assetCode, entry])),
    [effectiveBalances]
  );
  const conversionMap = useMemo(() => {
    const map = new Map<string, number>();
    const register = (from?: LogisticsOrderOperationAssets | null, to?: LogisticsOrderOperationAssets | null) => {
      if (!from || !to || !from.code || !to.code) {
        return;
      }
      const fromAmount = Number(from.amount);
      const toAmount = Number(to.amount);
      if (!Number.isFinite(fromAmount) || !Number.isFinite(toAmount) || fromAmount === 0) {
        return;
      }
      map.set(`${from.code}->${to.code}`, toAmount / fromAmount);
    };
    const incoming = operation?.assets?.incoming || null;
    const outgoing = operation?.assets?.outgoing || null;
    register(incoming, outgoing);
    register(outgoing, incoming);
    return map;
  }, [operation]);

  const convertExpectedAmount = useCallback(
    (value: number | '', fromCode: string, toCode: string): number | '' => {
      if (value === '' || !fromCode || !toCode || fromCode === toCode) {
        return value;
      }
      const rate = conversionMap.get(`${fromCode}->${toCode}`);
      if (!rate || !Number.isFinite(rate)) {
        return value;
      }
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) {
        return value;
      }
      const converted = numeric * rate;
      return Math.round(converted * 100) / 100;
    },
    [conversionMap]
  );

  const handleFieldChange = (field: keyof LogisticsOrderFormState, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleItemChange = (itemId: string, field: keyof LogisticsOrderFormItem, value: any) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id !== itemId) {
          return item;
        }
        if (field === 'assetCode') {
          return {
            ...item,
            assetCode: value,
            expectedAmount: convertExpectedAmount(item.expectedAmount, item.assetCode, value),
          };
        }
        return { ...item, [field]: value };
      }),
    }));
    setItemErrors((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: '',
      },
    }));
  };

  const handleMetadataChange = (itemId: string, field: keyof LogisticsOrderFormItem['metadata'], value: any) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              metadata: {
                ...item.metadata,
                [field]: value,
              },
            }
          : item
      ),
    }));
    setItemErrors((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        [field]: '',
      },
    }));
  };

  const handleSelectAddress = (field: 'origin' | 'destination', addressId: string | null) => {
    const selected = addressOptions.find((address) => address.id === addressId) || null;
    if (field === 'origin') {
      setForm((prev) => ({
        ...prev,
        origin: selected?.formatted || '',
        originAddressId: selected?.id || null,
      }));
      setFieldErrors((prev) => ({ ...prev, origin: '' }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      destination: selected?.formatted || '',
      destinationAddressId: selected?.id || null,
    }));
    setFieldErrors((prev) => ({ ...prev, destination: '' }));
  };

  const handleSelectMessenger = (optionId: string | null) => {
    const option = messengerOptions.find((entry) => entry.id === optionId) || null;
    if (option && option.type === 'user') {
      handleFieldChange('messengerId', option.id);
      handleFieldChange('messenger', option.name);
      return;
    }
    if (option) {
      handleFieldChange('messengerId', null);
      handleFieldChange('messenger', option.name);
      return;
    }
    handleFieldChange('messengerId', null);
    handleFieldChange('messenger', '');
  };

  const handleAddItem = () => {
    const defaultAsset = effectiveBalances[0]?.assetCode || form.items[0]?.assetCode || 'ARS';
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: createItemId(),
          assetCode: defaultAsset,
          assetType: 'CURRENCY',
          expectedAmount: '',
          metadata: {},
          notes: '',
        },
      ],
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    if (form.items.length === 1) {
      return;
    }
    setForm((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));
    setItemErrors((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
  };

  const getAvailableAmount = (assetCode: string, itemId: string) => {
    const balance = balancesMap.get(assetCode);
    if (!balance) {
      return 0;
    }
    const otherItems = form.items.filter((item) => item.assetCode === assetCode && item.id !== itemId);
    const used = otherItems.reduce((sum, item) => sum + (Number(item.expectedAmount) || 0), 0);
    return Math.max(0, balance.pendingAmount - used);
  };

  const handleNext = () => {
    if (step === 1) {
      const errors = validateStep1(form);
      setFieldErrors(errors);
      if (Object.keys(errors).length === 0) {
        setStep(2);
      }
    } else if (step === 2) {
      const errors = validateItems(form, effectiveBalances, getAvailableAmount);
      setItemErrors(errors);
      if (Object.keys(errors).length === 0 && form.items.length > 0) {
        setStep(3);
      } else if (form.items.length === 0) {
        setBannerError('AgregÃ¡ al menos un Ã­tem de valor.');
      }
    }
  };

  const handlePrev = () => {
    setBannerError(null);
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (mode: WizardSubmissionMode) => {
    const stepErrors = validateStep1(form);
    const itemValidation = validateItems(form, effectiveBalances, getAvailableAmount);
    setFieldErrors(stepErrors);
    setItemErrors(itemValidation);
    if (Object.keys(stepErrors).length > 0 || Object.keys(itemValidation).length > 0 || form.items.length === 0) {
      if (form.items.length === 0) {
        setBannerError('AgregÃ¡ al menos un Ã­tem para la orden.');
      }
      setStep((prev) => (Object.keys(stepErrors).length ? 1 : 2));
      return;
    }

    try {
      const payload = mapFormToPayload(form, mode);
      const order = editingOrder
        ? await updateOrder(editingOrder.id, payload)
        : await createOrder(payload);
      onCompleted(order, mode);
      onClose();
    } catch (err) {
      setBannerError((err as Error).message || 'No pudimos guardar la orden.');
    }
  };

  const renderStep = () => {
    if (!operation) {
      return (
        <div className="py-12 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      );
    }
    if (step === 1) {
      return (
        <OrderWizardStep1
          form={form}
          errors={fieldErrors}
          operation={operation}
          onChange={handleFieldChange}
          addressOptions={addressOptions}
          onSelectAddress={handleSelectAddress}
          messengerOptions={messengerOptions}
          onSelectMessenger={handleSelectMessenger}
          messengersLoading={messengersLoading}
        />
      );
    }
    if (step === 2) {
      return (
        <OrderWizardStep2
          items={form.items}
          balances={effectiveBalances}
          errors={itemErrors}
          onItemChange={handleItemChange}
          onMetadataChange={handleMetadataChange}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          getAvailableAmount={getAvailableAmount}
        />
      );
    }
    return <OrderWizardSummary form={form} operation={operation} balances={effectiveBalances} />;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Nueva orden logÃ­stica">
      <div className="space-y-4">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-gray-300'}`} />
            Datos bÃ¡sicos
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
            Ãtems
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${step === 3 ? 'bg-primary' : 'bg-gray-300'}`} />
            Resumen
          </div>
        </div>

        {bannerError && (
          <Alert type="error" message={bannerError} onClose={() => setBannerError(null)} />
        )}
        {error && <Alert type="error" message={error.message} onClose={resetError} />}

        {renderStep()}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          <div className="flex gap-2">
            <button
              type="button"
              className="px-4 py-2 text-sm text-gray-600 hover:text-text-primary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            {step > 1 && (
              <button
                type="button"
                className="px-4 py-2 text-sm text-gray-600 hover:text-text-primary"
                onClick={handlePrev}
                disabled={saving}
              >
                Anterior
              </button>
            )}
          </div>

          {step < 3 ? (
            <button
              type="button"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
              onClick={handleNext}
              disabled={saving}
            >
              Siguiente
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 text-sm rounded-lg"
                onClick={() => handleSubmit('BORRADOR')}
                disabled={saving}
              >
                {saving ? 'Guardandoâ€¦' : 'Guardar borrador'}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
                onClick={() => handleSubmit('PROGRAMADA')}
                disabled={saving}
              >
                {saving ? 'Programandoâ€¦' : 'Programar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
