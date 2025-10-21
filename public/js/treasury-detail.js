(function treasuryMovementDetail(global) {
  const { TreasuryApi, TreasuryApiError } = global;

  if (!TreasuryApi) {
    // eslint-disable-next-line no-console
    console.warn('TreasuryApi is not available. Movement detail cannot be loaded.');
    return;
  }

  const elements = {
    mobileBalanceContainer: document.getElementById('mobile-balance-container'),
    desktopBalanceContainer: document.getElementById('desktop-balance-container'),
    movementBreadcrumb: document.getElementById('movement-breadcrumb'),
    movementBreadcrumbPanel: document.getElementById('movement-id-breadcrumb'),
    movementId: document.getElementById('movement-id'),
    movementStatus: document.getElementById('movement-status'),
    movementDatetime: document.getElementById('movement-datetime'),
    movementCreator: document.getElementById('movement-creator'),
    movementType: document.getElementById('movement-type'),
    movementMedium: document.getElementById('movement-medium'),
    movementCurrency: document.getElementById('movement-currency'),
    movementAmount: document.getElementById('movement-amount'),
    movementReference: document.getElementById('movement-reference'),
    movementUpdated: document.getElementById('movement-updated'),
    contactCard: document.querySelector('#panel-content article:nth-of-type(2)'),
    contactName: document.getElementById('contact-name'),
    contactType: document.getElementById('contact-type'),
    contactCuit: document.getElementById('contact-cuit'),
    contactBalance: document.getElementById('contact-balance'),
    contactAccountBtn: document.getElementById('view-contact-account'),
    operationSection: document.getElementById('operation-section'),
    operationId: document.getElementById('operation-id'),
    operationStatus: document.getElementById('operation-status'),
    operationType: document.getElementById('operation-type'),
    operationCurrency: document.getElementById('operation-currency'),
    operationAmount: document.getElementById('operation-amount'),
    operationLinkBtn: document.getElementById('view-operation'),
    accountingRows: document.getElementById('accounting-rows'),
    toastContainer: document.getElementById('toast-container'),
    overlay: document.getElementById('movement-detail-overlay'),
    panel: document.getElementById('movement-detail-panel'),
    openPanelBtn: document.getElementById('view-panel'),
    closePanelBtn: document.getElementById('close-panel-btn'),
    closePanelIcon: document.getElementById('close-panel'),
    cancelMovementBtn: document.getElementById('cancel-movement'),
    editMovementBtn: document.getElementById('edit-movement'),
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
    registered: { label: 'Registrado', badge: 'bg-gray-100 text-gray-800' },
    compensated: { label: 'Compensado', badge: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Anulado', badge: 'bg-red-100 text-red-800' },
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
    };
    const iconMap = {
      success: 'fa-check-circle',
      warning: 'fa-exclamation-triangle',
      danger: 'fa-times-circle',
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

  const buildBalanceCard = (balance, { mobile = false } = {}) => {
    const icon = BALANCE_ICONS[balance.id] || 'fa-vault';
    const statusColor = BALANCE_STATUS_COLORS[balance.status] || BALANCE_STATUS_COLORS.ok;
    const updated = balance.updatedAt ? formatTime(balance.updatedAt) : '—';
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
            <div class="text-xs text-gray-500">Actualizado ${updated}</div>
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
          <div class="text-xs text-gray-500">Actualizado ${updated}</div>
      </article>`;
  };

  const updateBalances = (balances) => {
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

  const fetchBalances = async () => {
    try {
      const balances = await TreasuryApi.getBalances();
      updateBalances(balances);
    } catch (error) {
      // ignore balances errors silently; they are complementary information
    }
  };

  const parseMovementId = () => {
    const params = new URLSearchParams(window.location.search);
    const idFromQuery = params.get('movement') || params.get('id');
    if (idFromQuery) return idFromQuery;
    const pathSegments = window.location.pathname.split('/');
    return pathSegments[pathSegments.length - 1] || null;
  };

  async function fetchContactDetail(contactId, currency) {
    try {
      const url = `/api/current-accounts/contacts/${encodeURIComponent(contactId)}?currency=${encodeURIComponent(currency)}`;
      const res = await fetch(apiUrl(url), { credentials: 'include' });
      if (res.status === 401 || res.status === 403) throw new Error('No tenés permisos para ver el detalle.');
      if (!res.ok) throw new Error('No pudimos obtener el detalle del contacto.');
      const data = await res.json();
      return data;
    } catch (error) {
      showToast(error.message || 'Error al obtener el detalle del contacto.', 'danger');
      return null;
    }
  }

  const renderAccountingRows = (movement) => {
    if (!elements.accountingRows) return;
    const amount = Number(movement.amount || movement.totalAmount || 0);
    const currency = movement.currency || 'ARS';
    if (!amount) {
      elements.accountingRows.innerHTML = `
        <tr><td colspan="4" class="px-4 py-3 text-center text-sm text-gray-500">No hay información contable disponible.</td></tr>`;
      return;
    }
    const normalizedAmount = Math.abs(amount);
    const receivableAccount = movement.type === 'incoming' ? 'Cuentas a cobrar' : 'Cuentas a pagar';
    const treasuryAccount =
      movement.medium === 'cash'
        ? 'Tesorería - Caja'
        : movement.medium === 'transfer'
        ? 'Tesorería - Transferencias'
        : 'Tesorería';

    const rows = [
      {
        account: receivableAccount,
        currency,
        amount: movement.type === 'incoming' ? -normalizedAmount : normalizedAmount,
        counterpart: treasuryAccount,
      },
      {
        account: treasuryAccount,
        currency,
        amount: normalizedAmount,
        counterpart: receivableAccount,
      },
    ];

    elements.accountingRows.innerHTML = rows
      .map(
        (row) => `
        <tr>
            <td class="px-4 py-3 text-sm text-text-primary">${row.account}</td>
            <td class="px-4 py-3 text-center"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">${row.currency}</span></td>
            <td class="px-4 py-3 text-right text-sm font-medium ${
              row.amount >= 0 ? 'positive-amount' : 'negative-amount'
            }">${formatCurrency(Math.abs(row.amount), row.currency)}</td>
            <td class="px-4 py-3 text-sm text-gray-600">${row.counterpart}</td>
        </tr>`
      )
      .join('');
  };

  const populateMovementDetail = async (movement) => {
    const code = movement.movementCode || movement.id || '—';
    elements.movementId.textContent = `#${code}`;
    if (elements.movementBreadcrumb) {
      elements.movementBreadcrumb.textContent = `Movimiento ${code}`;
    }
    if (elements.movementBreadcrumbPanel) {
      elements.movementBreadcrumbPanel.textContent = `#${code}`;
    }

    const statusMeta = STATUS_META[movement.status] || STATUS_META.registered;
    elements.movementStatus.textContent = statusMeta.label;
    elements.movementStatus.className = `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusMeta.badge}`;

    const movementDate = movement.movementAt || movement.createdAt;
    elements.movementDatetime.textContent = `${formatDate(movementDate)} ${formatTime(movementDate)}`;
    elements.movementCreator.textContent = movement.performedBy?.name || '—';

    const typeMeta = TYPE_META[movement.type] || TYPE_META.incoming;
    elements.movementType.innerHTML = `<i class="fa-solid ${typeMeta.icon} ${typeMeta.color} mr-2"></i>${typeMeta.label}`;
    elements.movementMedium.textContent = MEDIUM_LABELS[movement.medium] || movement.medium || '—';

    const currency = movement.currency || 'ARS';
    elements.movementCurrency.textContent = currency;
    elements.movementCurrency.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
      currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
    }`;

    const signedAmount =
      movement.type === 'outgoing' ? -Number(movement.amount || 0) : Number(movement.amount || 0);
    elements.movementAmount.textContent = formatCurrency(Math.abs(signedAmount), currency);
    elements.movementAmount.className = `text-2xl font-bold ${
      signedAmount >= 0 ? 'positive-amount' : 'negative-amount'
    }`;

    elements.movementReference.textContent = movement.reference || movement.description || '—';
    elements.movementUpdated.textContent = `Última actualización ${formatTime(
      movement.updatedAt || movement.createdAt
    )}`;

    if (movement.contact) {
      const contact = movement.contact;
      elements.contactName.textContent =
        contact.shortName || contact.fullName || contact.displayName || '—';
      elements.contactType.textContent =
        contact.contactType === 'provider' ? 'Proveedor' : 'Cliente';
      elements.contactType.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        contact.contactType === 'provider' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
      }`;
      elements.contactCuit.textContent = contact.cuit || '—';

      const contactDetail = await fetchContactDetail(contact.id);
      const balanceRecord = contactDetail?.balances?.find(
        (entry) => entry.currency === currency
      );
      if (balanceRecord) {
        elements.contactBalance.textContent = formatCurrency(balanceRecord.amount, currency);
        elements.contactBalance.classList.toggle('positive-amount', balanceRecord.amount >= 0);
        elements.contactBalance.classList.toggle('negative-amount', balanceRecord.amount < 0);
      } else {
        elements.contactBalance.textContent = '—';
        elements.contactBalance.classList.remove('positive-amount', 'negative-amount');
      }
      if (elements.contactAccountBtn && contact.id) {
        elements.contactAccountBtn.addEventListener('click', () => {
          window.location.href = `saldos-contacto.html?contact=${encodeURIComponent(contact.id)}`;
        });
      }
    } else if (elements.contactCard) {
      elements.contactCard.classList.add('hidden');
    }

    if (Array.isArray(movement.linkedOperations) && movement.linkedOperations.length) {
      const op = movement.linkedOperations[0];
      elements.operationId.textContent = `#${op.code || op.id || '—'}`;
      elements.operationStatus.textContent = op.type || 'Vinculada';
      elements.operationStatus.className =
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800';
      elements.operationType.textContent = op.model || 'Operación';
      elements.operationCurrency.textContent = currency;
      elements.operationCurrency.className = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        currency === 'USD' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
      }`;
      elements.operationAmount.textContent = formatCurrency(op.amount || movement.amount, currency);
    } else if (elements.operationSection) {
      elements.operationSection.classList.add('hidden');
    }

    renderAccountingRows(movement);
  };

  const togglePanel = (open) => {
    if (!elements.overlay || !elements.panel) return;
    if (open) {
      elements.overlay.classList.remove('hidden');
      elements.panel.focus();
    } else {
      elements.overlay.classList.add('hidden');
    }
  };

  const handleCancelMovement = async (movementId) => {
    if (!movementId) return;
    if (!confirm('¿Confirmás la anulación de este movimiento?')) return;
    try {
      await TreasuryApi.cancelMovement(movementId, { reason: 'Cancelado desde la vista de detalle' });
      showToast('Movimiento anulado correctamente.', 'success');
      await loadMovement();
    } catch (error) {
      if (error instanceof TreasuryApiError) {
        showToast(error.message || 'No pudimos anular el movimiento.', 'danger');
      } else {
        showToast('Ocurrió un error al anular el movimiento.', 'danger');
      }
    }
  };

  let currentMovementId = null;

  const loadMovement = async () => {
    if (!currentMovementId) return;
    try {
      const detail = await TreasuryApi.getMovement(currentMovementId);
      if (!detail) {
        showToast('No encontramos el movimiento solicitado.', 'warning');
        return;
      }
      await populateMovementDetail(detail);
    } catch (error) {
      if (error instanceof TreasuryApiError) {
        showToast(error.message || 'No pudimos cargar el movimiento.', 'danger');
      } else {
        showToast('Ocurrió un error al cargar el movimiento.', 'danger');
      }
    }
  };

  const bindEvents = () => {
    elements.openPanelBtn?.addEventListener('click', () => togglePanel(true));
    elements.closePanelBtn?.addEventListener('click', () => togglePanel(false));
    elements.closePanelIcon?.addEventListener('click', () => togglePanel(false));
    if (elements.overlay) {
      elements.overlay.addEventListener('click', (event) => {
        if (event.target === elements.overlay) {
          togglePanel(false);
        }
      });
    }
    elements.cancelMovementBtn?.addEventListener('click', () => handleCancelMovement(currentMovementId));
    elements.editMovementBtn?.addEventListener('click', () => {
      showToast('La edición de movimientos estará disponible próximamente.', 'info');
    });
    elements.operationLinkBtn?.addEventListener('click', () => {
      showToast('Redirección a la operación vinculada en desarrollo.', 'info');
    });
  };

  const initialize = async () => {
    currentMovementId = parseMovementId();
    if (!currentMovementId) {
      showToast('Movimiento no especificado.', 'danger');
      return;
    }
    await Promise.all([fetchBalances(), loadMovement()]);
    bindEvents();
    togglePanel(true);
  };

  document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
