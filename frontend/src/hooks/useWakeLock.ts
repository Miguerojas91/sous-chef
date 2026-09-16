/**
 * Mantiene la pantalla encendida mientras se cocina.
 *
 * - Screen Wake Lock API: Chrome/Edge 84+, Safari iOS 16.4+, Android.
 * - NoSleep.js (<video> oculto) para Firefox y Safari iOS antiguos.
 * - MediaSession en "playing" para que iOS no suspenda el dispositivo.
 *
 * El navegador libera el lock al ocultar la pestaña, por eso se vuelve a pedir
 * en visibilitychange. Si el SO lo rechaza (ahorro de batería, permiso) falla
 * en silencio y la pantalla se apaga según las reglas del SO.
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

/** Una sola instancia de NoSleep para toda la app, con conteo de referencias. */
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

  useEffect(() => {
    let cancelled = false;

    const acquire = async (): Promise<void> => {
      if (SUPPORTS_WAKE_LOCK) {
        try {
          const sentinel = await (navigator as NavigatorWithWakeLock).wakeLock!.request('screen');
          if (cancelled) {
            sentinel.release().catch(() => {});
            return;
          }
          lockRef.current = sentinel;
          // Si el SO lo libera (ahorro de batería), visibilitychange lo vuelve a pedir.
        } catch {
          // permiso denegado, batería baja o política del SO: se usa NoSleep
        }
      }

      if (!lockRef.current && useNoSleepFallback) {
        try {
          const ns = acquireSharedNoSleep();
          await ns.enable();
          if (!cancelled) {
            noSleepEnabledRef.current = true;
            noSleepRefCount += 1;
          }
        } catch {
          // muchos navegadores exigen un gesto previo del usuario
        }
      }

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
