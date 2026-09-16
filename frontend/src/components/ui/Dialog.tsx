/**
 * Diálogo modal accesible. En móvil sale como hoja desde abajo (al alcance del
 * pulgar y sin quedar bajo el teclado); desde `sm` se centra.
 *
 * Gestiona lo que los modales hechos a mano no hacían: `role="dialog"`,
 * cierre con Escape, foco inicial dentro del diálogo, foco atrapado con Tab
 * y devolución del foco al elemento que lo abrió.
 */
import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DialogProps {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** Pie fijo (botones de acción); queda sobre el área segura inferior. */
  footer?: ReactNode;
  description?: ReactNode;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  tone?: 'light' | 'dark';
  /** Oculta el título visualmente (sigue nombrando al diálogo). */
  hideTitle?: boolean;
  size?: 'sm' | 'md';
}

export const Dialog = ({
  title, onClose, children, footer, description, initialFocusRef,
  tone = 'light', hideTitle = false, size = 'md',
}: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  // onClose cambia en cada render del padre; guardarlo en ref evita que el
  // efecto de foco se reinicie y robe el foco mientras el usuario escribe.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
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
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [initialFocusRef]);

  const dark = tone === 'dark';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-fade-in motion-reduce:animate-none"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative w-full ${size === 'sm' ? 'sm:max-w-sm' : 'sm:max-w-lg'} max-h-[calc(100dvh-1rem)] flex flex-col rounded-t-sheet sm:rounded-sheet shadow-overlay outline-none animate-sheet-up motion-reduce:animate-none ${
          dark ? 'bg-neutral-900 text-white border border-neutral-700' : 'bg-white text-neutral-900'
        }`}
      >
        <div className="px-5 pt-5 overflow-y-auto overscroll-contain">
          <h2 id={titleId} className={hideTitle ? 'sr-only' : 'text-lg font-extrabold'}>
            {title}
          </h2>
          {description && (
            <p id={descId} className={`mt-1 text-sm ${dark ? 'text-neutral-300' : 'text-neutral-600'}`}>
              {description}
            </p>
          )}
          <div className="pb-5">{children}</div>
        </div>
        {footer && (
          <div className={`px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-4 border-t ${dark ? 'border-neutral-800' : 'border-neutral-100'}`}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  tone?: 'light' | 'dark';
}

/** Confirmación de dos botones. El foco arranca en "Cancelar" por seguridad. */
export const ConfirmDialog = ({
  title, description, confirmLabel, cancelLabel = 'Cancelar',
  onConfirm, onCancel, destructive = false, tone = 'light',
}: ConfirmDialogProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dark = tone === 'dark';
  return (
    <Dialog
      title={title}
      description={description}
      onClose={onCancel}
      initialFocusRef={cancelRef}
      tone={tone}
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`flex-1 min-h-11 rounded-control border font-semibold text-sm transition-colors ${
              dark
                ? 'border-neutral-600 text-neutral-200 hover:bg-neutral-800'
                : 'border-neutral-300 text-neutral-800 hover:bg-neutral-50'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-11 rounded-control font-semibold text-sm text-white transition-colors ${
              destructive ? 'bg-danger hover:bg-red-800' : 'bg-brand-700 hover:bg-brand-800'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {null}
    </Dialog>
  );
};
