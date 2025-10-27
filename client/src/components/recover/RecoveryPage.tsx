import React from 'react';
import { useLocation } from 'react-router-dom';
import { MinimalHeader } from './MinimalHeader';
import { RecoveryRequestForm } from './RecoveryRequestForm';
import { PasswordResetForm } from './PasswordResetForm';

const useQuery = () => new URLSearchParams(useLocation().search);

export const RecoveryPage: React.FC = () => {
  const query = useQuery();
  const token = query.get('token') || '';

  return (
    <div className="bg-gray-50 min-h-screen">
      <MinimalHeader />
      {token ? (
        <PasswordResetForm token={token} />
      ) : (
        <RecoveryRequestForm />
      )}
    </div>
  );
};