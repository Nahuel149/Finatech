import React from 'react';
import { IncidentFormData } from './incidentFormTypes';
import { IncidentItemsTable } from './IncidentItemsTable';
import { IncidentFileUpload } from './IncidentFileUpload';

interface IncidentAssociationsFormProps {
  formData: IncidentFormData;
  onFormDataChange: (updates: Partial<IncidentFormData>) => void;
  movementId: string;
}

export const IncidentAssociationsForm: React.FC<IncidentAssociationsFormProps> = ({
  formData,
  onFormDataChange,
  movementId
}) => {
  const handleItemsChange = (items: IncidentFormData['involvedItems']) => {
    onFormDataChange({ involvedItems: items });
  };

  const handleAttachmentsChange = (attachments: File[]) => {
    onFormDataChange({ attachments });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200 pb-2">
        Asociaciones y adjuntos
      </h3>

      {/* Related Movement */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Movimiento relacionado
        </label>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <i className="fa-solid fa-truck text-white text-sm"></i>
              </div>
              <div>
                <div className="font-medium text-text-primary">
                  Movimiento #{movementId}
                </div>
                <div className="text-sm text-gray-600">
                  Transferencia • Buenos Aires → Córdoba
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-text-primary">
                $125,430.50
              </div>
              <div className="text-xs text-gray-500">
                15 ítems
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Involved Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-text-primary">
            Ítems involucrados
          </label>
        </div>
        <IncidentItemsTable 
          items={formData.involvedItems}
          onItemsChange={handleItemsChange}
        />
      </div>

      {/* Attach Documentation */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Adjuntar documentación
        </label>
        <IncidentFileUpload 
          files={formData.attachments}
          onFilesChange={handleAttachmentsChange}
        />
        <div className="mt-2 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>
              <i className="fa-solid fa-info-circle mr-1"></i>
              Formatos: PDF, JPG, PNG, DOC, XLS
            </span>
            <span>
              <i className="fa-solid fa-weight-hanging mr-1"></i>
              Máximo 10MB por archivo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
