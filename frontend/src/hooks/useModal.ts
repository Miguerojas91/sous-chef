/**
 * Comportamiento común de cualquier capa modal (diálogos, visores a pantalla
 * completa): foco inicial dentro, Tab atrapado, Escape para cerrar, scroll del
 * fondo bloqueado y foco devuelto al cerrar.
 *
 * Las capas abiertas forman una pila: Escape y Tab solo los atiende la de
 * arriba. Sin la pila, con un diálogo dentro de otro, un Escape cerraba ambos
 * porque los dos escuchan en `document`.
 */
import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface Layer {
  id: symbol;
  panel: HTMLElement | null;
}

const stack: Layer[] = [];

// El overflow original se guarda una sola vez, cuando abre la primera capa, y
// se restaura cuando cierra la última. Si cada capa guardara el suyo, una capa
// abierta encima guardaría 'hidden'; al desmontarse ambas en el mismo commit el
// orden de limpieza podía dejar el body bloqueado para siempre.
let bodyOverflowBeforeLock = '';

function pushLayer(layer: Layer) {
  if (stack.length === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  stack.push(layer);
}

function removeLayer(id: symbol) {
  const i = stack.findIndex(l => l.id === id);
  if (i === -1) return;
  stack.splice(i, 1);
  if (stack.length === 0) document.body.style.overflow = bodyOverflowBeforeLock;
}

/**
 * Enfoca un elemento que no es enfocable por sí mismo (encabezado, `main`)
 * con un tabindex temporal que se quita al perder el foco.
 */
function focusLandmark(el: HTMLElement) {
  if (!el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '-1');
    el.addEventListener('blur', () => el.removeAttribute('tabindex'), { once: true });
  }
  el.focus({ preventScroll: true });
}

/**
 * Devuelve el foco al cerrar una capa.
 *
 * Orden: el elemento que tenía el foco al abrir; si ya no está en el documento
 * (p. ej. el botón de micrófono que la pantalla de voz reemplazó), el
 * `returnFocusRef` de la capa; si tampoco, la capa que quede abierta debajo;
 * si no queda ninguna, el primer título dentro de `main` o el propio `main`.
 *
 * El respaldo solo actúa si el foco quedó perdido en `body`: cuando varias
 * capas se cierran en el mismo commit, no pisa el foco que otra ya devolvió
 * a un elemento vivo.
 */
function restoreFocus(previouslyFocused: HTMLElement | null, returnFocus: HTMLElement | null | undefined) {
  if (previouslyFocused?.isConnected) {
    previouslyFocused.focus();
    return;
  }
  const active = document.activeElement;
  if (active && active !== document.body && active.isConnected) return;

  if (returnFocus?.isConnected) {
    returnFocus.focus();
    return;
  }
  const below = stack[stack.length - 1]?.panel;
  if (below?.isConnected) {
    below.focus();
    return;
  }
  const landmark =
    document.querySelector<HTMLElement>('main h1, main h2, [role="main"] h1, [role="main"] h2')
    ?? document.querySelector<HTMLElement>('main, [role="main"]');
  if (landmark) focusLandmark(landmark);
}

interface UseModalOptions {
  onEscape?: () => void;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Atrapar Tab dentro del panel. Desactivar solo si el panel no es interactivo. */
  trapFocus?: boolean;
  /** Destino del foco al cerrar si el elemento que abrió la capa ya no existe. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function useModal(panelRef: RefObject<HTMLElement | null>, {
  onEscape, initialFocusRef, trapFocus = true, returnFocusRef,
}: UseModalOptions = {}) {
  // El callback cambia en cada render del padre; guardarlo en ref evita que el
  // efecto se reinicie y robe el foco mientras el usuario escribe.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    const id = Symbol('modal');
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    pushLayer({ id, panel });
    const isTop = () => stack[stack.length - 1]?.id === id;

    const first = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isTop()) return;
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (!trapFocus || e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      removeLayer(id);
      // Se lee al cerrar a propósito: el destino puede ser un nodo que React
      // montó después de abrir (el botón que vuelve a aparecer al salir).
      // eslint-disable-next-line react-hooks/exhaustive-deps
      restoreFocus(previouslyFocused, returnFocusRef?.current);
    };
  }, [panelRef, initialFocusRef, trapFocus, returnFocusRef]);
}
