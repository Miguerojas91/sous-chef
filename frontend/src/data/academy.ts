/**
 * Reglas de la Academia sobre los datos de src/data/lessons: búsqueda por id,
 * claves del CMS, acceso Premium y progreso guardado.
 */

import { ACADEMY_LEVELS } from './lessons';
import type { AcademyLevel, Lesson, WorldNumber } from './lessons';

export { ACADEMY_LEVELS };
export type * from './lessons';

/** Clases completas: Tailwind no genera clases armadas en tiempo de ejecución. */
export const LEVEL_CLASSES: Record<WorldNumber, { text: string; soft: string; line: string; dot: string }> = {
  1: { text: 'text-world-1', soft: 'bg-world-1-soft', line: 'border-world-1-line', dot: 'bg-world-1' },
  2: { text: 'text-world-2', soft: 'bg-world-2-soft', line: 'border-world-2-line', dot: 'bg-world-2' },
  3: { text: 'text-world-3', soft: 'bg-world-3-soft', line: 'border-world-3-line', dot: 'bg-world-3' },
  4: { text: 'text-world-4', soft: 'bg-world-4-soft', line: 'border-world-4-line', dot: 'bg-world-4' },
  5: { text: 'text-world-5', soft: 'bg-world-5-soft', line: 'border-world-5-line', dot: 'bg-world-5' },
};

export const TOTAL_LESSONS = ACADEMY_LEVELS.reduce((n, l) => n + l.lessons.length, 0);

export function findLesson(id: string): { lesson: Lesson; level: AcademyLevel } | null {
  for (const level of ACADEMY_LEVELS) {
    const lesson = level.lessons.find(l => l.id === id);
    if (lesson) return { lesson, level };
  }
  return null;
}

/** Títulos anteriores de clases renombradas. El CMS y el progreso viejo usan estos. */
const PREVIOUS_TITLES: Record<string, string> = {
  miseenplace: 'Mise en Place: El Arte de la Preparación',
  fondos: 'Fondos Básicos: El Alma de la Cocina',
  maillard: 'Reacción de Maillard: El Secreto del Sabor',
};

/**
 * Prefijo de las claves de EditableText de una clase. Las claves ya están
 * guardadas en el servidor con el título sin espacios, así que una clase
 * renombrada conserva el título anterior.
 */
export function cmsKeyFor(lesson: Lesson): string {
  return (PREVIOUS_TITLES[lesson.id] ?? lesson.title).replace(/\s+/g, '');
}

export type LessonAccess = 'open' | 'premium' | 'locked';

/**
 * Un nivel bloqueado cierra todas sus clases, aunque sean Premium y el usuario
 * lo tenga (Élite). Si no, una clase Premium pide la membresía.
 */
export function canOpenLesson(lesson: Lesson, { premium, levelLocked }: { premium: boolean; levelLocked: boolean }): LessonAccess {
  if (levelLocked) return 'locked';
  if (lesson.isPremium && !premium) return 'premium';
  return 'open';
}

// Formato anterior: arreglo de títulos (actuales o previos) en COMPLETED_TITLES_KEY.
// Se migra una vez a ids; la clave vieja se deja intacta.
const COMPLETED_TITLES_KEY = 'sous_academy_completed';
const COMPLETED_IDS_KEY = 'sous_academy_completed_ids';

/** Pura: convierte títulos guardados en ids. Descarta los que no reconoce. */
export function migrateCompletedTitles(titles: unknown): string[] {
  if (!Array.isArray(titles)) return [];
  const idByTitle = new Map<string, string>();
  for (const level of ACADEMY_LEVELS) {
    for (const lesson of level.lessons) {
      idByTitle.set(lesson.title, lesson.id);
      const previous = PREVIOUS_TITLES[lesson.id];
      if (previous) idByTitle.set(previous, lesson.id);
    }
  }
  const ids = new Set<string>();
  for (const t of titles) {
    const id = typeof t === 'string' ? idByTitle.get(t) : undefined;
    if (id) ids.add(id);
  }
  return [...ids];
}

export function loadCompletedLessons(): Set<string> {
  try {
    const saved = localStorage.getItem(COMPLETED_IDS_KEY);
    if (saved !== null) {
      const ids: unknown = JSON.parse(saved);
      return new Set(Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : []);
    }
    const legacy = localStorage.getItem(COMPLETED_TITLES_KEY);
    const migrated = new Set(migrateCompletedTitles(legacy ? JSON.parse(legacy) : []));
    // Guardar aunque esté vacío: la presencia de la clave nueva marca la migración hecha.
    saveCompletedLessons(migrated);
    return migrated;
  } catch {
    return new Set();
  }
}

export function saveCompletedLessons(ids: Set<string>): void {
  try {
    localStorage.setItem(COMPLETED_IDS_KEY, JSON.stringify([...ids]));
  } catch { /* sin almacenamiento (modo privado): el progreso vive solo en memoria */ }
}
