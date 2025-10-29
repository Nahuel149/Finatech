import React from 'react';
import { DashboardNavbar } from '../operaciones/Navbar';

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
}

// Standardize Tesorería navbar by delegating to the global DashboardNavbar
export const TreasuryNavbar: React.FC<Props> = ({ search, onSearchChange }) => {
  return <DashboardNavbar search={search} onSearchChange={onSearchChange} />;
};
