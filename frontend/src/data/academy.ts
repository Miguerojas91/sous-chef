/**
 * Reglas de la Academia sobre los datos de src/data/lessons: búsqueda por id,
 * claves del CMS, acceso Premium y progreso guardado. Los datos y sus tipos se
 * importan desde `./lessons`, no desde aquí.
 */

import { ACADEMY_LEVELS } from './lessons';
import type { AcademyLevel, Lesson } from './lessons';
import { isStringArray, readJSON, writeJSON } from '../utils/storage';

export const TOTAL_LESSONS = ACADEMY_LEVELS.reduce((n, l) => n + l.lessons.length, 0);

export function findLesson(id: string): { lesson: Lesson; level: AcademyLevel } | null {
  for (const level of ACADEMY_LEVELS) {
    const lesson = level.lessons.find(l => l.id === id);
    if (lesson) return { lesson, level };
  }
  return null;
}

/** Prefijo de las claves de EditableText de una clase (ver `Lesson.cmsKey`). */
export function cmsKeyFor(lesson: Lesson): string {
  return lesson.cmsKey ?? lesson.title.replace(/\s+/g, '');
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

const COMPLETED_IDS_KEY = 'sous_academy_completed_ids';

// Migración única del progreso por títulos a progreso por ids.
// Borrar después de 2026-12, junto con COMPLETED_TITLES_KEY, RENAMED_TITLES y
// migrateCompletedTitles: para entonces quien abrió la Academia ya migró.
// La clave vieja se deja intacta.
const COMPLETED_TITLES_KEY = 'sous_academy_completed';

/** Títulos con los que se guardó progreso antes de renombrar estas clases. */
const RENAMED_TITLES: Record<string, string> = {
  miseenplace: 'Mise en Place: El Arte de la Preparación',
  fondos: 'Fondos Básicos: El Alma de la Cocina',
  maillard: 'Reacción de Maillard: El Secreto del Sabor',
};

/** Pura: convierte títulos guardados en ids. Descarta los que no reconoce. */
export function migrateCompletedTitles(titles: unknown): string[] {
  if (!Array.isArray(titles)) return [];
  const idByTitle = new Map<string, string>();
  for (const level of ACADEMY_LEVELS) {
    for (const lesson of level.lessons) {
      idByTitle.set(lesson.title, lesson.id);
      const previous = RENAMED_TITLES[lesson.id];
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

const isArray = (value: unknown): value is unknown[] => Array.isArray(value);

export function loadCompletedLessons(): Set<string> {
  const saved = readJSON(COMPLETED_IDS_KEY, isStringArray, null);
  if (saved) return new Set(saved);

  const migrated = new Set(migrateCompletedTitles(readJSON(COMPLETED_TITLES_KEY, isArray, [])));
  // Guardar aunque esté vacío: la presencia de la clave nueva marca la migración hecha.
  saveCompletedLessons(migrated);
  return migrated;
}

/** Sin almacenamiento (modo privado), el progreso vive solo en memoria. */
export function saveCompletedLessons(ids: Set<string>): void {
  writeJSON(COMPLETED_IDS_KEY, [...ids]);
}
