import React from 'react';
export const TreasuryIntegrationSection: React.FC = () => (
  <section id="treasury-integration-section" className="mb-10">
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
            <i className="fa-solid fa-link text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Integración con Tesorería</h3>
            <p className="text-sm text-gray-600">
              Las operaciones completadas generan actualizaciones automáticas en Tesorería y Cuentas Corrientes
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => {
            window.location.href = '/dashboard/tesoreria?from=logistica';
          }}
        >
          <i className="fa-solid fa-external-link-alt mr-2" />
          Ver en Tesorería
        </button>
      </div>
    </div>
  </section>
);

export default TreasuryIntegrationSection;
