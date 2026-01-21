import { useCallback, useEffect, useMemo, useState } from 'react';
import { api, handleApiError } from '../../utils/api';
import { ApiError } from '../../types/auth';
import { DEFAULT_LOGISTICS_FILTERS, LogisticsAttachment, LogisticsFilters, LogisticsMetrics, LogisticsOperation, LogisticsOperationRecord, LogisticsOperationsResponse, LogisticsTimelineEntry, OperationStatus, OperationType } from '../../types/logistics';

type PaginationState = {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

const toOperationType = (type: LogisticsOperationRecord['type']): OperationType => {
  const normalized = type.toLowerCase();
  if (normalized === 'transferencia') {
    return 'transferencia';
  }
  if (normalized === 'retiro') {
    return 'retiro';
  }
  if (normalized === 'custodia') {
    return 'custodia';
  }
  return 'entrega';
};

const toTimelineState = (status: LogisticsOperationRecord['timeline'][number]['status']): LogisticsTimelineEntry['state'] => {
  if (status === 'current') {
    return 'current';
  }
  if (status === 'completed') {
    return 'completed';
  }
  return 'upcoming';
};

const toAttachmentType = (icon?: string | null): LogisticsAttachment['type'] => {
  if (!icon) {
    return 'document';
  }
  if (icon.includes('image')) {
    return 'image';
  }
  if (icon.includes('pdf')) {
    return 'pdf';
  }
  return 'document';
};

const mapRecordToOperation = (record: LogisticsOperationRecord): LogisticsOperation => {
  const amountValue = record.amount?.value ?? null;
  const currency = record.amount?.currency ?? 'ARS';
  const timeline: LogisticsTimelineEntry[] = (record.timeline ?? []).map((step, index) => {
    const timestamp = step.timestamp ? new Date(step.timestamp).toISOString() : record.datetime;
    const author = step.author?.trim() || 'Sistema';
    return {
      id: `${record.id}-tl-${index}`,
      title: step.label,
      description: step.status === 'pending' ? 'Paso pendiente de ejecución' : `Actualizado por ${author}`,
      date: timestamp,
      user: author,
      state: toTimelineState(step.status),
    };
  });

  const attachments: LogisticsAttachment[] = (record.attachments ?? []).map((attachment, index) => ({
    id: `${record.id}-att-${index}`,
    name: attachment.name,
    type: toAttachmentType(attachment.icon),
    size: attachment.size ?? null,
    url: attachment.url ?? null,
  }));

  const metadata = record.metadata ?? {};
  const note = typeof metadata?.note === 'string' ? metadata.note : metadata?.notes;
  const fallbackNote = `Operación ${record.type.toLowerCase()} gestionada por ${record.responsible || 'equipo logístico'}.`;

  return {
    id: record.id,
    operationCode: record.operationCode,
    date: record.datetime,
    type: toOperationType(record.type),
    contact: record.contact,
    route: record.route,
    origin: record.origin,
    destination: record.destination,
    status: record.state as OperationStatus,
    amount: amountValue,
    currency,
    responsible: record.responsible || 'Sin asignar',
    notes: (note && note.length > 0 ? note : fallbackNote) || fallbackNote,
    timeline,
    attachments,
    archived: Boolean(record.archived),
  };
};

const buildQueryParams = (filters: LogisticsFilters, pagination: Pick<PaginationState, 'page' | 'limit'>) => ({
  search: filters.search,
  type: filters.operationType,
  state: filters.status,
  contact: filters.contact,
  responsible: filters.responsible,
  dateFrom: filters.dateFrom,
  dateTo: filters.dateTo,
  archived: filters.showArchived ? 'archived' : '',
  page: pagination.page,
  limit: pagination.limit,
});

export const useLogisticsOperations = () => {
  const [filters, setFilters] = useState<LogisticsFilters>(DEFAULT_LOGISTICS_FILTERS);
  const [operations, setOperations] = useState<LogisticsOperation[]>([]);
  const [metrics, setMetrics] = useState<LogisticsMetrics | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 25,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const { page, limit } = pagination;

  const fetchOperations = useCallback(async () => {
    setLoading(true);
    try {
      const response = (await api.getLogisticsOperations(
        buildQueryParams(filters, { page, limit })
      )) as LogisticsOperationsResponse;

      setOperations(response.data.map(mapRecordToOperation));
      setMetrics(response.metrics);
      setPagination({
        page: response.pagination.page,
        limit: response.pagination.limit,
        totalItems: response.pagination.totalItems,
        totalPages: response.pagination.totalPages,
      });
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  useEffect(() => {
    fetchOperations();
  }, [fetchOperations]);

  const updateFilters = useCallback((updater: Partial<LogisticsFilters> | ((prev: LogisticsFilters) => Partial<LogisticsFilters>)) => {
    setFilters((prev) => {
      const nextPartial = typeof updater === 'function' ? updater(prev) : updater;
      return {
        ...prev,
        ...nextPartial,
      };
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_LOGISTICS_FILTERS);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page: Math.max(1, page) }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit: Math.min(Math.max(limit, 5), 100), page: 1 }));
  }, []);

  const contacts = useMemo(() => {
    const unique = new Set<string>();
    operations.forEach((operation) => {
      if (operation.contact) {
        unique.add(operation.contact);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [operations]);

  const responsibles = useMemo(() => {
    const unique = new Set<string>();
    operations.forEach((operation) => {
      if (operation.responsible && operation.responsible !== 'Sin asignar') {
        unique.add(operation.responsible);
      }
    });
    return Array.from(unique).sort((a, b) => a.localeCompare(b, 'es'));
  }, [operations]);

  return {
    operations,
    metrics,
    filters,
    pagination,
    loading,
    error,
    refresh: fetchOperations,
    updateFilters,
    resetFilters,
    setPage,
    setLimit,
    contacts,
    responsibles,
  };
};

export type UseLogisticsOperationsReturn = ReturnType<typeof useLogisticsOperations>;

export const useLogisticsOperationDetail = (operationId?: string | null) => {
  const [operation, setOperation] = useState<LogisticsOperationRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(operationId));
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOperation = useCallback(async () => {
    if (!operationId) {
      setOperation(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = (await api.getLogisticsOperationById(operationId)) as LogisticsOperationRecord;
      setOperation(response);
    } catch (err) {
      setError(handleApiError(err));
      setOperation(null);
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    fetchOperation();
  }, [fetchOperation]);

  return {
    operation,
    loading,
    error,
    refresh: fetchOperation,
  };
};
