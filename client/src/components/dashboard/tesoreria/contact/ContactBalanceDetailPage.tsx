import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  useContactBalanceDetail,
  ContactBalanceDetailFilters,
} from '../../../../hooks';
import { TreasuryBalanceStripe } from '../TreasuryBalanceStripe';
import { TreasuryNavbar } from '../TreasuryNavbar';
import { ContactSummaryCard } from './ContactSummaryCard';
import { ContactFilters, ContactFilterValues } from './ContactFilters';
import { ContactOperationsTable } from './ContactOperationsTable';
import { Alert } from '../../../ui';
import { ClientSummary, TreasuryContactBalanceOperation } from '../../../../types';
import { NewClientModal } from '../../../clients/NewClientModal';

const STATUS_LABEL_MAP: Record<string, string> = {
  registered: 'Registrada',
  settled: 'Compensada',
  pending: 'Pendiente',
};

const CONTACT_TYPE_LABEL: Record<string, string> = {
  client: 'Cliente',
  provider: 'Proveedor',
};

const DEFAULT_FILTER_VALUES: ContactFilterValues = {
  operationType: '',
  status: '',
  currency: '',
  dateFrom: null,
  dateTo: null,
  search: '',
};

const toFilterState = (params: URLSearchParams): { filters: ContactFilterValues; page: number; sort: string } => ({
  filters: {
    operationType: params.get('operationType') || '',
    status: params.get('status') || '',
    currency: params.get('currency') || '',
    dateFrom: params.get('dateFrom'),
    dateTo: params.get('dateTo'),
    search: params.get('search') || '',
  },
  page: Number(params.get('page') || '1'),
  sort: params.get('sort') || 'date-desc',
});

const buildAppliedFilterChips = (values: ContactFilterValues) => {
  const chips: Array<{ key: keyof ContactFilterValues; label: string }> = [];

  if (values.operationType) {
    chips.push({ key: 'operationType', label: `Tipo: ${values.operationType}` });
  }
  if (values.status) {
    chips.push({
      key: 'status',
      label: `Estado: ${STATUS_LABEL_MAP[values.status] || values.status}`,
    });
  }
  if (values.currency) {
    chips.push({ key: 'currency', label: `Moneda: ${values.currency}` });
  }
  if (values.dateFrom) {
    chips.push({ key: 'dateFrom', label: `Desde: ${values.dateFrom}` });
  }
  if (values.dateTo) {
    chips.push({ key: 'dateTo', label: `Hasta: ${values.dateTo}` });
  }
  if (values.search) {
    chips.push({ key: 'search', label: `Buscar: "${values.search}"` });
  }

  return chips;
};

const sortValueToApi = (sort: string): ContactBalanceDetailFilters['sort'] => {
  if (
    sort === 'date-desc' ||
    sort === 'date-asc' ||
    sort === 'amount-desc' ||
    sort === 'amount-asc' ||
    sort === 'type-asc' ||
    sort === 'type-desc'
  ) {
    return sort;
  }
  return 'date-desc';
};

export const ContactBalanceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { contactId } = useParams<{ contactId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialState = useMemo(() => toFilterState(searchParams), [searchParams]);

  const [filters, setFilters] = useState<ContactFilterValues>(initialState.filters);
  const [page, setPage] = useState<number>(initialState.page || 1);
  const [sortValue, setSortValue] = useState<string>(initialState.sort || 'date-desc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null
  );
  const [globalSearch, setGlobalSearch] = useState(filters.search);
  const [createContactOpen, setCreateContactOpen] = useState(false);

  const apiFilters: ContactBalanceDetailFilters = {
    currency: filters.currency || null,
    operationType: filters.operationType || null,
    status: filters.status || null,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    search: filters.search || null,
    page,
    sort: sortValueToApi(sortValue),
  };

  const { data, loading, error } = useContactBalanceDetail(contactId, apiFilters, {
    autoFetch: Boolean(contactId),
  });

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const nextParams = new URLSearchParams();
    if (filters.operationType) nextParams.set('operationType', filters.operationType);
    if (filters.status) nextParams.set('status', filters.status);
    if (filters.currency) nextParams.set('currency', filters.currency);
    if (filters.dateFrom) nextParams.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) nextParams.set('dateTo', filters.dateTo);
    if (filters.search) nextParams.set('search', filters.search);
    if (page > 1) nextParams.set('page', String(page));
    if (sortValue && sortValue !== 'date-desc') nextParams.set('sort', sortValue);
    setSearchParams(nextParams, { replace: true });
  }, [filters, page, sortValue, setSearchParams]);

  useEffect(() => {
    setGlobalSearch(filters.search);
  }, [filters.search]);

  const activeFilters = useMemo(() => buildAppliedFilterChips(filters), [filters]);

  const handleNewContactCreated = (client: ClientSummary) => {
    setCreateContactOpen(false);
    setToast({ type: 'success', message: `Contacto ${client.fullName} creado correctamente.` });
  };

  const handleFiltersChange = (updates: Partial<ContactFilterValues>) => {
    setFilters((prev) => ({
      ...prev,
      ...updates,
    }));
    setPage(1);
  };

  const handleRemoveFilter = (key: keyof ContactFilterValues) => {
    switch (key) {
      case 'operationType':
        handleFiltersChange({ operationType: '' });
        break;
      case 'status':
        handleFiltersChange({ status: '' });
        break;
      case 'currency':
        handleFiltersChange({ currency: '' });
        break;
      case 'dateFrom':
        handleFiltersChange({ dateFrom: null });
        break;
      case 'dateTo':
        handleFiltersChange({ dateTo: null });
        break;
      case 'search':
        handleFiltersChange({ search: '' });
        setGlobalSearch('');
        break;
      default:
        break;
    }
  };

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTER_VALUES);
    setPage(1);
    setGlobalSearch('');
    setToast({ type: 'info', message: 'Filtros limpiados correctamente.' });
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
  };

  const handleSortChange = (value: string) => {
    setSortValue(value);
    setPage(1);
  };

  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    handleFiltersChange({ search: value });
  };

  const handleViewInAccounts = () => {
    setToast({ type: 'info', message: 'La navegación a Cuentas Corrientes estará disponible pronto.' });
  };

  const handleViewOperation = (operation: TreasuryContactBalanceOperation) => {
    const identifier = operation.operation.code ? `#${operation.operation.code}` : 'esta operación';
    setToast({ type: 'info', message: `Próximamente podrás ver el detalle de ${identifier}.` });
  };

  const handleSelectBalanceStripe = (balanceId: string) => {
    handleFiltersChange({ currency: balanceId.toUpperCase() });
  };

  const contactLabel = CONTACT_TYPE_LABEL[data.contact.contactType] || data.contact.contactType;

  if (!contactId) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <TreasuryNavbar search="" onSearchChange={() => {}} />
        <main className="pt-24 px-6 pb-24">
          <Alert type="warning" title="Contacto no especificado" message="Seleccioná un contacto desde la vista de saldos para ver el detalle correspondiente." />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <TreasuryNavbar search={globalSearch} onSearchChange={handleGlobalSearchChange} />
      <TreasuryBalanceStripe onSelectBalance={handleSelectBalanceStripe} />

      <main id="contact-detail-container" className="pt-[220px] px-6 pb-24">
        <section id="page-header" className="mb-8">
          <nav id="breadcrumbs" className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/tesoreria/saldos')}
              className="text-primary hover:text-blue-700 transition-colors"
            >
              Saldos
            </button>
            <i className="fa-solid fa-chevron-right text-xs" />
            <span className="text-text-primary font-medium">{data.contact.fullName || contactLabel}</span>
          </nav>
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              Detalle de cuenta de {data.contact.fullName || contactLabel}
            </h1>
            <p className="text-gray-600">
              Visualizá todas las operaciones que impactan en su saldo
            </p>
          </div>
        </section>

        {error && !loading && error.status === 404 ? (
          <Alert type="warning" title="No encontramos datos para este contacto" message="Verificá que el contacto exista y tenga operaciones registradas." />
        ) : (
          <>
            <ContactSummaryCard
              contact={data.contact}
              summary={data.summary}
              totalsByCurrency={data.stats.totalsByCurrency}
              onViewInAccounts={handleViewInAccounts}
            />

            <ContactFilters
              values={filters}
              options={data.filters.options}
              activeFilters={activeFilters}
              showAdvanced={showAdvanced}
              onChange={handleFiltersChange}
              onRemoveFilter={handleRemoveFilter}
              onClearFilters={handleClearFilters}
              onToggleAdvanced={() => setShowAdvanced((prev) => !prev)}
              onApplyAdvanced={() => {
                setShowAdvanced(false);
                setToast({ type: 'success', message: 'Filtros aplicados correctamente.' });
              }}
              onCreateContact={() => setCreateContactOpen(true)}
            />

            <ContactOperationsTable
              rows={data.table.items}
              currency={data.summary.balance.currency}
              loading={loading}
              error={error}
              pagination={data.table.pagination}
              sortValue={sortValue}
              onSortChange={handleSortChange}
              onPageChange={handlePageChange}
              onViewOperation={handleViewOperation}
            />
          </>
        )}
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

      <NewClientModal
        open={createContactOpen}
        onClose={() => setCreateContactOpen(false)}
        onCreated={handleNewContactCreated}
        defaultType="client"
        ownerLabel="Tesorería"
      />
    </div>
  );
};
