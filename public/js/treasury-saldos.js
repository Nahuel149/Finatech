(function treasuryBalancesDashboard(global) {
  const { TreasuryApi, TreasuryApiError } = global;

  const API_ENDPOINTS = {
    currentAccountSummary: '/api/current-accounts/summary',
    movements: ({ currency, limit = 6 }) =>
      `/api/current-accounts/movements?ledger=contact&currency=${currency}&limit=${limit}`,
  };

  const state = {
    summary: null,
    lastSync: null,
    movements: {
      usd: [],
      arsCash: [],
      arsTransfers: [],
    },
    topContact: null,
  };

  const CONTACTS_PAGE_SIZE = 10;

  const contactsState = {
    filters: {
      currency: 'USD',
      contactType: '',
      status: '',
      balance: '',
      search: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'amount',
      sortDirection: 'desc',
    },
    page: 1,
    totalPages: 1,
    totalItems: 0,
    loading: false,
  };

  const contactsElements = {
    summaryLabel: document.getElementById('contacts-summary-label'),
    container: document.getElementById('contacts-table-container'),
    loadingOverlay: document.getElementById('contacts-loading'),
    tableBody: document.getElementById('contacts-table-body'),
    emptyState: document.getElementById('contacts-empty'),
    pageInfo: document.getElementById('contacts-page-info'),
    prevBtn: document.getElementById('contacts-prev'),
    nextBtn: document.getElementById('contacts-next'),
    currencySelect: document.getElementById('contacts-currency'),
    typeSelect: document.getElementById('contacts-type'),
    statusSelect: document.getElementById('contacts-status'),
    balanceSelect: document.getElementById('contacts-balance'),
    searchInput: document.getElementById('contacts-search'),
    dateFromInput: document.getElementById('contacts-date-from'),
    dateToInput: document.getElementById('contacts-date-to'),
    sortSelect: document.getElementById('contacts-sort'),
    applyButton: document.getElementById('contacts-apply'),
    resetButton: document.getElementById('contacts-reset'),
  };

  const panelElements = {
    panel: document.getElementById('detail-panel'),
    overlay: document.getElementById('detail-panel-overlay'),
    amount: document.getElementById('panel-balance-amount'),
    updated: document.getElementById('panel-balance-variation'),
    dateFrom: document.getElementById('panel-date-from'),
    dateTo: document.getElementById('panel-date-to'),
    movementType: document.getElementById('panel-movement-type'),
    applyButton: document.getElementById('panel-filter-apply'),
    movementsContainer: document.getElementById('panel-movements-container'),
  };
  const detailState = {
    activeKey: null,
  };

  let menuToggleButton;
  let mobileMenuPanel;

  const formatCurrency = (value, currency = 'ARS') => {
    const numeric = Number(value) || 0;
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch (error) {
      const sign = currency === 'USD' ? 'USD' : '$';
      return `${sign} ${numeric.toFixed(2)}`;
    }
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

  const formatUpdatedLabel = (isoString) => {
    if (!isoString) return 'Actualizado —';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Actualizado —';
    return `Actualizado ${date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const fetchJson = async (url) => {
    const response = await fetch(apiUrl(url), {
      credentials: 'include',
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload.message || `Error al consultar ${url}`;
      if (typeof TreasuryApiError === 'function') { throw new TreasuryApiError(message, response.status, payload); } throw new Error(message);
    }
    return response.json();
  };

  const setTreasuryCard = (amountId, updatedId, value, currency, updatedAt) => {
    const amountNode = document.getElementById(amountId);
    const updatedNode = document.getElementById(updatedId);
    if (amountNode) amountNode.textContent = formatCurrency(value, currency);
    if (updatedNode) updatedNode.textContent = formatUpdatedLabel(updatedAt);
  };

  const updateTreasuryCards = (balances = []) => {
    const findBalance = (key, currency) =>
      balances.find((balance) => balance.id === key && balance.currency === currency) || null;

    const transfers = findBalance('transfers', 'ARS');
    const cash = findBalance('cash', 'ARS');
    const usd = findBalance('usd', 'USD');

    setTreasuryCard(
      'treasury-transfers-amount',
      'treasury-transfers-updated',
      transfers?.amount || 0,
      'ARS',
      transfers?.updatedAt
    );
    setTreasuryCard(
      'treasury-transfers-amount-mobile',
      'treasury-transfers-updated-mobile',
      transfers?.amount || 0,
      'ARS',
      transfers?.updatedAt
    );
    setTreasuryCard(
      'treasury-cash-amount',
      'treasury-cash-updated',
      cash?.amount || 0,
      'ARS',
      cash?.updatedAt
    );
    setTreasuryCard(
      'treasury-cash-amount-mobile',
      'treasury-cash-updated-mobile',
      cash?.amount || 0,
      'ARS',
      cash?.updatedAt
    );
    setTreasuryCard(
      'treasury-usd-amount',
      'treasury-usd-updated',
      usd?.amount || 0,
      'USD',
      usd?.updatedAt
    );
    setTreasuryCard(
      'treasury-usd-amount-mobile',
      'treasury-usd-updated-mobile',
      usd?.amount || 0,
      'USD',
      usd?.updatedAt
    );
  };

  const updateCurrentAccountCards = (summary) => {
    const balances = summary?.balances || [];
    const findByCurrency = (currency) =>
      balances.find((balance) => balance.currency === currency) || null;

    const usd = findByCurrency('USD');
    const ars = findByCurrency('ARS');

    if (usd) {
      const usdAmount = document.getElementById('receivable-usd-amount');
      if (usdAmount) usdAmount.textContent = formatCurrency(usd.amount, 'USD');
      const usdUpdated = document.getElementById('receivable-usd-updated');
      if (usdUpdated) usdUpdated.textContent = formatUpdatedLabel(usd.updatedAt);
    }

    if (ars) {
      const arsAmount = document.getElementById('receivable-ars-amount');
      if (arsAmount) arsAmount.textContent = formatCurrency(ars.amount, 'ARS');
      const arsUpdated = document.getElementById('receivable-ars-updated');
      if (arsUpdated) arsUpdated.textContent = formatUpdatedLabel(ars.updatedAt);
    }

    const topContact = (summary?.topContacts || [])[0];
    const labelNode = document.getElementById('top-contact-label');
    const amountNode = document.getElementById('top-contact-amount');
    const currencyNode = document.getElementById('top-contact-currency');
    const metaNode = document.getElementById('top-contact-meta');
    const topContactButton = document.getElementById('top-contact-button');

    if (topContact && amountNode) {
      const contactName =
        topContact.contact?.shortName || topContact.contact?.fullName || 'Contacto';
      const formattedAmount = formatCurrency(topContact.amount, topContact.currency);
      amountNode.textContent = formattedAmount;
      if (labelNode) labelNode.textContent = contactName;
      if (currencyNode) currencyNode.textContent = topContact.currency;
      if (metaNode) metaNode.textContent = formatUpdatedLabel(topContact.updatedAt);
      state.topContact = topContact;
      if (topContactButton) {
        topContactButton.disabled = false;
        topContactButton.dataset.contactId =
          topContact.contactId || topContact.contact?.id || '';
      }
    } else {
      if (amountNode) amountNode.textContent = '—';
      if (labelNode) labelNode.textContent = 'Sin contactos pendientes';
      if (currencyNode) currencyNode.textContent = '—';
      if (metaNode) metaNode.textContent = 'Sin movimientos recientes';
      state.topContact = null;
      if (topContactButton) {
        topContactButton.disabled = true;
        delete topContactButton.dataset.contactId;
      }
    }
  };

  const translateContactType = (type) => {
    if (type === 'provider') return 'Proveedor';
    return 'Cliente';
  };

  const translateStatus = (status) => (status === 'inactive' ? 'Inactivo' : 'Activo');

  const formatBalanceCell = (amount, currency) => {
    const className =
      amount > 0 ? 'positive-amount' : amount < 0 ? 'negative-amount' : 'text-gray-500';
    return `<span class="font-semibold ${className}">${formatCurrency(amount, currency)}</span>`;
  };

  const buildContactRow = (contact) => {
    const lastOperation = contact.lastOperation;
    const lastOperationDate = lastOperation?.createdAt ? formatDateTime(lastOperation.createdAt) : '—';
    const lastOperationState = lastOperation?.state
      ? lastOperation.state.charAt(0).toUpperCase() + lastOperation.state.slice(1)
      : '—';
    const stateBadgeClass =
      contact.contact?.status === 'inactive'
        ? 'bg-gray-100 text-gray-700'
        : 'bg-green-100 text-green-800';

    return `
      <tr>
        <td class="px-6 py-4">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-text-primary">${contact.contact?.shortName || contact.contact?.fullName || 'Contacto'}</span>
            <span class="text-xs text-gray-500">${contact.contact?.fullName || ''}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-gray-600">${translateContactType(contact.contact?.contactType)}</td>
        <td class="px-6 py-4 text-right">${formatBalanceCell(contact.amount, contact.currency)}</td>
        <td class="px-6 py-4 text-sm text-gray-600">
          <div class="flex flex-col">
            <span>${lastOperationDate}</span>
            <span class="text-xs text-gray-400">${lastOperationState}</span>
          </div>
        </td>
        <td class="px-6 py-4 text-center">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stateBadgeClass}">
            ${translateStatus(contact.contact?.status)}
          </span>
        </td>
        <td class="px-6 py-4 text-center">
          <button type="button" class="text-primary hover:text-blue-700 text-sm font-medium" data-contact-id="${contact.contactId || contact.contact?.id || ''}">
            Ver detalle
          </button>
        </td>
      </tr>
    `;
  };

  const updateContactsSummaryLabel = () => {
    if (!contactsElements.summaryLabel) return;
    contactsElements.summaryLabel.textContent = `Mostrando ${contactsState.totalItems} resultado${contactsState.totalItems === 1 ? '' : 's'}`;
  };

  const setContactsLoading = (isLoading) => {
    contactsState.loading = isLoading;
    if (contactsElements.loadingOverlay) {
      contactsElements.loadingOverlay.classList.toggle('hidden', !isLoading);
    }
    if (contactsElements.container) {
      contactsElements.container.classList.toggle('opacity-60', isLoading);
    }
  };

  const renderContactsTable = (items = []) => {
    if (!contactsElements.tableBody) return;
    if (!items.length) {
      contactsElements.tableBody.innerHTML = '';
      contactsElements.emptyState?.classList.remove('hidden');
      return;
    }

    contactsElements.emptyState?.classList.add('hidden');
    contactsElements.tableBody.innerHTML = items.map(buildContactRow).join('');
  };

  const updateContactsPagination = () => {
    if (contactsElements.pageInfo) {
      contactsElements.pageInfo.textContent = `Página ${contactsState.page} de ${contactsState.totalPages}`;
    }
    if (contactsElements.prevBtn) {
      contactsElements.prevBtn.disabled = contactsState.page <= 1 || contactsState.loading;
    }
    if (contactsElements.nextBtn) {
      contactsElements.nextBtn.disabled =
        contactsState.page >= contactsState.totalPages || contactsState.loading;
    }
  };

  const getContactsFiltersFromControls = () => ({
    currency: contactsElements.currencySelect?.value || 'USD',
    contactType: contactsElements.typeSelect?.value || '',
    status: contactsElements.statusSelect?.value || '',
    balance: contactsElements.balanceSelect?.value || '',
    search: contactsElements.searchInput?.value.trim() || '',
    dateFrom: contactsElements.dateFromInput?.value || '',
    dateTo: contactsElements.dateToInput?.value || '',
    sort: contactsElements.sortSelect?.value || 'amount-desc',
  });

  const applyFiltersToState = () => {
    const { currency, contactType, status, balance, search, dateFrom, dateTo, sort } =
      getContactsFiltersFromControls();
    const [sortBy, sortDirection = 'desc'] = sort.split('-');
    contactsState.filters = {
      currency,
      contactType,
      status,
      balance,
      search,
      dateFrom,
      dateTo,
      sortBy,
      sortDirection,
    };
  };

  const resetContactControls = () => {
    if (contactsElements.currencySelect) contactsElements.currencySelect.value = 'USD';
    if (contactsElements.typeSelect) contactsElements.typeSelect.value = '';
    if (contactsElements.statusSelect) contactsElements.statusSelect.value = '';
    if (contactsElements.balanceSelect) contactsElements.balanceSelect.value = '';
    if (contactsElements.searchInput) contactsElements.searchInput.value = '';
    if (contactsElements.dateFromInput) contactsElements.dateFromInput.value = '';
    if (contactsElements.dateToInput) contactsElements.dateToInput.value = '';
    if (contactsElements.sortSelect) contactsElements.sortSelect.value = 'amount-desc';
    applyFiltersToState();
  };

  const buildContactsQueryString = () => {
    const params = new URLSearchParams();
    params.set('currency', contactsState.filters.currency);
    if (contactsState.filters.contactType) params.set('contactType', contactsState.filters.contactType);
    if (contactsState.filters.status) params.set('status', contactsState.filters.status);
    if (contactsState.filters.balance) params.set('balance', contactsState.filters.balance);
    if (contactsState.filters.search) params.set('search', contactsState.filters.search);
    if (contactsState.filters.dateFrom) params.set('dateFrom', contactsState.filters.dateFrom);
    if (contactsState.filters.dateTo) params.set('dateTo', contactsState.filters.dateTo);
    params.set('sortBy', contactsState.filters.sortBy);
    params.set('sortDirection', contactsState.filters.sortDirection);
    params.set('page', contactsState.page);
    params.set('limit', CONTACTS_PAGE_SIZE);
    return params.toString();
  };

  const fetchContacts = async (options = {}) => {
    if (!contactsElements.tableBody) return;
    if (typeof options.page === 'number') {
      contactsState.page = Math.max(1, options.page);
    }
    setContactsLoading(true);
    try {
      const query = buildContactsQueryString();
      const response = await fetch(apiUrl(`/api/current-accounts/contacts?${query}`), {
        credentials: 'include',
      });
      if (response.status === 401 || response.status === 403) {
        if (contactsElements.container) contactsElements.container.classList.add('hidden');
        if (contactsElements.summaryLabel) {
          contactsElements.summaryLabel.textContent = 'No tenés permisos para ver los saldos.';
        }
        return;
      }
      if (!response.ok) {
        throw new Error('No pudimos obtener la lista de contactos.');
      }
      const data = await response.json();
      contactsState.totalItems = data?.totalItems || 0;
      contactsState.totalPages = data?.totalPages || 1;
      contactsState.page = data?.page || 1;
      const items = Array.isArray(data?.items) ? data.items : [];
      renderContactsTable(items);
      updateContactsPagination();
      updateContactsSummaryLabel();
    } catch (error) {
      showToast(error.message || 'No pudimos obtener la lista de contactos.', 'danger');
      renderContactsTable([]);
      updateContactsPagination();
    } finally {
      setContactsLoading(false);
    }
  };

  const attachContactsListeners = () => {
    contactsElements.applyButton?.addEventListener('click', () => {
      applyFiltersToState();
      contactsState.page = 1;
      fetchContacts();
    });

    contactsElements.resetButton?.addEventListener('click', () => {
      resetContactControls();
      contactsState.page = 1;
      fetchContacts();
    });

    contactsElements.prevBtn?.addEventListener('click', () => {
      if (contactsState.page > 1) {
        fetchContacts({ page: contactsState.page - 1 });
      }
    });

    contactsElements.nextBtn?.addEventListener('click', () => {
      if (contactsState.page < contactsState.totalPages) {
        fetchContacts({ page: contactsState.page + 1 });
      }
    });

    contactsElements.tableBody?.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-contact-id]');
      if (!button) return;
      const contactId = button.getAttribute('data-contact-id');
      if (!contactId) return;
      window.location.href = `saldos-contacto.html?contact=${encodeURIComponent(contactId)}`;
    });
  };

  const getMovementsForKey = (key) => {
    if (key === 'usd') return state.movements.usd || [];
    if (key === 'ars-cash') return state.movements.arsCash || [];
    if (key === 'ars-transfers') return state.movements.arsTransfers || [];
    if (key === 'ars') return [...(state.movements.arsCash || []), ...(state.movements.arsTransfers || [])];
    return [];
  };

  const renderPanelMovements = () => {
    if (!panelElements.movementsContainer) return;
    const activeKey = detailState.activeKey;
    if (!activeKey) {
      panelElements.movementsContainer.innerHTML =
        '<p class="text-xs text-gray-500">Seleccioná una cuenta para ver sus movimientos recientes.</p>';
      return;
    }

    const rawMovements = getMovementsForKey(activeKey);
    const typeFilter = panelElements.movementType?.value || '';
    const fromValue = panelElements.dateFrom?.value ? new Date(panelElements.dateFrom.value) : null;
    const toValue = panelElements.dateTo?.value ? new Date(panelElements.dateTo.value) : null;
    if (toValue) {
      toValue.setHours(23, 59, 59, 999);
    }

    const filtered = rawMovements.filter((movement) => {
      const movementDate = movement.createdAt ? new Date(movement.createdAt) : null;
      if (fromValue && movementDate && movementDate < fromValue) return false;
      if (toValue && movementDate && movementDate > toValue) return false;
      if (typeFilter === 'incoming' && Number(movement.amount) < 0) return false;
      if (typeFilter === 'outgoing' && Number(movement.amount) > 0) return false;
      return true;
    });

    if (!filtered.length) {
      panelElements.movementsContainer.innerHTML =
        '<p class="text-xs text-gray-500">No hay movimientos para los filtros seleccionados.</p>';
      return;
    }

    const cards = filtered.slice(0, 10).map((movement) => {
      const isIncome = Number(movement.amount) >= 0;
      const badgeClass = isIncome ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      const badgeIcon = isIncome ? 'fa-arrow-up' : 'fa-arrow-down';
      const badgeText = isIncome ? 'Ingreso' : 'Egreso';
      const amountClass = isIncome ? 'positive-amount' : 'negative-amount';
      const amountText = formatCurrency(Math.abs(movement.amount || 0), movement.currency || 'ARS');
      const createdAt = movement.createdAt ? formatDateTime(movement.createdAt) : '—';
      const contactName =
        movement.contact?.shortName || movement.contact?.fullName || 'General';
      const operationCode = movement.operation?.code || movement.operation?.id || '—';
      return `
        <article class="bg-white border border-gray-200 rounded-lg p-4">
          <header class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
                <i class="fa-solid ${badgeIcon} mr-1"></i>${badgeText}
              </span>
              <span class="text-xs text-gray-500">${createdAt}</span>
            </div>
            <div class="text-sm ${amountClass} font-semibold">${amountText}</div>
          </header>
          <div class="flex items-center justify-between text-xs text-gray-600">
            <span>${movement.metadata?.movementType || movement.medium || '—'} · ${contactName}</span>
            <span class="text-primary">${operationCode}</span>
          </div>
        </article>
      `;
    });

    panelElements.movementsContainer.innerHTML = cards.join('');
  };

  const renderMovementRows = (containerId, movements = []) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!movements.length) {
      container.innerHTML =
        '<article class="text-sm text-gray-500">No hay movimientos recientes para mostrar.</article>';
      return;
    }
    const rows = movements
      .map((movement) => {
        const isIncome = Number(movement.amount) >= 0;
        const badgeClass = isIncome
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800';
        const badgeIcon = isIncome ? 'fa-arrow-up' : 'fa-arrow-down';
        const badgeText = isIncome ? 'Ingreso' : 'Egreso';
        const amountClass = isIncome ? 'positive-amount' : 'negative-amount';
        const method =
          movement.metadata?.movementType ||
          movement.counterpart?.key ||
          movement.medium ||
          'General';
        const statusBadge =
          movement.stage === 'registration'
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Registrado</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Compensado</span>';
        const contactName =
          movement.contact?.shortName || movement.contact?.fullName || 'General';
        const amountText = formatCurrency(Math.abs(movement.amount), movement.currency);
        return `
        <article class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <header class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}">
                        <i class="fa-solid ${badgeIcon} mr-1"></i>${badgeText}
                    </span>
                    <span class="text-xs text-gray-500">${formatDateTime(movement.createdAt)}</span>
                </div>
                ${statusBadge}
            </header>
            <div class="flex items-center justify-between mb-3">
                <div>
                    <div class="text-sm font-medium text-text-primary">${method}</div>
                    <div class="text-xs text-gray-500">${contactName}</div>
                </div>
                <div class="${amountClass} text-lg font-semibold">${amountText}</div>
            </div>
            <footer class="flex items-center justify-between text-xs text-gray-500">
                <span>ID ${movement.operation?.code || movement.operation?.id || '—'}</span>
                <button type="button" class="text-primary hover:text-blue-700 text-xs" data-view-movement="${movement.id}">
                    Ver detalle
                </button>
            </footer>
        </article>`;
      })
      .join('');
    container.innerHTML = rows;
  };

  const updateFooterTimestamp = () => {
    const footerTimestamp = document.getElementById('footer-sync-timestamp');
    if (!footerTimestamp) return;
    const now = new Date();
    footerTimestamp.textContent = now.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const loadDashboardSnapshot = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        document.body.classList.add('cursor-wait');
      }

      const [treasuryRes, summaryRes, usdMovementsRes, arsMovementsRes] = await Promise.all([
        TreasuryApi.getBalances(),
        fetchJson(API_ENDPOINTS.currentAccountSummary),
        fetchJson(API_ENDPOINTS.movements({ currency: 'USD' })),
        fetchJson(API_ENDPOINTS.movements({ currency: 'ARS', limit: 6 })),
      ]);

      const arsItems = arsMovementsRes.items || [];
      const arsCashMovements = arsItems.filter(
        (item) => item.metadata?.movementType === 'cash'
      );
      const arsTransferMovements = arsItems.filter(
        (item) => item.metadata?.movementType !== 'cash'
      );

      state.summary = summaryRes;
      state.lastSync = new Date().toISOString();
      state.movements = {
        usd: usdMovementsRes.items || [],
        arsCash: arsCashMovements,
        arsTransfers: arsTransferMovements,
      };

      updateTreasuryCards(treasuryRes);
      updateCurrentAccountCards(summaryRes);
      renderMovementRows('usd-movements-container', state.movements.usd);
      renderMovementRows('ars-cash-movements', state.movements.arsCash);
      renderMovementRows('ars-transfers-movements', state.movements.arsTransfers);
      updateFooterTimestamp();
      if (detailState.activeKey) {
        renderPanelMovements();
      }
    } catch (error) {
      if (error instanceof TreasuryApiError && error.isUnauthorized()) {
        showToast('No tenés permisos para ver los saldos.', 'danger');
      } else {
        showToast(error.message || 'No pudimos actualizar la vista de Tesorería.', 'danger');
      }
    } finally {
      if (!silent) {
        document.body.classList.remove('cursor-wait');
      }
    }
  };

  const switchMovementsTab = (tabId) => {
    const tabs = document.querySelectorAll('[data-tab]');
    const panels = document.querySelectorAll('[data-tab-panel]');
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });
    panels.forEach((panel) => {
      const isHidden = panel.dataset.tabPanel !== tabId;
      panel.classList.toggle('hidden', isHidden);
    });
  };

  const openDetailPanel = (currencyKey) => {
    const summary = state.summary || {};
    const balances = summary.balances || [];
    const findByCurrency = (currency) =>
      balances.find((balance) => balance.currency === currency);

    let card;
    if (currencyKey === 'usd') {
      card = findByCurrency('USD');
      document.getElementById('panel-title')?.textContent = 'Detalle de cuenta USD';
    } else {
      card = findByCurrency('ARS');
      document.getElementById('panel-title')?.textContent = 'Detalle de cuenta ARS';
    }

    panelElements.amount.textContent = card
      ? formatCurrency(card.amount || 0, card.currency || 'ARS')
      : '--';
    panelElements.updated.textContent = card ? formatUpdatedLabel(card.updatedAt) : 'Actualizado —';

    detailState.activeKey = currencyKey;

    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (panelElements.dateFrom) panelElements.dateFrom.value = weekAgo.toISOString().split('T')[0];
    if (panelElements.dateTo) panelElements.dateTo.value = today.toISOString().split('T')[0];
    if (panelElements.movementType) panelElements.movementType.value = '';

    renderPanelMovements();

    panelElements.panel?.classList.add('open');
    panelElements.panel?.setAttribute('aria-hidden', 'false');
    panelElements.overlay?.classList.remove('hidden');
    panelElements.overlay?.setAttribute('aria-hidden', 'false');
  };

  const closeDetailPanel = () => {
    detailState.activeKey = null;
    panelElements.panel?.classList.remove('open');
    panelElements.panel?.setAttribute('aria-hidden', 'true');
    panelElements.overlay?.classList.add('hidden');
    panelElements.overlay?.setAttribute('aria-hidden', 'true');
  };

  const refreshBalances = (button) => {
    if (button) {
      button.setAttribute('disabled', 'disabled');
      const previousContent = button.innerHTML;
      button.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Actualizando...';
      loadDashboardSnapshot({ silent: false }).finally(() => {
        button.innerHTML = previousContent;
        button.removeAttribute('disabled');
      });
    } else {
      loadDashboardSnapshot();
    }
  };

  const viewInAccountsReceivable = (key) => {
    showToast(`Apertura de Cuenta Corriente para ${key || 'general'} en desarrollo.`, 'info');
  };

  const viewAllMovements = (section) => {
    if (section === 'current') {
      window.location.href = 'tesoreria-movimientos.html';
      return;
    }
    window.location.href = 'tesoreria-movimientos.html';
  };

  const viewTopContactDetail = () => {
    const button = document.getElementById('top-contact-button');
    const contactId =
      button?.dataset.contactId || state.topContact?.contactId || state.topContact?.contact?.id;
    if (!contactId) {
      showToast('No hay un contacto destacado disponible.', 'info');
      return;
    }
    window.location.href = `saldos-contacto.html?contact=${encodeURIComponent(contactId)}`;
  };

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const colors = {
      success: 'bg-success text-white',
      warning: 'bg-warning text-gray-900',
      danger: 'bg-danger text-white',
      info: 'bg-primary text-white',
    };
    const icons = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-times-circle',
      info: 'fa-info-circle',
    };
    const toast = document.createElement('div');
    toast.className = `toast px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 ${
      colors[type] || colors.info
    }`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type] || icons.info}"></i>
        <span class="text-sm font-medium">${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  const bindMobileMenu = () => {
    menuToggleButton = document.getElementById('menu-toggle');
    mobileMenuPanel = document.getElementById('mobile-menu');
    if (!menuToggleButton || !mobileMenuPanel) return;

    menuToggleButton.addEventListener('click', () => {
      const isHidden = mobileMenuPanel.classList.toggle('hidden');
      const icon = menuToggleButton.querySelector('i');
      if (icon) icon.className = isHidden ? 'fa-solid fa-bars text-lg' : 'fa-solid fa-times text-lg';
    });

    document.addEventListener('click', (event) => {
      if (
        !mobileMenuPanel ||
        mobileMenuPanel.classList.contains('hidden') ||
        menuToggleButton.contains(event.target) ||
        mobileMenuPanel.contains(event.target)
      ) {
        return;
      }
      mobileMenuPanel.classList.add('hidden');
      const icon = menuToggleButton.querySelector('i');
      if (icon) icon.className = 'fa-solid fa-bars text-lg';
    });
  };

  const bindTabs = () => {
    document.querySelectorAll('[data-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        switchMovementsTab(tab.dataset.tab);
      });
    });
  };

  const bindDetailPanel = () => {
    document.getElementById('close-detail-panel')?.addEventListener('click', closeDetailPanel);
    document.getElementById('detail-panel-overlay')?.addEventListener('click', closeDetailPanel);
    panelElements.applyButton?.addEventListener('click', () => {
      renderPanelMovements();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && panelElements.panel?.classList.contains('open')) {
        closeDetailPanel();
      }
    });
  };

  const bindDateFilters = () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const toISODate = (date) => date.toISOString().split('T')[0];

    const dateFrom = document.getElementById('panel-date-from');
    const dateTo = document.getElementById('panel-date-to');
    if (dateFrom) dateFrom.value = toISODate(weekAgo);
    if (dateTo) dateTo.value = toISODate(today);
  };

  const initialize = async () => {
    await loadDashboardSnapshot();
    bindMobileMenu();
    bindTabs();
    bindDetailPanel();
    bindDateFilters();
    resetContactControls();
    attachContactsListeners();
    fetchContacts();
  };

  global.refreshBalances = refreshBalances;
  global.openDetailPanel = openDetailPanel;
  global.closeDetailPanel = closeDetailPanel;
  global.viewInAccountsReceivable = viewInAccountsReceivable;
  global.viewAllMovements = viewAllMovements;
  global.viewTopContactDetail = viewTopContactDetail;

  document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
