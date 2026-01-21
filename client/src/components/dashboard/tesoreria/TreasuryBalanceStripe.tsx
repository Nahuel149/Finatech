import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks/dashboard/useDashboardBalances';
import { TreasuryBalance } from '../../../types/dashboard';
import { BalanceCard, BalanceCardData } from '../../shared/design-system/BalanceCard';
import { BalanceCardSkeleton } from '../../shared/design-system/LoadingSkeleton';
import { StatusType } from '../../shared/design-system/StatusIndicator';

interface Props {
  onSelectBalance?: (balanceId: string) => void;
}

const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => {
  let label = balance.label;
  if (balance.id === 'transfers') {
    label = 'Transferencias (ARS)';
  } else if (balance.id === 'cash') {
    label = 'Efectivo (ARS)';
  } else if (balance.id === 'usd') {
    label = 'Caja (USD)';
  }

  return {
    id: balance.id,
    label,
    amount: balance.amount,
    currency: balance.currency,
    status: balance.status as StatusType,
    updatedAt: balance.updatedAt,
  };
};

export const TreasuryBalanceStripe: React.FC<Props> = ({ onSelectBalance }) => {
  const navigate = useNavigate();
  const { balances, loading, error, refresh } = useDashboardBalances({ pollInterval: 60000 });
  const visibleBalances = useMemo(
    () => balances.filter((balance) => balance.id !== 'courier_in_transit'),
    [balances]
  );
  const [showTooltip, setShowTooltip] = useState(false);

  const handleBalanceClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  const handleCardClick = (balanceId: string) => {
    if (onSelectBalance) {
      onSelectBalance(balanceId);
    } else {
      handleBalanceClick();
    }
  };

  const lastUpdatedLabel = useMemo(() => {
    const timestamps = visibleBalances
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
  }, [visibleBalances]);

  const handleShowTooltip = () => {
    setShowTooltip(true);
  };

  const handleHideTooltip = () => {
    setShowTooltip(false);
  };

  return (
    <div
      id="treasury-balance-stripe"
      className="fixed top-[55px] lg:top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40"
    >
      <div className="px-4 py-3 lg:px-6 lg:py-4 xl:px-8 xl:py-5 relative">
        <div
          className="absolute right-4 top-4 lg:right-8 lg:top-6 xl:right-12 xl:top-8"
          onMouseEnter={handleShowTooltip}
          onMouseLeave={handleHideTooltip}
        >
          <button
            type="button"
            className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 text-gray-500 hover:text-primary hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 bg-white"
            onFocus={handleShowTooltip}
            onBlur={handleHideTooltip}
            aria-label="Ver última actualización de saldos de Tesorería"
          >
            <i className="fa-solid fa-clock-rotate-left text-sm" />
          </button>
          {showTooltip && (
            <div className="mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg p-3 text-xs text-gray-600 z-50">
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
                <p className="mt-2 text-gray-500">Seleccioná un balance para ver movimientos vinculados.</p>
              )}
            </div>
          )}
        </div>
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-3 lg:gap-4 xl:gap-6">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            visibleBalances.map((balance: TreasuryBalance) => (
              <BalanceCard
                key={balance.id}
                data={mapBalanceToCardData(balance)}
                onClick={() => handleCardClick(balance.id)}
                onRetry={refresh}
                compact
                highlightBySign
              />
            ))}

          {!loading && error && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCard
                  key={i}
                  data={{
                    id: `error-${i}`,
                    label: 'Balance',
                    amount: 0,
                    currency: 'ARS',
                    status: 'error',
                  }}
                  error={true}
                  onRetry={refresh}
                />
              ))}
            </>
          )}
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="flex flex-col gap-2 md:gap-3">
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCardSkeleton key={i} />
                ))}
              </>
            )}

            {!loading && !error &&
              visibleBalances.map((balance: TreasuryBalance) => (
                <BalanceCard
                  key={balance.id}
                  data={mapBalanceToCardData(balance)}
                  onClick={() => handleCardClick(balance.id)}
                  onRetry={refresh}
                  compact
                  highlightBySign
                />
              ))}

            {!loading && error && (
              <>
                {[0, 1, 2].map((i) => (
                  <BalanceCard
                    key={i}
                    data={{
                      id: `error-${i}`,
                      label: 'Balance',
                      amount: 0,
                      currency: 'ARS',
                      status: 'error',
                    }}
                    error={true}
                    onRetry={refresh}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
