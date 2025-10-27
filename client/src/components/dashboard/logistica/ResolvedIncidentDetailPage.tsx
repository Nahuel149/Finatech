import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardNavbar } from '../operaciones/Navbar';
import { BalanceStripe } from '../operaciones/BalanceStripe';
import { ResolvedIncidentDetailSidePanel } from './ResolvedIncidentDetailSidePanel';

interface ResolvedIncidentData {
  id: string;
  type: string;
  severity: 'baja' | 'media' | 'alta' | 'critica';
  status: 'resuelta';
  reportDate: string;
  resolutionDate: string;
  responsible: string;
  associatedMovement: string;
  description: string;
  operationalImpacts: string[];
  resolutionDetails: {
    resolutionType: string;
    resolutionDescription: string;
    resolvedBy: string;
    resolutionDate: string;
    followUpActions: string[];
  };
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
    status: string;
  }>;
  changeHistory: Array<{
    id: string;
    action: string;
    description: string;
    date: string;
    user: string;
    type: 'created' | 'updated' | 'in_review' | 'comment' | 'resolved';
  }>;
}

export const ResolvedIncidentDetailPage: React.FC = () => {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const [incident, setIncident] = useState<ResolvedIncidentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchIncidentData = async () => {
      setIsLoading(true);
      try {
        // Mock data for resolved incident - replace with actual API call
        const mockIncident: ResolvedIncidentData = {
          id: incidentId || 'INC-2024-001',
          type: 'Daño de mercadería',
          severity: 'media',
          status: 'resuelta',
          reportDate: '2024-01-15T10:30:00Z',
          resolutionDate: '2024-01-18T16:45:00Z',
          responsible: 'Juan Pérez',
          associatedMovement: 'MOV-2024-001',
          description: 'Se detectó daño en la mercadería durante el proceso de carga. Varios productos presentan abolladuras y rayones que afectan su calidad comercial.',
          operationalImpacts: [
            'Retraso en la entrega programada',
            'Necesidad de reemplazo de productos dañados',
            'Revisión del proceso de manipulación'
          ],
          resolutionDetails: {
            resolutionType: 'Reemplazo de mercadería',
            resolutionDescription: 'Se procedió al reemplazo completo de los productos dañados. Se implementaron nuevos protocolos de manipulación para prevenir futuros incidentes.',
            resolvedBy: 'María González',
            resolutionDate: '2024-01-18T16:45:00Z',
            followUpActions: [
              'Capacitación del personal en nuevos protocolos',
              'Revisión mensual de procedimientos de carga',
              'Implementación de sistema de monitoreo'
            ]
          },
          involvedItems: [
            {
              id: '1',
              code: 'PROD-001',
              description: 'Televisor LED 55"',
              quantity: 3,
              unit: 'unidades',
              status: 'recovered',
              location: 'Almacén Central - Sector A'
            },
            {
              id: '2',
              code: 'PROD-002',
              description: 'Laptop Gaming',
              quantity: 2,
              unit: 'unidades',
              status: 'damaged',
              location: 'Almacén Central - Sector B'
            }
          ],
          attachedDocuments: [
            {
              id: '1',
              name: 'reporte-danos.pdf',
              type: 'PDF',
              size: '2.5 MB',
              uploadDate: '2024-01-15T11:00:00Z',
              uploadedBy: 'Juan Pérez',
              status: 'Activo'
            },
            {
              id: '2',
              name: 'fotos-evidencia.zip',
              type: 'ZIP',
              size: '15.8 MB',
              uploadDate: '2024-01-15T11:30:00Z',
              uploadedBy: 'Juan Pérez',
              status: 'Activo'
            },
            {
              id: '3',
              name: 'resolucion-final.pdf',
              type: 'PDF',
              size: '1.2 MB',
              uploadDate: '2024-01-18T17:00:00Z',
              uploadedBy: 'María González',
              status: 'Activo'
            }
          ],
          changeHistory: [
            {
              id: '1',
              action: 'Creado',
              description: 'Incidencia creada por Juan Pérez',
              date: '2024-01-15T10:30:00Z',
              user: 'Juan Pérez',
              type: 'created'
            },
            {
              id: '2',
              action: 'En revisión',
              description: 'Incidencia asignada para revisión',
              date: '2024-01-15T14:20:00Z',
              user: 'Sistema',
              type: 'in_review'
            },
            {
              id: '3',
              action: 'Comentario',
              description: 'Se agregaron fotos de evidencia del daño',
              date: '2024-01-16T09:15:00Z',
              user: 'Juan Pérez',
              type: 'comment'
            },
            {
              id: '4',
              action: 'Resuelta',
              description: 'Incidencia resuelta - Mercadería reemplazada',
              date: '2024-01-18T16:45:00Z',
              user: 'María González',
              type: 'resolved'
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

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleGoBack = () => {
    navigate('/dashboard/logistica');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={searchTerm} onSearchChange={handleSearchChange} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Cargando detalles de la incidencia...</div>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNavbar search={searchTerm} onSearchChange={handleSearchChange} />
        <BalanceStripe />
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Incidencia no encontrada</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavbar search={searchTerm} onSearchChange={handleSearchChange} />
      <BalanceStripe />
      
      <div className="flex">
        <div className="flex-1">
          <ResolvedIncidentDetailSidePanel 
            incident={incident}
            onGoBack={handleGoBack}
          />
        </div>
      </div>
    </div>
  );
};
