import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ApiError,
  ClientSummary,
  CreateTreasuryMovementPayload,
  OperationSuggestion,
  TreasuryMovement,
} from '../../../../types';
import {
  useClientSearch,
  useCreateTreasuryMovement,
  useOperationSearch,
  useRecentClients,
  useUserPermissions,
} from '../../../../hooks';
import { Alert } from '../../../ui';
import { NewClientModal } from '../../../clients/NewClientModal';
import { MovementTypeSelector } from './MovementTypeSelector';
import { AttachmentItem, AttachmentList } from './AttachmentList';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface RegisterMovementModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (movement: TreasuryMovement) => void;
  onShowToast: (toast: { type: ToastType; message: string }) => void;
  prefillOperation?: { id?: string | null; code?: string | null } | null;
  prefillContact?: ClientSummary | null;
}

type MovementTypeValue = 'incoming' | 'outgoing' | '';
type MovementMediumValue = 'cash' | 'transfer' | 'deposit' | '';
interface FormValues {
  type: MovementTypeValue;
  medium: MovementMediumValue;
  currency: 'ARS' | 'USD' | '';
  amount: string;
  movementAt: string;
  reference: string;
}

const MEDIUM_OPTIONS: Array<{ value: MovementMediumValue; label: string }> = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
  { value: 'deposit', label: 'Depósito' },
];

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const DRAFT_STORAGE_KEY = 'treasury-register-draft';

interface MovementDraft {
  form: FormValues;
  contactId?: string | null;
  contactName?: string | null;
  operation?: OperationSuggestion | null;
  attachments?: AttachmentItem[];
  savedAt: number;
}

const formatDateTimeLocal = (date: Date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

const sanitizeAmountInput = (value: string) => {
  let sanitized = value.replace(/[^\d.,]/g, '');
  sanitized = sanitized.replace(',', '.');
  const [integerPart, decimalPart] = sanitized.split('.');
  if (decimalPart && decimalPart.length > 2) {
    sanitized = `${integerPart}.${decimalPart.slice(0, 2)}`;
  }
  return sanitized;
};

const hasValidationErrors = (errors: Partial<Record<keyof FormValues, string>>) =>
  Object.keys(errors).length > 0;

export const RegisterMovementModal: React.FC<RegisterMovementModalProps> = ({
  open,
  onClose,
  onSuccess,
  onShowToast,
  prefillOperation = null,
  prefillContact = null,
}) => {
  const [form, setForm] = useState<FormValues>({
    type: '',
    medium: '',
    currency: '',
    amount: '',
    movementAt: formatDateTimeLocal(new Date()),
    reference: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [selectedContact, setSelectedContact] = useState<ClientSummary | null>(null);
  const [contactInput, setContactInput] = useState('');
  const [contactDropdownVisible, setContactDropdownVisible] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<OperationSuggestion | null>(null);
  const [operationInput, setOperationInput] = useState('');
  const [operationDropdownVisible, setOperationDropdownVisible] = useState(false);
  const [operationInfoVisible, setOperationInfoVisible] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const prefillAppliedRef = useRef(false);

  const contactInputRef = useRef<HTMLDivElement | null>(null);
  const operationInputRef = useRef<HTMLDivElement | null>(null);

  const clientSearch = useClientSearch();
  const recentClients = useRecentClients(8);
  const operationSearch = useOperationSearch({
    contactId: selectedContact?.id ?? null,
    enableEmptyQueryWithContact: true,
  });
  const { createMovement, loading: submitting, error: createError, reset: resetCreateError } =
    useCreateTreasuryMovement();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const canManageTreasury = permissions.includes('manage-treasury');

  const currencySymbol = form.currency === 'USD' ? 'USD' : '$';

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      resetForm();
      setTimeout(() => loadDraftFromStorage(), 0);
      prefillAppliedRef.current = false;
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!contactDropdownVisible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (contactInputRef.current && !contactInputRef.current.contains(event.target as Node)) {
        setContactDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [contactDropdownVisible]);

  useEffect(() => {
    if (!operationInfoVisible && !operationDropdownVisible) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (operationInputRef.current && !operationInputRef.current.contains(event.target as Node)) {
        setOperationInfoVisible(false);
        setOperationDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [operationInfoVisible, operationDropdownVisible]);

  useEffect(() => {
    if (form.currency === '') {
      setForm((prev) => ({ ...prev, amount: '' }));
    }
  }, [form.currency]);

  useEffect(() => {
    if (!open || !prefillContact) return;
    if (selectedContact?.id === prefillContact.id) return;
    setSelectedContact(prefillContact);
    setContactInput(prefillContact.fullName || prefillContact.shortName || '');
    setContactDropdownVisible(false);
    clientSearch.setQuery('');
    setOperationDropdownVisible(true);
  }, [clientSearch, open, prefillContact, selectedContact?.id]);

  useEffect(() => {
    if (!open || !prefillOperation) return;
    if (
      selectedOperation &&
      ((prefillOperation.id && selectedOperation.id === prefillOperation.id) ||
        (prefillOperation.code && selectedOperation.code === prefillOperation.code))
    ) {
      return;
    }
    const prefillQuery =
      (prefillOperation.code ? prefillOperation.code.replace(/#/g, '').trim() : '') ||
      (prefillOperation.id ? prefillOperation.id.trim() : '');

    if (!prefillQuery) {
      return;
    }

    setOperationInput(prefillOperation.code || prefillQuery);
    setOperationDropdownVisible(true);
    setOperationInfoVisible(false);
    operationSearch.setQuery(prefillQuery);
  }, [open, operationSearch, prefillOperation, selectedOperation]);

  useEffect(() => {
    if (!open) return;
    if (!selectedContact) {
      setOperationDropdownVisible(false);
      return;
    }
    if (selectedOperation) {
      return;
    }
    setOperationDropdownVisible(true);
    setOperationInfoVisible(false);
    operationSearch.setQuery('');
    operationSearch.refresh();
  }, [open, operationSearch, selectedContact, selectedOperation]);

  useEffect(() => {
    if (!open || !prefillOperation || prefillAppliedRef.current) return;
    const match = operationSearch.suggestions.find(
      (suggestion) =>
        (prefillOperation.id && suggestion.id === prefillOperation.id) ||
        (prefillOperation.code && suggestion.code === prefillOperation.code)
    );
    if (match) {
      handleSelectOperation(match);
      setOperationInfoVisible(true);
      prefillAppliedRef.current = true;
    }
  }, [handleSelectOperation, open, operationSearch.suggestions, prefillOperation]);

  const resetForm = () => {
    setForm({
      type: '',
      medium: '',
      currency: '',
      amount: '',
      movementAt: formatDateTimeLocal(new Date()),
      reference: '',
    });
    setErrors({});
    setSelectedContact(null);
    setContactInput('');
    setContactDropdownVisible(false);
    clientSearch.setQuery('');
    setSelectedOperation(null);
    setOperationInput('');
    setOperationDropdownVisible(false);
    operationSearch.reset();
    setAttachments([]);
    setUploadingAttachments(false);
    setSubmitError(null);
    resetCreateError();
  };

  const loadDraftFromStorage = () => {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const draft: MovementDraft = JSON.parse(raw);
      if (!draft || !draft.form) return;
      setForm(draft.form);
      if (draft.contactName) {
        setContactInput(draft.contactName);
      }
      if (draft.contactId) {
        setSelectedContact({
          id: draft.contactId,
          fullName: draft.contactName || '',
          shortName: draft.contactName || '',
          contactType: 'client',
        } as ClientSummary);
      }
      if (draft.operation) {
        setSelectedOperation(draft.operation);
        setOperationInput(draft.operation.code || '');
        setOperationInfoVisible(true);
      }
      if (Array.isArray(draft.attachments)) {
        setAttachments(draft.attachments);
      }
    } catch {
      // ignore broken drafts
    }
  };

  const validateForm = (values: FormValues) => {
    const validationErrors: Partial<Record<keyof FormValues, string>> = {};
    if (!values.type) {
      validationErrors.type = 'Seleccioná el tipo de movimiento.';
    }
    if (!values.medium) {
      validationErrors.medium = 'Seleccioná el medio.';
    }
    if (!values.currency) {
      validationErrors.currency = 'Seleccioná la moneda.';
    }
    const numericAmount = Number(values.amount.replace(',', '.'));
    if (!values.amount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      validationErrors.amount = 'Ingresá un monto válido mayor a 0.';
    }
    if (!values.movementAt) {
      validationErrors.movementAt = 'Indicá la fecha y hora.';
    }
    return validationErrors;
  };

  const handleMediumChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, medium: event.target.value as MovementMediumValue }));
    setErrors((prev) => ({ ...prev, medium: undefined }));
  };

  const handleCurrencyChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, currency: event.target.value as 'ARS' | 'USD' | '' }));
    setErrors((prev) => ({ ...prev, currency: undefined }));
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeAmountInput(event.target.value);
    setForm((prev) => ({ ...prev, amount: sanitized }));
    setErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleReferenceChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, reference: event.target.value }));
  };

  const handleMovementAtChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, movementAt: event.target.value }));
    setErrors((prev) => ({ ...prev, movementAt: undefined }));
  };

  const handleContactInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setContactInput(value);
    if (!value.trim()) {
      setSelectedContact(null);
      setSelectedOperation(null);
      setOperationInput('');
      setOperationInfoVisible(false);
      setOperationDropdownVisible(false);
      operationSearch.reset();
    } else {
      setSelectedContact(null);
    }
    if (value.trim().length > 2) {
      clientSearch.setQuery(value.trim());
    } else {
      clientSearch.setQuery('');
    }
    setContactDropdownVisible(true);
  };

  const handleOperationInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setOperationInput(value);
    setSelectedOperation(null);
    setOperationInfoVisible(false);
    setOperationDropdownVisible(true);
    if (value.trim().length > 3) {
      operationSearch.setQuery(value.trim());
    } else {
      operationSearch.setQuery('');
    }
  };

  const handleSelectContact = (contact: ClientSummary) => {
    setSelectedContact(contact);
    setContactInput(contact.fullName || contact.shortName || '');
    setContactDropdownVisible(false);
    setSelectedOperation(null);
    setOperationInput('');
    setOperationInfoVisible(false);
    setOperationDropdownVisible(true);
    operationSearch.setQuery('');
    operationSearch.refresh();
  };

  const handleSelectOperation = (operation: OperationSuggestion) => {
    setSelectedOperation(operation);
    setOperationInput(operation.code || '');
    setOperationInfoVisible(true);
    setOperationDropdownVisible(false);

    setForm((prev) => ({
      ...prev,
      currency: operation.currency === 'USD' ? 'USD' : 'ARS',
      amount: operation.amount ? String(operation.amount) : prev.amount,
      medium: (operation.medium as MovementMediumValue) || prev.medium,
      type: (operation.direction as MovementTypeValue) || prev.type,
      reference: prev.reference || operation.code || prev.reference,
    }));
    setErrors((prev) => ({
      ...prev,
      currency: undefined,
      amount: undefined,
    }));
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const handleFiles = async (files: FileList) => {
    const items = Array.from(files);
    const accepted: File[] = [];
    items.forEach((file) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        onShowToast({
          type: 'warning',
          message: 'El archivo es demasiado grande (máx. 5MB).',
        });
        return;
      }
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) {
        onShowToast({
          type: 'warning',
          message: 'Tipo de archivo no permitido. Solo PDF e imágenes.',
        });
        return;
      }
      accepted.push(file);
    });

    if (!accepted.length) {
      return;
    }

    const formData = new FormData();
    accepted.forEach((file) => formData.append('files', file));

    try {
      setUploadingAttachments(true);
      const response = await fetch('/api/treasury/movements/attachments', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('No se pudo subir el archivo.');
      }
      const payload = await response.json();
      const uploaded = Array.isArray(payload.attachments) ? payload.attachments : [];
      const mapped: AttachmentItem[] = uploaded.map((item: any) => ({
        id: `${item.url || item.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        url: item.url,
        name: item.name,
        type: item.mimeType,
        size: item.size,
      }));
      setAttachments((prev) => [...prev, ...mapped]);
      onShowToast({
        type: 'success',
        message: 'Adjuntos cargados correctamente.',
      });
    } catch (error) {
      onShowToast({
        type: 'error',
        message: (error as Error).message || 'No pudimos subir los archivos.',
      });
    } finally {
      setUploadingAttachments(false);
    }
  };

  const handleDropZoneDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDropZoneDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDropZoneDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    if (event.dataTransfer.files) {
      handleFiles(event.dataTransfer.files);
    }
  };

  const handleSaveDraft = () => {
    const draft: MovementDraft = {
      form,
      contactId: selectedContact?.id,
      contactName: contactInput || selectedContact?.fullName || null,
      operation: selectedOperation,
      attachments,
      savedAt: Date.now(),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    onShowToast({
      type: 'success',
      message: 'Borrador guardado localmente.',
    });
  };

  const handleCreateNewContact = () => {
    setIsNewClientModalOpen(true);
    setContactDropdownVisible(false);
  };

  const handleCloseNewClientModal = () => {
    setIsNewClientModalOpen(false);
  };

  const handleNewClientCreated = (client: ClientSummary) => {
    handleSelectContact(client);
    setIsNewClientModalOpen(false);
    recentClients.refresh();
    onShowToast({
      type: 'success',
      message: 'Contacto creado correctamente.',
    });
  };

  const buildPayload = (values: FormValues): CreateTreasuryMovementPayload => {
    const amountNumber = Number(values.amount.replace(',', '.'));
    const metadata: Record<string, unknown> = {};

    if (attachments.length) {
      metadata.attachments = attachments.map(({ file, url, name, type, size, id }) => ({
        id,
        name: name || file?.name,
        type: type || file?.type,
        size: size || file?.size,
        url,
      }));
    }

    const payload: CreateTreasuryMovementPayload = {
      type: values.type || 'incoming',
      medium: values.medium || 'cash',
      currency: values.currency || 'ARS',
      amount: amountNumber,
      movementAt: values.movementAt ? new Date(values.movementAt).toISOString() : undefined,
      contactId: selectedContact?.id ?? undefined,
      reference: values.reference ? values.reference.trim() : undefined,
      description: values.reference ? values.reference.trim() : undefined,
      metadata,
    };

    if (selectedOperation) {
      payload.operation = {
        id: selectedOperation.id,
        model: selectedOperation.model,
      };
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!canManageTreasury) {
      onShowToast({ type: 'warning', message: 'No tenés permiso para registrar movimientos de tesorería.' });
      return;
    }

    const validationErrors = validateForm(form);
    if (hasValidationErrors(validationErrors)) {
      setErrors(validationErrors);
      return;
    }

    setSubmitError(null);
    try {
      const payload = buildPayload(form);
      const response = await createMovement(payload);
      if (response?.movement) {
        onSuccess(response.movement);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        onShowToast({
          type: 'success',
          message: `Movimiento ${response.movement.movementCode ?? ''} registrado correctamente.`,
        });
      }
      onClose();
    } catch (error) {
      setSubmitError(error as ApiError);
    }
  };

  const renderContactDropdown = () => {
    if (!contactDropdownVisible) return null;

    const searchTerm = contactInput.trim();
    const searchActive = searchTerm.length > 2;
    const suggestions = searchActive ? clientSearch.suggestions.slice(0, 10) : [];
    const recent = recentClients.recent
      .filter((contact) => !suggestions.some((item) => item.id === contact.id))
      .slice(0, 8);

    return (
      <div className="absolute z-20 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 divide-y">
        <div className="p-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>{searchActive ? 'Resultados' : 'Buscar contacto'}</span>
            {clientSearch.loading && (
              <span className="flex items-center text-gray-400 text-[11px]">
                <i className="fa-solid fa-spinner fa-spin mr-1" />
                Buscando
              </span>
            )}
          </div>
          {searchActive && clientSearch.error && (
            <div className="text-sm text-red-600">
              {clientSearch.error.message || 'Error al buscar contactos.'}
            </div>
          )}
          {searchActive && !clientSearch.loading && !clientSearch.error && suggestions.length === 0 && (
            <div className="text-sm text-gray-500">No se encontraron contactos</div>
          )}
          {searchActive &&
            !clientSearch.loading &&
            !clientSearch.error &&
            suggestions.map((contact) => (
              <button
                key={contact.id}
                type="button"
                className="w-full text-left p-3 hover:bg-gray-50 rounded-md"
                onClick={() => handleSelectContact(contact)}
              >
                <div className="font-medium text-gray-900">{contact.fullName}</div>
                <div className="text-sm text-gray-500">
                  {contact.contactType} • {contact.cuit || '—'}
                </div>
              </button>
            ))}
          {!searchActive && (
            <div className="text-sm text-gray-500">Escribí al menos 3 letras para buscar.</div>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-b-lg">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center justify-between">
            <span>Últimos contactos</span>
            {recentClients.loading && (
              <span className="flex items-center text-gray-400 text-[11px]">
                <i className="fa-solid fa-spinner fa-spin mr-1" />
                Cargando
              </span>
            )}
          </div>
          {recentClients.error && (
            <div className="text-sm text-red-600">
              {recentClients.error.message || 'No pudimos cargar los contactos recientes.'}
            </div>
          )}
          {!recentClients.loading && !recentClients.error && recent.length === 0 && (
            <div className="text-sm text-gray-500">Todavía no hay contactos recientes.</div>
          )}
          {!recentClients.loading &&
            !recentClients.error &&
            recent.map((contact) => (
              <button
                key={`recent-${contact.id}`}
                type="button"
                className="w-full text-left p-3 hover:bg-white rounded-md border border-transparent hover:border-gray-200 mb-2 last:mb-0"
                onClick={() => handleSelectContact(contact)}
              >
                <div className="font-medium text-gray-900">{contact.fullName}</div>
                <div className="text-sm text-gray-500">
                  {contact.contactType} • {contact.cuit || '—'}
                </div>
              </button>
            ))}
        </div>
      </div>
    );
  };

  const renderOperationSuggestions = () => {
    if (!operationDropdownVisible) return null;

    const hasQuery = operationInput.trim().length > 3;
    const hasContact = Boolean(selectedContact);

    if (!hasQuery && !hasContact) {
      return (
        <div className="mt-2 text-sm text-gray-500">
          Seleccioná un contacto o escribí al menos 4 caracteres para buscar operaciones.
        </div>
      );
    }

    if (operationSearch.loading) {
      return (
        <div className="mt-2 text-sm text-gray-500 flex items-center">
          <i className="fa-solid fa-spinner fa-spin mr-2" />
          Buscando operaciones…
        </div>
      );
    }

    if (operationSearch.error) {
      return (
        <div className="mt-2 text-sm text-red-600">
          {operationSearch.error.message || 'Error al buscar operaciones.'}
        </div>
      );
    }

    if (!operationSearch.suggestions.length) {
      return (
        <div className="mt-2 text-sm text-gray-500">
          {hasContact ? 'No encontramos operaciones recientes para este contacto.' : 'No se encontraron operaciones.'}
        </div>
      );
    }

    return (
      <div className="mt-2 border border-gray-200 rounded-lg divide-y">
        {operationSearch.suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            type="button"
            className="w-full text-left p-3 hover:bg-gray-50"
            onClick={() => handleSelectOperation(suggestion)}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{suggestion.code || 'Operación'}</div>
                <div className="text-sm text-gray-500">
                  {suggestion.currency} {new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2 }).format(suggestion.amount)}{' '}
                  • {suggestion.status || '—'}
                </div>
              </div>
              <i className="fa-solid fa-circle-chevron-right text-gray-400" />
            </div>
          </button>
        ))}
      </div>
    );
  };

  const operationInfo = useMemo(() => {
    if (!selectedOperation) return null;
    const formattedAmount = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: selectedOperation.currency,
    }).format(selectedOperation.amount);
    return (
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <i className="fa-solid fa-info-circle text-blue-600 mr-2" />
          <div className="text-sm text-blue-800">
            <div className="font-medium">Operación encontrada</div>
            <div>
              {selectedOperation.code} • {formattedAmount}{' '}
              {selectedOperation.movementType ? `• ${selectedOperation.movementType}` : ''}
            </div>
          </div>
        </div>
      </div>
    );
  }, [selectedOperation]);

  const modalContent = (
    <div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              type="button"
              className="text-primary font-medium"
              onClick={onClose}
            >
              Tesorería
            </button>
            <i className="fa-solid fa-chevron-right text-xs" />
            <span>Nuevo movimiento</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-2">Registrar nuevo movimiento</h1>
              <p className="text-gray-600">Cargá manualmente un ingreso o egreso de fondos</p>
            </div>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 text-xl"
              onClick={onClose}
            >
              <i className="fa-solid fa-times" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          {(submitError || createError) && (
            <div className="mb-4">
              <Alert
                type="error"
                message={submitError?.message || createError?.message || 'Ocurrió un error inesperado.'}
              />
            </div>
          )}
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-8" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Datos del movimiento</h3>
                <MovementTypeSelector
                  value={form.type}
                  onChange={(next) => {
                    setForm((prev) => ({ ...prev, type: next }));
                    setErrors((prev) => ({ ...prev, type: undefined }));
                  }}
                  error={errors.type}
                />

                <div className="mb-6">
                  <label htmlFor="medium" className="block text-sm font-medium text-gray-700 mb-2">
                    Medio *
                  </label>
                  <select
                    id="medium"
                    name="medium"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.medium}
                    onChange={handleMediumChange}
                  >
                    <option value="">Seleccionar medio</option>
                    {MEDIUM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Define si el movimiento se realiza en caja o por cuenta bancaria
                  </p>
                  {errors.medium && <div className="text-sm text-red-600 mt-1">{errors.medium}</div>}
                </div>

                <div className="mb-6">
                  <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda *
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.currency}
                    onChange={handleCurrencyChange}
                  >
                    <option value="">Seleccionar moneda</option>
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar Estadounidense</option>
                  </select>
                  {errors.currency && <div className="text-sm text-red-600 mt-1">{errors.currency}</div>}
                </div>

                <div className="mb-6">
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Monto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 font-medium">
                      {form.currency ? currencySymbol : ''}
                    </span>
                    <input
                      type="text"
                      id="amount"
                      name="amount"
                      className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="0,00"
                      value={form.amount}
                      onChange={handleAmountChange}
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Usá coma o punto para decimales</p>
                  {errors.amount && <div className="text-sm text-red-600 mt-1">{errors.amount}</div>}
                </div>

                <div className="mb-6">
                  <label htmlFor="movementAt" className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha y hora
                  </label>
                  <input
                    type="datetime-local"
                    id="movementAt"
                    name="movementAt"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    value={form.movementAt}
                    onChange={handleMovementAtChange}
                  />
                  {errors.movementAt && (
                    <div className="text-sm text-red-600 mt-1">{errors.movementAt}</div>
                  )}
                </div>

                <div className="mb-0">
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia o descripción
                  </label>
                  <textarea
                    id="reference"
                    name="reference"
                    rows={3}
                    maxLength={200}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    placeholder="Descripción del movimiento..."
                    value={form.reference}
                    onChange={handleReferenceChange}
                  />
                  <div className="flex justify-between mt-1">
                    <div className="text-sm text-gray-500">Opcional</div>
                    <div
                      className={`text-sm ${form.reference.length > 180 ? 'text-warning' : 'text-gray-500'}`}
                    >
                      {form.reference.length}/200
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Asociaciones</h3>
                <div className="mb-6" ref={contactInputRef}>
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
                    Contacto vinculado
                  </label>
                  <div className="flex space-x-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        id="contact"
                        name="contact"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Buscar contacto..."
                        value={contactInput}
                        onChange={handleContactInputChange}
                        onFocus={() => {
                          setContactDropdownVisible(true);
                          if (!recentClients.recent.length) {
                            recentClients.refresh();
                          }
                        }}
                        autoComplete="off"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <i className="fa-solid fa-search text-gray-400" />
                      </div>
                      {renderContactDropdown()}
                    </div>
                    <button
                      type="button"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      onClick={handleCreateNewContact}
                    >
                      <i className="fa-solid fa-plus mr-2" />
                      Nuevo
                    </button>
                  </div>
                </div>

                <div className="mb-6" ref={operationInputRef}>
                  <label htmlFor="operation" className="block text-sm font-medium text-gray-700 mb-2">
                    Operación asociada
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="operation"
                      name="operation"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Buscar operación por ID (#FT-000123)..."
                      value={operationInput}
                      onChange={handleOperationInputChange}
                      onFocus={() => {
                        setOperationDropdownVisible(true);
                        if (selectedContact && !operationSearch.loading && operationSearch.suggestions.length === 0) {
                          operationSearch.refresh();
                        }
                      }}
                      autoComplete="off"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <i className="fa-solid fa-search text-gray-400" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Opcional - Si se selecciona, autocompletará moneda y monto sugerido
                  </p>
                  {renderOperationSuggestions()}
                  {operationInfoVisible && operationInfo}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Adjuntos</label>
                  <div
                    className={`drop-zone border-2 border-dashed border-gray-300 rounded-lg p-6 text-center ${
                      isDragOver ? 'dragover' : ''
                    }`}
                    onDragOver={handleDropZoneDragOver}
                    onDragLeave={handleDropZoneDragLeave}
                    onDrop={handleDropZoneDrop}
                  >
                    <div className="flex flex-col items-center">
                      <i className="fa-solid fa-cloud-upload-alt text-4xl text-gray-400 mb-3" />
                      <div className="text-gray-600 mb-2">Arrastrá archivos aquí o</div>
                      <label className="text-primary hover:text-blue-700 font-medium cursor-pointer">
                        seleccioná archivos
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(event) => {
                            if (event.target.files) {
                              handleFiles(event.target.files);
                            }
                          }}
                        />
                      </label>
                      <div className="text-sm text-gray-500 mt-2">
                        PDF o imágenes (máx. 5MB cada uno)
                      </div>
                      {uploadingAttachments && (
                        <div className="text-sm text-gray-500 mt-2 flex items-center">
                          <i className="fa-solid fa-spinner fa-spin mr-2" />
                          Subiendo archivos...
                        </div>
                      )}
                    </div>
                  </div>
                  <AttachmentList items={attachments} onRemove={handleRemoveAttachment} />
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">* Campos obligatorios</div>
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                onClick={handleSaveDraft}
              >
                Guardar borrador
              </button>
              <button
                type="button"
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                onClick={handleSubmit}
                disabled={submitting || permissionsLoading || !canManageTreasury}
                title={
                  !canManageTreasury
                    ? 'Necesitás permiso de Tesorería para registrar movimientos.'
                    : undefined
                }
              >
                <span>Registrar movimiento</span>
                {submitting && <i className="fa-solid fa-spinner fa-spin ml-2" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!open) return null;

  return (
    <>
      {modalContent}
      <NewClientModal
        open={isNewClientModalOpen}
        onClose={handleCloseNewClientModal}
        onCreated={handleNewClientCreated}
        defaultOwner="Tesorería"
        defaultType="client"
      />
    </>
  );
};
