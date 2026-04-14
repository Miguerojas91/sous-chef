// ── Persistencia de progreso del usuario ──────────────────────────────────────
// Guarda estrellas por nivel y XP total en localStorage.

const STARS_KEY = 'sous_level_stars';

/** Devuelve las estrellas (0-3) ganadas en un nivel, o 0 si nunca se completó. */
export function getLevelStars(levelPath: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    return data[levelPath] ?? 0;
  } catch { return 0; }
}

/**
 * Guarda las estrellas de un nivel.
 * Solo actualiza si las nuevas estrellas son mayores a las existentes
 * (el mejor intento siempre gana).
 */
export function saveLevelStars(levelPath: string, stars: number) {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    if ((data[levelPath] ?? 0) < stars) {
      data[levelPath] = stars;
      localStorage.setItem(STARS_KEY, JSON.stringify(data));
    }
  } catch { /* ignorar si storage está lleno */ }
}

/**
 * Agrega XP al usuario actual y dispara el evento de actualización de UI.
 * Solo agrega si el usuario tiene sesión activa.
 */
export function addXP(amount: number) {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    user.xp = ((user.xp as number) ?? 0) + amount;
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('userStateChange'));
  } catch { /* ignorar */ }
}
