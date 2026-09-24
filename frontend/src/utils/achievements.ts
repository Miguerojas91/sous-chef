/**
 * Logros del perfil. Se calculan con el progreso que ya se guarda (estrellas,
 * clases, racha y XP): no tienen almacenamiento propio.
 */

import { LEVELS } from '../data/adventure';
import { loadCompletedLessons } from '../data/academy';
import { readLevelStars } from './progress';
import { getBestStreak } from './streak';

export type AchievementIcon = 'knife' | 'star' | 'flame' | 'book' | 'crown' | 'island' | 'shield' | 'books';

export interface Achievement { id: string; name: string; hint: string; icon: AchievementIcon; tone: 'green' | 'gold' | 'flame' | 'violet' | 'red'; earned: boolean }

export function getAchievements(xp: number): Achievement[] {
  const stars = readLevelStars();
  const done = LEVELS.filter(l => (stars[l.path] ?? 0) > 0);
  const lessons = loadCompletedLessons().size;
  const best = getBestStreak();
  const world1 = LEVELS.filter(l => l.world.id === 1);
  return [
    { id: 'first-level', name: 'Primer corte', hint: 'Completa tu primer nivel', icon: 'knife', tone: 'green', earned: done.length > 0 },
    { id: 'perfect', name: 'Foto perfecta', hint: 'Gana 3 estrellas en un nivel', icon: 'star', tone: 'gold', earned: done.some(l => stars[l.path] >= 3) },
    { id: 'streak-3', name: 'Racha de 3 días', hint: 'Cocina 3 días seguidos', icon: 'flame', tone: 'flame', earned: best >= 3 },
    { id: 'first-lesson', name: 'Primera clase', hint: 'Termina una clase de la Academia', icon: 'book', tone: 'violet', earned: lessons > 0 },
    { id: 'streak-7', name: 'Racha de 7 días', hint: 'Cocina 7 días seguidos', icon: 'flame', tone: 'flame', earned: best >= 7 },
    { id: 'first-boss', name: 'Primer jefe', hint: 'Derrota a un jefe final', icon: 'crown', tone: 'gold', earned: done.some(l => l.kind === 'boss') },
    { id: 'world-1', name: 'Isla conquistada', hint: 'Completa la Isla del Cuchillo', icon: 'island', tone: 'green', earned: world1.every(l => (stars[l.path] ?? 0) > 0) },
    { id: 'lessons-5', name: 'Estudioso', hint: 'Termina 5 clases', icon: 'books', tone: 'violet', earned: lessons >= 5 },
    { id: 'sous-chef', name: 'Sous Chef', hint: 'Llega a 1.500 XP', icon: 'shield', tone: 'red', earned: xp >= 1500 },
  ];
}

/** Resumen para las cifras del perfil. */
export function getProgressStats() {
  const stars = readLevelStars();
  const levelsDone = LEVELS.filter(l => (stars[l.path] ?? 0) > 0).length;
  const totalStars = LEVELS.reduce((n, l) => n + (stars[l.path] ?? 0), 0);
  return { levelsDone, totalLevels: LEVELS.length, totalStars, lessons: loadCompletedLessons().size };
}
