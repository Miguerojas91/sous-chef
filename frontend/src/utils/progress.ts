import { emitUserStateChange } from './events';
/**
 * Progreso del Modo Aventura en localStorage. Todo falla en silencio: sin
 * almacenamiento el juego sigue, solo no guarda.
 */

const STARS_KEY = 'sous_level_stars';

/** 0 a 3. `levelPath` es la ruta del nivel, p. ej. `/mapa/brunoise`. */
export function getLevelStars(levelPath: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    return data[levelPath] ?? 0;
  } catch {
    return 0;
  }
}

/** Solo guarda si mejora el resultado anterior. */
export function saveLevelStars(levelPath: string, stars: number): void {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    if ((data[levelPath] ?? 0) < stars) {
      data[levelPath] = stars;
      localStorage.setItem(STARS_KEY, JSON.stringify(data));
    }
  } catch { /* ignorar si el storage está lleno */ }
}

/** Sin sesión no hace nada. Emite `userStateChange` para refrescar el header. */
export function addXP(amount: number): void {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    user.xp = ((user.xp as number) ?? 0) + amount;
    localStorage.setItem('user', JSON.stringify(user));
    emitUserStateChange();
  } catch { /* ignorar */ }
}
