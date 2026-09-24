/**
 * Progreso del Modo Aventura en localStorage. Único dueño de la clave
 * `sous_level_stars`. Todo falla en silencio: sin almacenamiento el juego
 * sigue, solo no guarda.
 */

import { emitUserStateChange } from './events';
import { markActivityToday } from './streak';

const STARS_KEY = 'sous_level_stars';

/** Estrellas (0 a 3) por ruta de nivel, p. ej. `/mapa/brunoise`. Sin datos o corruptos, vacío. */
export function readLevelStars(): Record<string, number> {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STARS_KEY) || '{}');
    return data && typeof data === 'object' ? data as Record<string, number> : {};
  } catch {
    return {};
  }
}

/** Sin sesión no hace nada. Emite `userStateChange` para refrescar el header. */
function addXP(amount: number): void {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    user.xp = ((user.xp as number) ?? 0) + amount;
    localStorage.setItem('user', JSON.stringify(user));
    emitUserStateChange();
  } catch { /* ignorar */ }
}

/**
 * Guarda el resultado de un nivel. Las estrellas solo suben; el XP se suma solo
 * si el nivel no tenía estrellas, así repetirlo no da XP.
 */
export function recordLevelResult(levelPath: string, stars: number, xp: number): { firstCompletion: boolean } {
  const data = readLevelStars();
  const previous = data[levelPath] ?? 0;
  const firstCompletion = previous === 0;
  if (previous < stars) {
    data[levelPath] = stars;
    try { localStorage.setItem(STARS_KEY, JSON.stringify(data)); } catch { /* storage lleno */ }
  }
  if (firstCompletion) addXP(xp);
  markActivityToday();
  return { firstCompletion };
}
