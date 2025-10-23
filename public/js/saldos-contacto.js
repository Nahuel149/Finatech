(function contactBalancesModule() {
  const CONTACT_PAGE_SIZE = 20;

  const state = {
    contactId: null,
    contact: null,
    balances: {},
    selectedCurrency: 'USD',
    totals: { incoming: 0, outgoing: 0, net: 0 },
    filters: {
      currency: 'USD',
      operationType: '',
      state: '',
      dateFrom: '',
      sortBy: 'date',
      sortDirection: 'desc',
      search: '',
    },
    pagination: {
      page: 1,
      totalPages: 1,
      totalItems: 0,
      pageSize: CONTACT_PAGE_SIZE,
    },
    operations: [],
    rawOperations: [],
  };

  const elements = {
    container: document.getElementById('contact-detail-container'),
    breadcrumbName: document.getElementById('breadcrumb-contact-name'),
    pageTitle: document.getElementById('page-title'),
    avatar: document.getElementById('contact-avatar'),
    contactName: document.getElementById('contact-name'),
    contactTypeBadge: document.getElementById('contact-type-badge'),
    contactCuit: document.getElementById('contact-cuit'),
    contactUpdated: document.getElementById('contact-updated'),
    contactTotalBalance: document.getElementById('contact-total-balance'),
    contactTotalMeta: document.getElementById('contact-total-meta'),
    incomingAmount: document.getElementById('contact-incoming-amount'),
    incomingCount: document.getElementById('contact-incoming-count'),
    outgoingAmount: document.getElementById('contact-outgoing-amount'),
    outgoingCount: document.getElementById('contact-outgoing-count'),
    netAmount: document.getElementById('contact-net-amount'),
    relatedAccountsBtn: document.getElementById('view-related-accounts'),
    currencyFilter: document.getElementById('currency-filter'),
    typeFilter: document.getElementById('operation-type-filter'),
    statusFilter: document.getElementById('status-filter'),
    dateFromFilter: document.getElementById('date-from'),
    searchInput: document.getElementById('search-filter'),
    sortSelect: document.getElementById('sort-select'),
    clearFiltersBtn: document.getElementById('clear-filters'),
    activeFilters: document.getElementById('active-filters'),
    desktopTableBody: document.getElementById('desktop-table-body'),
    mobileTable: document.getElementById('mobile-table'),
    tableSummary: document.getElementById('table-summary'),
    tableRange: document.getElementById('table-range'),
    prevPage: document.getElementById('prev-page'),
    nextPage: document.getElementById('next-page'),
    summaryIncoming: document.getElementById('summary-incoming'),
    summaryOutgoing: document.getElementById('summary-outgoing'),
    summaryNet: document.getElementById('summary-net'),
    toastContainer: document.getElementById('toast-container'),
  };

  const formatCurrency = (value, currency = 'USD') => {
    const numeric = Number(value) || 0;
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch (_error) {
      const prefix = currency === 'USD' ? 'USD ' : '$';
      return `${prefix}${numeric.toFixed(2)}`;
    }
  };

  const formatSignedCurrency = (value, currency = 'USD') => {
    const formatted = formatCurrency(Math.abs(value), currency);
    if (value === 0) return formatted;
    return `${value > 0 ? '+' : '-'}${formatted}`;
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return `${date.toLocaleDateString('es-AR')} ${date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('es-AR');
  };

  const getInitials = (fullName = '') => {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '--';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const translateContactType = (type) => (type === 'provider' ? 'Proveedor' : 'Cliente');

  const translateState = (stateValue) => {
    if (!stateValue) return '—';
    const map = {
      registrada: 'Registrada',
      compensada: 'Compensada',
      pendiente: 'Pendiente',
    };
    return map[stateValue] || stateValue;
  };

  const operationLabel = (operation) => {
    if (!operation) return 'Operación';
    if (operation.source === 'transaction') {
      if (operation.type === 'buy') return 'Compra de USD';
      if (operation.type === 'sell') return 'Venta de USD';
      return 'Operación comercial';
    }
    if (operation.source === 'treasury') {
      if (operation.type === 'cash' || operation.type === 'caja') return 'Movimiento de caja';
      if (operation.type === 'transfer') return 'Transferencia';
      return 'Movimiento de Tesorería';
    }
    return operation.type || 'Operación';
  };

  const showToast = (message, type = 'info') => {
    if (!elements.toastContainer) return;
    const palette = {
      success: 'bg-success text-white',
      danger: 'bg-danger text-white',
      warning: 'bg-warning text-gray-900',
      info: 'bg-gray-900 text-white',
    };
    const icons = {
      success: 'fa-check-circle',
      danger: 'fa-times-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle',
    };
    const toast = document.createElement('div');
    toast.className = `fade-in px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2 ${palette[type] || palette.info}`;
    toast.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${message}</span>`;
    elements.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const setLoading = (isLoading) => {
    if (!elements.container) return;
    elements.container.classList.toggle('opacity-50', isLoading);
    elements.container.classList.toggle('pointer-events-none', isLoading);
  };

  const parseContactId = () => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('contact');
    if (queryId) return queryId;
    const segments = window.location.pathname.split('/').filter(Boolean);
    return segments.length ? segments[segments.length - 1] : null;
  };

  const updateContactHeader = () => {
    if (!state.contact) return;
    const { contact } = state;
    const name = contact.fullName || contact.shortName || 'Contacto';
    const badgeLabel = translateContactType(contact.contactType);
    if (elements.breadcrumbName) elements.breadcrumbName.textContent = name;
    if (elements.pageTitle) elements.pageTitle.textContent = `Detalle de cuenta de ${name}`;
    if (elements.contactName) elements.contactName.textContent = name;
    if (elements.contactTypeBadge) elements.contactTypeBadge.textContent = badgeLabel;
    if (elements.contactCuit) elements.contactCuit.textContent = contact.cuit || '—';
    if (elements.avatar) elements.avatar.textContent = getInitials(name);
    if (elements.contactUpdated) {
      elements.contactUpdated.textContent = `Actualizado ${new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
  };

  const updateTotals = () => {
    const { totals, filters } = state;
    const currency = filters.currency || state.selectedCurrency || 'USD';
    if (elements.contactTotalBalance) {
      const balanceValue =
        state.balances?.[currency] !== undefined ? state.balances[currency] : 0;
      elements.contactTotalBalance.textContent = formatCurrency(balanceValue, currency);
    }
    if (elements.contactTotalMeta) {
      elements.contactTotalMeta.textContent = `Moneda seleccionada: ${currency}`;
    }
    if (elements.incomingAmount) {
      elements.incomingAmount.textContent = formatCurrency(totals.incoming, currency);
    }
    if (elements.outgoingAmount) {
      elements.outgoingAmount.textContent = formatCurrency(totals.outgoing, currency);
    }
    if (elements.netAmount) {
      elements.netAmount.textContent = formatCurrency(totals.net, currency);
    }

    if (elements.summaryIncoming) {
      elements.summaryIncoming.textContent = formatCurrency(totals.incoming, currency);
    }
    if (elements.summaryOutgoing) {
      elements.summaryOutgoing.textContent = formatCurrency(totals.outgoing, currency);
    }
    if (elements.summaryNet) {
      elements.summaryNet.textContent = formatCurrency(totals.net, currency);
    }
  };

  const applySearchFilter = (items) => {
    const term = state.filters.search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const amountMatch = formatCurrency(item.amount, item.currency).toLowerCase().includes(term);
    const operationIdentifier =
        item.operation?.raw?.operationCode ||
        item.operation?.raw?.code ||
        item.operation?.raw?._id ||
        item.operation?.code ||
        item.operation?.id ||
        item.id || '';
    const idMatch = operationIdentifier.toString().toLowerCase().includes(term);
      return amountMatch || idMatch;
    });
  };

  const renderActiveFilters = () => {
    if (!elements.activeFilters) return;
    const chips = [];
    if (state.filters.operationType) {
      chips.push({ type: 'operationType', label: 'Tipo', value: state.filters.operationType });
    }
    if (state.filters.state) {
      chips.push({ type: 'state', label: 'Estado', value: translateState(state.filters.state) });
    }
    if (state.filters.dateFrom) {
      chips.push({ type: 'dateFrom', label: 'Desde', value: state.filters.dateFrom });
    }
    if (state.filters.search.trim()) {
      chips.push({ type: 'search', label: 'Buscar', value: `"${state.filters.search.trim()}"` });
    }

    if (!chips.length) {
      elements.activeFilters.innerHTML =
        '<span class="text-xs text-gray-500">Sin filtros adicionales aplicados.</span>';
      return;
    }

    elements.activeFilters.innerHTML = chips
      .map(
        (chip) => `
        <span class="chip-removable inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-white">
          ${chip.label}: ${chip.value}
          <button class="ml-2" data-remove="${chip.type}" aria-label="Quitar filtro ${chip.label}">
            <i class="fa-solid fa-times text-xs"></i>
          </button>
        </span>`
      )
      .join('');
  };

  const renderDesktopTable = (items) => {
    if (!elements.desktopTableBody) return;
    if (!items.length) {
      elements.desktopTableBody.innerHTML =
        '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No hay operaciones para los filtros seleccionados.</td></tr>';
      return;
    }

    const rows = items
      .map((movement) => {
        const amountClass =
          movement.amount > 0 ? 'text-success' : movement.amount < 0 ? 'text-danger' : 'text-gray-600';
        const badgeClass =
          movement.state === 'compensada'
            ? 'bg-green-100 text-green-800'
            : movement.state === 'registrada'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800';
        const currencyBadge =
          movement.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
        const operationId =
          movement.operation?.raw?.operationCode ||
          movement.operation?.raw?.code ||
          movement.operation?.raw?._id ||
          movement.operation?.code ||
          movement.operation?.id ||
          movement.id;
        const operationSource = movement.operation?.raw?.source || movement.operation?.source || '';

        return `
          <tr>
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-text-primary">${formatDate(movement.date || movement.createdAt)}</div>
              <div class="text-xs text-gray-500">${formatDateTime(movement.createdAt)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-text-primary">${operationLabel(movement.operation)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currencyBadge}">${movement.currency}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right">
              <span class="text-sm font-semibold ${amountClass}">${formatSignedCurrency(movement.amount, movement.currency)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">${translateState(movement.state)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">${operationId || '—'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-center">
              <button
                type="button"
                class="text-primary hover:text-blue-700 text-sm font-medium"
                data-view-operation="${operationId || ''}"
                data-source="${operationSource}"
              >
                Ver operación
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    elements.desktopTableBody.innerHTML = rows;
  };

  const renderMobileTable = (items) => {
    if (!elements.mobileTable) return;
    if (!items.length) {
      elements.mobileTable.innerHTML =
        '<div class="px-4 py-6 text-center text-sm text-gray-500">No hay operaciones para los filtros seleccionados.</div>';
      return;
    }

    elements.mobileTable.innerHTML = items
      .map((movement) => {
        const amountClass =
          movement.amount > 0 ? 'text-success' : movement.amount < 0 ? 'text-danger' : 'text-gray-600';
        const badgeClass =
          movement.state === 'compensada'
            ? 'bg-green-100 text-green-800'
            : movement.state === 'registrada'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800';
        const currencyBadge =
          movement.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800';
        const operationId =
          movement.operation?.raw?.operationCode ||
          movement.operation?.raw?.code ||
          movement.operation?.raw?._id ||
          movement.operation?.code ||
          movement.operation?.id ||
          movement.id;
        const operationSource = movement.operation?.raw?.source || movement.operation?.source || '';

        return `
          <div class="p-4 border-b border-gray-100" data-view-operation="${operationId || ''}" data-source="${operationSource}">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-semibold text-text-primary">${operationLabel(movement.operation)}</span>
              <span class="text-sm font-semibold ${amountClass}">${formatSignedCurrency(movement.amount, movement.currency)}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500">
              <span>${formatDateTime(movement.createdAt)}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full ${currencyBadge}">${movement.currency}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 mt-2">
              <span>ID ${operationId || '—'}</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full font-medium ${badgeClass}">${translateState(movement.state)}</span>
            </div>
          </div>
        `;
      })
      .join('');
  };

  const updateTables = (filteredItems) => {
    renderDesktopTable(filteredItems);
    renderMobileTable(filteredItems);

    const incomingCount = filteredItems.filter((movement) => movement.amount > 0).length;
    const outgoingCount = filteredItems.filter((movement) => movement.amount < 0).length;

    if (elements.incomingCount) {
      elements.incomingCount.textContent = `${incomingCount} en página`;
    }
    if (elements.outgoingCount) {
      elements.outgoingCount.textContent = `${outgoingCount} en página`;
    }

    updatePaginationSummary(filteredItems.length);
  };

  const updatePaginationSummary = (visibleCount = state.rawOperations.length) => {
    if (!elements.tableSummary || !elements.tableRange) return;
    const { page, pageSize, totalItems, totalPages } = state.pagination;
    const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalItems);
    elements.tableSummary.textContent = `Coincidencias visibles: ${visibleCount} · Total ${totalItems}`;
    elements.tableRange.textContent = `Mostrando ${start}-${end} de ${totalItems} operaciones`;
    if (elements.prevPage) elements.prevPage.disabled = page <= 1;
    if (elements.nextPage) elements.nextPage.disabled = page >= Math.max(totalPages, 1);
  };

  const openOperationDetail = (operationId, source) => {
    if (!operationId) {
      showToast('No encontramos la operación seleccionada.', 'warning');
      return;
    }
    if (source === 'treasury') {
      window.location.href = `/tesoreria/movimientos/${encodeURIComponent(operationId)}`;
      return;
    }
    window.location.href = `/dashboard/operations?operation=${encodeURIComponent(operationId)}`;
  };

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set('page', state.pagination.page);
    params.set('limit', state.pagination.pageSize);
    params.set('currency', state.filters.currency || 'USD');
    if (state.filters.operationType) params.set('type', state.filters.operationType);
    if (state.filters.state) params.set('state', state.filters.state);
    if (state.filters.dateFrom) params.set('dateFrom', state.filters.dateFrom);
    params.set('sortBy', state.filters.sortBy);
    params.set('sortDirection', state.filters.sortDirection);
    return params.toString();
  };

  const fetchContactDetail = async () => {
    if (!state.contactId) {
      showToast('Contacto no especificado.', 'danger');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        apiUrl(`/api/current-accounts/contacts/${state.contactId}?${buildQueryParams()}`),
        { credentials: 'include' }
      );
      if (response.status === 404) {
        showToast('El contacto no existe o no se encuentra disponible.', 'danger');
        setLoading(false);
        return;
      }
      if (response.status === 401 || response.status === 403) {
        showToast('No tenés permisos para visualizar esta información.', 'danger');
        setLoading(false);
        return;
      }
      if (!response.ok) {
        throw new Error('No pudimos obtener el detalle del contacto.');
      }
      const data = await response.json();
      state.contact = data.contact;
      state.balances = data.balances || {};
      state.selectedCurrency = data.selectedCurrency || state.filters.currency || 'USD';
      state.filters.currency = state.selectedCurrency;
      if (elements.currencyFilter) {
        elements.currencyFilter.value = state.selectedCurrency;
      }
      state.totals = data.totals || { incoming: 0, outgoing: 0, net: 0 };
      state.pagination = {
        page: data.operations?.page || 1,
        pageSize: data.operations?.pageSize || CONTACT_PAGE_SIZE,
        totalItems: data.operations?.totalItems || 0,
        totalPages: data.operations?.totalPages || 1,
      };
      state.operations = Array.isArray(data.operations?.items) ? data.operations.items : [];
      state.rawOperations = state.operations.slice();

      updateContactHeader();
      updateTotals();

      const filtered = applySearchFilter(state.rawOperations);
      updateTables(filtered);
      renderActiveFilters();
    } catch (error) {
      showToast(error.message || 'Error al obtener el detalle del contacto.', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    state.filters.operationType = '';
    state.filters.state = '';
    state.filters.dateFrom = '';
    state.filters.search = '';
    state.filters.sortBy = 'date';
    state.filters.sortDirection = 'desc';
    state.pagination.page = 1;
    if (elements.typeFilter) elements.typeFilter.value = '';
    if (elements.statusFilter) elements.statusFilter.value = '';
    if (elements.dateFromFilter) elements.dateFromFilter.value = '';
    if (elements.searchInput) elements.searchInput.value = '';
    if (elements.sortSelect) elements.sortSelect.value = 'date-desc';
  };

  const debounce = (fn, timeout = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), timeout);
    };
  };

  const handleFilterChange = () => {
    state.pagination.page = 1;
    fetchContactDetail();
  };

  const handleSearchInput = debounce(() => {
    state.filters.search = elements.searchInput?.value || '';
    const filtered = applySearchFilter(state.rawOperations);
    updateTables(filtered);
    renderActiveFilters();
    updatePaginationSummary();
  }, 250);

  const attachEventListeners = () => {
    elements.currencyFilter?.addEventListener('change', (event) => {
      state.filters.currency = event.target.value || 'USD';
      handleFilterChange();
    });

    elements.typeFilter?.addEventListener('change', (event) => {
      state.filters.operationType = event.target.value;
      handleFilterChange();
    });

    elements.statusFilter?.addEventListener('change', (event) => {
      state.filters.state = event.target.value;
      handleFilterChange();
    });

    elements.dateFromFilter?.addEventListener('change', (event) => {
      state.filters.dateFrom = event.target.value;
      handleFilterChange();
    });

    elements.sortSelect?.addEventListener('change', (event) => {
      const [sortBy, sortDirection] = event.target.value.split('-');
      state.filters.sortBy = sortBy || 'date';
      state.filters.sortDirection = sortDirection || 'desc';
      handleFilterChange();
    });

    elements.clearFiltersBtn?.addEventListener('click', () => {
      resetFilters();
      renderActiveFilters();
      handleFilterChange();
      showToast('Filtros limpiados correctamente.', 'success');
    });

    elements.activeFilters?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-remove]');
      if (!button) return;
      const type = button.getAttribute('data-remove');
      if (type === 'operationType') {
        state.filters.operationType = '';
        if (elements.typeFilter) elements.typeFilter.value = '';
      }
      if (type === 'state') {
        state.filters.state = '';
        if (elements.statusFilter) elements.statusFilter.value = '';
      }
      if (type === 'dateFrom') {
        state.filters.dateFrom = '';
        if (elements.dateFromFilter) elements.dateFromFilter.value = '';
      }
      if (type === 'search') {
        state.filters.search = '';
        if (elements.searchInput) elements.searchInput.value = '';
      }
      renderActiveFilters();
      const filtered = applySearchFilter(state.rawOperations);
      updateTables(filtered);
      updatePaginationSummary();
    });

    elements.searchInput?.addEventListener('input', handleSearchInput);

    elements.prevPage?.addEventListener('click', () => {
      if (state.pagination.page <= 1) return;
      state.pagination.page -= 1;
      fetchContactDetail();
    });
    elements.nextPage?.addEventListener('click', () => {
      if (state.pagination.page >= state.pagination.totalPages) return;
      state.pagination.page += 1;
      fetchContactDetail();
    });

    elements.desktopTableBody?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-view-operation]');
      if (!button) return;
      openOperationDetail(button.dataset.viewOperation, button.dataset.source);
    });
    elements.mobileTable?.addEventListener('click', (event) => {
      const card = event.target.closest('[data-view-operation]');
      if (!card) return;
      openOperationDetail(card.dataset.viewOperation, card.dataset.source);
    });

    elements.relatedAccountsBtn?.addEventListener('click', () => {
      showToast('Esta navegación estará disponible próximamente.', 'info');
    });

    document.getElementById('menu-toggle')?.addEventListener('click', (event) => {
      const menu = document.getElementById('mobile-menu');
      if (!menu) return;
      event.stopPropagation();
      const hidden = menu.classList.toggle('hidden');
      const icon = event.currentTarget.querySelector('i');
      if (icon) icon.className = hidden ? 'fa-solid fa-bars text-lg' : 'fa-solid fa-times text-lg';
    });

    document.addEventListener('click', (event) => {
      const menu = document.getElementById('mobile-menu');
      const toggle = document.getElementById('menu-toggle');
      if (!menu || menu.classList.contains('hidden')) return;
      if (menu.contains(event.target) || toggle?.contains(event.target)) return;
      menu.classList.add('hidden');
      const icon = toggle?.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars text-lg';
    });

    document.getElementById('mobile-back')?.addEventListener('click', () => {
      window.history.back();
    });
  };

  const initialize = () => {
    state.contactId = parseContactId();
    if (!state.contactId) {
      showToast('No se indicó un contacto válido.', 'danger');
      return;
    }
    attachEventListeners();
    fetchContactDetail();
  };

  document.addEventListener('DOMContentLoaded', initialize);
})();

