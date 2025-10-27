import React from 'react';

export const DashboardFooter: React.FC = () => (
  <footer id="footer" className="border-t border-gray-200 bg-white">
    <div className="px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">© 2024 FinaTech. Todos los derechos reservados.</div>
        <div className="flex items-center space-x-4">
          <button className="text-sm text-primary hover:underline">Privacidad</button>
          <button className="text-sm text-primary hover:underline">Términos</button>
          <button className="text-sm text-primary hover:underline">Soporte</button>
        </div>
      </div>
    </div>
  </footer>
);