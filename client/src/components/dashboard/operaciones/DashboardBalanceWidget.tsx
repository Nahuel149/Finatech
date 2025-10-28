import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboardBalances } from '../../../hooks';
import { Button } from '../../shared/design-system';

interface Props {
  canView: boolean;
}

export const DashboardBalanceWidget: React.FC<Props> = ({ canView }) => {
  const navigate = useNavigate();
  const { loading } = useDashboardBalances({ enabled: canView });

  if (!canView) {
    return null;
  }

  const handleClick = () => {
    navigate('/dashboard/tesoreria/saldos');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      loading={loading}
      icon={loading ? "fa-solid fa-spinner fa-spin" : "fa-solid fa-eye"}
      aria-label="Ver saldos"
    />
  );
};
