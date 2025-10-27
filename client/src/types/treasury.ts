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

export type TreasuryBalanceState = 'positive' | 'negative' | 'zero';

export interface TreasuryGlobalBalanceVariation {
  percentage: number;
  direction: 'up' | 'down' | 'flat';
  windowDays: number;
  currentWindowAmount: number;
  previousWindowAmount: number;
}

export interface TreasuryGlobalBalanceContact {
  id: string | null;
  fullName: string;
  shortName: string | null;
  contactType: string | null;
  status: string | null;
  cuit: string | null;
}

export interface TreasuryGlobalBalanceRow {
  id: string;
  accountKey: string;
  accountLabel: string;
  accountStatus: string;
  currency: string;
  amount: number;
  balanceState: TreasuryBalanceState;
  variation: TreasuryGlobalBalanceVariation;
  lastMovementAt: string | null;
  lastOperation: {
    code: string | null;
    type: string | null;
  } | null;
  contact: TreasuryGlobalBalanceContact;
}

export interface TreasuryGlobalBalanceSummaryCard {
  id: string;
  label: string;
  currency: string;
  amount: number;
  status: string;
  updatedAt: string | null;
  variation: {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    windowDays: number;
  };
}

export interface TreasuryGlobalBalancesFilterOption {
  value: string;
  label: string;
}

export interface TreasuryGlobalBalancesFilters {
  currencies: TreasuryGlobalBalancesFilterOption[];
  accountKeys: TreasuryGlobalBalancesFilterOption[];
  balanceStates: TreasuryGlobalBalancesFilterOption[];
  contactTypes: TreasuryGlobalBalancesFilterOption[];
}

export interface TreasuryGlobalBalancesStats {
  totalBalance: number;
  balanceStates: Record<TreasuryBalanceState, number>;
  totalsByCurrency: Array<{
    currency: string;
    total: number;
  }>;
}

export interface TreasuryGlobalBalancesOverviewResponse {
  generatedAt: string;
  summaryCards: TreasuryGlobalBalanceSummaryCard[];
  filters: TreasuryGlobalBalancesFilters;
  table: {
    items: TreasuryGlobalBalanceRow[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
  stats: TreasuryGlobalBalancesStats;
  appliedFilters: {
    currency: string | null;
    accountKey: string | null;
    contactType: string | null;
    balanceState: TreasuryBalanceState | null;
    search: string | null;
    dateFrom: string | null;
    dateTo: string | null;
  };
}

export interface TreasuryContactBalanceSummaryTotals {
  amount: number;
  count: number;
}

export interface TreasuryContactBalanceSummary {
  balance: {
    amount: number;
    currency: string;
  };
  variation: {
    windowDays: number;
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    currentPeriodNet: number;
    previousPeriodNet: number;
  } | null;
  totals: {
    balance: number;
    incoming: TreasuryContactBalanceSummaryTotals;
    outgoing: TreasuryContactBalanceSummaryTotals;
    net: number;
    lastMovementAt: string | null;
  };
}

export interface TreasuryContactBalanceOperation {
  id: string | null;
  createdAt: string | null;
  currency: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  operation: {
    type: string;
    code: string | null;
    source: string | null;
  };
  status: {
    key: string;
    label: string;
  };
}

export interface TreasuryContactBalanceFilterOptions {
  operationTypes: TreasuryGlobalBalancesFilterOption[];
  currencies: TreasuryGlobalBalancesFilterOption[];
  statuses: TreasuryGlobalBalancesFilterOption[];
}

export interface TreasuryContactBalanceFiltersApplied {
  currency: string | null;
  operationType: string | null;
  status: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  search: string | null;
}

export interface TreasuryContactBalanceDetailResponse {
  contact: {
    id: string;
    fullName: string;
    shortName: string;
    contactType: string;
    status: string;
    cuit: string | null;
    updatedAt: string | null;
  };
  summary: TreasuryContactBalanceSummary;
  filters: {
    options: TreasuryContactBalanceFilterOptions;
    applied: TreasuryContactBalanceFiltersApplied;
  };
  table: {
    items: TreasuryContactBalanceOperation[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
    sort: {
      sortBy: 'date' | 'amount' | 'type';
      sortDirection: 'asc' | 'desc';
    };
  };
  stats: {
    totalsByCurrency: Array<{ currency: string; total: number }>;
    totalOperations: number;
  };
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
