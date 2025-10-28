import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case 'primary':
      return 'bg-primary text-white hover:bg-blue-700 focus:ring-primary';
    case 'secondary':
      return 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500';
    case 'outline':
      return 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500';
    case 'ghost':
      return 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500';
    case 'danger':
      return 'bg-danger text-white hover:bg-red-700 focus:ring-red-500';
    default:
      return 'bg-primary text-white hover:bg-blue-700 focus:ring-primary';
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case 'sm':
      return 'px-3 py-1.5 text-sm';
    case 'md':
      return 'px-4 py-2 text-sm';
    case 'lg':
      return 'px-6 py-3 text-base';
    default:
      return 'px-4 py-2 text-sm';
  }
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...props
}) => {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);
  const widthClasses = fullWidth ? 'w-full' : '';
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${widthClasses} ${className}`}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <i className="fa-solid fa-spinner fa-spin mr-2" />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <i className={`fa-solid ${icon} mr-2`} />
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <i className={`fa-solid ${icon} ml-2`} />
      )}
    </button>
  );
};