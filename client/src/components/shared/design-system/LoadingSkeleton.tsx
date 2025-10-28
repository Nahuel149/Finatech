import React from 'react';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  className?: string;
  animate?: boolean;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
  animate = true,
}) => {
  const baseClasses = 'bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100';
  const animationClasses = animate ? 'animate-pulse' : '';
  
  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // Default dimensions for text variant
  if (variant === 'text' && !width && !height) {
    style.height = '1rem';
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses} ${className}`}
      style={style}
    />
  );
};

interface BalanceCardSkeletonProps {
  className?: string;
}

export const BalanceCardSkeleton: React.FC<BalanceCardSkeletonProps> = ({ className = '' }) => (
  <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center">
        <LoadingSkeleton variant="circular" width={16} height={16} className="mr-2" />
        <LoadingSkeleton width="8rem" height="1rem" />
      </div>
      <LoadingSkeleton variant="circular" width={8} height={8} />
    </div>
    <LoadingSkeleton width="10rem" height="2rem" className="mb-1" />
    <LoadingSkeleton width="6rem" height="0.75rem" />
  </div>
);