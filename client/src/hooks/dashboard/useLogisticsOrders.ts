import { useCallback, useEffect, useRef, useState } from 'react';
import { api, handleApiError } from '../../utils/api';
import { devLog } from '../../utils/devLogger';
import {
  ApiError,
  LogisticsAssignedOrdersResponse,
  LogisticsDiscrepancyPayload,
  LogisticsEvidenceUploadPayload,
  LogisticsItemsHandoverPayload,
  LogisticsOfflineAction,
  LogisticsOfflineActionPayload,
  LogisticsOfflineActionType,
  LogisticsOrder,
  LogisticsOrderBalance,
  LogisticsOrderListResponse,
  LogisticsOrderOperationContext,
  LogisticsOrderPayload,
  LogisticsPartialCompletionPayload,
} from '../../types';

const OFFLINE_QUEUE_STORAGE_KEY = 'logistics_offline_queue';

const readQueueFromStorage = (): LogisticsOfflineAction[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const value = window.localStorage.getItem(OFFLINE_QUEUE_STORAGE_KEY);
    if (!value) {
      return [];
    }
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const persistQueue = (queue: LogisticsOfflineAction[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(OFFLINE_QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // ignore storage errors
  }
};

const createActionId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.round(Math.random() * 1e6)}`;
};

const dataUrlToBlob = (dataUrl: string, fallbackType?: string) => {
  if (!dataUrl) {
    return new Blob([], { type: fallbackType || 'application/octet-stream' });
  }
  const parts = dataUrl.split(',');
  const metadata = parts[0] || '';
  const base64 = parts[1] || '';
  const match = /data:(.*?);base64/.exec(metadata);
  const mimeType = match?.[1] || fallbackType || 'application/octet-stream';
  if (!base64) {
    return new Blob([], { type: mimeType });
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

const buildEvidenceFormData = (payload: LogisticsEvidenceUploadPayload) => {
  if (!payload?.type || !Array.isArray(payload.files) || !payload.files.length) {
    throw new Error('Faltan archivos de evidencia.');
  }
  if (typeof FormData === 'undefined') {
    throw new Error('FormData no esta disponible.');
  }
  const formData = new FormData();
  formData.append('type', payload.type);
  payload.files.forEach((file) => {
    if (!file?.dataUrl) {
      return;
    }
    const blob = dataUrlToBlob(file.dataUrl, file.type);
    formData.append('files', blob, file.name || 'evidence');
  });
  return formData;
};

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState<LogisticsOfflineAction[]>(() => readQueueFromStorage());
  const queueRef = useRef(queue);

  useEffect(() => {
    queueRef.current = queue;
    persistQueue(queue);
  }, [queue]);

  const enqueue = useCallback(
    (action: Omit<LogisticsOfflineAction, 'id' | 'createdAt'>) => {
      const entry: LogisticsOfflineAction = {
        ...action,
        id: createActionId(),
        createdAt: new Date().toISOString(),
      };
      setQueue((current) => [...current, entry]);
      return entry;
    },
    []
  );

  const remove = useCallback((actionId: string) => {
    setQueue((current) => current.filter((action) => action.id !== actionId));
  }, []);

  const clear = useCallback(() => setQueue([]), []);

  return {
    queue,
    enqueue,
    remove,
    clear,
  };
};

export const useLogisticsOrdersByOperation = (operationId?: string | null) => {
  const [operation, setOperation] = useState<LogisticsOrderOperationContext | null>(null);
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [balances, setBalances] = useState<LogisticsOrderBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!operationId) {
      setOperation(null);
      setOrders([]);
      setBalances([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = (await api.getOperationLogisticsOrders(operationId)) as LogisticsOrderListResponse;
      setOperation(response.operation || null);
      setOrders(response.orders || []);
      setBalances(response.balances || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [operationId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return {
    operation,
    orders,
    balances,
    loading,
    error,
    refresh: fetchOrders,
  };
};

export const useMyLogisticsOrders = (initialFilters: Record<string, unknown> = {}) => {
  const [orders, setOrders] = useState<LogisticsOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [filters, setFilters] = useState<Record<string, unknown>>(initialFilters);

  const fetchOrders = useCallback(
    async (override?: Record<string, unknown>) => {
      setLoading(true);
      setError(null);
      try {
        const response = (await api.getMyLogisticsOrders({
          ...filters,
          ...(override || {}),
        })) as LogisticsAssignedOrdersResponse;
        const list = response.orders || [];
        if (typeof window !== 'undefined') {
          devLog('[useMyLogisticsOrders] fetched', list.length, 'orders with filters', filters);
        }
        setOrders(list);
        return list;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const updateFilters = useCallback(
    (next: Record<string, unknown>) => {
      setFilters((current) => ({
        ...current,
        ...next,
      }));
    },
    []
  );

  return {
    orders,
    loading,
    error,
    filters,
    setFilters: updateFilters,
    refresh: fetchOrders,
  };
};

export const useLogisticsOrderDetail = (orderId?: string) => {
  const [order, setOrder] = useState<LogisticsOrder | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState<ApiError | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = (await api.getLogisticsOrder(orderId)) as LogisticsOrder;
      setOrder(response);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    loading,
    error,
    refresh: fetchOrder,
  };
};

export const useCreateOrUpdateLogisticsOrder = (operationId?: string | null) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const createOrder = useCallback(
    async (payload: LogisticsOrderPayload) => {
      if (!operationId) {
        throw new Error('No hay operación seleccionada para crear la orden.');
      }
      setSaving(true);
      setError(null);
      try {
        const response = (await api.createLogisticsOrder(operationId, payload)) as LogisticsOrder;
        return response;
      } catch (err) {
        const apiErr = handleApiError(err);
        setError(apiErr);
        throw apiErr;
      } finally {
        setSaving(false);
      }
    },
    [operationId]
  );

  const updateOrder = useCallback(async (orderId: string, payload: LogisticsOrderPayload) => {
    if (!orderId) {
      throw new Error('El identificador de la orden es requerido.');
    }
    setSaving(true);
    setError(null);
    try {
      const response = (await api.updateLogisticsOrder(orderId, payload)) as LogisticsOrder;
      return response;
    } catch (err) {
      const apiErr = handleApiError(err);
      setError(apiErr);
      throw apiErr;
    } finally {
      setSaving(false);
    }
  }, []);

  const resetError = useCallback(() => setError(null), []);

  return {
    createOrder,
    updateOrder,
    saving,
    error,
    resetError,
  };
};

const shouldQueueError = (error: ApiError) => {
  if (!error) {
    return false;
  }
  if (error.code === 'NETWORK_ERROR') {
    return true;
  }
  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) {
    return true;
  }
  return false;
};

export const useLogisticsOrderActions = () => {
  const [runningAction, setRunningAction] = useState<LogisticsOfflineActionType | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const offlineQueue = useOfflineQueue();
  const retryingRef = useRef(false);

  const resolveArrivePayload = (payload?: LogisticsOfflineActionPayload) => {
    if (payload && typeof payload === 'object') {
      const maybePayload = payload as { gpsLat?: number; gpsLng?: number };
      if ('gpsLat' in maybePayload || 'gpsLng' in maybePayload) {
        return { gpsLat: maybePayload.gpsLat, gpsLng: maybePayload.gpsLng };
      }
    }
    return {};
  };

  const executeAction = useCallback(
    async (action: {
      type: LogisticsOfflineActionType;
      orderId: string;
      payload?: LogisticsOfflineActionPayload;
    }) => {
      switch (action.type) {
        case 'start-route':
          return api.startLogisticsRoute(action.orderId);
        case 'arrive':
          return api.arriveAtLogisticsOrder(action.orderId, resolveArrivePayload(action.payload));
        case 'update-items':
          return api.updateLogisticsOrderItems(action.orderId, action.payload as LogisticsItemsHandoverPayload);
        case 'complete-total':
          return api.completeLogisticsOrderTotal(action.orderId);
        case 'complete-partial':
          return api.completeLogisticsOrderPartial(
            action.orderId,
            action.payload as LogisticsPartialCompletionPayload
          );
        case 'report-discrepancy':
          return api.reportLogisticsDiscrepancy(
            action.orderId,
            action.payload as LogisticsDiscrepancyPayload
          );
        case 'add-evidence': {
          const formData = buildEvidenceFormData(action.payload as LogisticsEvidenceUploadPayload);
          return api.uploadLogisticsEvidence(action.orderId, formData);
        }
        default:
          throw new Error(`Acci?n desconocida: ${action.type}`);
      }
    },
    []
  );

  const runOrQueue = useCallback(
    async (type: LogisticsOfflineActionType, orderId: string, payload?: LogisticsOfflineActionPayload) => {
      setRunningAction(type);
      setError(null);
      try {
        return await executeAction({ type, orderId, payload });
      } catch (err) {
        const apiErr = handleApiError(err);
        if (shouldQueueError(apiErr)) {
          offlineQueue.enqueue({ type, orderId, payload });
        } else {
          setError(apiErr);
        }
        throw apiErr;
      } finally {
        setRunningAction(null);
      }
    },
    [executeAction, offlineQueue]
  );

  const retryPendingActions = useCallback(async () => {
    if (retryingRef.current) {
      return;
    }
    retryingRef.current = true;
    try {
      for (const pending of offlineQueue.queue) {
        try {
          await executeAction(pending);
          offlineQueue.remove(pending.id);
        } catch (err) {
          const apiErr = handleApiError(err);
          setError(apiErr);
          throw apiErr;
        }
      }
    } finally {
      retryingRef.current = false;
    }
  }, [executeAction, offlineQueue, setError]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const handleOnline = () => {
      if (!offlineQueue.queue.length) {
        return;
      }
      retryPendingActions().catch(() => {
        // errors are surfaced via hook state
      });
    };
    window.addEventListener('online', handleOnline);
    if (typeof navigator !== 'undefined' && navigator.onLine && offlineQueue.queue.length) {
      handleOnline();
    }
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [offlineQueue.queue.length, retryPendingActions]);

  return {
    pendingActions: offlineQueue.queue,
    runningAction,
    error,
    startRoute: (orderId: string) => runOrQueue('start-route', orderId),
    arriveOnSite: (orderId: string, payload: { gpsLat?: number; gpsLng?: number }) =>
      runOrQueue('arrive', orderId, payload),
    updateItems: (orderId: string, payload: LogisticsItemsHandoverPayload) =>
      runOrQueue('update-items', orderId, payload),
    completeTotal: (orderId: string) => runOrQueue('complete-total', orderId),
    completePartial: (orderId: string, payload: LogisticsPartialCompletionPayload) =>
      runOrQueue('complete-partial', orderId, payload),
    reportDiscrepancy: (orderId: string, payload: LogisticsDiscrepancyPayload) =>
      runOrQueue('report-discrepancy', orderId, payload),
    uploadEvidence: (orderId: string, payload: LogisticsEvidenceUploadPayload) =>
      runOrQueue('add-evidence', orderId, payload),
    retryPendingActions,
    clearOfflineQueue: offlineQueue.clear,
  };
};
