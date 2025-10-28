import React from 'react';

interface MinimalHeaderProps {
  onCreateAccountClick: () => void;
}

export const MinimalHeader: React.FC<MinimalHeaderProps> = ({ onCreateAccountClick }) => (
  <header id="header" className="bg-white shadow-sm border-b border-gray-200">
    <div className="px-4 py-3 md:px-4 md:py-3">
      <div className="grid grid-cols-3 items-center">
        <div aria-hidden="true" />

        <div className="flex items-center justify-center">
          <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2">
            <i className="fa-solid fa-chart-line text-white text-xs"></i>
          </div>
          <span className="text-lg font-bold text-text-primary md:text-lg">FinaTech</span>
        </div>

        <div className="flex justify-end">
          <button 
            onClick={onCreateAccountClick}
            className="text-primary hover:underline font-medium text-sm touch-friendly md:text-sm"
          >
            <span className="hidden sm:inline">Crear cuenta</span>
            <span className="sm:hidden">Crear</span>
          </button>
        </div>
      </div>
    </div>
  </header>
);
