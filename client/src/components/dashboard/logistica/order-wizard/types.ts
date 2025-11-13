import {
  LogisticsOrderItemMetadata,
  LogisticsOrderItemType,
  LogisticsOrderStatus,
  LogisticsOrderType,
} from '../../../../types';

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
  destination: string;
  contactName: string;
  contactPhone: string;
  windowStart: string;
  windowEnd: string;
  messenger: string;
  notes: string;
  internalNotes: string;
  items: LogisticsOrderFormItem[];
}

export type FormFieldErrors = Record<string, string>;
export type FormItemErrors = Record<string, Record<string, string>>;

export type WizardSubmissionMode = Extract<LogisticsOrderStatus, 'BORRADOR' | 'PROGRAMADA'>;
