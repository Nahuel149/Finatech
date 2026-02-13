import React, { useEffect, useState } from 'react';
import { DashboardNavbar } from '../operaciones/Navbar';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui/Alert';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  'view-balances': 'Consultar saldos y resúmenes generales.',
  'access-treasury': 'Acceder a la sección de Tesorería.',
  'access-transfers': 'Crear y revisar transferencias.',
  'manage-treasury': 'Gestionar movimientos y conciliaciones de tesorería.',
  'manage-market-rates': 'Actualizar y administrar tipos de cambio.',
  'manage-notifications': 'Configurar y marcar notificaciones.',
  'access-operations': 'Acceder a la seccion de Operaciones.',
  'access-logistics': 'Acceder a la sección de Logística.',
  'manage-logistics': 'Editar órdenes, incidentes y movimientos logísticos.',
  'treasury:receptions': 'Gestionar recepciones de tesorería.',
  'treasury:receptions:revert': 'Revertir recepciones de tesorería.',
  'admin:manage-permissions': 'Administrar permisos de usuarios.',
};
const PERMISSION_LABELS: Record<string, string> = {
  'view-balances': 'Ver balances',
  'access-treasury': 'Acceso a Tesoreria',
  'access-transfers': 'Acceso a transferencias',
  'manage-treasury': 'Gestionar tesoreria',
  'manage-market-rates': 'Gestionar tipo de cambio',
  'manage-notifications': 'Gestionar notificaciones',
  'access-operations': 'Acceso a Operaciones',
  'access-logistics': 'Acceso a Logistica',
  'manage-logistics': 'Gestionar Logistica',
  'treasury:receptions': 'Recepciones de tesoreria',
  'treasury:receptions:revert': 'Revertir recepciones',
  'admin:manage-permissions': 'Administrar permisos',
};
export const ProfilePage: React.FC = () => {
  const { user, loading, error, refresh } = useCurrentUser();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user && !loading && !error) {
      refresh().catch(() => {});
    }
  }, [user, loading, error, refresh]);

  const permissions = user?.permissions || [];

  return (
    <div className="bg-gray-50 min-h-screen text-sm lg:text-base flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />

      <main className="pt-28 px-4 lg:px-8 pb-24 max-w-5xl mx-auto flex-1 w-full">
        <header className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Perfil</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Tu información</h1>
          <p className="text-gray-600 mt-2">Datos de acceso y permisos asignados en la plataforma.</p>
        </header>

        {error && (
          <div className="mb-6">
            <Alert type="error" title="No pudimos cargar tu perfil" message={error.message || 'Intentá nuevamente en unos segundos.'} />
          </div>
        )}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Datos personales</h2>
              <p className="text-gray-600 text-sm">Información visible para tu cuenta y reportes.</p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
              {user?.email || 'Correo no disponible'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Nombre completo</span>
              <span className="text-lg font-semibold text-text-primary">
                {loading ? 'Cargando...' : user?.fullName || 'Sin nombre configurado'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">Correo</span>
              <span className="text-lg font-semibold text-text-primary break-all">
                {loading ? 'Cargando...' : user?.email || 'No informado'}
              </span>
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Permisos</h2>
                <p className="text-gray-600 text-sm">Accesos habilitados para tu usuario.</p>
              </div>
              <span className="text-xs text-gray-500">
              {permissions.length ? `${permissions.length} permiso(s)` : 'Sin permisos declarados'}
            </span>
          </div>

            {permissions.length === 0 ? (
              <div className="text-gray-500 text-sm">No tenés permisos adicionales asignados.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {permissions.map((permission) => (
                  <span
                    key={permission}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gray-100 text-text-primary border border-gray-200"
                    title={PERMISSION_DESCRIPTIONS[permission] || 'Permiso asignado a tu usuario.'}
                  >
                    <i className="fa-solid fa-shield-halved mr-2 text-primary" />
                    {PERMISSION_LABELS[permission] || 'Permiso adicional'}
                  </span>
                ))}
              </div>
            )}
        </section>
      </main>

      <Footer />
    </div>
  );
};
