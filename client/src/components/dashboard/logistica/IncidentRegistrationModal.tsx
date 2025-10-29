import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IncidentGeneralInfoForm } from './IncidentGeneralInfoForm';
import { IncidentAssociationsForm } from './IncidentAssociationsForm';
import type { IncidentFormData } from './incidentFormTypes';

interface IncidentRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  movementId: string;
}

export const IncidentRegistrationModal: React.FC<IncidentRegistrationModalProps> = ({
  isOpen,
  onClose,
  movementId
}) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<IncidentFormData>({
    type: '',
    severity: '',
    dateTime: new Date().toISOString().slice(0, 16),
    responsible: '',
    description: '',
    operationalImpact: {
      delayedDelivery: false,
      requiresManualReview: false,
      affectsDocumentation: false,
      other: false,
      otherDescription: ''
    },
    involvedItems: [],
    attachments: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormDataChange = (updates: Partial<IncidentFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleClose = () => {
    onClose();
    navigate(`/dashboard/logistica/movimiento/${movementId}`);
  };

  const handleSaveDraft = async () => {
    // TODO: Implement save draft functionality
    console.log('Saving draft:', formData);
  };

  const handleRegisterIncident = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Implement incident registration API call
      console.log('Registering incident:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Close modal and navigate back
      handleClose();
    } catch (error) {
      console.error('Error registering incident:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = () => {
    return formData.type && 
           formData.severity && 
           formData.dateTime && 
           formData.responsible && 
           formData.description.trim();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-b border-gray-200 bg-gray-50">
          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-3 overflow-x-auto">
            <span 
              className="text-primary font-medium cursor-pointer hover:underline whitespace-nowrap"
              onClick={() => navigate('/dashboard/logistica')}
            >
              Logística
            </span>
            <i className="fa-solid fa-chevron-right text-xs flex-shrink-0"></i>
            <span 
              className="text-primary font-medium cursor-pointer hover:underline whitespace-nowrap"
              onClick={() => navigate(`/dashboard/logistica/movimiento/${movementId}`)}
            >
              Movimiento #{movementId}
            </span>
            <i className="fa-solid fa-chevron-right text-xs flex-shrink-0"></i>
            <span className="whitespace-nowrap">Nueva incidencia</span>
          </nav>
          
          {/* Title */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">Registrar nueva incidencia</h2>
              <p className="text-sm text-gray-600 mt-1">
                Documentá cualquier evento, error o irregularidad detectada durante el movimiento
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 p-2 transition-colors self-end sm:self-auto"
            >
              <i className="fa-solid fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <form className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Left Column: General Information */}
            <IncidentGeneralInfoForm 
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

            {/* Right Column: Associations and Attachments */}
            <IncidentAssociationsForm 
              formData={formData}
              onFormDataChange={handleFormDataChange}
              movementId={movementId}
            />
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 text-text-primary rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveDraft}
                className="px-6 py-2 bg-gray-200 text-text-primary rounded-lg hover:bg-gray-300 transition-colors"
              >
                Guardar borrador
              </button>
            </div>
            
            <button 
              onClick={handleRegisterIncident}
              disabled={!isFormValid() || isSubmitting}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar incidencia'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
