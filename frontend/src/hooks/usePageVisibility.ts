/** Pausar intervalos y polling con la app oculta o el teléfono bloqueado ahorra batería. */
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

/** Solo corre con la página visible. `delay` en `null` lo desactiva. */
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
