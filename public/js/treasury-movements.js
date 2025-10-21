(function treasuryMovementsController(global) {
  const { TreasuryApi, TreasuryApiError } = global;

  if (!TreasuryApi) {
    // eslint-disable-next-line no-console
    console.warn('TreasuryApi is not available. Movements view will not load.');
    return;
  }

  const state = {
    initialized: false,
    loading: false,
    balancesLoaded: false,
    filters: {},
    page: 1,
    limit: 20,
    sortBy: 'movementAt',
    sortDirection: 'desc',
    items: [],
    pagination: {
      totalItems: 0,
      totalPages: 1,
    },
    totals: {},
  };

  const elements = {
    desktopTableBody: document.getElementById('desktop-table-body'),
    mobileTable: document.getElementById('mobile-table'),
    toastContainer: document.getElementById('toast-container'),
    summary: document.getElementById('movements-summary'),
    paginationInfo: document.getElementById('pagination-info'),
    currentPage: document.getElementById('current-page-indicator'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    totalsIncoming: document.getElementById('totals-incoming'),
    totalsOutgoing: document.getElementById('totals-outgoing'),
    totalsNet: document.getElementById('totals-net'),
    mobileBalanceContainer: document.getElementById('mobile-balance-container'),
    desktopBalanceContainer: document.getElementById('desktop-balance-container'),
    balanceCardsSection: document.getElementById('desktop-balance-cards'),
    activeFilters: document.getElementById('active-filters'),
    contactSelect: document.getElementById('contact-filter'),
  };

  const DOMSelectors = {
    dateFrom: document.getElementById('date-from'),
    dateTo: document.getElementById('date-to'),
    movementType: document.getElementById('movement-type-filter'),
    medium: document.getElementById('medium-filter'),
    currency: document.getElementById('currency-filter'),
    status: document.getElementById('status-filter'),
    contact: document.getElementById('contact-filter'),
    search: document.getElementById('search-filter'),
    applyFilters: document.getElementById('apply-filters'),
    clearFilters: document.getElementById('clear-filters'),
    sortSelect: document.getElementById('sort-select'),
    registerMovement: document.getElementById('register-movement'),
    openConciliation: document.getElementById('open-conciliation'),
    openSettings: document.getElementById('open-settings'),
  };

  const TYPE_META = {
    incoming: { label: 'Ingreso', icon: 'fa-arrow-down', color: 'text-success' },
    outgoing: { label: 'Egreso', icon: 'fa-arrow-up', color: 'text-danger' },
  };

  const MEDIUM_LABELS = {
    cash: 'Efectivo',
    transfer: 'Transferencia',
    deposit: 'Depósito',
    usd: 'Caja USD',
  };

  const STATUS_META = {
    registered: { label: 'Registrado', badge: 'bg-gray-100 text-gray-800', colorKey: 'gray' },
    compensated: { label: 'Compensado', badge: 'bg-green-100 text-green-800', colorKey: 'green' },
    cancelled: { label: 'Anulado', badge: 'bg-red-100 text-red-800', colorKey: 'red' },
  };

  const BALANCE_ICONS = {
    transfers: 'fa-money-bill-transfer',
    cash: 'fa-hand-holding-dollar',
    usd: 'fa-dollar-sign',
  };

  const BALANCE_STATUS_COLORS = {
    ok: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
  };

  const formatCurrency = (amount, currency) => {
    const numeric = Number(amount) || 0;
    const formatter = numeric.toLocaleString('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency === 'USD' ? 'USD ' : '$'}${formatter}`;
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const formatTime = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const showToast = (message, type = 'info') => {
    if (!elements.toastContainer) return;
    const palette = {
      success: 'bg-success text-white',
      warning: 'bg-warning text-gray-900',
      danger: 'bg-danger text-white',
      info: 'bg-primary text-white',
      error: 'bg-danger text-white',
    };
    const iconMap = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-times-circle',
      error: 'fa-times-circle',
      info: 'fa-info-circle',
    };

    const toast = document.createElement('div');
    toast.className = `fade-in px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 ${
      palette[type] || palette.info
    }`;
    toast.innerHTML = `<i class="fa-solid ${iconMap[type] || iconMap.info}"></i><span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  };

  const setLoading = (loading) => {
    state.loading = loading;
    if (!elements.desktopTableBody) return;
    elements.desktopTableBody.classList.toggle('opacity-60', loading);
    elements.desktopTableBody.classList.toggle('pointer-events-none', loading);
    elements.mobileTable.classList.toggle('opacity-60', loading);
  };

  const normalizeMovement = (movement) => {
    const typeMeta = TYPE_META[movement.type] || TYPE_META.incoming;
    const statusMeta = STATUS_META[movement.status] || STATUS_META.registered;
    const signedAmount =
      movement.type === 'outgoing' ? -Number(movement.amount || 0) : Number(movement.amount || 0);
    const movementDate = movement.movementAt || movement.createdAt || null;
    const linkedOperation = Array.isArray(movement.linkedOperations)
      ? movement.linkedOperations[0]
      : null;

    return {
      id: movement.movementCode || movement.id,
      movementId: movement.id,
      type: movement.type,
      typeLabel: typeMeta.label,
      typeIcon: typeMeta.icon,
      typeColor: typeMeta.color,
      medium: MEDIUM_LABELS[movement.medium] || movement.medium || '—',
      currency: movement.currency || 'ARS',
      amount: signedAmount,
      contact:
        movement.contact?.shortName ||
        movement.contact?.fullName ||
        movement.contact?.displayName ||
        'Sin contacto',
      contactId: movement.contact?.id || movement.contact?.contactId || movement.contact?.id,
      status: statusMeta.label,
      statusColor: statusMeta.colorKey,
      statusBadge: statusMeta.badge,
      operation: linkedOperation?.code || null,
      operationModel: linkedOperation?.model || null,
      movementAt: movementDate,
      formattedDate: formatDate(movementDate),
      formattedTime: formatTime(movementDate),
    };
  };

  const renderDesktopRows = (rows) => {
    if (!elements.desktopTableBody) return;
    if (!rows.length) {
      elements.desktopTableBody.innerHTML = `
        <tr>
            <td colspan="9" class="px-6 py-6 text-center text-sm text-gray-500">
                No encontramos movimientos con los filtros seleccionados.
            </td>
        </tr>`;
      return;
    }

    elements.desktopTableBody.innerHTML = rows
      .map(
        (row) => `
        <tr class="table-row hover:bg-gray-50 transition-colors cursor-pointer" data-detail="${row.movementId}">
            <td class="px-6 py-4">
                <div class="text-sm font-medium text-text-primary">${row.formattedDate}</div>
                <div class="text-xs text-gray-500">${row.formattedTime}</div>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center">
                    <i class="fa-solid ${row.typeIcon} ${row.typeColor} mr-2"></i>
                    <span class="text-sm text-text-primary">${row.typeLabel}</span>
                </div>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="text-sm text-text-primary">${row.medium}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  row.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }">${row.currency}</span>
            </td>
            <td class="px-6 py-4 text-right">
                <span class="text-lg font-semibold ${
                  row.amount > 0 ? 'positive-amount' : row.amount < 0 ? 'negative-amount' : 'neutral-amount'
                }">${formatCurrency(Math.abs(row.amount), row.currency)}</span>
            </td>
            <td class="px-6 py-4">
                <span class="text-sm text-text-primary">${row.contact}</span>
            </td>
            <td class="px-6 py-4 text-center">
                ${
                  row.operation
                    ? `<span class="text-sm font-mono text-primary">#${row.operation}</span>`
                    : '<span class="text-sm text-gray-400">—</span>'
                }
            </td>
            <td class="px-6 py-4 text-center">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  row.statusBadge
                }">${row.status}</span>
            </td>
            <td class="px-6 py-4 text-center">
                <div class="flex items-center justify-center space-x-2 text-sm">
                    <button class="text-primary hover:text-blue-700" data-view="${row.movementId}">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                    <button class="text-gray-500 hover:text-gray-700" data-edit="${row.movementId}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="text-danger hover:text-red-700 disabled:opacity-50" data-cancel="${row.movementId}" ${
                  row.statusColor === 'red' ? 'disabled' : ''
                }>
                        <i class="fa-solid fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>`
      )
      .join('');
  };

  const renderMobileRows = (rows) => {
    if (!elements.mobileTable) return;
    if (!rows.length) {
      elements.mobileTable.innerHTML = `
        <article class="p-4 text-center text-sm text-gray-500">
            No encontramos movimientos con los filtros seleccionados.
        </article>`;
      return;
    }

    elements.mobileTable.innerHTML = rows
      .map(
        (row) => `
        <article class="p-4 border-b border-gray-200 space-y-3 cursor-pointer hover:bg-gray-50 transition-colors" data-detail="${row.movementId}">
            <header class="flex items-center justify-between">
                <div>
                    <div class="text-sm font-medium text-text-primary">#${row.id || row.movementId}</div>
                    <div class="text-xs text-gray-500">${row.formattedDate} • ${row.formattedTime}</div>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  statusMetaBadge(row.statusColor)
                }">${row.status}</span>
            </header>
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                    <i class="fa-solid ${row.typeIcon} ${row.typeColor}"></i>
                    <span class="text-sm text-text-primary">${row.typeLabel}</span>
                </div>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  row.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }">${row.currency}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <div>
                    <div class="text-xs text-gray-500">Medio</div>
                    <div class="font-medium text-text-primary">${row.medium}</div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-500">Monto</div>
                    <div class="font-semibold ${
                      row.amount > 0 ? 'positive-amount' : row.amount < 0 ? 'negative-amount' : 'neutral-amount'
                    }">${formatCurrency(Math.abs(row.amount), row.currency)}</div>
                </div>
            </div>
            <div class="text-xs text-gray-600">
                <span class="font-medium text-text-primary">Contacto:</span> ${row.contact}
            </div>
            <div class="text-xs text-gray-500">
                ${row.operation ? `Operación vinculada #${row.operation}` : 'Sin operación vinculada'}
            </div>
            <footer class="flex items-center justify-end gap-3 text-sm">
                <button class="text-primary hover:text-blue-700" data-view="${row.movementId}">Ver</button>
                <button class="text-gray-600 hover:text-gray-800" data-edit="${row.movementId}">Editar</button>
                <button class="text-danger hover:text-red-700 disabled:opacity-50" data-cancel="${row.movementId}" ${
                  row.statusColor === 'red' ? 'disabled' : ''
                }>Anular</button>
            </footer>
        </article>`
      )
      .join('');
  };

  const statusMetaBadge = (colorKey) => {
    const entry = Object.values(STATUS_META).find((meta) => meta.colorKey === colorKey);
    return entry ? entry.badge : 'bg-gray-100 text-gray-800';
  };

  const composeTotals = (totals, key) => {
    const bucket = totals[key] || {};
    const entries = Object.entries(bucket);
    if (!entries.length) return '—';
    return entries
      .map(([currency, amount]) => formatCurrency(Math.abs(amount || 0), currency))
      .join(' + ');
  };

  const updateTotals = (totals = {}) => {
    const incomingText = composeTotals(totals, 'incoming');
    const outgoingText = composeTotals(totals, 'outgoing');
    const net = totals.net || {};
    const netSum = Object.values(net).reduce((acc, value) => acc + Number(value || 0), 0);

    elements.totalsIncoming.textContent = incomingText;
    elements.totalsOutgoing.textContent = outgoingText;

    elements.totalsNet.textContent = composeTotals(totals, 'net');
    elements.totalsNet.classList.remove('positive-amount', 'negative-amount', 'neutral-amount');
    if (netSum > 0.01) {
      elements.totalsNet.classList.add('positive-amount');
    } else if (netSum < -0.01) {
      elements.totalsNet.classList.add('negative-amount');
    } else {
      elements.totalsNet.classList.add('neutral-amount');
    }
  };

  const updateSummary = () => {
    if (!elements.summary) return;
    const { page, limit } = state;
    const { totalItems } = state.pagination;
    if (!totalItems) {
      elements.summary.textContent = 'Sin movimientos registrados.';
      return;
    }
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, totalItems);
    elements.summary.textContent = `Mostrando ${from}-${to} de ${totalItems} movimientos`;
  };

  const updatePaginationControls = () => {
    const { page } = state;
    const { totalItems, totalPages } = state.pagination;
    if (elements.paginationInfo) {
      if (!totalItems) {
        elements.paginationInfo.textContent = 'Sin resultados para los filtros actuales.';
      } else {
        const from = (page - 1) * state.limit + 1;
        const to = Math.min(page * state.limit, totalItems);
        elements.paginationInfo.textContent = `Mostrando ${from}-${to} de ${totalItems} movimientos`;
      }
    }
    if (elements.currentPage) {
      elements.currentPage.textContent = `${Math.min(page, totalPages)} / ${Math.max(totalPages, 1)}`;
    }
    if (elements.prevPage) {
      elements.prevPage.disabled = page <= 1;
    }
    if (elements.nextPage) {
      elements.nextPage.disabled = page >= totalPages;
    }
  };

  const buildBalanceCard = (balance, { mobile = false } = {}) => {
    const icon = BALANCE_ICONS[balance.id] || 'fa-vault';
    const statusColor = BALANCE_STATUS_COLORS[balance.status] || BALANCE_STATUS_COLORS.ok;
    const updatedTime = balance.updatedAt ? formatTime(balance.updatedAt) : '—';
    const amountText = formatCurrency(balance.amount || 0, balance.currency);

    if (mobile) {
      return `
        <article class="bg-white rounded-lg border border-gray-200 p-3 shadow-sm min-w-[200px]">
            <div class="flex items-center justify-between mb-2">
                <div class="flex items-center">
                    <i class="fa-solid ${icon} text-primary mr-2 text-sm"></i>
                    <span class="text-xs font-medium text-gray-600">${balance.label}</span>
                </div>
                <div class="w-2 h-2 rounded-full ${statusColor}"></div>
            </div>
            <div class="text-lg font-bold text-text-primary">${amountText}</div>
            <div class="text-xs text-gray-500">Actualizado ${updatedTime}</div>
        </article>`;
    }

    return `
      <article class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
              <div class="flex items-center">
                  <i class="fa-solid ${icon} text-primary mr-2"></i>
                  <span class="text-sm font-medium text-gray-600">${balance.label}</span>
              </div>
              <div class="w-2 h-2 rounded-full ${statusColor}"></div>
          </div>
          <div class="text-2xl font-bold text-text-primary">${amountText}</div>
          <div class="text-xs text-gray-500">Actualizado ${updatedTime}</div>
      </article>`;
  };

  const updateBalances = (balances = []) => {
    if (elements.mobileBalanceContainer) {
      elements.mobileBalanceContainer.innerHTML = balances
        .map((balance) => buildBalanceCard(balance, { mobile: true }))
        .join('');
    }
    if (elements.desktopBalanceContainer) {
      elements.desktopBalanceContainer.innerHTML = balances
        .map((balance) => buildBalanceCard(balance))
        .join('');
    }
  };

  const collectFilters = () => ({
    dateFrom: DOMSelectors.dateFrom?.value || undefined,
    dateTo: DOMSelectors.dateTo?.value || undefined,
    type: DOMSelectors.movementType?.value || undefined,
    medium: DOMSelectors.medium?.value || undefined,
    currency: DOMSelectors.currency?.value || undefined,
    status: DOMSelectors.status?.value || undefined,
    contact: DOMSelectors.contact?.value || undefined,
    search: DOMSelectors.search?.value?.trim() || undefined,
  });

  const renderActiveFilterChips = () => {
    if (!elements.activeFilters) return;
    const filters = collectFilters();
    const chips = [];
    if (filters.dateFrom) chips.push({ type: 'dateFrom', label: `Desde: ${filters.dateFrom}` });
    if (filters.dateTo) chips.push({ type: 'dateTo', label: `Hasta: ${filters.dateTo}` });
    if (filters.type) chips.push({ type: 'movementType', label: `Tipo: ${TYPE_META[filters.type]?.label || filters.type}` });
    if (filters.medium) chips.push({ type: 'medium', label: `Medio: ${MEDIUM_LABELS[filters.medium] || filters.medium}` });
    if (filters.currency) chips.push({ type: 'currency', label: `Moneda: ${filters.currency}` });
    if (filters.status) chips.push({ type: 'status', label: `Estado: ${STATUS_META[filters.status]?.label || filters.status}` });
    if (filters.contact) {
      const option = DOMSelectors.contact?.selectedOptions?.[0];
      chips.push({ type: 'contact', label: `Contacto: ${option ? option.textContent : filters.contact}` });
    }
    if (filters.search) chips.push({ type: 'search', label: `Buscar: "${filters.search}"` });

    if (!chips.length) {
      elements.activeFilters.innerHTML =
        '<span class="text-xs text-gray-500">Sin filtros activos</span>';
      return;
    }

    elements.activeFilters.innerHTML = chips
      .map(
        (chip) => `
        <button class="chip-removable inline-flex items-center px-3 py-1 bg-primary text-white rounded-full text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
            data-remove="${chip.type}">
            ${chip.label}
            <i class="fa-solid fa-xmark ml-2"></i>
        </button>`
      )
      .join('');
  };

  const populateContacts = (contacts = []) => {
    if (!DOMSelectors.contact) return;
    const previousValue = DOMSelectors.contact.value;
    DOMSelectors.contact.innerHTML = '<option value="">Todos</option>';
    contacts.forEach((contact) => {
      const option = document.createElement('option');
      option.value = contact.id;
      option.textContent = contact.shortName || contact.fullName || contact.displayName || 'Contacto';
      DOMSelectors.contact.appendChild(option);
    });
    if (previousValue) {
      DOMSelectors.contact.value = previousValue;
    }
  };

  const handleApiError = (error, contextMessage) => {
    if (error instanceof TreasuryApiError) {
      showToast(error.message || contextMessage || 'Ocurrió un error.', 'danger');
      if (error.isUnauthorized()) {
        elements.summary.textContent =
          'No tenés permisos para acceder a los movimientos de Tesorería.';
        setLoading(false);
      }
      return;
    }
    showToast(contextMessage || 'Ocurrió un error inesperado.', 'danger');
    // eslint-disable-next-line no-console
    console.error(error);
  };

  const loadBalances = async (silent = false) => {
    try {
      const balances = await TreasuryApi.getBalances();
      updateBalances(balances);
      state.balancesLoaded = true;
    } catch (error) {
      if (!silent) {
        handleApiError(error, 'No pudimos obtener los saldos de Tesorería.');
      }
    }
  };

  const loadContacts = async () => {
    try {
      const contacts = await TreasuryApi.searchClients({ limit: 50 });
      populateContacts(
        contacts.map((contact) => ({
          id: contact._id || contact.id,
          shortName: contact.shortName,
          fullName: contact.fullName,
          displayName: contact.fullName,
        }))
      );
    } catch (error) {
      handleApiError(error, 'No pudimos cargar los contactos disponibles.');
    }
  };

  const mapSortValue = (value) => {
    switch (value) {
      case 'date-asc':
        return { sortBy: 'movementAt', sortDirection: 'asc' };
      case 'amount-desc':
        return { sortBy: 'amount', sortDirection: 'desc' };
      case 'amount-asc':
        return { sortBy: 'amount', sortDirection: 'asc' };
      case 'status':
        return { sortBy: 'status', sortDirection: 'asc' };
      case 'date-desc':
      default:
        return { sortBy: 'movementAt', sortDirection: 'desc' };
    }
  };

  const loadMovements = async () => {
    setLoading(true);
    try {
      const response = await TreasuryApi.listMovements({
        page: state.page,
        limit: state.limit,
        sortBy: state.sortBy,
        sortDirection: state.sortDirection,
        filters: state.filters,
      });
      const items = Array.isArray(response?.items) ? response.items.map(normalizeMovement) : [];

      state.items = items;
      state.pagination = {
        totalItems: Number(response?.pagination?.totalItems) || items.length,
        totalPages: Number(response?.pagination?.totalPages) || 1,
      };
      state.totals = response?.totals || {};

      renderDesktopRows(items);
      renderMobileRows(items);
      updateTotals(state.totals);
      updateSummary();
      updatePaginationControls();
    } catch (error) {
      handleApiError(error, 'No pudimos obtener los movimientos de Tesorería.');
      renderDesktopRows([]);
      renderMobileRows([]);
      updateTotals({});
      updateSummary();
      updatePaginationControls();
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    state.filters = collectFilters();
    state.page = 1;
    renderActiveFilterChips();
    loadMovements();
  };

  const clearFilters = () => {
    Object.values(DOMSelectors).forEach((control) => {
      if (!control) return;
      if (control.tagName === 'INPUT' || control.tagName === 'SELECT') {
        control.value = '';
      }
    });
    state.filters = {};
    state.page = 1;
    renderActiveFilterChips();
    loadMovements();
  };

  const handlePagination = (direction) => {
    const nextPage = state.page + direction;
    if (nextPage < 1 || nextPage > state.pagination.totalPages) {
      return;
    }
    state.page = nextPage;
    loadMovements();
  };

  const handleCancelMovement = async (movementId) => {
    if (!movementId) return;
    if (!confirm('¿Confirmás la anulación del movimiento seleccionado?')) return;
    try {
      await TreasuryApi.cancelMovement(movementId, { reason: 'Anulado desde el panel' });
      showToast(`Movimiento #${movementId} anulado correctamente.`, 'success');
      loadMovements();
    } catch (error) {
      handleApiError(error, 'No pudimos anular el movimiento.');
    }
  };

  const handleRowAction = (event) => {
    const viewBtn = event.target.closest('[data-view]');
    const editBtn = event.target.closest('[data-edit]');
    const cancelBtn = event.target.closest('[data-cancel]');
    const detailRow = event.target.closest('[data-detail]');

    if (viewBtn) {
      const id = viewBtn.getAttribute('data-view');
      window.location.href = `tesoreria-movimiento-detalle.html?movement=${encodeURIComponent(id)}`;
      return;
    }
    if (editBtn) {
      const id = editBtn.getAttribute('data-edit');
      showToast(`Edición del movimiento #${id} en desarrollo.`, 'info');
      return;
    }
    if (cancelBtn && !cancelBtn.disabled) {
      const id = cancelBtn.getAttribute('data-cancel');
      handleCancelMovement(id);
      return;
    }
    if (detailRow) {
      const id = detailRow.getAttribute('data-detail');
      window.location.href = `tesoreria-movimiento-detalle.html?movement=${encodeURIComponent(id)}`;
    }
  };

  const bindEvents = () => {
    if (DOMSelectors.applyFilters) {
      DOMSelectors.applyFilters.addEventListener('click', applyFilters);
    }
    if (DOMSelectors.clearFilters) {
      DOMSelectors.clearFilters.addEventListener('click', clearFilters);
    }
    if (elements.activeFilters) {
      elements.activeFilters.addEventListener('click', (event) => {
        const button = event.target.closest('[data-remove]');
        if (!button) return;
        const map = {
          dateFrom: 'date-from',
          dateTo: 'date-to',
          movementType: 'movement-type-filter',
          medium: 'medium-filter',
          currency: 'currency-filter',
          status: 'status-filter',
          contact: 'contact-filter',
          search: 'search-filter',
        };
        const inputId = map[button.getAttribute('data-remove')];
        if (inputId) {
          const field = document.getElementById(inputId);
          if (field) field.value = '';
        }
        applyFilters();
      });
    }
    if (DOMSelectors.sortSelect) {
      DOMSelectors.sortSelect.addEventListener('change', (event) => {
        const { sortBy, sortDirection } = mapSortValue(event.target.value);
        state.sortBy = sortBy;
        state.sortDirection = sortDirection;
        state.page = 1;
        loadMovements();
      });
    }
    if (elements.prevPage) {
      elements.prevPage.addEventListener('click', () => handlePagination(-1));
    }
    if (elements.nextPage) {
      elements.nextPage.addEventListener('click', () => handlePagination(1));
    }
    if (elements.desktopTableBody) {
      elements.desktopTableBody.addEventListener('click', handleRowAction);
    }
    if (elements.mobileTable) {
      elements.mobileTable.addEventListener('click', handleRowAction);
    }
    if (DOMSelectors.registerMovement) {
      DOMSelectors.registerMovement.addEventListener('click', () => {
        window.location.href = 'tesoreria-registrar-movimiento.html';
      });
    }
    if (DOMSelectors.openConciliation) {
      DOMSelectors.openConciliation.addEventListener('click', () => {
        showToast('La conciliación automática estará disponible próximamente.', 'info');
      });
    }
    if (DOMSelectors.openSettings) {
      DOMSelectors.openSettings.addEventListener('click', () => {
        showToast('La configuración de Tesorería está en desarrollo.', 'info');
      });
    }
  };

  const initialize = async () => {
    if (state.initialized) return;
    state.initialized = true;

    renderActiveFilterChips();
    bindEvents();
    loadContacts();
    await loadBalances();
    await loadMovements();
    setInterval(() => {
      loadBalances(true);
    }, 60000);
  };

  document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
