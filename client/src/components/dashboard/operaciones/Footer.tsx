import React from 'react';

export const DashboardFooter: React.FC = () => (
  <footer id="footer" className="bg-white border-t border-gray-200">
    {/* Desktop Layout */}
    <div className="hidden md:block py-6 px-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-6">
          <span className="text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer">Términos de uso</span>
          <span className="text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer">Política de privacidad</span>
          <span className="text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer">Centro de ayuda</span>
          <span className="text-sm text-gray-600 hover:text-primary transition-colors cursor-pointer">Soporte técnico</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">© 2024 FinaTech - Versión 2.1.4</span>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-sm text-gray-600">Sistema operativo</span>
          </div>
        </div>
      </div>
    </div>

    {/* Mobile Layout */}
    <div className="block md:hidden py-4 px-4">
      <div className="text-center space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <span className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Términos de uso</span>
          <span className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Política de privacidad</span>
          <span className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Centro de ayuda</span>
          <span className="text-gray-600 hover:text-primary transition-colors cursor-pointer">Soporte técnico</span>
        </div>
        <div className="text-center space-y-2">
          <span className="text-xs text-gray-500 block">© 2024 FinaTech - Versión 2.1.4</span>
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full"></div>
            <span className="text-xs text-gray-600">Sistema operativo</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

// Export as Footer for compatibility with imports
export const Footer = DashboardFooter;