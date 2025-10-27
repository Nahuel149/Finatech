import React from 'react';
import { Outlet } from 'react-router-dom';
import { TransferPesosProvider } from './TransferPesosContext';

export const TransferPesosFlow: React.FC = () => (
  <TransferPesosProvider>
    <Outlet />
  </TransferPesosProvider>
);
