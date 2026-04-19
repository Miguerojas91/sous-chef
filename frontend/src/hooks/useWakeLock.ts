import { useEffect, useRef } from 'react';

/**
 * Mantiene la pantalla encendida mientras `active` sea true.
 * Usa la Wake Lock API. Si el navegador no la soporta, no hace nada.
 * Vuelve a adquirir el lock automáticamente si la pestaña se oculta y reaparece.
 */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  const acquire = async () => {
    if (!active) return;
    if (!('wakeLock' in navigator)) return;
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // El sistema puede rechazarlo (batería baja, etc.) — no es crítico
    }
  };

  const release = () => {
    lockRef.current?.release().catch(() => {});
    lockRef.current = null;
  };

  // Adquirir/liberar cuando cambia `active`
  useEffect(() => {
    if (active) {
      acquire();
    } else {
      release();
    }
    return release;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Re-adquirir cuando la pestaña vuelve a ser visible (el lock se pierde al ocultar la pestaña)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && active) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
