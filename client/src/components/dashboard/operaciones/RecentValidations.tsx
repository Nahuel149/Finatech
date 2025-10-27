import React from 'react';
import { useDashboardNotifications } from '../../../hooks';
import { DashboardNotification } from '../../../types';

const timeAgo = (iso?: string) => {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? 's' : ''}`;
};

const severityStyles = (severity?: string) => {
  switch (severity) {
    case 'error':
      return { box: 'bg-red-100', icon: 'fa-times-circle', color: 'text-danger' };
    case 'warning':
      return { box: 'bg-orange-100', icon: 'fa-exclamation-triangle', color: 'text-orange-600' };
    case 'success':
      return { box: 'bg-green-100', icon: 'fa-check-circle', color: 'text-green-600' };
    case 'info':
    default:
      return { box: 'bg-blue-100', icon: 'fa-info-circle', color: 'text-blue-600' };
  }
};

export const RecentValidations: React.FC = () => {
  const { notifications, loading, error, refresh } = useDashboardNotifications();

  return (
    <section id="recent-validations" className="mb-8">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">Validaciones recientes</h2>
              <p className="text-gray-600">Alertas y notificaciones importantes</p>
            </div>
            <button className="text-primary hover:underline font-medium">Ver todas</button>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {loading && (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-6 flex items-center">
                  <div className="w-10 h-10 rounded-lg mr-4 bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 w-48 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse mb-2" />
                    <div className="h-3 w-64 rounded bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 animate-pulse" />
                  </div>
                </div>
              ))}
            </>
          )}

          {!loading && !error && notifications.map((n: DashboardNotification) => {
            const s = severityStyles(n.severity);
            return (
              <div key={n.id} className="p-6 flex items-center">
                <div className={`w-10 h-10 ${s.box} rounded-lg flex items-center justify-center mr-4`}>
                  <i className={`fa-solid ${s.icon} ${s.color}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-text-primary">{n.title}</h3>
                      {n.description && <p className="text-gray-600 text-sm">{n.description}</p>}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{timeAgo(n.createdAt)}</div>
                      {n.actionLabel && <button className="text-primary text-sm hover:underline">{n.actionLabel}</button>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {!loading && error && (
            <div className="p-6 flex items-center">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                <i className="fa-solid fa-times-circle text-danger"></i>
              </div>
              <div className="flex-1 flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-text-primary">Error al cargar notificaciones</h3>
                  <p className="text-gray-600 text-sm">Verifica la conexión y vuelve a intentar</p>
                </div>
                <button onClick={() => refresh()} className="text-primary text-sm hover:underline">Reintentar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};