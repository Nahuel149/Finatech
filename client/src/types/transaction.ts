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

export interface TransactionDraft {
  id: string;
  clientId: string | null;
  client?: ClientSummary | null;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  subtype: string;
  apr: number;
  marketApr: number;
  incomingAmount: number;
  outgoingAmount: number;
  marginPercentage: number;
  status: 'draft' | 'pending' | 'registered' | 'completed' | 'cancelled';
  currentStep: number;
  operationCode: string | null;
  completedAt: string | null;
  settlement: TransactionSettlement;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionDraftPayload {
  clientId: string;
  type: TransactionType;
  incomingAsset: TransactionAsset;
  outgoingAsset: TransactionAsset;
  subtype: string;
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
