import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '../../icons/HeroiconsOutline';
import MovementDataForm, { type LogisticsMovementDraft } from './MovementDataForm';
import AssociationsDocumentsForm from './AssociationsDocumentsForm';
import ItemsBulkForm from './ItemsBulkForm';
import AttachmentsForm from './AttachmentsForm';
import CompletionConfirmationModal from './CompletionConfirmationModal';
import { devLog } from '../../../utils/devLogger';
import { apiRequest } from '../../../utils/api';
import { Alert } from '../../ui/Alert';

interface NewMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const buildLocalDatetimeInputValue = (date = new Date()) => {
  const tzOffsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, 16);
};

const buildInitialMovementData = (): LogisticsMovementDraft => ({
  // UI defaults to "Entrega" visually, so keep the payload aligned to avoid 400s
  // when the user submits without re-selecting the type.
  type: 'entrega',
  state: 'pendiente',
  origin: '',
  destination: '',
  responsible: '',
  datetime: buildLocalDatetimeInputValue(),
  reference: '',
});

const NewMovementModal: React.FC<NewMovementModalProps> = ({ isOpen, onClose }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [movementData, setMovementData] = useState<LogisticsMovementDraft>(buildInitialMovementData);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isMovementValid = () => {
    return (
      Boolean(movementData.type) &&
      Boolean(movementData.state) &&
      Boolean(movementData.origin?.trim()) &&
      Boolean(movementData.destination?.trim()) &&
      Boolean(movementData.responsible?.trim()) &&
      Boolean(movementData.datetime)
    );
  };

  // Mantener el orden de Hooks y evitar llamadas condicionales
  useEffect(() => {
    // Habilitar animación de entrada solo cuando el modal está abierto
    setMounted(isOpen);

    // Prevent nested confirmation modal state from leaking across openings.
    setShowConfirmation(false);

    if (isOpen) {
      setSaveMessage(null);
      setSaveError(null);
      setSubmitError(null);
      setSubmitting(false);

      // Restore draft if present (useful after a refresh).
      try {
        const rawDraft = localStorage.getItem('logisticsMovementDraft');
        if (rawDraft) {
          const parsed = JSON.parse(rawDraft);
          const restored = parsed?.data || parsed;
          if (restored && typeof restored === 'object') {
            setMovementData({ ...buildInitialMovementData(), ...(restored as LogisticsMovementDraft) });
            setSaveMessage('Borrador recuperado.');
          }
        } else {
          // UI defaults to "Entrega" visually; ensure payload has a type even if the user doesn't click it.
          setMovementData((prev) => (prev.type ? prev : buildInitialMovementData()));
        }
      } catch (err) {
        devLog('Restore draft failed', err);
        setMovementData((prev) => (prev.type ? prev : buildInitialMovementData()));
      }
    }

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
      const payload = { savedAt: new Date().toISOString(), data: movementData };
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

  const handleConfirmRegistration = async () => {
    setSubmitting(true);
    try {
      await apiRequest('/api/logistics/operations', {
        method: 'POST',
        body: movementData,
      });
      localStorage.removeItem('logisticsMovementDraft');
      setMovementData(buildInitialMovementData());
      setSubmitError(null);
      setShowConfirmation(false);
      onClose();
    } catch (err) {
      devLog('Register movement failed', err);
      setSubmitError('No pudimos registrar el movimiento.');
    } finally {
      setSubmitting(false);
    }
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
                  <MovementDataForm
                    value={movementData}
                    onChange={setMovementData}
                  />
                  <div className="space-y-8">
                    <AssociationsDocumentsForm />
                    <ItemsBulkForm />
                    <AttachmentsForm />
                  </div>
                </div>
              </div>
            </div>

            <footer className="px-6 sm:px-8 py-5 sm:py-6 border-t border-gray-200 bg-gray-50">
              {submitError && (
                <div className="mb-2">
                  <Alert type="error" message={submitError} onClose={() => setSubmitError(null)} />
                </div>
              )}
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
                  className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  disabled={submitting || !isMovementValid()}
                >
                  {submitting ? 'Registrando...' : 'Registrar movimiento'}
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
