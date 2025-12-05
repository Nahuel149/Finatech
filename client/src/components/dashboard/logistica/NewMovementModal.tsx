import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import MovementDataForm from './MovementDataForm';
import AssociationsDocumentsForm from './AssociationsDocumentsForm';
import ItemsBulkForm from './ItemsBulkForm';
import AttachmentsForm from './AttachmentsForm';
import CompletionConfirmationModal from './CompletionConfirmationModal';
import { devLog } from '../../../utils/devLogger';

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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
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
    try {
      const payload = {
        ...movementData,
        savedAt: new Date().toISOString()
      };
      localStorage.setItem('logisticsMovementDraft', JSON.stringify(payload));
      setSaveError(null);
      setSaveMessage('Borrador guardado localmente');
    } catch (err) {
      setSaveMessage(null);
      setSaveError('No pudimos guardar el borrador. Intenta nuevamente.');
      devLog('Save draft failed', err);
    } finally {
      window.setTimeout(() => {
        setSaveMessage(null);
        setSaveError(null);
      }, 3200);
    }
  };

  const handleRegisterMovement = () => {
    setShowConfirmation(true);
  };

  const handleConfirmRegistration = () => {
    // TODO: Implement movement registration
    devLog('Registering movement...');
    setShowConfirmation(false);
    onClose();
  };

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
  };

  return (
    <>
      {isOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-200 ease-out ${
            mounted ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={handleClose}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            className={`bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-200/60 flex flex-col transform transition-all duration-200 ease-out ${
              mounted ? 'scale-100 translate-y-0' : 'scale-95 translate-y-1'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="px-6 sm:px-8 py-5 sm:py-6 border-b border-gray-200">
              <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
                <span className="text-primary font-medium">Logística</span>
                <i className="fa-solid fa-chevron-right text-xs" />
                <span>Nuevo movimiento</span>
              </nav>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-semibold text-text-primary">Registrar nuevo movimiento</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Cargá los datos operativos para la trazabilidad logística
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                  aria-label="Cerrar modal"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto">
              <div className="px-6 sm:px-8 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <MovementDataForm />
                  <div className="space-y-8">
                    <AssociationsDocumentsForm />
                    <ItemsBulkForm />
                    <AttachmentsForm />
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-6 sm:px-8 py-5 sm:py-6 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={handleClose}
                  className="px-5 py-2 text-sm font-medium text-text-primary border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-5 py-2 text-sm font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
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
              {(saveMessage || saveError) && (
                <p className={`mt-3 text-sm ${saveError ? 'text-danger' : 'text-emerald-600'}`}>
                  {saveMessage || saveError}
                </p>
              )}
            </footer>
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
