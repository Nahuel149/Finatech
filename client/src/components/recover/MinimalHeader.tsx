import React from 'react';

export const MinimalHeader: React.FC = () => {
  return (
    <header id="header" className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 py-3">
        <div className="flex items-center justify-center">
          {/* Centered Logo */}
          <div className="flex items-center">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center mr-2">
              <i className="fa-solid fa-chart-line text-white text-xs"></i>
            </div>
            <span className="text-lg font-bold text-text-primary">FinaTech</span>
          </div>
        </div>
      </div>
    </header>
  );
};