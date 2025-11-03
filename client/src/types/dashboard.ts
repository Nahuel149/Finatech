// Dashboard-related data types inferred from backend API

export interface TreasuryBalance {
  id: string;
  label: string;
  currency: 'ARS' | 'USD' | 'EUR' | string;
  amount: number;
  status: 'ok' | 'warning' | 'error' | string;
  updatedAt: string; // ISO string
}

export interface DashboardBalancesResponse {
  balances: TreasuryBalance[];
}

export interface DashboardNotification {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  severity?: 'info' | 'warning' | 'error' | 'success';
  actionLabel?: string;
  actionUrl?: string;
  read?: boolean;
  message?: string;
  metadata?: Record<string, unknown> | null;
}

export interface DashboardNotificationsResponse {
  notifications: DashboardNotification[];
}
