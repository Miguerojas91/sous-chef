/**
 * levelsData.ts
 *
 * Datos canónicos del sistema de progresión del Modo Aventura.
 * Define el orden lineal de todos los niveles y expone una utilidad
 * para verificar si un nivel está desbloqueado según el progreso guardado
 * en localStorage.
 */

/** Rutas URL de todos los niveles en orden progresivo (índice 0 = primer nivel). */
export const LEVEL_PATHS: string[] = [
  '/mapa/juliana',        // 0 — siempre desbloqueado
  '/mapa/brunoise',       // 1
  '/mapa/chiffonade',     // 2
  '/mapa/chef-vegetal',   // 3

  '/mapa/sofrito',        // 4
  '/mapa/maillard',       // 5
  '/mapa/emulsion',       // 6
  '/mapa/flambeador',     // 7

  '/mapa/fondo-blanco',   // 8
  '/mapa/fondo-oscuro',   // 9
  '/mapa/fumet',          // 10
  '/mapa/maestro-salsas', // 11

  '/mapa/sous-vide',      // 12
  '/mapa/esferificacion', // 13
  '/mapa/fermentacion',   // 14
  '/mapa/alquimista',     // 15

  '/mapa/menu-degustacion', // 16
  '/mapa/maridaje',         // 17
  '/mapa/alta-cocina',      // 18
  '/mapa/gran-chef',        // 19
];

/**
 * Determina si un nivel está desbloqueado para el usuario actual.
 *
 * Regla: el nivel 0 siempre está abierto. Para el resto, el nivel
 * anterior debe tener al menos 1 estrella guardada en localStorage
 * bajo la clave `sous_level_stars`.
 *
 * @param path - Ruta URL del nivel a verificar (ej. `/mapa/brunoise`).
 * @returns `true` si el nivel está desbloqueado, `false` en caso contrario.
 */
export function isLevelUnlocked(path: string): boolean {
  const idx = LEVEL_PATHS.indexOf(path);
  // El primer nivel (índice 0) o rutas no registradas siempre están abiertas
  if (idx <= 0) return true;
  const prevPath = LEVEL_PATHS[idx - 1];
  try {
    const stars = JSON.parse(localStorage.getItem('sous_level_stars') ?? '{}') as Record<string, number>;
    return (stars[prevPath] ?? 0) > 0;
  } catch {
    return false;
  }
}
