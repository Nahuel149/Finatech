import React from 'react';

interface Props {
  onSaveDraft: () => void;
  onCancel: () => void;
  onContinue: () => void;
  saving?: boolean;
  disableContinue?: boolean;
  disableSave?: boolean;
  onBack?: () => void;
  backLabel?: string;
  continueLabel?: string;
}

export const WizardActions: React.FC<Props> = ({
  onSaveDraft,
  onCancel,
  onContinue,
  saving = false,
  disableContinue = false,
  disableSave = false,
  onBack,
  backLabel = 'Atrás',
  continueLabel = 'Continuar',
}) => (
  <div
    id="step-1-actions"
    className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-gray-200"
  >
    <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={saving}
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          {backLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onSaveDraft}
        className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
        disabled={saving || disableSave}
        title="Guardar los datos sin avanzar al siguiente paso"
      >
        <i className="fa-solid fa-floppy-disk mr-2" />
        Guardar borrador
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-3 bg-white border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
      >
        <i className="fa-solid fa-xmark mr-2" />
        Cancelar
      </button>
    </div>

    <button
      type="button"
      onClick={onContinue}
      className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto"
      disabled={saving || disableContinue}
      title="Guardar los datos y continuar al siguiente paso"
    >
      {saving ? (
        <>
          Procesando
          <i className="fa-solid fa-circle-notch ml-2 animate-spin" />
        </>
      ) : (
        <>
          {continueLabel}
          <i className="fa-solid fa-arrow-right ml-2" />
        </>
      )}
    </button>
  </div>
);
