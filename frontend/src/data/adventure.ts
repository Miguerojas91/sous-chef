/**
 * Registro único del Modo Aventura: mundos, niveles, orden y regla de
 * desbloqueo. De aquí salen las rutas de App, el mapa y la identidad de cada
 * nivel que reciben LevelPage y BossPage.
 *
 * El contenido de cada nivel vive en `data/levels/<slug>.ts` y se carga con
 * `import()` para que cada nivel sea su propio chunk.
 */

import type { WorldId } from './worlds';
import type { BossContent, LevelContent } from './levels/types';

interface LevelBase {
  slug: string;
  /** Ruta del nivel. También es la clave del progreso en `sous_level_stars`. */
  path: string;
  /** Etiqueta corta del mapa. */
  name: string;
  /** Nombre en la pantalla del nivel, en analytics y en el evaluador de fotos. */
  title: string;
  emoji: string;
  xp: number;
}

export type AdventureLevel = LevelBase & (
  | { kind: 'normal'; load: () => Promise<LevelContent> }
  | { kind: 'boss'; load: () => Promise<BossContent> }
);

export interface AdventureWorld {
  id: WorldId;
  name: string;
  subtitle: string;
  emoji: string;
  premium: boolean;
  levels: AdventureLevel[];
}

/** Nivel con su posición global (1 a 20) y su mundo. */
export type PlacedLevel = AdventureLevel & {
  num: number;
  world: AdventureWorld;
};

const base = (slug: string, name: string, emoji: string, xp: number, title = name): LevelBase =>
  ({ slug, path: `/mapa/${slug}`, name, title, emoji, xp });

const normal = (slug: string, name: string, emoji: string, xp: number, load: () => Promise<LevelContent>, title?: string): AdventureLevel =>
  ({ ...base(slug, name, emoji, xp, title), kind: 'normal', load });

const boss = (slug: string, name: string, emoji: string, xp: number, load: () => Promise<BossContent>, title?: string): AdventureLevel =>
  ({ ...base(slug, name, emoji, xp, title), kind: 'boss', load });

export const WORLDS: AdventureWorld[] = [
  {
    id: 1, name: 'Isla del Cuchillo', subtitle: 'Técnicas de corte', emoji: '🔪', premium: false,
    levels: [
      normal('juliana',      'Juliana',      '🥕', 50,  () => import('./levels/juliana').then(m => m.content), 'Corte Juliana'),
      normal('brunoise',     'Brunoise',     '🧅', 50,  () => import('./levels/brunoise').then(m => m.content)),
      normal('chiffonade',   'Chiffonade',   '🌿', 50,  () => import('./levels/chiffonade').then(m => m.content)),
      boss('chef-vegetal',   'Chef Vegetal', '🥦', 200, () => import('./levels/chef-vegetal').then(m => m.content)),
    ],
  },
  {
    id: 2, name: 'Valle del Fuego', subtitle: 'Salsas y calor', emoji: '🔥', premium: false,
    levels: [
      normal('sofrito',    'Sofrito',       '🧄', 75,  () => import('./levels/sofrito').then(m => m.content)),
      normal('maillard',   'Maillard',      '🥩', 75,  () => import('./levels/maillard').then(m => m.content), 'Reacción de Maillard'),
      normal('emulsion',   'Emulsión',      '🥚', 75,  () => import('./levels/emulsion').then(m => m.content)),
      boss('flambeador',   'El Flambeador', '🍳', 250, () => import('./levels/flambeador').then(m => m.content)),
    ],
  },
  {
    id: 3, name: 'Mar de Sabores', subtitle: 'Fondos y caldos', emoji: '🌊', premium: true,
    levels: [
      normal('fondo-blanco',   'Fondo Blanco',   '🍲', 100, () => import('./levels/fondo-blanco').then(m => m.content)),
      normal('fondo-oscuro',   'Fondo Oscuro',   '🥣', 100, () => import('./levels/fondo-oscuro').then(m => m.content)),
      normal('fumet',          'Fumet',          '🐟', 100, () => import('./levels/fumet').then(m => m.content), 'Fumet de Pescado'),
      boss('maestro-salsas',   'Maestro Salsas', '🫕', 300, () => import('./levels/maestro-salsas').then(m => m.content), 'Maestro de Salsas'),
    ],
  },
  {
    id: 4, name: 'Pico del Maestro', subtitle: 'Técnicas avanzadas', emoji: '🏔️', premium: true,
    levels: [
      normal('sous-vide',      'Sous-Vide',      '🌡️', 150, () => import('./levels/sous-vide').then(m => m.content)),
      normal('esferificacion', 'Esferificación', '⚗️', 150, () => import('./levels/esferificacion').then(m => m.content)),
      normal('fermentacion',   'Fermentación',   '🍞', 150, () => import('./levels/fermentacion').then(m => m.content)),
      boss('alquimista',       'El Alquimista',  '🔬', 400, () => import('./levels/alquimista').then(m => m.content)),
    ],
  },
  {
    id: 5, name: 'Castillo del Chef', subtitle: 'Alta cocina', emoji: '👑', premium: true,
    levels: [
      normal('menu-degustacion', 'Menú Degustación', '🍽️', 200,  () => import('./levels/menu-degustacion').then(m => m.content)),
      normal('maridaje',         'Maridaje',         '🍷', 200,  () => import('./levels/maridaje').then(m => m.content)),
      normal('alta-cocina',      'Alta Cocina',      '🥂', 200,  () => import('./levels/alta-cocina').then(m => m.content)),
      boss('gran-chef',          'El Gran Chef',     '👨‍🍳', 1000, () => import('./levels/gran-chef').then(m => m.content)),
    ],
  },
];

/** Todos los niveles en orden de progresión. */
export const LEVELS: PlacedLevel[] = WORLDS.flatMap(world => world.levels.map(l => ({ ...l, world })))
  .map((l, i) => ({ ...l, num: i + 1 }));

const normalizePath = (path: string) => path.replace(/\/+$/, '').toLowerCase();

const BY_PATH = new Map(LEVELS.map(l => [normalizePath(l.path), l]));

/** Tolera mayúsculas y barra final, igual que el router. */
const getLevel = (path: string): PlacedLevel | undefined => BY_PATH.get(normalizePath(path));

export type LevelStatus = 'completed' | 'active' | 'locked';

/**
 * Un nivel se abre cuando el anterior tiene al menos 1 estrella. El primero y
 * las rutas no registradas siempre están abiertos.
 */
export function isUnlocked(path: string, stars: Record<string, number>): boolean {
  const level = getLevel(path);
  if (!level || level.num === 1) return true;
  return (stars[LEVELS[level.num - 2].path] ?? 0) > 0;
}

export function getLevelStatus(path: string, stars: Record<string, number>): LevelStatus {
  if ((stars[path] ?? 0) > 0) return 'completed';
  return isUnlocked(path, stars) ? 'active' : 'locked';
}
