import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';
import { subscribeDashboardBalanceRefresh } from '../../../utils';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';

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
      <div className="px-4 py-4 lg:px-8 lg:py-6 xl:px-12 xl:py-8">
        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-4 lg:gap-6 xl:gap-8">
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

        {/* Mobile Layout */}
        <div className="lg:hidden">
          <div className="flex flex-col gap-3 md:gap-4">
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
    </div>
  );
};
