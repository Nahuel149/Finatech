import React, { useState } from 'react';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import MovementDataForm from './MovementDataForm';
import AssociationsDocumentsForm from './AssociationsDocumentsForm';
import ItemsBulkForm from './ItemsBulkForm';
import AttachmentsForm from './AttachmentsForm';
import CompletionConfirmationModal from './CompletionConfirmationModal';

interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewMovementModal: React.FC<NewMovementModalProps> = ({ isOpen, onClose }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [movementData] = useState({
    type: '',
    reference: ''
  });

  if (!isOpen) return null;

  const handleSaveDraft = () => {
    // TODO: Implement save draft functionality
    console.log('Saving draft...');
  };

  const handleRegisterMovement = () => {
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = () => {
    // TODO: Implement movement registration
    console.log('Registering movement...');
    setShowConfirmation(false);
    onClose();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {/* Breadcrumb */}
              <nav className="text-sm text-gray-500 mb-2">
                <span>Logística</span>
                <span className="mx-2">/</span>
                <span>Panel principal</span>
                <span className="mx-2">/</span>
                <span className="text-gray-900">Registrar nuevo movimiento</span>
              </nav>
              <h2 className="text-xl font-semibold text-gray-900">
                Registrar nuevo movimiento logístico
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-8">
              {/* Movement Data Form */}
              <MovementDataForm />

              {/* Associations and Documents Form */}
              <AssociationsDocumentsForm />

              {/* Items or Bulk Form */}
              <ItemsBulkForm />

              {/* Attachments Form */}
              <AttachmentsForm />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Guardar borrador
            </button>
            <button
              onClick={handleRegisterMovement}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors"
            >
              Registrar movimiento
            </button>
          </div>
        </div>
      </div>

      {/* Completion Confirmation Modal */}
      <CompletionConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmRegistration}
        movementId={movementData.reference || 'NEW'}
        movementType={movementData.type || 'No especificado'}
        reference={movementData.reference}
      />
    </>
  );
};

export default NewMovementModal;