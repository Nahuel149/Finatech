import React, { useState } from 'react';
import { LocationSearchPanel } from './LocationSearchPanel';
import { DashboardNavbar } from '../dashboard/operaciones/Navbar';
import { BalanceStripe } from '../dashboard/operaciones/BalanceStripe';
import { DashboardFooter } from '../dashboard/operaciones/Footer';

export const LocationSearchPage: React.FC = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />
      <main className="flex-grow pt-[420px] lg:pt-[250px] px-4 lg:px-6 pb-10 max-w-5xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
            Búsqueda de direcciones (LocationIQ)
          </h1>
          <p className="text-gray-600 mt-2">
            Usa este buscador para validar domicilios de clientes o puntos logísticos sin exponer la clave en el frontend.
          </p>
        </div>
        <LocationSearchPanel />
      </main>
      <DashboardFooter />
    </div>
  );
};
