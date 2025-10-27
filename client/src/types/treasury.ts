// Treasury module types inferred from backend treasury service

export type TreasuryMovementType = 'incoming' | 'outgoing' | string;
export type TreasuryMovementMedium = 'cash' | 'transfer' | 'deposit' | string;
export type TreasuryMovementStatus =
  | 'registered'
  | 'compensated'
  | 'cancelled'
  | 'pending'
  | string;

export interface TreasuryContact {
  id: string | null;
  fullName: string;
  shortName?: string;
  contactType?: string;
  status?: string;
  email?: string | null;
}

export interface TreasuryMovementOperationLink {
  id: string | null;
  model: string | null;
  code: string | null;
  type: string | null;
  currency: string | null;
  amount: number;
  matchedAt: string | null;
  matchedBy: string | null;
}

export interface TreasuryMovement {
  id: string | null;
  movementCode: string | null;
  type: TreasuryMovementType;
  medium: TreasuryMovementMedium;
  currency: 'ARS' | 'USD' | string;
  amount: number;
  balanceKey?: string | null;
  status: TreasuryMovementStatus;
  movementAt: string | null;
  contact: TreasuryContact | null;
  description: string | null;
  reference: string | null;
  source: string;
  linkedOperations: TreasuryMovementOperationLink[];
  metadata: Record<string, unknown>;
  createdAt: string | null;
  updatedAt: string | null;
  compensatedAt: string | null;
  compensatedBy: string | null;
  cancelledAt: string | null;
  cancelledBy: string | null;
  cancellationReason: string | null;
  auditTrail?: Array<{
    action: string;
    user: string | null;
    timestamp: string | null;
    metadata: Record<string, unknown>;
  }>;
}

export interface TreasuryMovementsTotals {
  incoming: number;
  outgoing: number;
  net: number;
}

export interface TreasuryMovementsResponse {
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  totals: Record<string, TreasuryMovementsTotals>;
  items: TreasuryMovement[];
}

export interface TreasuryBalancesResponse {
  balances: Array<{
    id: string;
    label: string;
    currency: string;
    amount: number;
    status: string;
    updatedAt: string;
  }>;
}

export interface CreateTreasuryMovementPayload {
  type: TreasuryMovementType;
  medium: TreasuryMovementMedium;
  currency: string;
  amount: number;
  movementAt?: string;
  contactId?: string | null;
  reference?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown>;
  operation?: {
    id: string;
    model?: string | null;
  };
}

export interface CreateTreasuryMovementResponse {
  movement: TreasuryMovement;
  balance: {
    id: string;
    label: string;
    currency: string;
    amount: number;
    status: string;
    updatedAt: string;
  } | null;
}

export interface OperationSuggestion {
  id: string;
  code: string | null;
  model: string;
  amount: number;
  currency: string;
  movementType?: string | null;
  status?: string | null;
  confirmedAt?: string | null;
  description?: string | null;
}

export interface TreasuryLinkedBalanceVariation {
  windowDays: number;
  percentage: number | null;
  direction: 'up' | 'down' | 'flat';
  currentNet: number;
  previousNet: number;
}

export interface TreasuryLinkedBalanceTotals {
  incoming: number;
  outgoing: number;
  net: number;
}

export interface TreasuryLinkedBalanceAccounting {
  accountName: string;
  currency: string;
  balance: number;
  lastOperationAt: string | null;
  state: 'activo' | 'inactivo' | 'sin_movimientos' | string;
}

export interface TreasuryLinkedBalanceContactSummary {
  contact: TreasuryContact;
  totals: TreasuryLinkedBalanceTotals;
  lastMovementAt: string | null;
  movementCount: number;
}

export interface TreasuryLinkedBalanceActivityEntry {
  id: string | null;
  createdAt: string | null;
  ledger: string;
  stage: string;
  amount: number;
  currency: string;
  direction: 'positive' | 'negative';
  operation: {
    id: string | null;
    code: string | null;
    type: string | null;
    source: string | null;
  } | null;
  counterpart: Record<string, unknown> | null;
  contact: TreasuryContact | null;
}

export interface TreasuryLinkedBalanceSummaryEntry {
  id: string;
  label: string;
  currency: string;
  amount: number;
  status: string;
  updatedAt: string;
  variation: TreasuryLinkedBalanceVariation;
  totals: TreasuryLinkedBalanceTotals;
  recentMovements: TreasuryMovement[];
  contacts: TreasuryLinkedBalanceContactSummary[];
  accounting: TreasuryLinkedBalanceAccounting | null;
  activity: TreasuryLinkedBalanceActivityEntry[];
}

export interface TreasuryLinkedBalancesSummaryResponse {
  generatedAt: string;
  balances: TreasuryLinkedBalanceSummaryEntry[];
}

export interface TreasuryLinkedBalanceDetailFilters {
  dateFrom: string | null;
  dateTo: string | null;
  type: string | null;
  contactId: string | null;
  defaults: {
    dateFrom: string;
    dateTo: string;
  };
}

export interface TreasuryLinkedBalanceDetailResponse {
  balance: Omit<TreasuryLinkedBalanceSummaryEntry, 'recentMovements' | 'contacts' | 'activity' | 'totals'> & {
    variation: TreasuryLinkedBalanceVariation;
  };
  filters: TreasuryLinkedBalanceDetailFilters;
  totals: TreasuryLinkedBalanceTotals;
  overallTotals: TreasuryLinkedBalanceTotals;
  movements: {
    items: TreasuryMovement[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  contacts: TreasuryLinkedBalanceContactSummary[];
  activity: TreasuryLinkedBalanceActivityEntry[];
  recentMovements: TreasuryMovement[];
}
