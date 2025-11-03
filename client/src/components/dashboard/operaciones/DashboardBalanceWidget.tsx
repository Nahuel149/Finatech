import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { Button } from '../../shared/design-system';

interface Props {
  canView: boolean;
}

export const DashboardBalanceWidget: React.FC<Props> = ({ canView }) => {
  const navigate = useNavigate();
  const { balances, loading, error } = useDashboardBalances({ enabled: canView, pollInterval: 60000 });
  const [showTooltip, setShowTooltip] = useState(false);

  const orderedBalances = useMemo(() => {
    if (!canView) {
      return [];
    }
    const order = ['usd', 'cash', 'transfers'];
    const fallback = balances.filter((balance) => !order.includes(balance.id));
    const sorted = order
      .map((key) => balances.find((balance) => balance.id === key))
      .filter((balance): balance is typeof balances[number] => Boolean(balance));
    return [...sorted, ...fallback];
  }, [balances, canView]);

  const formattedBalances = useMemo(
    () =>
      orderedBalances.map((balance) => ({
        id: balance.id,
        label: balance.label,
        amount: balance.amount,
        currency: balance.currency,
        display: new Intl.NumberFormat(
          balance.currency === 'USD' ? 'en-US' : 'es-AR',
          {
            style: 'currency',
            currency: balance.currency,
            minimumFractionDigits: 2,
          }
        ).format(balance.amount),
        updatedAt: balance.updatedAt,
        status: balance.status,
      })),
    [orderedBalances]
  );

  const lastUpdatedLabel = useMemo(() => {
    if (!canView) {
      return 'Sin datos';
    }
    const timestamps = formattedBalances
      .map((balance) => (balance.updatedAt ? new Date(balance.updatedAt).getTime() : null))
      .filter((value): value is number => Number.isFinite(value ?? NaN));

    if (!timestamps.length) {
      return 'Sin datos';
    }

    const maxTimestamp = Math.max(...timestamps);
    const date = new Date(maxTimestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Sin datos';
    }

    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [formattedBalances, canView]);

  const handleClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  const handleShowTooltip = () => {
    setShowTooltip(true);
  };

  const handleHideTooltip = () => {
    setShowTooltip(false);
  };

  const statusIcon = useMemo(() => {
    if (!canView) {
      return 'fa-solid fa-wallet';
    }
    if (loading) {
      return 'fa-solid fa-spinner fa-spin';
    }
    if (error) {
      return 'fa-solid fa-circle-exclamation';
    }
    return 'fa-solid fa-wallet';
  }, [loading, error, canView]);

  if (!canView) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClick}
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleHideTooltip}
        onFocus={handleShowTooltip}
        onBlur={handleHideTooltip}
        aria-label="Ver saldos"
        className="pl-3 pr-2 py-2 text-text-primary hover:text-primary hover:bg-blue-50 focus:ring-primary border border-transparent rounded-full"
        iconPosition="left"
        icon={statusIcon}
      >
        <div className="flex items-center space-x-3">
          {formattedBalances.map((balance) => (
            <div key={balance.id} className="flex items-center space-x-1 text-xs sm:text-sm">
              <span className="text-gray-500">{balance.label}:</span>
              <span
                className={
                  balance.amount > 0
                    ? 'text-success font-semibold'
                    : balance.amount < 0
                    ? 'text-danger font-semibold'
                    : 'text-text-primary font-medium'
                }
              >
                {balance.display}
              </span>
            </div>
          ))}
          {!formattedBalances.length && !loading && (
            <span className="text-xs text-gray-500">Sin saldos</span>
          )}
        </div>
      </Button>

      {showTooltip && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-xs text-gray-600 z-50">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text-primary">Última actualización</span>
            <i className="fa-solid fa-clock text-gray-400" />
          </div>
          <p className="mt-2 text-gray-700">{lastUpdatedLabel}</p>
          {error && (
            <p className="mt-2 text-danger flex items-center space-x-1">
              <i className="fa-solid fa-triangle-exclamation" />
              <span>{error.message || 'No pudimos cargar los saldos.'}</span>
            </p>
          )}
          {!loading && !error && (
            <p className="mt-2 text-gray-500">Tocá para ver el módulo de saldos completo.</p>
          )}
        </div>
      )}
    </div>
  );
};
