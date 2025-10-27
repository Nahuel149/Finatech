import React from 'react';

interface Props {
  percentage: number;
  message: string;
  tone: 'neutral' | 'success' | 'error';
}

const toneClasses: Record<Props['tone'], string> = {
  neutral: 'text-gray-600',
  success: 'text-success',
  error: 'text-danger',
};

export const SettlementProgress: React.FC<Props> = ({ percentage, message, tone }) => (
  <div id="settlement-progress" className="space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-text-primary">Progreso de liquidación</span>
      <span id="progress-percentage" className="text-sm font-semibold text-text-primary">
        {percentage.toFixed(1)}%
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-3">
      <div
        id="progress-bar-fill"
        className="bg-primary h-3 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
    <div id="validation-message" className={`text-sm flex items-start ${toneClasses[tone]}`}>
      <i className="fa-solid fa-info-circle mr-1 mt-0.5" />
      <span>{message}</span>
    </div>
  </div>
);
