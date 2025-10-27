import React from 'react';
import { 
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  ChevronRightIcon,
  FireIcon,
  ShieldExclamationIcon
} from '../../icons/HeroiconsOutline';

interface ActiveIncident {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  status: string;
  reportedDate: string;
  reportedBy: string;
  assignedTo: string;
  movementId?: string;
  estimatedResolution?: string;
}

interface LogisticsActiveIncidentsSectionProps {
  onIncidentClick: (incidentId: string) => void;
}

export const LogisticsActiveIncidentsSection: React.FC<LogisticsActiveIncidentsSectionProps> = ({ 
  onIncidentClick 
}) => {
  // Mock data for active incidents
  const activeIncidents: ActiveIncident[] = [
    {
      id: 'INC-2024-001',
      title: 'Retraso en entrega crítica',
      description: 'Entrega programada para cliente premium presenta retraso de 2 horas debido a problemas de tráfico.',
      severity: 'high',
      status: 'En investigación',
      reportedDate: '2024-01-15T10:30:00Z',
      reportedBy: 'Juan Pérez',
      assignedTo: 'María García',
      movementId: 'MOV-2024-001',
      estimatedResolution: '2024-01-15T16:00:00Z'
    },
    {
      id: 'INC-2024-002',
      title: 'Discrepancia en inventario',
      description: 'Se detectó diferencia entre inventario físico y sistema en almacén central.',
      severity: 'medium',
      status: 'Asignado',
      reportedDate: '2024-01-15T08:15:00Z',
      reportedBy: 'Ana López',
      assignedTo: 'Carlos Rodríguez',
      estimatedResolution: '2024-01-16T12:00:00Z'
    },
    {
      id: 'INC-2024-003',
      title: 'Falla en sistema de tracking',
      description: 'El sistema de seguimiento no actualiza ubicaciones en tiempo real.',
      severity: 'low',
      status: 'Pendiente',
      reportedDate: '2024-01-14T16:45:00Z',
      reportedBy: 'Roberto Silva',
      assignedTo: 'Laura Martínez',
      estimatedResolution: '2024-01-17T10:00:00Z'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return FireIcon;
      case 'medium':
        return ExclamationTriangleIcon;
      case 'low':
        return ShieldExclamationIcon;
      default:
        return ExclamationTriangleIcon;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Hace menos de 1 hora';
    } else if (diffInHours < 24) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Incidencias Activas
          </h2>
          <p className="text-sm text-gray-600">
            Incidencias que requieren atención inmediata o seguimiento.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {activeIncidents.filter(i => i.severity === 'high').length} críticas
          </span>
          <button
            onClick={() => window.location.href = '/dashboard/logistica/incidencias'}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Ver todas →
          </button>
        </div>
      </div>

      {activeIncidents.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="flex justify-center mb-3">
            <svg className="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-green-900 mb-2">
            ¡Excelente trabajo!
          </h3>
          <p className="text-sm text-green-700">
            No hay incidencias activas en este momento. Todas las operaciones funcionan correctamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeIncidents.map((incident) => {
            const SeverityIcon = getSeverityIcon(incident.severity);
            
            return (
              <div
                key={incident.id}
                className={`border rounded-lg p-6 transition-all duration-200 hover:shadow-md cursor-pointer ${getSeverityColor(incident.severity)}`}
                onClick={() => onIncidentClick(incident.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <SeverityIcon className={`h-5 w-5 mr-2 ${
                        incident.severity === 'high' ? 'text-red-600' :
                        incident.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <h3 className="text-sm font-semibold text-gray-900">
                        {incident.title}
                      </h3>
                      <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                        incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {incident.severity === 'high' ? 'Alta' : 
                         incident.severity === 'medium' ? 'Media' : 'Baja'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-4">
                      {incident.description}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600">
                      <div className="flex items-center">
                        <span className="font-medium">ID:</span>
                        <span className="ml-1 font-mono">{incident.id}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-1" />
                        <span>{getTimeAgo(incident.reportedDate)}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <UserIcon className="h-4 w-4 mr-1" />
                        <span>Asignado a: {incident.assignedTo}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          incident.status === 'En investigación' ? 'bg-orange-100 text-orange-800' :
                          incident.status === 'Asignado' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {incident.status}
                        </span>
                      </div>
                    </div>
                    
                    {incident.estimatedResolution && (
                      <div className="mt-3 text-xs text-gray-600">
                        <span className="font-medium">Resolución estimada:</span>
                        <span className="ml-1">{formatDate(incident.estimatedResolution)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <ChevronRightIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary footer */}
      {activeIncidents.length > 0 && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-6">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-600">
                  {activeIncidents.filter(i => i.severity === 'high').length} Alta prioridad
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-600">
                  {activeIncidents.filter(i => i.severity === 'medium').length} Media prioridad
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-gray-600">
                  {activeIncidents.filter(i => i.severity === 'low').length} Baja prioridad
                </span>
              </div>
            </div>
            
            <button
              onClick={() => window.location.href = '/dashboard/logistica/reportar-incidencia'}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
            >
              <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
              Reportar nueva incidencia
            </button>
          </div>
        </div>
      )}
    </section>
  );
};