import React from 'react';
import {
  XMarkIcon,
  DocumentIcon,
  ClockIcon,
  UserIcon,
  TruckIcon,
  CheckCircleIcon,
  PencilIcon,
  EyeIcon,
  PlusIcon,
} from '../../icons/HeroiconsOutline';

interface MovementDetailSidePanelProps {
  isOpen: boolean;
  movement: any;
  isLoading: boolean;
  onClose: () => void;
  onMarkAsCompleted: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onRegisterIncident: () => void;
}

export const MovementDetailSidePanel: React.FC<MovementDetailSidePanelProps> = ({
  isOpen,
  movement,
  isLoading,
  onClose,
  onMarkAsCompleted,
  onEdit,
  onCancel,
  onRegisterIncident,
}) => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente': { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente' },
      'en-progreso': { color: 'bg-blue-100 text-blue-800', label: 'En progreso' },
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
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency === 'ARS' ? 'ARS' : 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <span onClick={onClose} className="text-primary font-medium cursor-pointer">Logística</span>
                <span>/</span>
                <span className="text-gray-900">Detalle de movimiento</span>
              </nav>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mt-4">
            <h1 className="text-xl font-bold text-gray-900">
              {isLoading ? 'Cargando...' : `Movimiento ${movement?.id}`}
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="px-6 py-6 space-y-8">
            {/* Movement Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del movimiento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">ID</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tipo</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.type}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fecha</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(movement.date)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Responsable</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.responsible}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contacto</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.contact}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Referencia</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.reference}</p>
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estado</label>
                  <div className="mt-1">
                    {getStatusBadge(movement.status)}
                  </div>
                </div>
                
                {movement.status !== 'completado' && movement.status !== 'anulado' && (
                  <button
                    onClick={onMarkAsCompleted}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Marcar como completado
                  </button>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cronología de estados</h2>
              
              <div className="space-y-4">
                {movement.timeline?.map((event: any, index: number) => (
                  <div key={event.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTimelineIcon(event.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">{event.title}</h3>
                        <span className="text-xs text-gray-500">{formatDate(event.date)}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">Por {event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalles operativos</h2>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Origen</label>
                    <p className="mt-1 text-sm text-gray-900">{movement.origin}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Destino</label>
                    <p className="mt-1 text-sm text-gray-900">{movement.destination}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medio</label>
                    <p className="mt-1 text-sm text-gray-900">{movement.medium}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Moneda</label>
                    <p className="mt-1 text-sm text-gray-900">{movement.currency}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Monto total</label>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatCurrency(movement.totalAmount, movement.currency)}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Operación vinculada</label>
                    <p className="mt-1 text-sm text-primary cursor-pointer hover:underline">
                      {movement.linkedOperation}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Associated Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Ítems asociados</h2>
                <button className="flex items-center px-3 py-2 text-sm text-primary border border-primary rounded-lg hover:bg-blue-50 transition-colors">
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Agregar ítem
                </button>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Descripción
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Identificador
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {movement.associatedItems?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.identifier}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-800">
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button className="text-gray-600 hover:text-gray-800">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attached Documents */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Documentos adjuntos</h2>
              
              <div className="space-y-3">
                {movement.attachments?.map((attachment: any) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DocumentIcon className="h-8 w-8 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{attachment.type} • {attachment.size}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">
                        Ver
                      </button>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit and Registry */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Auditoría y registro</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Creado por</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {movement.audit?.createdBy} el {formatDate(movement.audit?.createdAt)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Última modificación</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {movement.audit?.lastModifiedBy} el {formatDate(movement.audit?.lastModifiedAt)}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección IP</label>
                  <p className="mt-1 text-sm text-gray-900">{movement.audit?.ipAddress}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Log de cambios</label>
                  <p className="mt-1 text-sm text-gray-500">No hay cambios registrados</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Panel Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Volver a Logística
            </button>
            
            <button
              onClick={onEdit}
              className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Editar movimiento
            </button>
            
            <button
              onClick={onCancel}
              className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Anular movimiento
            </button>
            
            <button
              onClick={onRegisterIncident}
              className="flex items-center px-4 py-2 text-orange-600 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <i className="fa-solid fa-exclamation-triangle mr-2"></i>
              Registrar incidencia
            </button>
            
            {movement && movement.status !== 'completado' && movement.status !== 'anulado' && (
              <button
                onClick={onMarkAsCompleted}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-auto"
              >
                Marcar como completado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
