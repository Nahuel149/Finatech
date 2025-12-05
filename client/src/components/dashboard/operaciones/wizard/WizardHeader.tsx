import React from 'react';

interface WizardStep {
  label: string;
  description: string;
}

interface Props {
  steps: WizardStep[];
  currentStep: number;
  onBack: () => void;
  currencies?: string[];
}

const CURRENCY_FLAGS: Record<string, string> = {
  ARS: '🇦🇷',
  BRL: '🇧🇷',
  EUR: '🇪🇺',
  USD: '🇺🇸',
};

const getCurrencyFlag = (code: string) => CURRENCY_FLAGS[code] || '🏳️';

export const WizardHeader: React.FC<Props> = ({
  steps,
  currentStep,
  onBack,
  currencies = [],
}) => {
  const uniqueCurrencies = Array.from(
    new Set(
      currencies
        .filter(Boolean)
        .map((currency) => currency.toUpperCase()),
    ),
  );

  return (
    <section id="wizard-header" className="mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-primary hover:text-blue-700 mr-0 sm:mr-4 mb-2 sm:mb-0 transition-colors"
        >
          <i className="fa-solid fa-arrow-left mr-2" />
          Volver a Operaciones
        </button>
        <div className="hidden sm:block h-6 w-px bg-gray-300 mr-4" />
        <div className="flex items-center flex-wrap gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Nueva Operaci��n</h1>
          {uniqueCurrencies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {uniqueCurrencies.map((currency) => (
                <span
                  key={currency}
                  className="inline-flex items-center px-2 py-1 rounded-full bg-white border border-gray-200 text-sm text-text-primary shadow-sm"
                >
                  <span className="text-lg mr-1">{getCurrencyFlag(currency)}</span>
                  <span className="font-semibold">{currency}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div id="progress-bar" className="mb-8">
        <div className="flex flex-nowrap items-center justify-between gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-1 lg:overflow-visible">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const stepClasses = isCompleted
              ? 'bg-success text-white'
              : isActive
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-500';
            const labelClasses = isCompleted || isActive ? 'text-text-primary' : 'text-gray-400';
            const descriptionClasses = isCompleted || isActive ? 'text-xs sm:text-sm text-gray-500' : 'text-xs sm:text-sm text-gray-400';
            const connectorClasses = index < currentStep ? 'bg-primary' : 'bg-gray-300';

            return (
              <React.Fragment key={step.label}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 ${stepClasses} rounded-full flex items-center justify-center font-semibold transition-colors`}
                  >
                    {isCompleted ? <i className="fa-solid fa-check text-xs sm:text-sm" /> : index + 1}
                  </div>
                  <div className="ml-3 whitespace-nowrap">
                    <div className={`font-medium text-sm sm:text-base ${labelClasses}`}>{step.label}</div>
                    <div className={`${descriptionClasses} text-xs sm:text-sm leading-tight`}>{step.description}</div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-px ${connectorClasses} mx-2 sm:mx-4 lg:mx-8 flex-1`}
                    style={{ minWidth: '1.5rem', maxWidth: '180px' }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
};
