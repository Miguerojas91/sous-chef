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

const stack: symbol[] = [];

interface UseModalOptions {
  onEscape?: () => void;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Atrapar Tab dentro del panel. Desactivar solo si el panel no es interactivo. */
  trapFocus?: boolean;
}

export function useModal(panelRef: RefObject<HTMLElement | null>, {
  onEscape, initialFocusRef, trapFocus = true,
}: UseModalOptions = {}) {
  // El callback cambia en cada render del padre; guardarlo en ref evita que el
  // efecto se reinicie y robe el foco mientras el usuario escribe.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => { onEscapeRef.current = onEscape; }, [onEscape]);

  useEffect(() => {
    const id = Symbol('modal');
    stack.push(id);
    const isTop = () => stack[stack.length - 1] === id;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
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
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      const i = stack.indexOf(id);
      if (i !== -1) stack.splice(i, 1);
      if (stack.length === 0) document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [panelRef, initialFocusRef, trapFocus]);
}
