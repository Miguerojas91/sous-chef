/**
 * Mide el área que de verdad queda visible cuando el teclado del móvil está
 * abierto.
 *
 * Hace falta porque `100dvh` no descuenta el teclado en iOS: la pantalla sigue
 * midiendo lo mismo, el teclado la tapa por debajo y los últimos mensajes del
 * chat quedan escondidos detrás. `visualViewport` sí reporta el alto real.
 *
 * El teclado se da por abierto cuando el alto visible cae mucho por debajo del
 * máximo visto Y hay un campo de texto enfocado. Las dos condiciones importan:
 * en iOS la barra de direcciones también encoge el viewport al hacer scroll, y
 * en escritorio se puede achicar la ventana a mano.
 */
import { useEffect, useState } from 'react';

/** Caída mínima, en px, para no confundir el teclado con la barra del navegador. */
const KEYBOARD_THRESHOLD = 120;

export interface ViewportState {
  /** Alto visible real. `null` si el navegador no expone `visualViewport`. */
  height: number | null;
  /** Cuánto bajó el viewport visual dentro del de diseño (iOS). */
  offsetTop: number;
  keyboardOpen: boolean;
}

const INITIAL: ViewportState = { height: null, offsetTop: 0, keyboardOpen: false };

const isTextField = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName;
  if (tag === 'TEXTAREA') return true;
  if (tag === 'INPUT') {
    const type = (el as HTMLInputElement).type;
    return type !== 'checkbox' && type !== 'radio' && type !== 'button' && type !== 'submit';
  }
  return (el as HTMLElement).isContentEditable;
};

export const useVisualViewport = (): ViewportState => {
  const [state, setState] = useState<ViewportState>(INITIAL);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    // Alto de referencia sin teclado: el mayor visto para este ancho de pantalla.
    let baseline = 0;
    let baseWidth = 0;
    let pending = 0;

    const read = () => {
      pending = 0;
      const height = Math.round(vv.height);
      const width = Math.round(vv.width);
      // Al girar el teléfono cambian las dos medidas: la referencia se reinicia.
      if (width !== baseWidth) {
        baseWidth = width;
        baseline = height;
      } else if (height > baseline) {
        baseline = height;
      }

      const next: ViewportState = {
        height,
        offsetTop: Math.round(vv.offsetTop),
        keyboardOpen: baseline - height > KEYBOARD_THRESHOLD && isTextField(document.activeElement),
      };

      setState(prev => (
        prev.height === next.height && prev.offsetTop === next.offsetTop && prev.keyboardOpen === next.keyboardOpen
          ? prev
          : next
      ));
    };

    // El viewport dispara muchos eventos seguidos mientras el teclado entra.
    const schedule = () => {
      if (pending) return;
      pending = requestAnimationFrame(read);
    };

    read();
    vv.addEventListener('resize', schedule);
    vv.addEventListener('scroll', schedule);
    // Sin esto, cerrar el campo con el teclado ya abierto no actualizaría nada.
    window.addEventListener('focusin', schedule);
    window.addEventListener('focusout', schedule);

    return () => {
      if (pending) cancelAnimationFrame(pending);
      vv.removeEventListener('resize', schedule);
      vv.removeEventListener('scroll', schedule);
      window.removeEventListener('focusin', schedule);
      window.removeEventListener('focusout', schedule);
    };
  }, []);

  return state;
};
