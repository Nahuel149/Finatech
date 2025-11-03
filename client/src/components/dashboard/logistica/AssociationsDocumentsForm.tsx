import React, { useMemo, useState } from 'react';

const AssociationsDocumentsForm: React.FC = () => {
  const [associatedContact, setAssociatedContact] = useState('');
  const [relatedOperation, setRelatedOperation] = useState('');

  const operationChip = useMemo(() => {
    if (!relatedOperation.trim()) {
      return null;
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        <i className="fa-solid fa-exchange-alt mr-1" />
        {relatedOperation.trim()}
        <button
          type="button"
          onClick={() => setRelatedOperation('')}
          className="ml-2 text-blue-600 hover:text-blue-800"
          aria-label="Quitar operación relacionada"
        >
          <i className="fa-solid fa-times text-xs" />
        </button>
      </span>
    );
  }, [relatedOperation]);

  return (
    <section>
      <h3 className="text-lg font-semibold text-text-primary mb-6">Asociaciones y documentos</h3>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Contacto asociado</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={associatedContact}
              onChange={(e) => setAssociatedContact(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Buscar cliente o proveedor…"
            />
            <button
              type="button"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-text-primary hover:bg-gray-100 transition-colors"
              onClick={() => {
                // Placeholder action until modal is implemented
                console.info('Agregar nuevo contacto');
              }}
              aria-label="Agregar contacto"
            >
              <i className="fa-solid fa-plus text-sm" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Opcional: vinculá este movimiento con un contacto específico para mejorar la trazabilidad.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Operación relacionada</label>
          <input
            type="text"
            value={relatedOperation}
            onChange={(e) => setRelatedOperation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Buscar por ID (#FT-000123)…"
          />
          <div className="mt-2 min-h-[28px] flex items-center">{operationChip}</div>
          <p className="text-xs text-gray-500">
            Solo referencia para trazabilidad; no compensa saldos automáticamente.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AssociationsDocumentsForm;
