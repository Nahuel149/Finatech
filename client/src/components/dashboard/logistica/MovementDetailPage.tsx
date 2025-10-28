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
          id: movementId,
          type: 'Entrega de efectivo',
          date: '2024-01-15T14:30:00Z',
          responsible: 'Carlos Ruiz',
          contact: 'María González',
          reference: 'REF-2024-001',
          status: 'en-progreso',
          origin: 'Sucursal Central',
          destination: 'Sucursal Norte',
          medium: 'Vehículo propio',
          currency: 'ARS',
          totalAmount: 125000,
          linkedOperation: 'OP-2024-001',
          timeline: [
            {
              id: '1',
              title: 'Movimiento registrado',
              description: 'El movimiento fue registrado en el sistema por Ana López',
              date: '2024-01-15T14:30:00Z',
              user: 'Ana López',
              type: 'created'
            },
            {
              id: '2',
              title: 'En progreso',
              description: 'Carlos Ruiz inició el proceso de entrega',
              date: '2024-01-15T15:00:00Z',
              user: 'Carlos Ruiz',
              type: 'updated'
            }
          ],
          associatedItems: [
            {
              id: '1',
              description: 'Efectivo en billetes de $1000',
              identifier: 'EF-001',
              quantity: 125,
              unit: 'billetes'
            },
            {
              id: '2',
              description: 'Documentos de respaldo',
              identifier: 'DOC-001',
              quantity: 3,
              unit: 'documentos'
            }
          ],
          attachments: [
            {
              id: '1',
              name: 'comprobante-entrega.pdf',
              type: 'PDF',
              size: '2.3 MB',
              url: '#'
            },
            {
              id: '2',
              name: 'foto-efectivo.jpg',
              type: 'JPG',
              size: '1.8 MB',
              url: '#'
            }
          ],
          audit: {
            createdBy: 'Ana López',
            createdAt: '2024-01-15T14:30:00Z',
            lastModifiedBy: 'Carlos Ruiz',
            lastModifiedAt: '2024-01-15T15:00:00Z',
            ipAddress: '192.168.1.45'
          }
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
      status: 'completado'
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
