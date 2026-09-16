/** Orden de los niveles y desbloqueo según el progreso guardado. Derivado de `adventure.ts`. */

import { LEVELS, isUnlocked, readLevelStars } from './adventure';

/** Rutas en orden de progresión: el índice 0 siempre está abierto y cada bloque de 4 es un mundo. */
export const LEVEL_PATHS: string[] = LEVELS.map(l => l.path);

export const isLevelUnlocked = (path: string): boolean => isUnlocked(path, readLevelStars());
