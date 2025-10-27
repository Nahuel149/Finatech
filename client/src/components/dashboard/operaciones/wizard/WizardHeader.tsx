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
    <div className="flex items-center mb-6">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center text-primary hover:text-blue-700 mr-4 transition-colors"
      >
        <i className="fa-solid fa-arrow-left mr-2" />
        Volver a Operaciones
      </button>
      <div className="h-6 w-px bg-gray-300 mr-4" />
      <h1 className="text-3xl font-bold text-text-primary">Nueva Operación</h1>
    </div>

    <div id="progress-bar" className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const stepClasses = isCompleted
            ? 'bg-success text-white'
            : isActive
            ? 'bg-primary text-white'
            : 'bg-gray-200 text-gray-500';
          const labelClasses = isCompleted || isActive ? 'text-text-primary' : 'text-gray-400';
          const descriptionClasses = isCompleted || isActive ? 'text-sm text-gray-500' : 'text-sm text-gray-400';
          const connectorClasses = index < currentStep ? 'bg-primary' : 'bg-gray-300';

          return (
            <React.Fragment key={step.label}>
              <div className="flex items-center">
                <div
                  className={`w-10 h-10 ${stepClasses} rounded-full flex items-center justify-center font-semibold transition-colors`}
                >
                  {isCompleted ? <i className="fa-solid fa-check text-sm" /> : index + 1}
                </div>
                <div className="ml-3">
                  <div className={`font-medium ${labelClasses}`}>{step.label}</div>
                  <div className={descriptionClasses}>{step.description}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 mx-8 h-px ${connectorClasses}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  </section>
);
