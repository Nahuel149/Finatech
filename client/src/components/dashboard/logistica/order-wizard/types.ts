import { LogisticsOrderItemMetadata, LogisticsOrderItemType, LogisticsOrderStatus, LogisticsOrderType } from '../../../../types/logistics';

export interface LogisticsOrderFormItem {
  id: string;
  assetCode: string;
  assetType: LogisticsOrderItemType;
  expectedAmount: number | '';
  metadata: LogisticsOrderItemMetadata;
  notes?: string;
}

export interface LogisticsOrderFormState {
  type: LogisticsOrderType;
  origin: string;
  originAddressId: string | null;
  destination: string;
  destinationAddressId: string | null;
  contactName: string;
  contactPhone: string;
  windowStart: string;
  windowEnd: string;
  messengerId: string | null;
  messenger: string;
  notes: string;
  internalNotes: string;
  items: LogisticsOrderFormItem[];
}

export type FormFieldErrors = Record<string, string>;
export type FormItemErrors = Record<string, Record<string, string>>;

export type WizardSubmissionMode = Extract<LogisticsOrderStatus, 'BORRADOR' | 'PROGRAMADA'>;

export interface MessengerOption {
  id: string;
  name: string;
  email?: string | null;
  type?: 'seed' | 'user' | string;
}
