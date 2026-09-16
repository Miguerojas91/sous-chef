/**
 * Sesión de "Cocinemos" guardada en localStorage: la intención y el tiempo
 * elegidos, y la clave del historial del chat. Inicio la usa para ofrecer
 * "Continuar tu receta"; CookingSession, para restaurar la sesión tras un F5.
 */
import type { CookingIntent } from '../services/gemini';

const META_KEY = 'sous_cooking_meta';
export const COOKING_CHAT_KEY = 'sous_chat_cooking';

export interface CookingSessionMeta {
  intent: CookingIntent;
  timeAvailable: string;
}

export function loadCookingMeta(): CookingSessionMeta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as CookingSessionMeta) : null;
  } catch {
    return null;
  }
}

export function saveCookingMeta(meta: CookingSessionMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch { /* storage lleno o bloqueado */ }
}

export function clearCookingSession(): void {
  try {
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(COOKING_CHAT_KEY);
  } catch { /* storage bloqueado */ }
}

/** Hay una receta a medias: intención guardada y al menos un mensaje. */
export function hasCookingInProgress(): boolean {
  try {
    return loadCookingMeta() !== null && localStorage.getItem(COOKING_CHAT_KEY) !== null;
  } catch {
    return false;
  }
}
