import React from 'react';
import { ChevronRightIcon, DocumentChartBarIcon } from '../../icons/HeroiconsOutline';

export const LogisticsGeneralSummaryHeader: React.FC = () => {
  return (
    <header className="mb-8">
      {/* Breadcrumbs */}
      <nav className="mb-4 flex items-center text-sm text-gray-500" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/dashboard" className="hover:text-gray-700">
              Dashboard
            </a>
          </li>
          <li>
            <ChevronRightIcon className="h-4 w-4" />
          </li>
          <li>
            <a href="/dashboard/logistica" className="hover:text-gray-700">
              Logística
            </a>
          </li>
          <li>
            <ChevronRightIcon className="h-4 w-4" />
          </li>
          <li>
            <span className="text-primary font-medium cursor-pointer">Resumen General</span>
          </li>
        </ol>
      </nav>

      {/* Header Content */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <DocumentChartBarIcon className="h-8 w-8 text-primary" />
            <h1 className="text-xl font-bold text-text-primary sm:text-2xl">
              Resumen General de Logística
            </h1>
          </div>
          <p className="text-sm text-gray-600 sm:text-base">
            Vista consolidada de todas las operaciones logísticas, métricas clave e incidencias activas.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar reporte
          </button>
          
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
            Actualizar datos
          </button>
        </div>
      </div>
    </header>
  );
};