import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTreasuryBalances } from '../../../hooks';
import { TreasuryBalance } from '../../../types';
import { BalanceCard, BalanceCardData, BalanceCardSkeleton, StatusType } from '../../shared/design-system';

interface Props {
  onSelectBalance?: (balanceId: string) => void;
}

const mapBalanceToCardData = (balance: TreasuryBalance): BalanceCardData => {
  const getStatusType = (status?: string): StatusType => {
    switch ((status || '').toLowerCase()) {
      case 'ok':
        return 'ok';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'unknown';
    }
  };

  const getIcon = (label?: string, currency?: string) => {
    if (label?.toLowerCase().includes('transfer')) return 'fa-money-bill-transfer';
    if (label?.toLowerCase().includes('efectivo')) return 'fa-hand-holding-dollar';
    if (currency === 'USD') return 'fa-dollar-sign';
    return 'fa-wallet';
  };

  return {
    id: balance.id,
    label: balance.label || 'Balance',
    amount: balance.amount || 0,
    currency: balance.currency || 'ARS',
    status: getStatusType(balance.status),
    icon: getIcon(balance.label, balance.currency),
    updatedAt: balance.updatedAt,
  };
};

// Default fallback data with stable timestamps
const DEFAULT_BALANCES = {
  transfersARS: { id: 'transfers-ars', amount: 2847950, currency: 'ARS', status: 'ok', updatedAt: '2024-01-01T12:00:00.000Z', label: 'Transferencias (ARS)' },
  cashARS: { id: 'cash-ars', amount: 456780.50, currency: 'ARS', status: 'ok', updatedAt: '2024-01-01T12:00:00.000Z', label: 'Efectivo (ARS)' },
  cashUSD: { id: 'cash-usd', amount: 12450, currency: 'USD', status: 'error', updatedAt: '2024-01-01T12:00:00.000Z', label: 'Caja (USD)' }
};

export const TreasuryBalanceStripe: React.FC<Props> = ({ onSelectBalance }) => {
  const navigate = useNavigate();
  const { balances, loading, error, refresh } = useTreasuryBalances();

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

  // Define the exact three balance cards as shown in the HTML reference
  const balanceCards = useMemo((): BalanceCardData[] => {
    // Map actual balance data to the three specific cards
    const transfersARS = balances.find(b => b.id.includes('transfer') && b.currency === 'ARS') || DEFAULT_BALANCES.transfersARS;
    const cashARS = balances.find(b => b.id.includes('efectivo') && b.currency === 'ARS') || DEFAULT_BALANCES.cashARS;
    const cashUSD = balances.find(b => b.id.includes('caja') && b.currency === 'USD') || DEFAULT_BALANCES.cashUSD;

    return [
      mapBalanceToCardData({ ...transfersARS, label: 'Transferencias (ARS)' }),
      mapBalanceToCardData({ ...cashARS, label: 'Efectivo (ARS)' }),
      mapBalanceToCardData({ ...cashUSD, label: 'Caja (USD)' })
    ];
  }, [balances]);

  return (
    <div
      id="balance-stripe"
      className="fixed top-[73px] left-0 right-0 bg-white border-b border-gray-200 z-40"
    >
      <div className="px-6 py-4">
        <div className="grid grid-cols-3 gap-6">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <BalanceCardSkeleton key={i} />
              ))}
            </>
          )}

          {!loading && !error &&
            balanceCards.map((card) => (
              <BalanceCard
                key={card.id}
                data={card}
                onClick={() => handleCardClick(card.id)}
                onRetry={refresh}
              />
            ))}

          {!loading && error && (
            <>
              {balanceCards.map((card) => (
                <BalanceCard
                  key={card.id}
                  data={card}
                  error={true}
                  onClick={() => handleCardClick(card.id)}
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
