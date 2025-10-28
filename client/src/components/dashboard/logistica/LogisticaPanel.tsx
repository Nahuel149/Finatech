import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { LogisticaPanelHeader } from './LogisticaPanelHeader';
import { GeneralSummarySection } from './GeneralSummarySection';
import { LogisticsOperationsSection } from './LogisticsOperationsSection';
import { TreasuryIntegrationSection } from './TreasuryIntegrationSection';
import { FilterPanel } from './FilterPanel';
import { OperationDetailPanel } from './OperationDetailPanel';
import NewMovementModal from './NewMovementModal';
import { Footer } from '../operaciones/Footer';

interface FilterState {
  search: string;
  operationType: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  contact: string;
  responsible: string;
}

interface LogisticOperation {
  id: string;
  type: string;
  status: string;
  contact: string;
  responsible: string;
  date: string;
  amount: number;
  currency?: string;
  description?: string;
  timeline?: TimelineEvent[];
  attachments?: Attachment[];
}

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  user: string;
  type: 'created' | 'updated' | 'completed' | 'cancelled';
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
}

export const LogisticaPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  const [selectedOperations, setSelectedOperations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<LogisticOperation | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Sample data - in a real app, this would come from an API
  const sampleOperations: LogisticOperation[] = [
    {
      id: 'LOG-001',
      type: 'entrega',
      status: 'en-transito',
      contact: 'María González',
      responsible: 'Carlos Ruiz',
      date: '2024-01-15T14:30:00Z',
      amount: 125000,
      currency: 'ARS',
      description: 'Entrega de documentos y efectivo a sucursal norte',
      timeline: [
        {
          id: '1',
          title: 'Operación registrada',
          description: 'La operación fue registrada en el sistema',
          date: '2024-01-15T14:30:00Z',
          user: 'Sistema',
          type: 'created'
        },
        {
          id: '2',
          title: 'Asignado a responsable',
          description: 'Carlos Ruiz fue asignado como responsable',
          date: '2024-01-15T14:35:00Z',
          user: 'Ana López',
          type: 'updated'
        },
        {
          id: '3',
          title: 'En tránsito',
          description: 'El vehículo salió del depósito central',
          date: '2024-01-15T15:00:00Z',
          user: 'Carlos Ruiz',
          type: 'updated'
        }
      ],
      attachments: [
        {
          id: '1',
          name: 'Orden de trabajo.pdf',
          type: 'PDF',
          size: '245 KB',
          url: '#'
        },
        {
          id: '2',
          name: 'Foto del producto.jpg',
          type: 'JPG',
          size: '1.2 MB',
          url: '#'
        }
      ]
    },
    {
      id: 'LOG-002',
      type: 'retiro',
      status: 'pendiente',
      contact: 'Juan Pérez',
      responsible: 'Ana López',
      date: '2024-01-15T16:00:00Z',
      amount: 85000,
      currency: 'ARS',
      description: 'Retiro de documentación del cliente',
      timeline: [
        {
          id: '1',
          title: 'Operación registrada',
          description: 'La operación fue registrada en el sistema',
          date: '2024-01-15T16:00:00Z',
          user: 'Sistema',
          type: 'created'
        }
      ]
    },
    {
      id: 'LOG-003',
      type: 'transferencia-interna',
      status: 'completado',
      contact: 'Sistema Interno',
      responsible: 'Pedro Martín',
      date: '2024-01-14T10:15:00Z',
      amount: 200000,
      currency: 'ARS',
      description: 'Transferencia interna entre sucursales',
      timeline: [
        {
          id: '1',
          title: 'Operación registrada',
          description: 'La operación fue registrada en el sistema',
          date: '2024-01-14T10:15:00Z',
          user: 'Sistema',
          type: 'created'
        },
        {
          id: '2',
          title: 'Operación completada',
          description: 'La transferencia se completó exitosamente',
          date: '2024-01-14T11:30:00Z',
          user: 'Pedro Martín',
          type: 'completed'
        }
      ]
    }
  ];

  const handleFilterToggle = () => {
    setIsFilterPanelOpen(!isFilterPanelOpen);
  };

  const handleOperationOpen = (operation: LogisticOperation) => {
    // Navigate to the movement detail page
    navigate(`/dashboard/logistica/movimiento/${operation.id}`);
  };

  const handleDetailPanelClose = () => {
    setIsDetailPanelOpen(false);
    setSelectedOperation(null);
    setIsDetailLoading(false);
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on operations:`, selectedOperations);
  };

  const handleSelectionChange = (operationIds: string[]) => {
    setSelectedOperations(operationIds);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleApplyFilters = (filters: FilterState) => {
    console.log('Applied filters:', filters);
    setIsFilterPanelOpen(false);
  };

  const handleRegisterNewMovement = () => {
    setIsNewMovementModalOpen(true);
  };

  const handleCloseNewMovementModal = () => {
    setIsNewMovementModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar search={searchTerm} onSearchChange={handleSearch} />
      
      <div className="flex">
        <main className="flex-1 p-6">
          <LogisticaPanelHeader onRegisterClick={handleRegisterNewMovement} />
          
          <div className="space-y-6">
            <GeneralSummarySection />
            
            <LogisticsOperationsSection
              operations={sampleOperations}
              selectedOperations={selectedOperations}
              onSelectionChange={handleSelectionChange}
              onFilterToggle={handleFilterToggle}
              onBulkAction={handleBulkAction}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              onOperationOpen={handleOperationOpen}
            />
            
            <TreasuryIntegrationSection />
          </div>
        </main>
      </div>

      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        onApply={handleApplyFilters}
      />

      <OperationDetailPanel
        isOpen={isDetailPanelOpen}
        onClose={handleDetailPanelClose}
        operation={selectedOperation}
        isLoading={isDetailLoading}
      />

      <NewMovementModal
        isOpen={isNewMovementModalOpen}
        onClose={handleCloseNewMovementModal}
      />

      <Footer />
    </div>
  );
};