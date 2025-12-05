import React from 'react';

interface Props {
  allocatedAmount: number;
  targetAmount: number;
  message: string;
  tone: 'neutral' | 'success' | 'error';
  formatAmount: (amount: number) => string;
}

const toneClasses: Record<Props['tone'], string> = {
  neutral: 'text-gray-600',
  success: 'text-success',
  error: 'text-danger',
};

export const SettlementProgress: React.FC<Props> = ({
  allocatedAmount,
  targetAmount,
  message,
  tone,
  formatAmount,
}) => {
  const safeTarget = targetAmount > 0 ? targetAmount : 0;
  const percentage = safeTarget > 0 ? (allocatedAmount / safeTarget) * 100 : 0;
  const clampedWidth = Math.min(Math.max(percentage, 0), 100);
  const label = safeTarget > 0
    ? `${formatAmount(allocatedAmount)} / ${formatAmount(safeTarget)}`
    : formatAmount(allocatedAmount);

  return (
    <div id="settlement-progress" className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">Progreso de liquidacion</span>
        <span id="progress-percentage" className="text-sm font-semibold text-text-primary">
          {label}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          id="progress-bar-fill"
          className="bg-primary h-3 rounded-full transition-all duration-300"
          style={{ width: `${clampedWidth}%` }}
        />
      </div>
      <div id="validation-message" className={`text-sm flex items-start ${toneClasses[tone]}`}>
        <i className="fa-solid fa-info-circle mr-1 mt-0.5" />
        <span>{message}</span>
      </div>
    </div>
  );
};
