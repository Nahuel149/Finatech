import { TransactionType } from './transaction';

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
  type?: string | null;
  icon?: string | null;
  color?: string | null;
}

export interface LogisticsAddressOption {
  id: string;
  label: string;
  formatted: string;
  placeId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
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
  archived?: boolean;
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

export type LogisticsIncidentSeverity = 'baja' | 'media' | 'alta' | 'critica';
export type LogisticsIncidentStatus = 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';

export interface LogisticsIncidentDocument {
  id?: string;
  name: string;
  type: string;
  size?: string | null;
  url?: string | null;
  uploadedBy?: string | null;
  uploadedAt?: string | null;
  status?: string | null;
}

export interface LogisticsIncidentItem {
  id?: string;
  code: string;
  description: string;
  quantity: number;
  unit?: string | null;
  status?: string;
  location?: string | null;
}

export type LogisticsIncidentHistoryType =
  | 'created'
  | 'updated'
  | 'in_review'
  | 'comment'
  | 'resolved'
  | 'cancelled';

export interface LogisticsIncidentHistoryEntry {
  id?: string;
  action: string;
  description?: string | null;
  date: string;
  user: string;
  type: LogisticsIncidentHistoryType;
}

export interface LogisticsIncidentResolutionDetails {
  resolutionType?: string | null;
  resolutionDescription?: string | null;
  resolvedBy?: string | null;
  resolutionDate?: string | null;
  followUpActions?: string[];
}

export interface LogisticsIncident {
  id: string;
  incidentCode: string;
  type?: string;
  status: LogisticsIncidentStatus;
  severity: LogisticsIncidentSeverity;
  reportDate: string;
  resolutionDate?: string | null;
  responsible?: string | null;
  reportedBy?: string | null;
  associatedMovement?: string | null;
  logisticsOrderId?: string | null;
  description: string;
  operationalImpacts: string[];
  involvedItems: LogisticsIncidentItem[];
  attachedDocuments: LogisticsIncidentDocument[];
  changeHistory: LogisticsIncidentHistoryEntry[];
  resolutionDetails?: LogisticsIncidentResolutionDetails | null;
  createdAt?: string;
  updatedAt?: string;
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
  archived?: boolean;
}

export interface LogisticsOperationUpdatePayload {
  contact?: string;
  responsible?: string;
  origin?: string;
  destination?: string;
  route?: string;
  date?: string;
  type?: OperationType;
  amount?: {
    value: number | null;
    currency: string;
  };
  notes?: string;
}

export interface LogisticsFilters {
  search: string;
  operationType: '' | OperationType;
  status: '' | OperationStatus;
  dateFrom: string;
  dateTo: string;
  contact: string;
  responsible: string;
  showArchived: boolean;
}

export const DEFAULT_LOGISTICS_FILTERS: LogisticsFilters = {
  search: '',
  operationType: '',
  status: '',
  dateFrom: '',
  dateTo: '',
  contact: '',
  responsible: '',
  showArchived: false,
};

export type LogisticsOrderType = 'RETIRO' | 'ENTREGA';
export type LogisticsOrderStatus =
  | 'BORRADOR'
  | 'PROGRAMADA'
  | 'ASIGNADA'
  | 'EN_CAMINO'
  | 'EN_SITIO'
  | 'COMPLETADA'
  | 'COMPLETADA_TOTAL'
  | 'COMPLETADA_PARCIAL'
  | 'DISCREPANCIA'
  | 'CANCELADA';
export type LogisticsOrderItemType = 'CURRENCY' | 'CHEQUE' | 'METAL' | 'OTHER';
export type LogisticsHandoverVerificationMethod = 'OTP' | 'QR' | 'DNI';

export interface LogisticsOrderItemMetadata {
  bank?: string;
  number?: string;
  dueDate?: string;
  metalType?: string;
  purity?: string;
  weight?: number;
  description?: string;
}

export interface LogisticsOrderItem {
  id?: string;
  assetCode: string;
  assetType: LogisticsOrderItemType;
  expectedAmount: number;
  metadata: LogisticsOrderItemMetadata;
  notes?: string | null;
  receivedAmount?: number | null;
  pendingAmount?: number | null;
  discrepancyFlag?: boolean;
  discrepancyReason?: string | null;
}

export type LogisticsEvidenceType = 'DNI_PHOTO' | 'SIGNATURE' | 'PACKAGE_PHOTO' | 'GPS' | string;

export interface LogisticsEvidenceMetadata {
  fileName?: string;
  mimeType?: string;
  size?: number;
  note?: string | null;
  gpsLat?: number;
  gpsLng?: number;
  [key: string]: unknown;
}

export interface LogisticsEvidence {
  id?: string;
  type: LogisticsEvidenceType;
  url: string;
  createdAt?: string;
  metadata?: LogisticsEvidenceMetadata | null;
}

export interface LogisticsEvidenceUploadFile {
  name: string;
  type: string;
  size: number;
  lastModified?: number;
  dataUrl: string;
}

export interface LogisticsEvidenceUploadPayload {
  type: LogisticsEvidenceType | string;
  files: LogisticsEvidenceUploadFile[];
}

export interface LogisticsOrderTimelineEvent {
  id?: string;
  type: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  createdBy?: string | null;
}

export interface LogisticsHandoverVerification {
  method: LogisticsHandoverVerificationMethod | string | null;
  requiresDni?: boolean;
  valueLast4?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: string | null;
  verifiedMethod?: LogisticsHandoverVerificationMethod | string | null;
  verifiedValueLast4?: string | null;
  verifiedDni?: boolean;
}

export interface LogisticsOrderBalance {
  assetCode: string;
  assetLabel: string;
  role: 'incoming' | 'outgoing';
  totalAmount: number;
  allocatedAmount: number;
  pendingAmount: number;
}

export interface LogisticsOrderOperationAssets {
  code: string;
  label: string;
  amount: number;
}

export interface LogisticsOrderOperationContext {
  id: string;
  code: string | null;
  type: TransactionType | 'transfer';
  operationModel?: 'Transaction' | 'TransferOperation' | string;
  direction?: 'incoming' | 'outgoing' | null;
  clientId: string | null;
  clientName: string | null;
  clientPhone?: string | null;
  clientAddresses?: LogisticsAddressOption[];
  assets: {
    incoming: LogisticsOrderOperationAssets | null;
    outgoing: LogisticsOrderOperationAssets | null;
  };
  balances: LogisticsOrderBalance[];
}

export interface LogisticsOrderClientSnapshot {
  id: string | null;
  fullName: string | null;
  shortName: string | null;
  contactType: string | null;
  phone: string | null;
  email: string | null;
}

export interface LogisticsOrderSnapshotEntry {
  role: 'incoming' | 'outgoing';
  code: string;
  label: string;
  amount: number;
}

export interface LogisticsOrder {
  id: string;
  orderNumber: string;
  status: LogisticsOrderStatus;
  type: LogisticsOrderType;
  origin: string;
  originAddressId?: string | null;
  destination: string;
  destinationAddressId?: string | null;
  windowStart: string;
  windowEnd: string;
  contactName: string;
  contactPhone: string;
  messengerId?: string | null;
  messenger: string | null;
  assignedTo: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes: string | null;
  internalNotes: string | null;
  items: LogisticsOrderItem[];
  liquidationPercentage: number;
  operationId: string;
  operationCode: string | null;
  operationModel: string | null;
  operationType: TransactionType | string | null;
  operationSnapshot: LogisticsOrderSnapshotEntry[];
  client: LogisticsOrderClientSnapshot | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  requiredEvidences: string[];
  evidences: LogisticsEvidence[];
  geofenceOK: boolean;
  startedAt: string | null;
  arrivedAt: string | null;
  completedAt: string | null;
  receiptId: string | null;
  receiptUrl: string | null;
  handoverVerification?: LogisticsHandoverVerification | null;
  timeline: LogisticsOrderTimelineEvent[];
}

export interface LogisticsOrderListResponse {
  operation: LogisticsOrderOperationContext;
  orders: LogisticsOrder[];
  balances: LogisticsOrderBalance[];
}

export interface LogisticsOrderItemPayload {
  assetCode: string;
  assetType: LogisticsOrderItemType;
  expectedAmount: number;
  metadata?: LogisticsOrderItemMetadata;
  notes?: string | null;
}

export interface LogisticsOrderPayload {
  type: LogisticsOrderType;
  origin: string;
  originAddressId?: string | null;
  destination: string;
  destinationAddressId?: string | null;
  contactName: string;
  contactPhone: string;
  windowStart: string;
  windowEnd: string;
  status: LogisticsOrderStatus;
  items: LogisticsOrderItemPayload[];
  requestId?: string;
  notes?: string | null;
  internalNotes?: string | null;
  messengerId?: string | null;
  messenger?: string | null;
  handoverVerification?: {
    method?: LogisticsHandoverVerificationMethod | string;
    value?: string;
    requiresDni?: boolean;
  } | null;
}

export interface LogisticsAssignedOrdersResponse {
  orders: LogisticsOrder[];
}

export interface LogisticsHandoverItemPayload {
  id: string;
  receivedAmount?: number;
  pendingAmount?: number;
  discrepancyFlag?: boolean;
  discrepancyReason?: string | null;
  metadata?: LogisticsOrderItemMetadata;
}

export interface LogisticsItemsHandoverPayload {
  items: LogisticsHandoverItemPayload[];
  verification?: {
    method?: LogisticsHandoverVerificationMethod | string;
    code?: string;
    token?: string;
    value?: string;
    dniConfirmed?: boolean;
  };
}

export interface LogisticsPartialCompletionItem {
  id: string;
  pendingAmount: number;
  receivedAmount?: number;
  note?: string | null;
}

export interface LogisticsPartialCompletionPayload {
  items: LogisticsPartialCompletionItem[];
  reason?: string;
}

export interface LogisticsDiscrepancyPayload {
  reason: string;
  description: string;
  evidenceIds?: string[];
}

export type LogisticsOfflineActionPayload =
  | LogisticsItemsHandoverPayload
  | LogisticsPartialCompletionPayload
  | LogisticsDiscrepancyPayload
  | LogisticsEvidenceUploadPayload
  | { gpsLat?: number; gpsLng?: number }
  | undefined;

export type LogisticsOfflineActionType =
  | 'start-route'
  | 'arrive'
  | 'update-items'
  | 'complete-total'
  | 'complete-partial'
  | 'report-discrepancy'
  | 'add-evidence';

export interface LogisticsOfflineAction {
  id: string;
  orderId: string;
  type: LogisticsOfflineActionType;
  payload?: LogisticsOfflineActionPayload;
  createdAt: string;
}
