/**
 * usePageVisibility.ts
 *
 * Devuelve `true` mientras la pestaña está visible. Útil para pausar
 * intervalos, polling y animaciones cuando el usuario cambia de pestaña
 * o bloquea el dispositivo — preserva batería en mobile.
 *
 * También expone `useIntervalWhenVisible` para correr un callback en
 * intervalo SOLO si la pestaña está activa.
 */
import { useEffect, useRef, useState } from 'react';

export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden'
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

/**
 * Ejecuta `cb` cada `delay` ms SOLO mientras la pestaña esté visible.
 * Si `delay` es `null`, no corre.
 */
export function useIntervalWhenVisible(cb: () => void, delay: number | null): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    if (delay == null) return;

    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (id != null) return;
      id = setInterval(() => cbRef.current(), delay);
    };
    const stop = () => {
      if (id != null) { clearInterval(id); id = null; }
    };

    if (document.visibilityState !== 'hidden') start();
    const onChange = () => {
      if (document.visibilityState === 'hidden') stop();
      else start();
    };
    document.addEventListener('visibilitychange', onChange);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onChange);
    };
  }, [delay]);
}
