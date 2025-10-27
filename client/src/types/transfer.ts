// Transfer-related types inferred from backend routes and services

export type MovementType = 'cash' | 'transfer';
export type MovementDirection = 'incoming' | 'outgoing';
export type MovementMethod = 'ARS' | 'USD';

export interface TransferDistributionLineInput {
  contactId: string; // Client ID
  method?: MovementMethod; // defaults to 'ARS' in service
  amount: number;
}

export interface TransferDistributionLine {
  lineId: string;
  contactId: string;
  contactName: string | null;
  contactType: string | null;
  method: MovementMethod;
  amount: number;
}

export interface TransferOperation {
  id: string;
  operationCode: string | null;
  movementType: MovementType;
  direction: MovementDirection;
  currency: 'ARS' | 'USD' | string;
  totalAmount: number;
  distributionLines: TransferDistributionLine[];
  status: string;
  confirmedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateTransferPayload {
  movementType: MovementType;
  direction: MovementDirection;
  totalAmount: number;
  distributionLines: TransferDistributionLineInput[];
}

export interface CreateTransferResponse {
  operation: TransferOperation;
  balance: {
    id: string;
    currency: string;
    amount: number;
    updatedAt: string;
  } | null;
  events: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string | null;
  }>;
}

export interface ListTransfersResponse {
  items: TransferOperation[];
}