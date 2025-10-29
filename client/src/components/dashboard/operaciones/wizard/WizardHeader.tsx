import React from 'react';

interface WizardStep {
  label: string;
  description: string;
}

interface Props {
  steps: WizardStep[];
  currentStep: number;
  onBack: () => void;
}

export const WizardHeader: React.FC<Props> = ({ steps, currentStep, onBack }) => (
  <section id="wizard-header" className="mb-8">
    <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-primary hover:text-blue-700 mr-0 sm:mr-4 mb-2 sm:mb-0 transition-colors"
      >
        <i className="fa-solid fa-arrow-left mr-2" />
        Volver a Operaciones
      </button>
      <div className="hidden sm:block h-6 w-px bg-gray-300 mr-4" />
      <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Nueva Operación</h1>
    </div>

    <div id="progress-bar" className="mb-8">
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 sm:gap-4 lg:gap-6">
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
                <div className="ml-3">
                  <div className={`font-medium text-sm sm:text-base ${labelClasses}`}>{step.label}</div>
                  <div className={`hidden sm:block ${descriptionClasses}`}>{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`hidden lg:flex flex-1 mx-2 sm:mx-8 h-px ${connectorClasses}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </section>
);
