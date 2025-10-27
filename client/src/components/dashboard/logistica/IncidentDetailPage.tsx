import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { IncidentDetailSidePanel } from './IncidentDetailSidePanel';

interface IncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'abierta' | 'en-proceso' | 'resuelta' | 'anulada';
  reportDate: string;
  resolutionDate?: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  involvedItems: Array<{
    id: string;
    code: string;
    description: string;
    quantity: number;
    unit: string;
    status: 'affected' | 'damaged' | 'lost' | 'recovered';
    location: string;
  }>;
  attachedDocuments: Array<{
    id: string;
    name: string;
    type: string;
    size: string;
    uploadDate: string;
    uploadedBy: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'resolved' | 'cancelled';
  }>;
}

export const IncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<IncidentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchIncidentData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call - replace with actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data based on the HTML structure
        const mockIncident: IncidentData = {
          id: incidentId || 'INC-001',
          type: 'Retraso en entrega',
          severity: 'media',
          status: 'en-proceso',
          reportDate: '2024-01-15T09:30:00Z',
          resolutionDate: undefined,
          responsible: 'Carlos Ruiz',
          associatedMovement: 'LOG-001',
          description: 'Se reportó un retraso significativo en la entrega programada debido a condiciones climáticas adversas. El vehículo de transporte tuvo que tomar una ruta alternativa, lo que generó un retraso de aproximadamente 2 horas en el cronograma original.',
          operationalImpacts: [
            'Retraso en cronograma de entregas',
            'Necesidad de reprogramar citas con clientes',
            'Posible impacto en satisfacción del cliente'
          ],
          involvedItems: [
            {
              id: 'ITEM-001',
              code: 'DOC-2024-01',
              description: 'Documentos contractuales',
              quantity: 1,
              unit: 'lote',
              status: 'affected',
              location: 'Centro de distribución - Bahía 4'
            },
            {
              id: 'ITEM-002',
              code: 'EF-ARS-001',
              description: 'Efectivo ARS',
              quantity: 125000,
              unit: 'pesos',
              status: 'recovered',
              location: 'Custodia móvil - Unidad 12'
            }
          ],
          attachedDocuments: [
            {
              id: 'DOC-001',
              name: 'Reporte_climatico.pdf',
              type: 'PDF',
              size: '245 KB',
              uploadDate: '2024-01-15T10:15:00Z',
              uploadedBy: 'Ana López'
            },
            {
              id: 'DOC-002',
              name: 'Foto_ruta_alternativa.jpg',
              type: 'JPG',
              size: '1.2 MB',
              uploadDate: '2024-01-15T11:30:00Z',
              uploadedBy: 'Carlos Ruiz'
            },
            {
              id: 'DOC-003',
              name: 'Comunicacion_cliente.pdf',
              type: 'PDF',
              size: '180 KB',
              uploadDate: '2024-01-15T12:00:00Z',
              uploadedBy: 'Ana López'
            }
          ],
          changeHistory: [
            {
              id: 'HIST-001',
              action: 'Incidencia creada',
              description: 'Se registró la incidencia en el sistema debido a reporte del conductor',
              date: '2024-01-15T09:30:00Z',
              user: 'Sistema',
              type: 'created'
            },
            {
              id: 'HIST-002',
              action: 'Asignación de responsable',
              description: 'Carlos Ruiz fue asignado como responsable de la resolución',
              date: '2024-01-15T09:45:00Z',
              user: 'Ana López',
              type: 'updated'
            },
            {
              id: 'HIST-003',
              action: 'Actualización de estado',
              description: 'Estado cambiado a "En proceso" - se inició investigación',
              date: '2024-01-15T10:00:00Z',
              user: 'Carlos Ruiz',
              type: 'updated'
            },
            {
              id: 'HIST-004',
              action: 'Documentación adjunta',
              description: 'Se adjuntaron reportes climáticos y fotografías de la ruta',
              date: '2024-01-15T11:30:00Z',
              user: 'Carlos Ruiz',
              type: 'updated'
            }
          ]
        };
        
        setIncident(mockIncident);
      } catch (error) {
        console.error('Error fetching incident data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (incidentId) {
      fetchIncidentData();
    }
  }, [incidentId]);

  const handleBackToLogistics = () => {
    navigate('/dashboard/logistica');
  };

  const handleEditIncident = () => {
    // TODO: Implement edit incident functionality
    console.log('Edit incident:', incidentId);
  };

  const handleMarkAsResolved = () => {
    // TODO: Implement mark as resolved functionality
    console.log('Mark as resolved:', incidentId);
    setIncident(prev => prev ? { ...prev, status: 'resuelta' } : null);
  };

  const handleCancelIncident = () => {
    // TODO: Implement cancel incident functionality
    console.log('Cancel incident:', incidentId);
    setIncident(prev => prev ? { ...prev, status: 'anulada' } : null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={searchTerm} onSearchChange={setSearchTerm} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando detalle de incidencia...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={searchTerm} onSearchChange={setSearchTerm} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-gray-600">No se encontró la incidencia solicitada.</p>
            <button
              onClick={handleBackToLogistics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Volver a Logística
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={searchTerm} onSearchChange={setSearchTerm} />
      <BalanceStripe />
      
      <IncidentDetailSidePanel
        isOpen={true}
        onClose={handleBackToLogistics}
        incident={incident}
        onEditIncident={handleEditIncident}
        onMarkAsResolved={handleMarkAsResolved}
        onCancelIncident={handleCancelIncident}
      />
    </div>
  );
};
