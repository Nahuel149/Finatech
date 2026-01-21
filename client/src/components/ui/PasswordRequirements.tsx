import React from 'react';
import { PasswordRequirements as PasswordReqs } from '../../types/auth';

interface PasswordRequirementsProps {
  requirements: PasswordReqs;
  className?: string;
}

export const PasswordRequirements: React.FC<PasswordRequirementsProps> = ({
  requirements,
  className = '',
}) => {
  const requirementItems = [
    { key: 'minLength', label: 'Mínimo 8 caracteres', met: requirements.minLength },
    { key: 'hasUppercase', label: 'Al menos una mayúscula', met: requirements.hasUppercase },
    { key: 'hasLowercase', label: 'Al menos una minúscula', met: requirements.hasLowercase },
    { key: 'hasNumber', label: 'Al menos un número', met: requirements.hasNumber },
    { key: 'hasSpecialChar', label: 'Al menos un carácter especial', met: requirements.hasSpecialChar },
  ];

  return (
    <div className={`mt-2 ${className}`}>
      <p className="text-sm text-gray-600 mb-2">La contraseña debe contener:</p>
      <ul className="space-y-1">
        {requirementItems.map((item) => (
          <li key={item.key} className="flex items-center text-sm">
            <div className={`mr-2 h-4 w-4 rounded-full flex items-center justify-center ${
              item.met ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              {item.met ? (
                <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <div className="h-2 w-2 bg-gray-400 rounded-full" />
              )}
            </div>
            <span className={item.met ? 'text-green-600' : 'text-gray-500'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};