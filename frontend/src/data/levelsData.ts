/**
 * Orden lineal de los niveles del Modo Aventura y regla de desbloqueo según
 * el progreso guardado en localStorage.
 */

/**
 * Rutas de todos los niveles en orden de progresión. El índice es la posición
 * en el mapa: el 0 siempre está abierto y cada bloque de 4 es un mundo.
 */
export const LEVEL_PATHS: string[] = [
  '/mapa/juliana',
  '/mapa/brunoise',
  '/mapa/chiffonade',
  '/mapa/chef-vegetal',

  '/mapa/sofrito',
  '/mapa/maillard',
  '/mapa/emulsion',
  '/mapa/flambeador',

  '/mapa/fondo-blanco',
  '/mapa/fondo-oscuro',
  '/mapa/fumet',
  '/mapa/maestro-salsas',

  '/mapa/sous-vide',
  '/mapa/esferificacion',
  '/mapa/fermentacion',
  '/mapa/alquimista',

  '/mapa/menu-degustacion',
  '/mapa/maridaje',
  '/mapa/alta-cocina',
  '/mapa/gran-chef',
];

/**
 * Un nivel se desbloquea cuando el anterior tiene al menos 1 estrella en
 * `sous_level_stars`. El primero y las rutas no registradas siempre están abiertos.
 */
export function isLevelUnlocked(path: string): boolean {
  const idx = LEVEL_PATHS.indexOf(path);
  if (idx <= 0) return true;
  const prevPath = LEVEL_PATHS[idx - 1];
  try {
    const stars = JSON.parse(localStorage.getItem('sous_level_stars') ?? '{}') as Record<string, number>;
    return (stars[prevPath] ?? 0) > 0;
  } catch {
    return false;
  }
}
