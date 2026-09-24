/**
 * Diálogo modal accesible: tarjeta blanca centrada (rounded-3xl, shadow-2xl)
 * sobre un fondo oscurecido y desenfocado. En pantallas bajas no pasa de
 * `100dvh - 2rem` y el cuerpo hace scroll. El foco, Escape y el bloqueo del
 * scroll vienen de `useModal`.
 */
import { useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useModal } from '../../hooks/useModal';

interface DialogProps {
  title: ReactNode;
  onClose: () => void;
  children?: ReactNode;
  /** Pie fijo (botones de acción). */
  footer?: ReactNode;
  description?: ReactNode;
  /** Elemento que recibe el foco al abrir. Por defecto, el primero enfocable. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Destino del foco al cerrar si el elemento que abrió el diálogo ya no existe. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  tone?: 'light' | 'dark';
  /** Oculta el título visualmente (sigue nombrando al diálogo). */
  hideTitle?: boolean;
  size?: 'sm' | 'md';
  /** Icono decorativo junto al título (se muestra en un cuadro con gradiente). */
  icon?: ReactNode;
  /** Muestra el botón X de cerrar en la cabecera. */
  showClose?: boolean;
}

export const Dialog = ({
  title, onClose, children, footer, description, initialFocusRef, returnFocusRef,
  tone = 'light', hideTitle = false, size = 'md', icon, showClose = false,
}: DialogProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();

  useModal(panelRef, { onEscape: onClose, initialFocusRef, returnFocusRef });

  const dark = tone === 'dark';
  const hasBody = children != null && children !== false;
  const visibleHeader = !hideTitle || !!description || !!icon || showClose;
  const divider = dark ? 'border-neutral-800' : 'border-neutral-100';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
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
        className={`relative w-full ${size === 'sm' ? 'max-w-sm' : 'max-w-md'} max-h-[calc(100dvh-2rem)] flex flex-col rounded-3xl shadow-2xl overflow-hidden outline-none animate-sheet-up motion-reduce:animate-none ${
          dark ? 'bg-neutral-900 text-white border border-neutral-700' : 'bg-white text-neutral-900'
        }`}
      >
        {visibleHeader ? (
          <header className={`flex items-start gap-3 flex-shrink-0 ${hasBody ? `p-5 border-b ${divider}` : 'px-6 pt-6 pb-4'}`}>
            {icon && (
              <span className="bg-orange-400 p-2 rounded-xl text-white flex-shrink-0" aria-hidden>
                {icon}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <h2 id={titleId} className={hideTitle ? 'sr-only' : `text-lg font-black leading-tight ${dark ? 'text-white' : 'text-neutral-900'}`}>
                {title}
              </h2>
              {description && (
                <p id={descId} className={`mt-1 text-sm leading-snug ${dark ? 'text-neutral-300' : 'text-neutral-500'}`}>
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className={`w-11 h-11 -mr-2 -mt-2 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${
                  dark ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <X size={18} aria-hidden />
              </button>
            )}
          </header>
        ) : (
          <h2 id={titleId} className="sr-only">{title}</h2>
        )}
        {hasBody && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5">
            {children}
          </div>
        )}
        {footer && (
          <div className={`flex-shrink-0 p-4 ${hasBody || visibleHeader ? `border-t ${divider}` : ''} ${dark ? '' : 'bg-neutral-50'}`}>
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
        <div className="flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className={`flex-1 min-h-11 py-2.5 px-4 rounded-xl font-bold text-sm transition-colors ${
              dark
                ? 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 min-h-11 py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-colors ${
              destructive ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    />
  );
};
