import React from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  ClockIcon,
  UserIcon,
  TruckIcon,
  CheckCircleIcon,
} from '../../icons/HeroiconsOutline';

interface OperationDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  operation: LogisticOperation | null;
  isLoading?: boolean;
}

interface LogisticOperation {
  id: string;
  type: string;
  status: string;
  contact: string;
  responsible: string;
  date: string;
  amount: number;
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

export const OperationDetailPanel: React.FC<OperationDetailPanelProps> = ({
  isOpen,
  onClose,
  operation,
  isLoading = false
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'en-transito': { color: 'bg-blue-100 text-blue-800', label: 'En tránsito' },
      'completado': { color: 'bg-green-100 text-green-800', label: 'Completado' },
      'anulado': { color: 'bg-red-100 text-red-800', label: 'Anulado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      'entrega': { color: 'bg-purple-100 text-purple-800', label: 'Entrega' },
      'retiro': { color: 'bg-orange-100 text-orange-800', label: 'Retiro' },
      'transferencia-interna': { color: 'bg-indigo-100 text-indigo-800', label: 'Transferencia interna' }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.entrega;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <ClockIcon className="h-4 w-4 text-blue-500" />;
      case 'updated':
        return <UserIcon className="h-4 w-4 text-yellow-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <XMarkIcon className="h-4 w-4 text-red-500" />;
      default:
        return <TruckIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 h-full w-96 bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-text-primary">
              Detalle de operación
            </h3>
            <button
              type="button"
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              onClick={onClose}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : operation ? (
              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Información básica</h4>
                    <span className="text-sm text-gray-500">#{operation.id}</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Tipo:</span>
                      {getTypeBadge(operation.type)}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Estado:</span>
                      {getStatusBadge(operation.status)}
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Contacto:</span>
                      <span className="text-sm font-medium text-gray-900">{operation.contact}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Responsable:</span>
                      <span className="text-sm font-medium text-gray-900">{operation.responsible}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Fecha:</span>
                      <span className="text-sm font-medium text-gray-900">{formatDate(operation.date)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Monto:</span>
                      <span className="text-sm font-medium text-gray-900">{formatAmount(operation.amount)}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {operation.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Descripción</h4>
                    <p className="text-sm text-gray-600">{operation.description}</p>
                  </div>
                )}

                {/* Timeline */}
                {operation.timeline && operation.timeline.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Historial de cambios</h4>
                    <div className="space-y-4">
                      {operation.timeline.map((event, index) => (
                        <div key={event.id} className="flex space-x-3">
                          <div className="flex-shrink-0">
                            {getTimelineIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">{event.title}</div>
                            <div className="text-sm text-gray-500">{event.description}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {formatDate(event.date)} • {event.user}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {operation.attachments && operation.attachments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Archivos adjuntos</h4>
                    <div className="space-y-2">
                      {operation.attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <DocumentIcon className="h-5 w-5 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{attachment.name}</div>
                            <div className="text-xs text-gray-500">{attachment.type} • {attachment.size}</div>
                          </div>
                          <button
                            type="button"
                            className="text-sm text-primary hover:text-blue-700"
                            onClick={() => window.open(attachment.url, '_blank')}
                          >
                            Descargar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <TruckIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Selecciona una operación para ver los detalles</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {operation && !isLoading && (
            <div className="border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Editar
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Actualizar estado
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
