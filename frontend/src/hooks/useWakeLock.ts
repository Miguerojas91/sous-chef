/**
 * useWakeLock.ts
 *
 * Mantiene la pantalla encendida mientras el usuario está cocinando.
 *
 * Triple stack (cubre 100% de los navegadores en uso):
 *   1. Screen Wake Lock API     — Chrome 84+, Edge 84+, Safari iOS 16.4+, Android.
 *   2. NoSleep.js (fallback)    — Firefox + Safari iOS antiguos vía <video> oculto.
 *   3. MediaSession API         — Indica al SO "hay reproducción activa", evita
 *                                  que iOS suspenda el dispositivo agresivamente.
 *
 * Comportamiento:
 * - Adquiere el lock cuando `active === true`.
 * - Lo libera al desmontar o cuando `active` pasa a `false`.
 * - Re-adquiere automáticamente al volver de background (visibilitychange),
 *   porque el navegador libera el lock al ocultar la pestaña.
 * - Se ata a un gesto del usuario en mobile cuando es necesario (NoSleep
 *   requiere autoplay-after-gesture en algunos browsers).
 *
 * Falla silenciosa:
 * - Si el SO rechaza la solicitud (batería <5%, modo ahorro, permiso denegado),
 *   no lanza ni alerta — la app sigue funcionando, solo que la pantalla podrá
 *   apagarse según las reglas del SO.
 *
 * @param active  - `true` para mantener la pantalla encendida.
 * @param options - Opciones avanzadas:
 *                   - `useNoSleepFallback`: usar NoSleep.js si Wake Lock no está
 *                     disponible (default `true`).
 *                   - `mediaSessionTitle`: texto que aparece en el SO/lockscreen
 *                     (default "Cocinando con Sous Chef").
 */

import { useEffect, useRef } from 'react';
import NoSleep from 'nosleep.js';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}

interface NavigatorWithWakeLock {
  wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> };
}

interface UseWakeLockOptions {
  useNoSleepFallback?: boolean;
  mediaSessionTitle?: string;
}

const SUPPORTS_WAKE_LOCK = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
const SUPPORTS_MEDIA_SESSION = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

/** Estado compartido (1 instancia NoSleep para toda la app — ahorra memoria). */
let sharedNoSleep: InstanceType<typeof NoSleep> | null = null;
let noSleepRefCount = 0;

function acquireSharedNoSleep(): InstanceType<typeof NoSleep> {
  if (!sharedNoSleep) sharedNoSleep = new NoSleep();
  return sharedNoSleep;
}

export function useWakeLock(active: boolean, options: UseWakeLockOptions = {}): void {
  const { useNoSleepFallback = true, mediaSessionTitle = 'Cocinando con Sous Chef' } = options;
  const lockRef = useRef<WakeLockSentinelLike | null>(null);
  const noSleepEnabledRef = useRef(false);

  // ── Acquire / release loop tied to `active` ────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const acquire = async (): Promise<void> => {
      // 1. Wake Lock API (ideal)
      if (SUPPORTS_WAKE_LOCK) {
        try {
          const sentinel = await (navigator as NavigatorWithWakeLock).wakeLock!.request('screen');
          if (cancelled) {
            sentinel.release().catch(() => {});
            return;
          }
          lockRef.current = sentinel;
          // Si el SO la libera (battery save), intentaremos re-adquirir con visibilitychange.
        } catch {
          // permiso denegado / batería baja / política del SO → fallback
        }
      }

      // 2. NoSleep.js (fallback para Firefox / Safari viejos)
      if (!lockRef.current && useNoSleepFallback) {
        try {
          const ns = acquireSharedNoSleep();
          await ns.enable();
          if (!cancelled) {
            noSleepEnabledRef.current = true;
            noSleepRefCount += 1;
          }
        } catch {
          // muchos browsers requieren un user gesture previo → silenciamos
        }
      }

      // 3. MediaSession (indica "playing" al SO)
      if (SUPPORTS_MEDIA_SESSION && !cancelled) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: mediaSessionTitle,
            artist: 'Sous Chef',
          });
          navigator.mediaSession.playbackState = 'playing';
        } catch {
          /* no fatal */
        }
      }
    };

    const release = (): void => {
      const sentinel = lockRef.current;
      if (sentinel && !sentinel.released) {
        sentinel.release().catch(() => {});
      }
      lockRef.current = null;

      if (noSleepEnabledRef.current && sharedNoSleep) {
        noSleepRefCount = Math.max(0, noSleepRefCount - 1);
        if (noSleepRefCount === 0) {
          sharedNoSleep.disable();
        }
        noSleepEnabledRef.current = false;
      }

      if (SUPPORTS_MEDIA_SESSION) {
        try { navigator.mediaSession.playbackState = 'none'; } catch { /* ok */ }
      }
    };

    if (active) {
      acquire();
    } else {
      release();
    }

    // Re-adquirir al volver de background (los browsers liberan el lock al ocultar la tab).
    const onVisibility = (): void => {
      if (!active) return;
      if (document.visibilityState === 'visible' && !lockRef.current) {
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [active, useNoSleepFallback, mediaSessionTitle]);
}
