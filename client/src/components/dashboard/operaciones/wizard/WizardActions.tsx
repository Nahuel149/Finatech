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
    className="flex flex-col gap-3 pt-4 border-t border-gray-200"
  >
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
      <div className="flex flex-row flex-wrap gap-2 sm:space-x-3 order-2 lg:order-1 w-full lg:w-auto">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="h-12 px-6 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto flex-1"
            disabled={saving}
          >
            <i className="fa-solid fa-arrow-left mr-2" />
            {backLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onSaveDraft}
          className="h-12 px-6 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed w-full sm:w-auto flex-1"
          disabled={saving || disableSave}
          title="Guardar los datos sin avanzar al siguiente paso"
        >
          <i className="fa-solid fa-floppy-disk mr-2" />
          Guardar borrador
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-12 px-6 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors flex items-center justify-center w-full sm:w-auto flex-1"
        >
          <i className="fa-solid fa-xmark mr-2" />
          Cancelar
        </button>
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="h-12 px-8 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed w-full lg:w-auto order-1 lg:order-2 shadow-sm"
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
  </div>
);
