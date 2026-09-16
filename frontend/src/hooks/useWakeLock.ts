/**
 * Mantiene la pantalla encendida mientras se cocina. Es el único dueño del
 * wake lock, de NoSleep y de `mediaSession.playbackState` en la app.
 *
 * - Screen Wake Lock API: Chrome/Edge 84+, Safari iOS 16.4+, Android.
 * - NoSleep.js (<video> oculto) para Firefox y Safari iOS antiguos.
 * - MediaSession en "playing" para que iOS no suspenda el dispositivo ni el audio.
 *
 * El navegador libera el lock al ocultar la pestaña, por eso se vuelve a pedir
 * en visibilitychange. Si el SO lo rechaza (ahorro de batería, permiso) falla
 * en silencio y la pantalla se apaga según las reglas del SO.
 */

import { useEffect, useRef } from 'react';
import NoSleep from 'nosleep.js';

interface UseWakeLockOptions {
  useNoSleepFallback?: boolean;
  mediaSessionTitle?: string;
}

const SUPPORTS_WAKE_LOCK = typeof navigator !== 'undefined' && 'wakeLock' in navigator;
const SUPPORTS_MEDIA_SESSION = typeof navigator !== 'undefined' && 'mediaSession' in navigator;

// Una sola instancia de NoSleep para toda la app, con conteo de referencias:
// dos <video> en bucle gastan batería y el primero en soltar apagaría al otro.
let sharedNoSleep: NoSleep | null = null;
let noSleepRefCount = 0;

function retainNoSleep(): NoSleep {
  if (!sharedNoSleep) sharedNoSleep = new NoSleep();
  noSleepRefCount += 1;
  return sharedNoSleep;
}

function releaseNoSleep(): void {
  noSleepRefCount = Math.max(0, noSleepRefCount - 1);
  if (noSleepRefCount === 0) sharedNoSleep?.disable();
}

/**
 * Enciende NoSleep de forma síncrona, para llamarla dentro de un gesto del
 * usuario: iOS solo deja reproducir el video así, y después de un `await` el
 * gesto ya expiró. Devuelve la función para soltar la referencia.
 */
export function acquireNoSleepInGesture(): () => void {
  const noSleep = retainNoSleep();
  noSleep.enable().catch(() => { /* sin gesto válido o política del SO */ });
  let released = false;
  return () => {
    if (released) return;
    released = true;
    releaseNoSleep();
  };
}

function setPlaybackState(state: MediaSessionPlaybackState): void {
  if (!SUPPORTS_MEDIA_SESSION) return;
  try { navigator.mediaSession.playbackState = state; } catch { /* no fatal */ }
}

export function useWakeLock(active: boolean, options: UseWakeLockOptions = {}): void {
  const { useNoSleepFallback = true, mediaSessionTitle = 'Cocinando con Sous Chef' } = options;
  const lockRef = useRef<WakeLockSentinel | null>(null);
  const holdsNoSleepRef = useRef(false);

  // Aparte del efecto principal: cambiar el título no debe soltar y volver a
  // pedir el lock, porque NoSleep no se puede reactivar fuera de un gesto.
  useEffect(() => {
    if (!active || !SUPPORTS_MEDIA_SESSION) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: mediaSessionTitle, artist: 'Sous Chef' });
    } catch { /* no fatal */ }
  }, [active, mediaSessionTitle]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    const acquire = async (): Promise<void> => {
      setPlaybackState('playing');

      if (SUPPORTS_WAKE_LOCK) {
        try {
          const sentinel = await navigator.wakeLock.request('screen');
          if (cancelled) {
            sentinel.release().catch(() => {});
            return;
          }
          lockRef.current = sentinel;
        } catch {
          // permiso denegado, batería baja o política del SO: se usa NoSleep
        }
      }
      if (cancelled) return;

      if (!lockRef.current && useNoSleepFallback && !holdsNoSleepRef.current) {
        holdsNoSleepRef.current = true;
        // Muchos navegadores exigen un gesto previo; si falla, queda el intento.
        retainNoSleep().enable().catch(() => {});
      }
    };

    const release = (): void => {
      const sentinel = lockRef.current;
      if (sentinel && !sentinel.released) sentinel.release().catch(() => {});
      lockRef.current = null;

      if (holdsNoSleepRef.current) {
        holdsNoSleepRef.current = false;
        releaseNoSleep();
      }
      setPlaybackState('none');
    };

    acquire();

    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        // Con la pestaña oculta iOS suspende el AudioContext si no ve reproducción.
        setPlaybackState('playing');
        return;
      }
      if (!lockRef.current || lockRef.current.released) {
        lockRef.current = null;
        acquire();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      release();
    };
  }, [active, useNoSleepFallback]);
}
