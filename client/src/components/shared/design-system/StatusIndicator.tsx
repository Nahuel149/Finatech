import React from 'react';

export type StatusType = 'ok' | 'warning' | 'error' | 'loading' | 'unknown';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const getStatusClasses = (status: StatusType): string => {
  switch (status) {
    case 'ok':
      return 'bg-success';
    case 'warning':
      return 'bg-warning';
    case 'error':
      return 'bg-danger';
    case 'loading':
      return 'bg-gray-300 animate-pulse';
    default:
      return 'bg-gray-300';
  }
};

const getSizeClasses = (size: 'sm' | 'md' | 'lg'): string => {
  switch (size) {
    case 'sm':
      return 'w-1.5 h-1.5';
    case 'md':
      return 'w-2 h-2';
    case 'lg':
      return 'w-3 h-3';
    default:
      return 'w-2 h-2';
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const statusClasses = getStatusClasses(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <div
      className={`${statusClasses} ${sizeClasses} rounded-full ${className}`}
      aria-label={`Status: ${status}`}
    />
  );
};