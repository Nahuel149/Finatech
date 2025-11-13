import type {
  LogisticsEvidence,
  LogisticsOrderItem,
  LogisticsOrderItemMetadata,
  LogisticsOrderItemType,
  LogisticsOrderType,
} from './logistics';
import type { TreasuryContact } from './treasury';

export type TreasuryReceptionStatus = 'pending' | 'confirmed' | 'omitted' | 'reverted';

export interface TreasuryReceptionEventMetadata {
  reason?: string | null;
  notes?: string | null;
  ip?: string | null;
  location?: string | null;
  amount?: number | null;
  currency?: string | null;
  [key: string]: unknown;
}

export interface TreasuryReceptionEvent {
  id: string;
  type:
    | 'recepcion.confirmada'
    | 'recepcion.omitida'
    | 'recepcion.revertida'
    | 'recepcion.pendiente'
    | string;
  user: {
    id: string | null;
    fullName: string | null;
    avatarUrl?: string | null;
  } | null;
  timestamp: string;
  metadata?: TreasuryReceptionEventMetadata | null;
}

export interface TreasuryReceptionCurrencyTotal {
  currency: string;
  expectedAmount: number;
  receivedAmount: number;
  pendingAmount: number;
}

export interface TreasuryReceptionItem {
  id: string;
  assetCode: string;
  assetLabel?: string | null;
  assetType: LogisticsOrderItemType | string;
  currency: string;
  expectedAmount: number;
  receivedAmount: number;
  pendingAmount: number;
  metadata?: LogisticsOrderItemMetadata;
  sourceItem?: LogisticsOrderItem | null;
}

export interface TreasuryReception {
  id: string;
  receptionCode?: string | null;
  orderId: string;
  orderNumber: string;
  orderType: LogisticsOrderType | string;
  completedAt: string | null;
  courierId?: string | null;
  courierName: string | null;
  courierPhone?: string | null;
  originContact?: TreasuryContact | null;
  destinationContact?: TreasuryContact | null;
  originLabel?: string | null;
  destinationLabel?: string | null;
  items: TreasuryReceptionItem[];
  currencyTotals: TreasuryReceptionCurrencyTotal[];
  receptionStatus: TreasuryReceptionStatus;
  accountingStatus: TreasuryReceptionStatus;
  events: TreasuryReceptionEvent[];
  evidences: LogisticsEvidence[];
  metadata?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface TreasuryReceptionsResponse {
  items: TreasuryReception[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  filters?: Record<string, unknown>;
  summary?: Record<string, unknown>;
}

export interface ConfirmTreasuryReceptionPayload {
  notes?: string;
}

export interface OmitTreasuryReceptionPayload {
  reason: string;
  notes?: string;
}

export interface RevertTreasuryReceptionPayload {
  reason?: string;
  notes?: string;
}
