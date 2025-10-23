(function balanceWidgetModule(global) {
  const WIDGET_SELECTOR = '[data-balance-widget]';
  const ENDPOINT = '/api/dashboard/balances';
  const POLL_INTERVAL_MS = 60000;

  const STATE = {
    timers: new Map(),
    stylesInjected: false,
  };

  const formatCurrency = (value, currency) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return '--';
    }
    try {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: currency === 'USD' ? 'USD' : 'ARS',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numeric);
    } catch (_error) {
      const prefix = currency === 'USD' ? 'USD ' : '$';
      return `${prefix}${numeric.toFixed(2)}`;
    }
  };

  const formatUpdate = (isoString) => {
    if (!isoString) return 'Actualizado —';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return 'Actualizado —';
    return `Actualizado ${date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const injectStyles = () => {
    if (STATE.stylesInjected) return;
    const style = document.createElement('style');
    style.id = 'balance-widget-styles';
    style.textContent = `
      .balance-widget {
        position: relative;
        display: inline-flex;
        align-items: stretch;
        gap: 0.5rem;
      }
      .balance-widget__button {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem 0.75rem;
        border-radius: 9999px;
        border: 1px solid #d1d5db;
        background-color: #ffffff;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .balance-widget__button:hover,
      .balance-widget__button:focus-visible {
        border-color: #0066CC;
        box-shadow: 0 2px 8px rgba(0, 102, 204, 0.15);
        outline: none;
      }
      .balance-widget__item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.125rem;
      }
      .balance-widget__label {
        font-size: 0.625rem;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .balance-widget__value {
        font-size: 0.875rem;
        font-weight: 600;
        color: #1f2937;
      }
      .balance-widget__tooltip {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        background-color: rgba(17, 24, 39, 0.92);
        color: #fff;
        padding: 0.4rem 0.65rem;
        border-radius: 0.5rem;
        font-size: 0.7rem;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 0.15s ease, transform 0.15s ease;
        pointer-events: none;
        z-index: 60;
      }
      .balance-widget__button:focus-visible + .balance-widget__tooltip,
      .balance-widget__button:hover + .balance-widget__tooltip,
      .balance-widget__tooltip[data-visible="true"] {
        opacity: 1;
        transform: translateY(0);
      }
      .balance-widget--loading .balance-widget__value {
        position: relative;
        color: transparent;
      }
      .balance-widget--loading .balance-widget__value::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 0.25rem;
        background: linear-gradient(90deg, rgba(226,232,240,0.6), rgba(209,213,219,0.9), rgba(226,232,240,0.6));
        animation: balance-widget-pulse 1.2s ease-in-out infinite;
      }
      @keyframes balance-widget-pulse {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(10%); }
        100% { transform: translateX(100%); }
      }
      @media (max-width: 767px) {
        .balance-widget__button {
          padding: 0.35rem 0.6rem;
          gap: 0.5rem;
        }
        .balance-widget__label {
          font-size: 0.55rem;
        }
        .balance-widget__value {
          font-size: 0.75rem;
        }
      }
    `;
    document.head.appendChild(style);
    STATE.stylesInjected = true;
  };

  const renderWidget = (anchor) => {
    const widget = document.createElement('div');
    widget.className = 'balance-widget balance-widget--loading';
    widget.innerHTML = `
      <button type="button" class="balance-widget__button" aria-label="Ver saldos y cuentas vinculadas">
        <div class="balance-widget__item">
          <span class="balance-widget__label">Transferencias ARS</span>
          <span class="balance-widget__value" data-balance-widget-transfer>--</span>
        </div>
        <div class="balance-widget__item">
          <span class="balance-widget__label">Efectivo ARS</span>
          <span class="balance-widget__value" data-balance-widget-cash>--</span>
        </div>
        <div class="balance-widget__item">
          <span class="balance-widget__label">Caja USD</span>
          <span class="balance-widget__value" data-balance-widget-usd>--</span>
        </div>
      </button>
      <div class="balance-widget__tooltip" role="status" aria-live="polite">Actualizado —</div>
    `;
    anchor.innerHTML = '';
    anchor.appendChild(widget);
    return widget;
  };

  const updateWidget = (widget, balances) => {
    if (!widget) return;
    const valueTransfer = widget.querySelector('[data-balance-widget-transfer]');
    const valueCash = widget.querySelector('[data-balance-widget-cash]');
    const valueUsd = widget.querySelector('[data-balance-widget-usd]');
    const tooltip = widget.querySelector('.balance-widget__tooltip');

    const getBalance = (key, currency) =>
      balances.find((item) => item.id === key && item.currency === currency);

    const transfers = getBalance('transfers', 'ARS');
    const cash = getBalance('cash', 'ARS');
    const usd = getBalance('usd', 'USD');

    if (valueTransfer) valueTransfer.textContent = formatCurrency(transfers?.amount ?? 0, 'ARS');
    if (valueCash) valueCash.textContent = formatCurrency(cash?.amount ?? 0, 'ARS');
    if (valueUsd) valueUsd.textContent = formatCurrency(usd?.amount ?? 0, 'USD');

    const timestamps = [transfers?.updatedAt, cash?.updatedAt, usd?.updatedAt].filter(Boolean);
    const latest = timestamps.length ? timestamps.sort().slice(-1)[0] : null;

    if (tooltip) {
      tooltip.textContent = formatUpdate(latest);
      tooltip.setAttribute('data-visible', 'false');
    }

    widget.classList.remove('balance-widget--loading');
  };

  const hideWidget = (anchor) => {
    if (!anchor) return;
    anchor.innerHTML = '';
    anchor.style.display = 'none';
  };

  const startPolling = (anchor, widget) => {
    const fetchBalances = async () => {
      if (!widget || !document.contains(widget)) {
        clearInterval(STATE.timers.get(anchor));
        STATE.timers.delete(anchor);
        return;
      }
      try {
        const response = await fetch(apiUrl(ENDPOINT), { credentials: 'include' });
        if (response.status === 401 || response.status === 403) {
          hideWidget(anchor);
          clearInterval(STATE.timers.get(anchor));
          STATE.timers.delete(anchor);
          return;
        }
        if (!response.ok) {
          throw new Error('No se pudieron obtener los balances.');
        }
        const data = await response.json();
        const balances = Array.isArray(data?.balances) ? data.balances : [];
        updateWidget(widget, balances);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Balance widget error', error);
      }
    };

    fetchBalances();
    const timerId = setInterval(() => {
      if (!document.hidden) {
        fetchBalances();
      }
    }, POLL_INTERVAL_MS);
    STATE.timers.set(anchor, timerId);
  };

  const initWidget = (anchor) => {
    if (!anchor) return;
    injectStyles();
    const widget = renderWidget(anchor);
    const button = widget.querySelector('.balance-widget__button');
    const tooltip = widget.querySelector('.balance-widget__tooltip');

    if (button) {
      button.addEventListener('click', () => {
        const targetUrl = anchor.getAttribute('data-balance-widget-target') || '/saldos';
        window.location.href = targetUrl;
      });
      button.addEventListener('focus', () => {
        if (tooltip) tooltip.setAttribute('data-visible', 'true');
      });
      button.addEventListener('blur', () => {
        if (tooltip) tooltip.setAttribute('data-visible', 'false');
      });
    }

    startPolling(anchor, widget);
  };

  const initialize = () => {
    if (typeof document === 'undefined') return;
    const anchors = Array.from(document.querySelectorAll(WIDGET_SELECTOR));
    if (!anchors.length) return;
    anchors.forEach((anchor) => {
      initWidget(anchor);
    });
  };

  document.addEventListener('DOMContentLoaded', initialize);
})(typeof window !== 'undefined' ? window : globalThis);
