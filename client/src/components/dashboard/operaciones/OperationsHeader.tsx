import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/design-system';

interface Props {
  onTransferPesos: () => void;
  onOpenReport: () => void;
}

export const OperationsHeader: React.FC<Props> = ({ onTransferPesos, onOpenReport }) => {
  const navigate = useNavigate();

  const handleNuevaOperacion = () => {
    navigate('/dashboard/operaciones/nueva?tipo=compra');
  };

  const handleTransferirPesos = () => {
    navigate('/dashboard/operaciones/transfer-pesos');
  };

  const handleVerCuentasCorrientes = () => {
    navigate('/dashboard/tesoreria/saldos?account=cash-ars');
  };

  return (
    <section id="operations-header" className="mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
        <div className="hidden lg:block">
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary mb-2">Operaciones</h1>
          <p className="text-gray-600 text-sm lg:text-base">Gestiona y supervisa todas las operaciones financieras</p>
        </div>

        {/* Desktop Layout */}
        <div id="header-actions" className="hidden lg:flex lg:items-center lg:space-x-3">
          <Button variant="primary" size="md" onClick={handleNuevaOperacion} icon="fa-solid fa-plus" className="font-medium">
            Nueva operacion
          </Button>
          <Button variant="outline" size="md" onClick={onOpenReport} icon="fa-solid fa-chart-pie" className="font-medium">
            Reporte operativo
          </Button>
          <Button variant="outline" size="md" onClick={handleTransferirPesos} icon="fa-solid fa-paper-plane" className="font-medium">
            Transferir pesos
          </Button>
          <Button variant="outline" size="md" onClick={handleVerCuentasCorrientes} icon="fa-solid fa-file-invoice" className="font-medium">
            Ver cuentas corrientes
          </Button>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden grid grid-cols-1 gap-3">
          <Button variant="primary" size="md" onClick={handleNuevaOperacion} icon="fa-solid fa-plus" className="w-full font-medium">
            Nueva operacion
          </Button>
          <Button variant="secondary" size="md" onClick={onOpenReport} icon="fa-solid fa-chart-pie" className="w-full text-sm">
            Reporte operativo
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" size="md" onClick={handleTransferirPesos} icon="fa-solid fa-paper-plane" className="w-full text-sm">
              Transferir pesos
            </Button>
            <Button variant="outline" size="md" onClick={handleVerCuentasCorrientes} icon="fa-solid fa-file-invoice" className="w-full text-sm">
              Ver cuentas corrientes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
