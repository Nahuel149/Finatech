import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { MovementDetailSidePanel } from './MovementDetailSidePanel';
import CompletionConfirmationModal from './CompletionConfirmationModal';
import { IncidentRegistrationModal } from './IncidentRegistrationModal';
import { Footer } from '../operaciones/Footer';

interface MovementDetailPageProps {
  movementId?: string;
}

export const MovementDetailPage: React.FC<MovementDetailPageProps> = ({ movementId: propMovementId }) => {
  const { movementId: paramMovementId } = useParams<{ movementId: string }>();
  const navigate = useNavigate();
  const movementId = propMovementId || paramMovementId;
  
  const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [movement, setMovement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (movementId) {
      // Simulate API call to fetch movement details
      setIsLoading(true);
      setTimeout(() => {
        setMovement({
          id: `#${movementId}`.toUpperCase(),
          type: 'Transferencia',
          date: '2024-01-15T10:30:00Z',
          responsible: 'Juan Pérez - Operador Senior',
          contact: 'Empresa ABC S.A.',
          reference: 'Entrega de documentación para operación #FT-000456',
          status: 'en-curso',
          origin: 'Sede Central',
          destination: 'Sucursal Norte',
          medium: 'Transporte interno',
          currency: 'USD',
          totalAmount: 125000,
          linkedOperation: '#FT-000456',
          timeline: [
            {
              id: 'created',
              title: 'Creado',
              description: null,
              date: '2024-01-15T10:30:00Z',
              user: 'Juan Pérez',
              type: 'created',
            },
            {
              id: 'in-progress',
              title: 'En curso',
              description: 'Movimiento iniciado hacia destino',
              date: '2024-01-15T11:15:00Z',
              user: 'Juan Pérez',
              type: 'updated',
            },
            {
              id: 'received',
              title: 'Recibido',
              description: null,
              date: null,
              user: null,
              type: 'received',
            },
            {
              id: 'completed',
              title: 'Completado',
              description: null,
              date: null,
              user: null,
              type: 'completed',
            },
          ],
          associatedItems: [
            {
              id: 'DOC-001-2024',
              description: 'Documentación contractual',
              identifier: 'DOC-001-2024',
              quantity: 1,
              unit: 'paquete',
            },
            {
              id: 'CHQ-ABC-001',
              description: 'Cheques en custodia',
              identifier: 'CHQ-ABC-001',
              quantity: 3,
              unit: 'sobre',
            },
          ],
          attachments: [
            {
              id: 'contrato_abc_2024.pdf',
              name: 'contrato_abc_2024.pdf',
              type: 'PDF',
              size: '2.4 MB',
              url: '#',
            },
            {
              id: 'foto_cheques.jpg',
              name: 'foto_cheques.jpg',
              type: 'JPG',
              size: '1.8 MB',
              url: '#',
            },
          ],
          audit: {
            createdBy: 'Juan Pérez',
            createdAt: '2024-01-15T10:30:00Z',
            lastModifiedBy: 'Juan Pérez',
            lastModifiedAt: '2024-01-15T14:25:00Z',
            ipAddress: '192.168.1.45',
          },
        });
        setIsLoading(false);
      }, 1000);
    }
  }, [movementId]);

  const handleMarkAsCompleted = () => {
    setIsCompletionModalOpen(true);
  };

  const handleConfirmCompletion = () => {
    // Simulate API call to mark as completed
    setMovement((prev: any) => ({
      ...prev,
      status: 'completado',
    }));
    setIsCompletionModalOpen(false);
  };

  const handleBackToLogistics = () => {
    navigate('/dashboard/logistica');
  };

  const handleEditMovement = () => {
    // Navigate to edit movement page
    console.log('Edit movement:', movementId);
  };

  const handleCancelMovement = () => {
    // Handle movement cancellation
    console.log('Cancel movement:', movementId);
  };

  const handleRegisterIncident = () => {
    setIsIncidentModalOpen(true);
  };

  if (!movementId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={search} onSearchChange={setSearch} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No se especificó un ID de movimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={search} onSearchChange={setSearch} />
      <BalanceStripe />
      
      <MovementDetailSidePanel
          isOpen={true}
          movement={movement}
          isLoading={isLoading}
          onClose={handleBackToLogistics}
          onMarkAsCompleted={handleMarkAsCompleted}
          onEdit={handleEditMovement}
          onCancel={handleCancelMovement}
          onRegisterIncident={handleRegisterIncident}
        />

      <CompletionConfirmationModal
        isOpen={isCompletionModalOpen}
        onClose={() => setIsCompletionModalOpen(false)}
        onConfirm={handleConfirmCompletion}
        movementId={movement?.id || ''}
        movementType={movement?.type}
        reference={movement?.reference}
      />

      <IncidentRegistrationModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        movementId={movementId}
      />

      <Footer />
    </div>
  );
};
