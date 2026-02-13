import React, { useEffect, useRef } from 'react';

interface GoogleLoginButtonProps {
  clientId?: string | null;
  onCredential: (credential: string) => void;
  onUnavailable?: (message: string) => void;
  isLoading?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  clientId,
  onCredential,
  onUnavailable,
  isLoading = false,
  text = 'continue_with',
}) => {
  const buttonContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!clientId) {
      onUnavailable?.('Google Sign-In no está configurado. Contactá al administrador.');
      return;
    }

    let timeoutId: number | null = null;
    let attempts = 0;
    const maxAttempts = 50;
    let cancelled = false;

    const initialize = () => {
      if (cancelled) {
        return;
      }

      const googleIdentity = window.google?.accounts?.id;
      if (!googleIdentity) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          onUnavailable?.('Google Sign-In no está disponible. Verificá tu conexión e intentá de nuevo.');
          return;
        }
        timeoutId = window.setTimeout(initialize, 100);
        return;
      }

      try {
        googleIdentity.initialize({
          client_id: clientId,
          callback: (response: { credential?: string }) => {
            if (!response?.credential) {
              onUnavailable?.('No recibimos credenciales de Google. Intentá de nuevo.');
              return;
            }
            onCredential(response.credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        if (buttonContainerRef.current) {
          buttonContainerRef.current.innerHTML = '';
          const buttonWidth = Math.max(buttonContainerRef.current.offsetWidth || 320, 240);
          googleIdentity.renderButton(buttonContainerRef.current, {
            theme: 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            width: buttonWidth,
            locale: 'es',
          });
        }
      } catch (_error) {
        onUnavailable?.('Error al inicializar Google Sign-In. Intentá de nuevo.');
      }
    };

    initialize();

    return () => {
      cancelled = true;
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [clientId, onCredential, onUnavailable, text]);

  return (
    <div className="px-4 pb-4 sm:px-6 sm:pb-6">
      {/* Separator */}
      <div className="relative my-4 sm:my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-xs sm:text-sm">
          <span className="px-2 bg-white text-gray-500">o</span>
        </div>
      </div>

      <div className="relative">
        <div className={`${isLoading ? 'opacity-60 pointer-events-none' : ''}`}>
          <div ref={buttonContainerRef} />
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-lg">
            <span className="inline-flex items-center text-xs sm:text-sm text-gray-700">
              <i className="fa-solid fa-spinner fa-spin mr-2" />
              Conectando con Google...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
