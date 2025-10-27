export type IncidentSeverity = 'low' | 'medium' | 'high';
export type IncidentSeverityValue = IncidentSeverity | '';

export interface IncidentOperationalImpact {
  delayedDelivery: boolean;
  requiresManualReview: boolean;
  affectsDocumentation: boolean;
  other: boolean;
  otherDescription: string;
}

export interface IncidentInvolvedItem {
  id: string;
  description: string;
  quantity: number;
  observation: string;
}

export interface IncidentFormData {
  type: string;
  severity: IncidentSeverityValue;
  dateTime: string;
  responsible: string;
  description: string;
  operationalImpact: IncidentOperationalImpact;
  involvedItems: IncidentInvolvedItem[];
  attachments: File[];
}
