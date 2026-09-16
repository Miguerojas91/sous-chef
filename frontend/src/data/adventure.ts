/**
 * Registro único del Modo Aventura: mundos, niveles, orden y regla de
 * desbloqueo. De aquí salen las rutas de App, el mapa y los datos que muestran
 * LevelPage y BossPage.
 *
 * Los componentes se cargan con `import()` dinámico: los niveles importan
 * LevelPage/BossPage, que a su vez leen este módulo, y así no hay ciclo al
 * evaluar los módulos.
 */

import type { ComponentType } from 'react';
import type { WorldId } from './worlds';

export type LevelKind = 'normal' | 'boss';

export interface AdventureLevel {
  slug: string;
  /** Ruta del nivel. También es la clave del progreso en `sous_level_stars`. */
  path: string;
  /** Etiqueta corta del mapa. */
  name: string;
  /** Nombre en la pantalla del nivel, en analytics y en el evaluador de fotos. */
  title: string;
  emoji: string;
  xp: number;
  kind: LevelKind;
  load: () => Promise<ComponentType>;
}

export interface AdventureWorld {
  id: WorldId;
  name: string;
  subtitle: string;
  emoji: string;
  premium: boolean;
  levels: AdventureLevel[];
}

/** Nivel con su posición global (1 a 20) y su mundo. */
export interface PlacedLevel extends AdventureLevel {
  num: number;
  world: AdventureWorld;
}

const level = (
  slug: string,
  name: string,
  emoji: string,
  xp: number,
  kind: LevelKind,
  load: AdventureLevel['load'],
  title = name,
): AdventureLevel => ({ slug, path: `/mapa/${slug}`, name, title, emoji, xp, kind, load });

export const WORLDS: AdventureWorld[] = [
  {
    id: 1, name: 'Isla del Cuchillo', subtitle: 'Técnicas de corte', emoji: '🔪', premium: false,
    levels: [
      level('juliana',      'Juliana',      '🥕', 50,  'normal', () => import('../components/JulianaLevel').then(m => m.JulianaLevel), 'Corte Juliana'),
      level('brunoise',     'Brunoise',     '🧅', 50,  'normal', () => import('../components/BrunoiseLevel').then(m => m.BrunoiseLevel)),
      level('chiffonade',   'Chiffonade',   '🌿', 50,  'normal', () => import('../components/ChiffonadeLevel').then(m => m.ChiffonadeLevel)),
      level('chef-vegetal', 'Chef Vegetal', '🥦', 200, 'boss',   () => import('../components/ChefVegetalBoss').then(m => m.ChefVegetalBoss)),
    ],
  },
  {
    id: 2, name: 'Valle del Fuego', subtitle: 'Salsas y calor', emoji: '🔥', premium: false,
    levels: [
      level('sofrito',    'Sofrito',       '🧄', 75,  'normal', () => import('../components/SofritoLevel').then(m => m.SofritoLevel)),
      level('maillard',   'Maillard',      '🥩', 75,  'normal', () => import('../components/MaillardLevel').then(m => m.MaillardLevel), 'Reacción de Maillard'),
      level('emulsion',   'Emulsión',      '🥚', 75,  'normal', () => import('../components/EmulsionLevel').then(m => m.EmulsionLevel)),
      level('flambeador', 'El Flambeador', '🍳', 250, 'boss',   () => import('../components/FlambeadorBoss').then(m => m.FlambeadorBoss)),
    ],
  },
  {
    id: 3, name: 'Mar de Sabores', subtitle: 'Fondos y caldos', emoji: '🌊', premium: true,
    levels: [
      level('fondo-blanco',   'Fondo Blanco',   '🍲', 100, 'normal', () => import('../components/FondoBlancoLevel').then(m => m.FondoBlancoLevel)),
      level('fondo-oscuro',   'Fondo Oscuro',   '🥣', 100, 'normal', () => import('../components/FondoOscuroLevel').then(m => m.FondoOscuroLevel)),
      level('fumet',          'Fumet',          '🐟', 100, 'normal', () => import('../components/FumetLevel').then(m => m.FumetLevel), 'Fumet de Pescado'),
      level('maestro-salsas', 'Maestro Salsas', '🫕', 300, 'boss',   () => import('../components/MaestroDeSalsasBoss').then(m => m.MaestroDeSalsasBoss), 'Maestro de Salsas'),
    ],
  },
  {
    id: 4, name: 'Pico del Maestro', subtitle: 'Técnicas avanzadas', emoji: '🏔️', premium: true,
    levels: [
      level('sous-vide',      'Sous-Vide',      '🌡️', 150, 'normal', () => import('../components/SousVideLevel').then(m => m.SousVideLevel)),
      level('esferificacion', 'Esferificación', '⚗️', 150, 'normal', () => import('../components/EsferificacionLevel').then(m => m.EsferificacionLevel)),
      level('fermentacion',   'Fermentación',   '🍞', 150, 'normal', () => import('../components/FermentacionLevel').then(m => m.FermentacionLevel)),
      level('alquimista',     'El Alquimista',  '🔬', 400, 'boss',   () => import('../components/AlquimistaBoss').then(m => m.AlquimistaBoss)),
    ],
  },
  {
    id: 5, name: 'Castillo del Chef', subtitle: 'Alta cocina', emoji: '👑', premium: true,
    levels: [
      level('menu-degustacion', 'Menú Degustación', '🍽️', 200,  'normal', () => import('../components/MenuDegustacionLevel').then(m => m.MenuDegustacionLevel)),
      level('maridaje',         'Maridaje',         '🍷', 200,  'normal', () => import('../components/MarinajeLevel').then(m => m.MarinajeLevel)),
      level('alta-cocina',      'Alta Cocina',      '🥂', 200,  'normal', () => import('../components/AltaCocinaLevel').then(m => m.AltaCocinaLevel)),
      level('gran-chef',        'El Gran Chef',     '👨‍🍳', 1000, 'boss',   () => import('../components/GranChefBoss').then(m => m.GranChefBoss)),
    ],
  },
];

/** Todos los niveles en orden de progresión. */
export const LEVELS: PlacedLevel[] = WORLDS.flatMap(world => world.levels.map(l => ({ ...l, world })))
  .map((l, i) => ({ ...l, num: i + 1 }));

const BY_PATH = new Map(LEVELS.map(l => [l.path, l]));

export const getLevel = (path: string): PlacedLevel | undefined =>
  BY_PATH.get(path.length > 1 ? path.replace(/\/+$/, '') : path);

/** Para LevelPage y BossPage: fuera de una ruta registrada es un error de programación. */
export function requireLevel(path: string): PlacedLevel {
  const found = getLevel(path);
  if (!found) throw new Error(`Nivel de aventura no registrado: ${path}`);
  return found;
}

/** Estrellas por ruta de nivel. Sin almacenamiento o con datos corruptos, vacío. */
export function readLevelStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('sous_level_stars') || '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

export type LevelStatus = 'completed' | 'active' | 'locked';

/**
 * Un nivel se abre cuando el anterior tiene al menos 1 estrella. El primero y
 * las rutas no registradas siempre están abiertos.
 */
export function isUnlocked(path: string, stars: Record<string, number>): boolean {
  const idx = LEVELS.findIndex(l => l.path === path);
  if (idx <= 0) return true;
  return (stars[LEVELS[idx - 1].path] ?? 0) > 0;
}

export function getLevelStatus(path: string, stars: Record<string, number>): LevelStatus {
  if ((stars[path] ?? 0) > 0) return 'completed';
  return isUnlocked(path, stars) ? 'active' : 'locked';
}
