import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  TruckIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon
} from '../../icons/HeroiconsOutline';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  href: string;
  badge?: string;
}

export const LogisticsQuickActionsSection: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      title: 'Registrar Movimiento',
      description: 'Crear un nuevo movimiento logístico',
      icon: PlusIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      href: '/dashboard/logistica/registrar-nuevo-movimiento'
    },
    {
      title: 'Gestionar Entregas',
      description: 'Administrar entregas pendientes',
      icon: TruckIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      href: '/dashboard/logistica/entregas',
      badge: '23'
    },
    {
      title: 'Reportar Incidencia',
      description: 'Registrar nueva incidencia',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      href: '/dashboard/logistica/reportar-incidencia'
    },
    {
      title: 'Ver Inventario',
      description: 'Consultar estado del inventario',
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      href: '/dashboard/logistica/inventario'
    },
    {
      title: 'Generar Reporte',
      description: 'Crear reportes personalizados',
      icon: DocumentTextIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      href: '/dashboard/logistica/reportes'
    },
    {
      title: 'Analíticas',
      description: 'Ver métricas detalladas',
      icon: ChartBarIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      href: '/dashboard/logistica/analiticas'
    },
    {
      title: 'Gestionar Equipos',
      description: 'Administrar personal logístico',
      icon: UserGroupIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      href: '/dashboard/logistica/equipos'
    },
    {
      title: 'Configuración',
      description: 'Ajustar parámetros del sistema',
      icon: CogIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      href: '/dashboard/logistica/configuracion'
    }
  ];

  const handleActionClick = (href: string) => {
    navigate(href);
  };

  return (
    <section className="mb-8">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Acciones Rápidas
        </h2>
        <p className="text-sm text-gray-600">
          Accesos directos a las operaciones más frecuentes del sistema logístico.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => handleActionClick(action.href)}
            className={`relative group text-left p-6 rounded-lg border border-gray-200 transition-all duration-200 ${action.bgColor} hover:shadow-md hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <div className={`flex-shrink-0 rounded-md p-2 bg-white shadow-sm`}>
                    <action.icon className={`h-5 w-5 ${action.color}`} />
                  </div>
                  {action.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {action.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                  {action.title}
                </h3>
                <p className="text-xs text-gray-600 group-hover:text-gray-500">
                  {action.description}
                </p>
              </div>
              
              <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>

            {/* Hover effect overlay */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent to-white opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
          </button>
        ))}
      </div>

      {/* Additional quick stats */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Centro de Control Rápido
            </h3>
            <p className="text-sm text-blue-700 mb-4">
              Accede a las funciones más utilizadas desde un solo lugar.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                23 movimientos pendientes
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                5 entregas programadas hoy
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                12 operaciones completadas
              </span>
            </div>
          </div>
          
          <div className="hidden lg:block">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleActionClick('/dashboard/logistica/registrar-nuevo-movimiento')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Nuevo Movimiento
              </button>
              
              <button
                onClick={() => handleActionClick('/dashboard/logistica/reportar-incidencia')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                Reportar Incidencia
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};