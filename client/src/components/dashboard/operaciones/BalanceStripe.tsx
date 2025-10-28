import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';

const formatFullDateTime = (iso?: string) => {
  const d = iso ? new Date(iso) : new Date();
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => ({
  id: balance.id,
  label: balance.label,
  amount: balance.amount,
  currency: balance.currency,
  status: balance.status as StatusType,
  updatedAt: balance.updatedAt,
});

export const BalanceStripe: React.FC = () => {
  const navigate = useNavigate();
  const { balances, loading, error, refresh } = useDashboardBalances({ pollInterval: 60000 });

  useEffect(() => {
    const unsubscribe = subscribeDashboardBalanceRefresh(() => {
      refresh().catch(() => {});
    });
    return unsubscribe;
  }, [refresh]);

  const handleBalanceClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  return (
    <div
      id="balance-stripe"
      className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40"
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            balances.map((balance: TreasuryBalance) => (
              <BalanceCard
                key={balance.id}
                data={mapBalanceToCardData(balance)}
                onClick={handleBalanceClick}
                onRetry={refresh}
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
  );
};
