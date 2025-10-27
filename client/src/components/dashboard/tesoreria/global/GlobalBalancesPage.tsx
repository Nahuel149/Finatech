import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import {
  GlobalBalancesFilters,
  FilterValues,
} from './GlobalBalancesFilters';
import { GlobalBalancesSummaryCards } from './GlobalBalancesSummaryCards';
import { GlobalBalancesTable } from './GlobalBalancesTable';
import {
  TreasuryBalanceState,
  TreasuryGlobalBalanceRow,
  TreasuryGlobalBalancesOverviewResponse,
} from '../../../../types';
import { useGlobalBalancesOverview } from '../../../../hooks';

type ToastType = 'success' | 'info' | 'warning' | 'error';

interface ToastState {
  type: ToastType;
  message: string;
}

type SortField = 'balance' | 'name' | 'variation' | 'lastMovement';

interface FilterState extends FilterValues {
  page: number;
  limit: number;
  sortBy: SortField;
  sortDirection: 'asc' | 'desc';
}

const DEFAULT_FILTER_STATE: FilterState = {
  currency: 'ALL',
  accountKey: '',
  search: '',
  contactType: '',
  balanceState: '',
  dateFrom: null,
  dateTo: null,
  page: 1,
  limit: 15,
  sortBy: 'balance',
  sortDirection: 'desc',
};

const SORT_MAPPING: Record<string, { sortBy: SortField; sortDirection: 'asc' | 'desc' }> = {
  'balance-desc': { sortBy: 'balance', sortDirection: 'desc' },
  'balance-asc': { sortBy: 'balance', sortDirection: 'asc' },
  'name-asc': { sortBy: 'name', sortDirection: 'asc' },
  'name-desc': { sortBy: 'name', sortDirection: 'desc' },
  'variation-desc': { sortBy: 'variation', sortDirection: 'desc' },
  'variation-asc': { sortBy: 'variation', sortDirection: 'asc' },
  'lastMovement-desc': { sortBy: 'lastMovement', sortDirection: 'desc' },
  'lastMovement-asc': { sortBy: 'lastMovement', sortDirection: 'asc' },
};

const sortValueFromState = (sortBy: SortField, sortDirection: 'asc' | 'desc') => {
  switch (sortBy) {
    case 'name':
      return `name-${sortDirection}`;
    case 'variation':
      return `variation-${sortDirection}`;
    case 'lastMovement':
      return `lastMovement-${sortDirection}`;
    case 'balance':
    default:
      return `balance-${sortDirection}`;
  }
};

const balanceStateLabel = (state: TreasuryBalanceState) => {
  switch (state) {
    case 'positive':
      return 'Saldo positivo';
    case 'negative':
      return 'Saldo negativo';
    case 'zero':
      return 'Saldo en cero';
    default:
      return state;
  }
};

const contactTypeLabel = (type: string) => {
  const normalized = type.toLowerCase();
  if (normalized === 'client') return 'Cliente';
  if (normalized === 'provider') return 'Proveedor';
  return type;
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR');
};

const DEFAULT_OVERVIEW: TreasuryGlobalBalancesOverviewResponse = {
  generatedAt: new Date().toISOString(),
  summaryCards: [],
  filters: {
    currencies: [],
    accountKeys: [],
    balanceStates: [],
    contactTypes: [],
  },
  table: {
    items: [],
    pagination: {
      page: 1,
      limit: 15,
      totalItems: 0,
      totalPages: 1,
    },
  },
  stats: {
    totalBalance: 0,
    balanceStates: {
      positive: 0,
      negative: 0,
      zero: 0,
    },
    totalsByCurrency: [],
  },
  appliedFilters: {
    currency: null,
    accountKey: null,
    contactType: null,
    balanceState: null,
    search: null,
    dateFrom: null,
    dateTo: null,
  },
};

export const GlobalBalancesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');
  const location = useLocation();

  const { data, loading, error, refresh } = useGlobalBalancesOverview(filters);
  const overview = data ?? DEFAULT_OVERVIEW;

  const showToast = useCallback((nextToast: ToastState) => {
    setToast(nextToast);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    setGlobalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      refresh().catch(() => {});
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    if (!location.search) {
      return;
    }
    const params = new URLSearchParams(location.search);
    const account = params.get('account');
    const currency = params.get('currency');
    const nextUpdates: Partial<FilterState> = {};
    if (account) {
      nextUpdates.accountKey = account;
    }
    if (currency) {
      nextUpdates.currency = currency.toUpperCase();
    }
    if (Object.keys(nextUpdates).length) {
      handleFiltersChange({ ...nextUpdates, page: 1 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  const handleFiltersChange = (
    updates: Partial<FilterState> | ((previous: FilterState) => Partial<FilterState>)
  ) => {
    setFilters((prev) => {
      const patch = typeof updates === 'function' ? updates(prev) : updates;
      const next: FilterState = {
        ...prev,
        ...patch,
      };
      if (!('page' in patch)) {
        next.page = 1;
      }
      return next;
    });
  };

  const handleValuesChange = (updates: Partial<FilterValues>) => {
    handleFiltersChange(updates as Partial<FilterState>);
  };

  const handlePageChange = (page: number) => {
    handleFiltersChange({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (value: string) => {
    const mapping = SORT_MAPPING[value] || SORT_MAPPING['balance-desc'];
    handleFiltersChange({
      sortBy: mapping.sortBy,
      sortDirection: mapping.sortDirection,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      ...DEFAULT_FILTER_STATE,
      sortBy: filters.sortBy,
      sortDirection: filters.sortDirection,
    });
    showToast({
      type: 'success',
      message: 'Filtros limpiados correctamente.',
    });
  };

  const handleRemoveFilter = (key: keyof FilterValues) => {
    const reset: Partial<FilterValues> = {};
    if (key === 'currency') reset.currency = 'ALL';
    if (key === 'accountKey') reset.accountKey = '';
    if (key === 'search') reset.search = '';
    if (key === 'contactType') reset.contactType = '';
    if (key === 'balanceState') reset.balanceState = '';
    if (key === 'dateFrom') reset.dateFrom = null;
    if (key === 'dateTo') reset.dateTo = null;
    handleValuesChange(reset);
  };

  const handleSelectAccount = (accountKeyValue: string) => {
    handleFiltersChange((prev) => ({
      accountKey: prev.accountKey === accountKeyValue ? '' : accountKeyValue,
      page: 1,
    }));
    showToast({
      type: 'info',
      message: 'Filtrado por cuenta seleccionada.',
    });
  };

  const handleSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleValuesChange({ search: value });
  };

  const handleApplyAdvanced = () => {
    setShowAdvancedFilters(false);
    showToast({
      type: 'success',
      message: 'Filtros avanzados aplicados.',
    });
  };

  const handleViewContactDetail = (row: TreasuryGlobalBalanceRow) => {
    if (!row.contact?.id) {
      showToast({
        type: 'warning',
        message: 'Este saldo no está asociado a un contacto específico.',
      });
      return;
    }

    const params = new URLSearchParams();
    if (row.currency) {
      params.set('currency', row.currency);
    }
    const query = params.toString();
    navigate(
      `/dashboard/tesoreria/saldos/contacto/${row.contact.id}${query ? `?${query}` : ''}`,
      { replace: false }
    );
  };

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: keyof FilterValues; label: string }> = [];

    if (filters.currency && filters.currency !== 'ALL') {
      chips.push({ key: 'currency', label: `Moneda: ${filters.currency}` });
    }

    if (filters.accountKey) {
      const option = overview.filters.accountKeys.find(
        (item) => item.value === filters.accountKey
      );
      chips.push({
        key: 'accountKey',
        label: `Cuenta: ${option?.label || filters.accountKey}`,
      });
    }

    if (filters.search) {
      chips.push({ key: 'search', label: `Buscar: "${filters.search}"` });
    }

    if (filters.contactType) {
      chips.push({
        key: 'contactType',
        label: `Tipo: ${contactTypeLabel(filters.contactType)}`,
      });
    }

    if (filters.balanceState) {
      chips.push({
        key: 'balanceState',
        label: balanceStateLabel(filters.balanceState as TreasuryBalanceState),
      });
    }

    if (filters.dateFrom) {
      chips.push({ key: 'dateFrom', label: `Desde: ${formatDate(filters.dateFrom)}` });
    }

    if (filters.dateTo) {
      chips.push({ key: 'dateTo', label: `Hasta: ${formatDate(filters.dateTo)}` });
    }

    return chips;
  }, [filters, overview.filters.accountKeys]);

  const sortValue = sortValueFromState(filters.sortBy, filters.sortDirection);

  return (
    <div className="bg-gray-50 min-h-screen">
      <TreasuryNavbar search={globalSearch} onSearchChange={handleSearchChange} />
      <TreasuryBalanceStripe onSelectBalance={handleSelectAccount} />

      <main id="saldos-container" className="pt-[220px] px-6 pb-24">
        <section id="page-header" className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <span className="text-text-primary font-medium">Saldos</span>
          </nav>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Saldos y cuentas corrientes
            </h1>
            <p className="text-gray-600">
              Visión consolidada por moneda y tipo de cuenta
            </p>
          </div>
        </section>

        <GlobalBalancesSummaryCards
          cards={overview.summaryCards}
          loading={loading}
          onSelectCard={overview.summaryCards.length ? handleSelectAccount : undefined}
          activeAccountKey={filters.accountKey || null}
        />

        <GlobalBalancesFilters
          values={filters}
          options={overview.filters}
          activeFilters={activeFilterChips}
          showAdvanced={showAdvancedFilters}
          onChange={handleValuesChange}
          onRemoveFilter={handleRemoveFilter}
          onClearFilters={handleClearFilters}
          onToggleAdvanced={() => setShowAdvancedFilters((prev) => !prev)}
          onApplyAdvanced={handleApplyAdvanced}
        />

        <GlobalBalancesTable
          rows={overview.table.items}
          loading={loading}
          error={error}
          pagination={overview.table.pagination}
          sortValue={sortValue}
          onSortChange={handleSortChange}
          onPageChange={handlePageChange}
          onRowClick={handleViewContactDetail}
          onViewDetail={handleViewContactDetail}
        />
      </main>

      {toast && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 fade-in ${
            toast.type === 'success'
              ? 'bg-success text-white'
              : toast.type === 'warning'
              ? 'bg-warning text-gray-800'
              : toast.type === 'error'
              ? 'bg-danger text-white'
              : 'bg-gray-800 text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <i
              className={`fa-solid ${
                toast.type === 'success'
                  ? 'fa-check'
                  : toast.type === 'warning'
                  ? 'fa-exclamation-triangle'
                  : toast.type === 'error'
                  ? 'fa-times'
                  : 'fa-info'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};
