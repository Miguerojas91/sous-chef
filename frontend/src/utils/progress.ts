/**
 * progress.ts
 *
 * Capa de persistencia del progreso del usuario en el Modo Aventura.
 * Guarda y lee estrellas por nivel y XP total usando localStorage.
 * Todas las funciones fallan de forma silenciosa para no interrumpir
 * la experiencia si el almacenamiento del navegador no está disponible.
 */

/** Clave usada en localStorage para el mapa de estrellas por nivel. */
const STARS_KEY = 'sous_level_stars';

/**
 * Devuelve las estrellas (0–3) obtenidas en un nivel.
 *
 * @param levelPath - Ruta URL del nivel, ej. `/mapa/brunoise`.
 * @returns Número de estrellas (0 si el nivel nunca se ha completado).
 */
export function getLevelStars(levelPath: string): number {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    return data[levelPath] ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Persiste las estrellas de un nivel en localStorage.
 * Solo actualiza si el nuevo valor es mayor al existente —
 * el mejor intento siempre prevalece.
 *
 * @param levelPath - Ruta URL del nivel.
 * @param stars     - Estrellas obtenidas en este intento (0–3).
 */
export function saveLevelStars(levelPath: string, stars: number): void {
  try {
    const data = JSON.parse(localStorage.getItem(STARS_KEY) || '{}') as Record<string, number>;
    if ((data[levelPath] ?? 0) < stars) {
      data[levelPath] = stars;
      localStorage.setItem(STARS_KEY, JSON.stringify(data));
    }
  } catch { /* ignorar si el storage está lleno */ }
}

/**
 * Suma XP al usuario actualmente logueado y dispara el evento
 * `userStateChange` para que el header y otros componentes se actualicen.
 * No hace nada si no hay sesión activa.
 *
 * @param amount - Cantidad de XP a agregar (debe ser positivo).
 */
export function addXP(amount: number): void {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    user.xp = ((user.xp as number) ?? 0) + amount;
    localStorage.setItem('user', JSON.stringify(user));
    window.dispatchEvent(new Event('userStateChange'));
  } catch { /* ignorar */ }
}
