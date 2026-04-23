/**
 * useWakeLock.ts
 *
 * Hook de React que utiliza la Screen Wake Lock API para evitar que
 * la pantalla del dispositivo se apague mientras el usuario está cocinando.
 *
 * Comportamiento:
 * - Adquiere el lock cuando `active` es `true`.
 * - Libera el lock cuando `active` pasa a `false` o el componente se desmonta.
 * - Re-adquiere el lock automáticamente al volver a la pestaña, ya que el
 *   navegador libera el lock cuando la pestaña pasa a segundo plano.
 * - Si el navegador no soporta la API o el sistema rechaza la solicitud
 *   (ej. batería baja), falla silenciosamente.
 *
 * @param active - `true` para mantener la pantalla encendida, `false` para liberar.
 */

import { useEffect, useRef } from 'react';

export function useWakeLock(active: boolean): void {
  const lockRef = useRef<WakeLockSentinel | null>(null);

  /** Solicita el wake lock de pantalla. */
  const acquire = async (): Promise<void> => {
    if (!active) return;
    if (!('wakeLock' in navigator)) return; // API no soportada (ej. Firefox desktop)
    try {
      lockRef.current = await navigator.wakeLock.request('screen');
    } catch {
      // El sistema puede rechazar la solicitud (batería baja, modo ahorro, etc.) — no es crítico
    }
  };

  /** Libera el wake lock si existe. */
  const release = (): void => {
    lockRef.current?.release().catch(() => {});
    lockRef.current = null;
  };

  // Adquirir o liberar cuando cambia `active`
  useEffect(() => {
    if (active) acquire(); else release();
    return release; // siempre liberar al desmontar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Re-adquirir cuando la pestaña vuelve a estar visible
  // (el navegador libera el lock automáticamente al ocultarla)
  useEffect(() => {
    const handleVisibility = (): void => {
      if (document.visibilityState === 'visible' && active) acquire();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}
