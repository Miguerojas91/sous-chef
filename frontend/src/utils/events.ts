/**
 * Eventos globales de la app, con nombre y datos tipados en un solo lugar.
 * Viven en `window` para que cualquier módulo los emita sin importar componentes
 * (importar desde App.tsx crearía dependencias circulares).
 */

export type ToastType = 'info' | 'warning' | 'success' | 'error';
export interface ToastDetail { msg: string; type: ToastType }

const TOAST = 'sous:toast';
const USER_STATE = 'userStateChange';

export function showToast(msg: string, type: ToastType = 'info'): void {
  window.dispatchEvent(new CustomEvent<ToastDetail>(TOAST, { detail: { msg, type } }));
}

/** Devuelve la función para dejar de escuchar. */
export function onToast(cb: (detail: ToastDetail) => void): () => void {
  const handler = (e: Event) => cb((e as CustomEvent<ToastDetail>).detail);
  window.addEventListener(TOAST, handler);
  return () => window.removeEventListener(TOAST, handler);
}

/** Avisa que cambió el usuario en sesión (login, logout, XP, premium, preferencias). */
export function emitUserStateChange(): void {
  window.dispatchEvent(new Event(USER_STATE));
}

export function onUserStateChange(cb: () => void): () => void {
  window.addEventListener(USER_STATE, cb);
  return () => window.removeEventListener(USER_STATE, cb);
}
