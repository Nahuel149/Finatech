import React, { useEffect, useState } from 'react';
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
  const [mounted, setMounted] = useState(false);

  // Mantener el orden de Hooks y evitar llamadas condicionales
  useEffect(() => {
    // Habilitar animación de entrada solo cuando el modal está abierto
    setMounted(isOpen);
    return () => setMounted(false);
  }, [isOpen]);

  const handleClose = () => {
    // play exit animation briefly before unmount
    setMounted(false);
    setTimeout(() => {
      onClose();
    }, 180);
  };

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
      {/* No renderizar contenido cuando el modal está cerrado */}
      {!isOpen ? null : (
      <div
        className={`fixed inset-0 flex items-center justify-center p-5 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-200 ease-out ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      >
        <div
          className={`bg-white rounded-lg shadow-2xl border border-gray-200/60 max-w-4xl w-full max-h-[calc(100vh-40px)] flex flex-col transform transition-all duration-200 ease-out ${mounted ? 'scale-100 translate-y-0' : 'scale-95 translate-y-1'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-gray-200 gap-4">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="text-sm text-gray-500 mb-2 overflow-x-auto">
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  <span>Logística</span>
                  <span>/</span>
                  <span>Panel principal</span>
                  <span>/</span>
                  <span className="text-gray-900">Registrar nuevo movimiento</span>
                </div>
              </nav>
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Registrar nuevo movimiento logístico
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors self-end sm:self-auto p-2"
              aria-label="Cerrar modal"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1">
            <div className="space-y-6 sm:space-y-8">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleClose}
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
      )}

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