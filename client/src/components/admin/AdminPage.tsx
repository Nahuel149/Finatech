import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminPermissionDefinition, AdminUser } from '../../types';
import { api } from '../../utils';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../ui/Button';

const PERMISSION_ORDER = [
  'view-balances',
  'access-treasury',
  'access-transfers',
  'manage-treasury',
  'manage-notifications',
  'access-logistics',
  'manage-logistics',
  'treasury:receptions',
  'treasury:receptions:revert',
];

const PERMISSION_LABELS: Record<string, AdminPermissionDefinition> = {
  'view-balances': {
    key: 'view-balances',
    label: 'Ver balances',
    description: 'Lectura de saldos generales y widget de balances.',
  },
  'access-treasury': {
    key: 'access-treasury',
    label: 'Acceso a Tesoreria',
    description: 'Permite entrar a las pantallas de tesoreria.',
  },
  'access-transfers': {
    key: 'access-transfers',
    label: 'Acceso a transferencias',
    description: 'Habilita el flujo de transferencias y sus detalles.',
  },
  'manage-treasury': {
    key: 'manage-treasury',
    label: 'Gestionar tesoreria',
    description: 'Crear, aprobar y editar movimientos de tesoreria.',
  },
  'manage-notifications': {
    key: 'manage-notifications',
    label: 'Gestionar notificaciones',
    description: 'Crear, editar o borrar avisos para el equipo.',
  },
  'access-logistics': {
    key: 'access-logistics',
    label: 'Acceso a logistica',
    description: 'Lectura de ordenes y operaciones de logistica.',
  },
  'manage-logistics': {
    key: 'manage-logistics',
    label: 'Gestionar logistica',
    description: 'Modificar estados, adjuntar evidencias y resolver incidencias.',
  },
  'treasury:receptions': {
    key: 'treasury:receptions',
    label: 'Recepciones de tesoreria',
    description: 'Puede procesar recepciones de fondos.',
  },
  'treasury:receptions:revert': {
    key: 'treasury:receptions:revert',
    label: 'Revertir recepciones',
    description: 'Puede revertir una recepcion cargada.',
  },
};

const normalizePermission = (permission?: string) =>
  (permission || '').trim().toLowerCase();

const buildPermissionCatalog = (keys: string[]): AdminPermissionDefinition[] =>
  keys.map((key) => ({
    key,
    label: PERMISSION_LABELS[key]?.label || key,
    description: PERMISSION_LABELS[key]?.description,
  }));

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { user, loading: userLoading, refresh } = useCurrentUser();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [managedPermissions, setManagedPermissions] = useState<string[]>(PERMISSION_ORDER);
  const [draftPermissions, setDraftPermissions] = useState<Record<string, Set<string>>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [updatingMessengerId, setUpdatingMessengerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [fxBuy, setFxBuy] = useState<string>('');
  const [fxSell, setFxSell] = useState<string>('');
  const [fxSide, setFxSide] = useState<'buy' | 'sell'>('sell');
  const [fxDate, setFxDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fxLoading, setFxLoading] = useState<boolean>(false);
  const [fxError, setFxError] = useState<string | null>(null);
  const [fxSuccess, setFxSuccess] = useState<string | null>(null);

  const currentUserPermissions = useMemo(() => {
    const list = user?.permissions;
    if (Array.isArray(list)) {
      return list.map(normalizePermission);
    }
    return [];
  }, [user]);

  const hasAdminAccess = useMemo(
    () => currentUserPermissions.includes('admin:manage-permissions'),
    [currentUserPermissions],
  );
  const canManageMarketRates = useMemo(
    () => currentUserPermissions.includes('manage-market-rates'),
    [currentUserPermissions],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [permissionResponse, usersResponse] = await Promise.all([
        api.getAdminPermissions().catch(() => null),
        api.getAdminUsers(),
      ]);

      const permissionKeys = permissionResponse?.permissions?.length
        ? permissionResponse.permissions.map(normalizePermission)
        : PERMISSION_ORDER;

      setManagedPermissions(permissionKeys);

      const fetchedUsers: AdminUser[] = usersResponse?.users ?? [];
      setUsers(fetchedUsers);

      const nextDrafts: Record<string, Set<string>> = {};
      fetchedUsers.forEach((item: AdminUser) => {
        const normalizedPermissions = (item.permissions || [])
          .map((permission: string) => normalizePermission(permission))
          .filter(Boolean);

        nextDrafts[item.id] = new Set(normalizedPermissions);
      });
      setDraftPermissions(nextDrafts);
    } catch (err: any) {
      setError(err.message || 'No pudimos cargar la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate('/login/admin');
    }
  }, [userLoading, user, navigate]);

  useEffect(() => {
    if (!userLoading && user && hasAdminAccess) {
      loadData();
    }
  }, [userLoading, user, hasAdminAccess, loadData]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((entry) => {
      if (filterVerified === 'verified' && !entry.isVerified) return false;
      if (filterVerified === 'unverified' && entry.isVerified) return false;
      if (!term) return true;
      return (
        entry.fullName.toLowerCase().includes(term) ||
        entry.email.toLowerCase().includes(term)
      );
    });
  }, [users, search, filterVerified]);

  const togglePermission = (userId: string, permission: string) => {
    const normalized = normalizePermission(permission);
    setSuccess(null);
    setDraftPermissions((prev) => {
      const next = { ...prev };
      const current = new Set(next[userId] ? Array.from(next[userId]) : []);
      if (current.has(normalized)) {
        current.delete(normalized);
      } else {
        current.add(normalized);
      }
      next[userId] = current;
      return next;
    });
  };

  const resetDraftForUser = (userId: string) => {
    const sourceUser = users.find((entry) => entry.id === userId);
    const nextDraft = new Set(
      (sourceUser?.permissions || []).map((permission) => normalizePermission(permission)).filter(Boolean),
    );
    setDraftPermissions((prev) => ({ ...prev, [userId]: nextDraft }));
    setSuccess(null);
  };

  const saveUserPermissions = async (userId: string) => {
    setSavingUserId(userId);
    setError(null);
    setSuccess(null);

    const permissions = Array.from(draftPermissions[userId] || []);

    try {
      const response = await api.updateUserPermissions(userId, permissions);
      const updatedUser = response?.user || users.find((entry) => entry.id === userId);
      const normalizedPermissions = (updatedUser?.permissions || permissions).map(normalizePermission);

      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === userId
            ? {
                ...entry,
                ...updatedUser,
                permissions: normalizedPermissions,
              }
            : entry,
        ),
      );

      setDraftPermissions((prev) => ({
        ...prev,
        [userId]: new Set(normalizedPermissions),
      }));

      if (user?.id === userId) {
        await refresh();
      }

      setSuccess('Permisos actualizados.');
    } catch (err: any) {
      setError(err.message || 'No pudimos guardar los permisos.');
    } finally {
      setSavingUserId(null);
    }
  };

  const updateMessenger = async (userId: string, enabled: boolean) => {
    setUpdatingMessengerId(userId);
    setError(null);
    setSuccess(null);
    try {
      const response = await api.updateMessengerFlag(userId, enabled);
      const updatedUser = response?.user || users.find((entry) => entry.id === userId);
      setUsers((prev) =>
        prev.map((entry) =>
          entry.id === userId
            ? {
                ...entry,
                ...updatedUser,
                isMessenger: enabled,
              }
            : entry,
        ),
      );
      if (user?.id === userId) {
        await refresh();
      }
      setSuccess(enabled ? 'Mensajero habilitado.' : 'Mensajero removido.');
    } catch (err: any) {
      setError(err.message || 'No pudimos actualizar el mensajero.');
    } finally {
      setUpdatingMessengerId(null);
    }
  };

  const permissionCatalog = useMemo(
    () => buildPermissionCatalog(managedPermissions),
    [managedPermissions],
  );

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login/admin');
    } catch {
      navigate('/login/admin');
    }
  };

  const parseNumberInput = (value: string) => {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const loadMarketRate = useCallback(async () => {
    if (!canManageMarketRates) {
      return;
    }
    setFxLoading(true);
    setFxError(null);
    try {
      const response = await api.getMarketRate({ baseAsset: 'USD', quoteAsset: 'ARS' });
      const override = (response as any)?.override;
      if (override) {
        setFxBuy(
          override.buyRate !== undefined && override.buyRate !== null
            ? String(override.buyRate)
            : override.rate
              ? String(override.rate)
              : ''
        );
        setFxSell(
          override.sellRate !== undefined && override.sellRate !== null
            ? String(override.sellRate)
            : override.rate
              ? String(override.rate)
              : ''
        );
        setFxSide(override.selectedSide === 'buy' ? 'buy' : 'sell');
        if (override.validFrom) {
          setFxDate(String(override.validFrom).slice(0, 10));
        }
      }
      setFxSuccess(null);
    } catch (err: any) {
      setFxError(err.message || 'No pudimos obtener la tasa actual.');
    } finally {
      setFxLoading(false);
    }
  }, [canManageMarketRates]);

  const handleFetchOfficial = useCallback(async () => {
    setFxLoading(true);
    setFxError(null);
    setFxSuccess(null);
    try {
      const response = await api.fetchOfficialRate({ baseAsset: 'USD', quoteAsset: 'ARS' });
      const quote = (response as any)?.quote;
      if (quote?.buyRate && quote?.sellRate) {
        setFxBuy(String(quote.buyRate));
        setFxSell(String(quote.sellRate));
        setFxSide('sell');
        setFxSuccess('Cotización oficial cargada desde dolarhoy.com.');
      } else {
        setFxError('No recibimos valores válidos desde el proveedor.');
      }
    } catch (err: any) {
      setFxError(err.message || 'No pudimos obtener la cotización oficial.');
    } finally {
      setFxLoading(false);
    }
  }, []);

  const handleSaveFx = useCallback(async () => {
    if (!canManageMarketRates) {
      setFxError('No tenés permiso para actualizar el tipo de cambio.');
      return;
    }
    setFxLoading(true);
    setFxError(null);
    setFxSuccess(null);
    const buy = parseNumberInput(fxBuy);
    const sell = parseNumberInput(fxSell);
    if (!buy && !sell) {
      setFxError('Ingresá al menos precio de compra o venta.');
      setFxLoading(false);
      return;
    }
    if (fxSide === 'buy' && !buy) {
      setFxError('Seleccionaste publicar compra, pero falta el valor de compra.');
      setFxLoading(false);
      return;
    }
    if (fxSide === 'sell' && !sell) {
      setFxError('Seleccionaste publicar venta, pero falta el valor de venta.');
      setFxLoading(false);
      return;
    }
    const selectedValue = fxSide === 'buy' ? buy || sell : sell || buy;
    if (!selectedValue) {
      setFxError('Seleccioná un valor válido para publicar.');
      setFxLoading(false);
      return;
    }
    try {
      const payload: any = {
        baseAsset: 'USD',
        quoteAsset: 'ARS',
        selectedSide: fxSide,
        rate: selectedValue,
      };
      if (buy) payload.buyRate = buy;
      if (sell) payload.sellRate = sell;
      if (fxDate) {
        const date = new Date(fxDate);
        if (!Number.isNaN(date.getTime())) {
          payload.validFrom = date.toISOString();
        }
      }
      await api.saveMarketRate(payload);
      setFxSuccess('Tipo de cambio guardado.');
      loadMarketRate();
    } catch (err: any) {
      setFxError(err.message || 'No pudimos guardar el tipo de cambio.');
    } finally {
      setFxLoading(false);
    }
  }, [canManageMarketRates, fxBuy, fxSell, fxSide, fxDate, loadMarketRate]);

  useEffect(() => {
    if (hasAdminAccess && canManageMarketRates) {
      loadMarketRate();
    }
  }, [hasAdminAccess, canManageMarketRates, loadMarketRate]);

  if (!hasAdminAccess && !userLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <Alert
            type="error"
            title="Acceso denegado"
            message="Necesitas el permiso admin:manage-permissions para usar este panel."
          />
          <Button onClick={() => navigate('/login/admin')} variant="primary" fullWidth>
            Ir al login de admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Seguridad</p>
            <h1 className="text-2xl font-bold text-slate-900">Administrar permisos</h1>
            <p className="text-sm text-slate-600">
              Ajusta que puede ver y operar cada usuario.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/dashboard')} size="sm">
              Ir al dashboard
            </Button>
            <Button variant="secondary" onClick={handleLogout} size="sm">
              Cerrar sesion
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        {canManageMarketRates && (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">Tipo de cambio USD/ARS</p>
                <p className="text-xs text-slate-600">
                  Definí compra/venta manualmente o traé el valor oficial y elegí cuál publicar hacia la app.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={loadMarketRate} loading={fxLoading}>
                  Recargar actual
                </Button>
                <Button variant="secondary" size="sm" onClick={handleFetchOfficial} loading={fxLoading}>
                  Traer oficial (dolarhoy.com)
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveFx} loading={fxLoading}>
                  Guardar tipo de cambio
                </Button>
              </div>
            </div>

            {fxError && (
              <Alert type="error" message={fxError} onClose={() => setFxError(null)} />
            )}
            {fxSuccess && (
              <Alert type="success" message={fxSuccess} onClose={() => setFxSuccess(null)} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
                Compra (USD → ARS)
                <input
                  type="text"
                  value={fxBuy}
                  onChange={(event) => setFxBuy(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  placeholder="0,00"
                  disabled={fxLoading}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
                Venta (USD → ARS)
                <input
                  type="text"
                  value={fxSell}
                  onChange={(event) => setFxSell(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  placeholder="0,00"
                  disabled={fxLoading}
                />
              </label>
              <div className="flex flex-col gap-2 text-sm text-slate-800">
                <span className="font-medium">Publicar</span>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={fxSide === 'buy'}
                    onChange={() => setFxSide('buy')}
                    disabled={fxLoading}
                  />
                  <span>Usar precio de compra</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    checked={fxSide === 'sell'}
                    onChange={() => setFxSide('sell')}
                    disabled={fxLoading}
                  />
                  <span>Usar precio de venta</span>
                </label>
              </div>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-800">
                Vigencia
                <input
                  type="date"
                  value={fxDate}
                  onChange={(event) => setFxDate(event.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                  disabled={fxLoading}
                />
                <span className="text-xs text-slate-500">
                  Se aplica a partir de esta fecha (hora local).
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">Permisos disponibles</p>
            <p className="text-xs text-slate-600">
              Esta lista esta sincronizada con el backend /api/admin/permissions.
            </p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o email"
              className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <select
              value={filterVerified}
              onChange={(event) =>
                setFilterVerified(event.target.value as 'all' | 'verified' | 'unverified')
              }
              className="w-full md:w-48 px-3 py-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="all">Todos los usuarios</option>
              <option value="verified">Solo verificados</option>
              <option value="unverified">Solo sin verificar</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 text-center text-slate-600">
            No encontramos usuarios con ese filtro.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((entry) => {
              const currentDraft = draftPermissions[entry.id] || new Set<string>();
              return (
                <div
                  key={entry.id}
                  className="bg-white border border-slate-200 rounded-lg shadow-sm p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-slate-900">{entry.fullName}</p>
                      <p className="text-sm text-slate-600">{entry.email}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                          {entry.permissions?.length ?? 0} permisos
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.isVerified
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {entry.isVerified ? 'Verificado' : 'No verificado'}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                            entry.isMessenger ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {entry.isMessenger ? 'Mensajero' : 'Sin mensajero'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetDraftForUser(entry.id)}
                      >
                        Deshacer cambios
                      </Button>
                      <Button
                        variant={entry.isMessenger ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => updateMessenger(entry.id, !entry.isMessenger)}
                        loading={updatingMessengerId === entry.id}
                      >
                        {entry.isMessenger ? 'Quitar de mensajeros' : 'Agregar a mensajeros'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => saveUserPermissions(entry.id)}
                        loading={savingUserId === entry.id}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {permissionCatalog.map((permission) => (
                      <label
                        key={`${entry.id}-${permission.key}`}
                        className="flex items-start gap-3 p-3 border border-slate-200 rounded-md hover:border-primary/60 transition-colors cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded"
                          checked={currentDraft.has(permission.key)}
                          onChange={() => togglePermission(entry.id, permission.key)}
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{permission.label}</p>
                          {permission.description && (
                            <p className="text-xs text-slate-600">{permission.description}</p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
