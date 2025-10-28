import { ClientSummary } from './client';

export type TransactionType = 'buy' | 'sell';

export interface TransactionAsset {
  code: string;
  label: string;
}

export interface TransactionSettlementLine {
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
  computedPercentage: number;
}

export interface TransactionSettlement {
  mode: 'simple' | 'compound';
  simpleMethod: string | null;
  lines: TransactionSettlementLine[];
  totalPercentage: number;
  isComplete: boolean;
}

export interface TransactionAccountingEntry {
  action: 'settlement_completed';
  performedAt: string | null;
  performedBy: string | null;
  metadata: {
    direction?: string | null;
    currency?: string | null;
    entries?: Array<{
      movementType: 'cash' | 'transfer' | 'usd';
      method: string;
      amount: number;
    }>;
  };
}

export interface TransactionSettlementImpact {
  currency: string | null;
  direction: 'incoming' | 'outgoing' | null;
  entries: Array<{
    movementType: 'cash' | 'transfer' | 'usd';
    method: string;
    amount: number;
  }>;
  balances: Array<{
    key: string;
    currency: string;
    amount: number;
    updatedAt: string;
  }>;
}

export interface TransactionDraft {
  id: string;
  clientId: string | null;
  client?: ClientSummary | null;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  apr: number;
  marketApr: number;
  incomingAmount: number;
  outgoingAmount: number;
  marginPercentage: number;
  status: 'draft' | 'pending' | 'registered' | 'completed' | 'cancelled' | 'voided';
  currentStep: number;
  operationCode: string | null;
  completedAt: string | null;
  voidedAt?: string | null;
  voidedBy?: string | null;
  voidReason?: string | null;
  settlement: TransactionSettlement;
  accountingAudit?: TransactionAccountingEntry[];
  settlementImpact?: TransactionSettlementImpact;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDraftPayload {
  clientId: string;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  apr: number;
  marketApr: number;
  incomingAmount: number;
  outgoingAmount: number;
  notes?: string | null;
}

export interface TransactionSettlementLinePayload {
  method: string;
  allocationType: 'percentage' | 'amount';
  value: number;
}

export interface TransactionSettlementPayload {
  mode: 'simple' | 'compound';
  simpleMethod?: string | null;
  lines?: TransactionSettlementLinePayload[];
}
