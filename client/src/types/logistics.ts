// Logistics domain types mapped from backend payloads

export type OperationType = 'entrega' | 'transferencia' | 'retiro' | 'custodia' | 'transferencia-interna';
export type OperationStatus = 'pendiente' | 'en-curso' | 'completado' | 'anulado';

export interface LogisticsApiAmount {
  value: number | null;
  currency: string;
}

export interface LogisticsApiAttachment {
  name: string;
  size?: string | null;
  url?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface LogisticsApiTimelineEntry {
  label: string;
  status: 'pending' | 'current' | 'completed';
  timestamp?: string | Date | null;
  author?: string | null;
}

export interface LogisticsOperationRecord {
  id: string;
  operationCode: string;
  datetime: string;
  type: 'Entrega' | 'Transferencia' | 'Retiro' | 'Custodia';
  state: OperationStatus;
  contact: string;
  route: string;
  origin?: string;
  destination?: string;
  amount: LogisticsApiAmount | null;
  responsible?: string;
  attachments: LogisticsApiAttachment[];
  timeline: LogisticsApiTimelineEntry[];
  metadata?: Record<string, string | null | undefined> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface LogisticsMetrics {
  active: number;
  pendingDeliveries: number;
  internalTransfers: number;
  completedToday: number;
  trends: {
    active: number;
    pendingDeliveries: number;
    internalTransfers: number;
    completedToday: number;
  };
}

export interface LogisticsOperationsResponse {
  data: LogisticsOperationRecord[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  metrics: LogisticsMetrics;
}

export interface LogisticsTimelineEntry {
  id: string;
  title: string;
  description: string;
  date: string;
  user: string;
  state: 'completed' | 'current' | 'upcoming';
}

export interface LogisticsAttachment {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document';
  size?: string | null;
  url?: string | null;
}

export interface LogisticsOperation {
  id: string;
  operationCode: string;
  date: string;
  type: OperationType;
  contact: string;
  route: string;
  origin?: string;
  destination?: string;
  status: OperationStatus;
  amount: number | null;
  currency: string;
  responsible: string;
  notes: string;
  timeline: LogisticsTimelineEntry[];
  attachments: LogisticsAttachment[];
}

export interface LogisticsFilters {
  search: string;
  operationType: '' | OperationType;
  status: '' | OperationStatus;
  dateFrom: string;
  dateTo: string;
  contact: string;
  responsible: string;
}

export const DEFAULT_LOGISTICS_FILTERS: LogisticsFilters = {
  search: '',
  operationType: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  contact: '',
  responsible: '',
};
