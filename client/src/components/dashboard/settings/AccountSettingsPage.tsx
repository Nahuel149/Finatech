import React, { useEffect, useState } from 'react';
import { DashboardNavbar } from '../operaciones/Navbar';
import { Footer } from '../operaciones/Footer';
import { Alert } from '../../ui';
import { useCurrentUser, primeCurrentUser } from '../../../hooks';
import { api, handleApiError } from '../../../utils';

type BannerType = 'success' | 'info' | 'warning' | 'error';

interface BannerState {
  type: BannerType;
  message: string;
}

export const AccountSettingsPage: React.FC = () => {
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');

  const [displayName, setDisplayName] = useState(user?.fullName || '');
  const [usernameSaving, setUsernameSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [twoFactorUpdating, setTwoFactorUpdating] = useState(false);

  const [banner, setBanner] = useState<BannerState | null>(null);

  useEffect(() => {
    if (user?.fullName) {
      setDisplayName(user.fullName);
    }
  }, [user?.fullName]);

  useEffect(() => {
    const nextTwoFactor =
      (user as unknown as { twoFactor?: { isEnabled?: boolean } } | null)?.twoFactor?.isEnabled ?? false;
    setTwoFactorEnabled(nextTwoFactor);
  }, [user]);

  const handleUsernameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setUsernameSaving(true);
    api
      .updateProfile({ fullName: displayName })
      .then((response) => {
        if (response?.profile) {
          primeCurrentUser(response.profile);
        }
        setBanner({
          type: 'success',
          message: 'Nombre de usuario actualizado correctamente.',
        });
      })
      .catch((err) => {
        const apiError = handleApiError(err);
        setBanner({
          type: 'error',
          message: apiError.message || 'No pudimos actualizar el nombre.',
        });
      })
      .finally(() => {
        setUsernameSaving(false);
      });
  };

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmPassword) {
      setBanner({
        type: 'error',
        message: 'La confirmación de la contraseña no coincide.',
      });
      return;
    }
    if (!currentPassword || !newPassword) {
      setBanner({
        type: 'error',
        message: 'Completá la contraseña actual y la nueva contraseña.',
      });
      return;
    }
    setPasswordSaving(true);
    api
      .changePassword({ currentPassword, newPassword })
      .then((response) => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (response?.profile) {
          primeCurrentUser(response.profile);
        }
        setBanner({
          type: 'success',
          message: 'Contraseña actualizada con éxito.',
        });
      })
      .catch((err) => {
        const apiError = handleApiError(err);
        setPasswordError(apiError.message || 'No pudimos actualizar la contraseña.');
        setBanner({
          type: 'error',
          message: apiError.message || 'No pudimos actualizar la contraseña.',
        });
      })
      .finally(() => {
        setPasswordSaving(false);
      });
  };

  const handleToggle2FA = () => {
    setTwoFactorUpdating(true);
    const nextState = !twoFactorEnabled;
    api
      .updateTwoFactor({ enabled: nextState })
      .then((response) => {
        const enabled = response?.profile?.twoFactor?.isEnabled ?? nextState;
        setTwoFactorEnabled(enabled);
        if (response?.profile) {
          primeCurrentUser(response.profile);
        }
        setBanner({
          type: 'success',
          message: `Autenticación en dos pasos ${enabled ? 'activada' : 'desactivada'}. Se enviará el código al correo configurado.`,
        });
      })
      .catch((err) => {
        const apiError = handleApiError(err);
        setBanner({
          type: 'error',
          message: apiError.message || 'No pudimos actualizar la autenticación en dos pasos.',
        });
      })
      .finally(() => {
        setTwoFactorUpdating(false);
      });
  };

  return (
    <div className="bg-gray-50 min-h-screen text-sm lg:text-base flex flex-col">
      <DashboardNavbar search={search} onSearchChange={setSearch} />

      <main className="pt-28 px-4 lg:px-8 pb-24 max-w-6xl mx-auto flex-1 w-full">
        <header className="mb-8">
          <p className="text-sm text-gray-500 mb-1">Configuración</p>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Seguridad de la cuenta</h1>
          <p className="text-gray-600 mt-2">
            Actualizá tus datos de acceso y administrá la autenticación en dos pasos por correo.
          </p>
        </header>

        {banner && (
          <div className="mb-6">
            <Alert
              type={banner.type}
              title={banner.type === 'error' ? 'Revisá la información' : 'Listo'}
              message={banner.message}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Nombre de usuario</h2>
                <p className="text-gray-600 text-sm">Mostramos este nombre en la cabecera y en tus reportes.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary">
                {user?.email || 'Correo no configurado'}
              </span>
            </div>
            <form className="space-y-4" onSubmit={handleUsernameSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="displayName">
                  Nombre visible
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ej: Nahuel Prueba"
                  autoComplete="name"
                  required
                />
              </div>
              <div className="flex flex-wrap gap-3 justify-between items-center">
                <p className="text-xs text-gray-500">Este cambio es inmediato para tus próximas sesiones.</p>
                <button
                  type="submit"
                  disabled={usernameSaving}
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {usernameSaving ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-floppy-disk mr-2" />
                      Guardar cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Autenticación en dos pasos</h2>
                <p className="text-gray-600 text-sm">
                  Enviamos un código al correo registrado para confirmar tus ingresos sensibles.
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs ${
                  twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {twoFactorEnabled ? 'Activa' : 'Desactivada'}
              </span>
            </div>
            <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div>
                <p className="text-sm font-medium text-text-primary">2FA por email</p>
                <p className="text-xs text-gray-600">
                  Protegemos el ingreso y cambios críticos enviando códigos a {user?.email || 'tu correo'}.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle2FA}
                disabled={twoFactorUpdating}
                className={`inline-flex items-center px-4 py-2 rounded-lg border ${
                  twoFactorEnabled
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                    : 'bg-white text-text-primary border-gray-200 hover:bg-gray-50'
                } transition-colors disabled:opacity-60`}
              >
                {twoFactorUpdating ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <i className={`fa-solid ${twoFactorEnabled ? 'fa-toggle-on' : 'fa-toggle-off'} mr-2`} />
                    {twoFactorEnabled ? 'Desactivar' : 'Activar'}
                  </>
                )}
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Te pediremos el código de verificación cada vez que cambies tu contraseña o inicies sesión desde un nuevo dispositivo.
            </p>
          </section>
        </div>

        <section className="mt-6 bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">Cambiar contraseña</h2>
              <p className="text-gray-600 text-sm">Usá una contraseña segura y diferente a otras plataformas.</p>
            </div>
          </div>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handlePasswordSubmit}>
            {passwordError && (
              <div className="md:col-span-2">
                <Alert type="error" title="Error al actualizar" message={passwordError} />
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="currentPassword">
                Contraseña actual
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoComplete="current-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="newPassword">
                Nueva contraseña
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoComplete="new-password"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="confirmPassword">
                Confirmar nueva contraseña
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
                <li>Usá al menos 8 caracteres combinando letras, números y símbolos.</li>
                <li>No reutilices contraseñas de otros servicios.</li>
              </ul>
              <button
                type="submit"
                disabled={passwordSaving}
                className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {passwordSaving ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin mr-2" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-lock mr-2" />
                    Actualizar contraseña
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </main>

      <Footer />
    </div>
  );
};
