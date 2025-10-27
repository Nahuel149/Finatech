import React from 'react';

export interface ValidationItem {
  label: string;
  hint?: string;
  tooltip?: string;
  passed: boolean;
}

interface Props {
  items: ValidationItem[];
}

export const FinalValidationChecklist: React.FC<Props> = ({ items }) => (
  <section id="final-validation" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">Validaciones finales</h3>
        <p className="text-sm text-gray-500">
          Antes de confirmar revisá que todas las validaciones estén en verde.
        </p>
      </div>
      <div className="bg-success bg-opacity-10 text-success border border-success rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide">
        Checklist completo
      </div>
    </div>
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`flex items-start justify-between rounded-lg border p-4 transition-colors ${
            item.passed ? 'bg-success bg-opacity-5 border-success' : 'bg-danger bg-opacity-5 border-danger'
          }`}
        >
          <div className="flex items-start">
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white mr-3 ${
                item.passed ? 'bg-success' : 'bg-danger'
              }`}
            >
              <i className={`fa-solid ${item.passed ? 'fa-check' : 'fa-triangle-exclamation'}`} />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary flex items-center">
                {item.label}
                {item.tooltip && (
                  <span className="relative ml-2 group">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 text-gray-600 rounded-full text-xs font-semibold">
                      i
                    </span>
                    <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-black text-white text-xs rounded px-3 py-2 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                      {item.tooltip}
                    </span>
                  </span>
                )}
              </div>
              {item.hint && <div className="text-xs text-gray-500 mt-1">{item.hint}</div>}
            </div>
          </div>
          <div className={`text-xs font-semibold uppercase tracking-wide ${item.passed ? 'text-success' : 'text-danger'}`}>
            {item.passed ? 'OK' : 'Revisar'}
          </div>
        </div>
      ))}
    </div>
  </section>
);
