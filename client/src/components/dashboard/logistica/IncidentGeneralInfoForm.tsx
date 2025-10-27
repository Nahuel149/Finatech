import React from 'react';
import { IncidentFormData, IncidentSeverity } from './incidentFormTypes';
import { IncidentSeveritySelector } from './IncidentSeveritySelector';

interface IncidentGeneralInfoFormProps {
  formData: IncidentFormData;
  onFormDataChange: (updates: Partial<IncidentFormData>) => void;
}

export const IncidentGeneralInfoForm: React.FC<IncidentGeneralInfoFormProps> = ({
  formData,
  onFormDataChange
}) => {
  const handleInputChange = (field: keyof IncidentFormData, value: any) => {
    onFormDataChange({ [field]: value });
  };

  const handleOperationalImpactChange = (field: keyof IncidentFormData['operationalImpact'], value: any) => {
    onFormDataChange({
      operationalImpact: {
        ...formData.operationalImpact,
        [field]: value
      }
    });
  };

  const maxDescriptionLength = 500;
  const remainingChars = maxDescriptionLength - formData.description.length;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-text-primary border-b border-gray-200 pb-2">
        Información general
      </h3>

      {/* Incident Type */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Tipo de incidencia *
        </label>
        <select 
          value={formData.type}
          onChange={(e) => handleInputChange('type', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          <option value="">Seleccionar tipo</option>
          <option value="documentation_error">Error en documentación</option>
          <option value="quantity_discrepancy">Discrepancia en cantidad</option>
          <option value="damage">Daño en mercadería</option>
          <option value="delay">Retraso en entrega</option>
          <option value="system_error">Error del sistema</option>
          <option value="other">Otro</option>
        </select>
      </div>

      {/* Severity Level */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Nivel de severidad *
        </label>
        <IncidentSeveritySelector 
          value={formData.severity}
          onChange={(severity: IncidentSeverity) => handleInputChange('severity', severity)}
        />
      </div>

      {/* Date and Time */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Fecha y hora *
        </label>
        <input 
          type="datetime-local"
          value={formData.dateTime}
          onChange={(e) => handleInputChange('dateTime', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      {/* Internal Responsible */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Responsable interno *
        </label>
        <select 
          value={formData.responsible}
          onChange={(e) => handleInputChange('responsible', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        >
          <option value="">Seleccionar responsable</option>
          <option value="juan_perez">Juan Pérez - Operaciones</option>
          <option value="maria_garcia">María García - Logística</option>
          <option value="carlos_rodriguez">Carlos Rodríguez - Almacén</option>
          <option value="ana_martinez">Ana Martínez - Control de Calidad</option>
        </select>
      </div>

      {/* Detailed Description */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">
          Descripción detallada *
        </label>
        <textarea 
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describí en detalle qué ocurrió, cuándo se detectó y cualquier información relevante..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          rows={4}
          maxLength={maxDescriptionLength}
          required
        />
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            Máximo {maxDescriptionLength} caracteres
          </span>
          <span className={`text-xs ${remainingChars < 50 ? 'text-red-500' : 'text-gray-500'}`}>
            {remainingChars} restantes
          </span>
        </div>
      </div>

      {/* Operational Impact */}
      <div>
        <label className="block text-sm font-medium text-text-primary mb-3">
          Impacto operacional
        </label>
        <div className="space-y-3">
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={formData.operationalImpact.delayedDelivery}
              onChange={(e) => handleOperationalImpactChange('delayedDelivery', e.target.checked)}
              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-text-primary">Retraso en entrega</span>
          </label>
          
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={formData.operationalImpact.requiresManualReview}
              onChange={(e) => handleOperationalImpactChange('requiresManualReview', e.target.checked)}
              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-text-primary">Requiere revisión manual</span>
          </label>
          
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={formData.operationalImpact.affectsDocumentation}
              onChange={(e) => handleOperationalImpactChange('affectsDocumentation', e.target.checked)}
              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-text-primary">Afecta documentación</span>
          </label>
          
          <label className="flex items-center">
            <input 
              type="checkbox"
              checked={formData.operationalImpact.other}
              onChange={(e) => handleOperationalImpactChange('other', e.target.checked)}
              className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <span className="text-sm text-text-primary">Otro</span>
          </label>
          
          {formData.operationalImpact.other && (
            <div className="ml-7 mt-2">
              <input 
                type="text"
                value={formData.operationalImpact.otherDescription}
                onChange={(e) => handleOperationalImpactChange('otherDescription', e.target.value)}
                placeholder="Especificar otro impacto..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
