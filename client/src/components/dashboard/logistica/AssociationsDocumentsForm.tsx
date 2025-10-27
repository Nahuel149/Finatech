import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '../../icons/HeroiconsOutline';

const AssociationsDocumentsForm: React.FC = () => {
  const [associatedContact, setAssociatedContact] = useState('');
  const [relatedOperation, setRelatedOperation] = useState('');

  return (
    <div>
      <h3 className="text-lg font-semibold text-text-primary mb-4">Asociaciones y documentos</h3>
      
      <div className="space-y-6">
        {/* Associated Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contacto asociado
          </label>
          <div className="relative">
            <input
              type="text"
              value={associatedContact}
              onChange={(e) => setAssociatedContact(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Buscar contacto por nombre o empresa..."
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Opcional: vinculá este movimiento con un contacto específico
          </p>
        </div>

        {/* Related Operation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Operación relacionada
          </label>
          <div className="relative">
            <input
              type="text"
              value={relatedOperation}
              onChange={(e) => setRelatedOperation(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Buscar operación por ID o referencia..."
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Opcional: asociá este movimiento con una operación comercial existente
          </p>
        </div>
      </div>
    </div>
  );
};

export default AssociationsDocumentsForm;