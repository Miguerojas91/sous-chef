// Orden canónico de todos los niveles de aventura (prerequisito = índice anterior)
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
 * Devuelve true si el nivel en `path` está desbloqueado.
 * El nivel 0 siempre está desbloqueado.
 * El resto requiere que el nivel anterior tenga al menos 1 estrella en localStorage.
 */
export function isLevelUnlocked(path: string): boolean {
  const idx = LEVEL_PATHS.indexOf(path);
  if (idx <= 0) return true; // primer nivel: siempre abierto
  const prevPath = LEVEL_PATHS[idx - 1];
  try {
    const stars = JSON.parse(localStorage.getItem('sous_level_stars') ?? '{}') as Record<string, number>;
    return (stars[prevPath] ?? 0) > 0;
  } catch {
    return false;
  }
}
