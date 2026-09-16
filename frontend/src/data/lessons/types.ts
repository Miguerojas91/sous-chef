export interface TableRow {
  col1: string;
  col2: string;
}

interface SectionBase {
  title?: string;
}

export type LessonSection =
  | (SectionBase & { type: 'text' | 'tip' | 'warning'; content: string })
  | (SectionBase & { type: 'list' | 'steps'; content: string[] })
  | (SectionBase & { type: 'table'; content: TableRow[] });

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface LessonContent {
  intro: string;
  sections: LessonSection[];
  keyPoints: string[];
  quiz: QuizQuestion[];
}

export interface Lesson {
  /** Identidad estable: progreso guardado, DOM y búsqueda. No cambia al renombrar. */
  id: string;
  emoji: string;
  title: string;
  duration: string;
  isPremium?: boolean;
  description: string;
  topics: string[];
  /** Sin contenido, el visor muestra "todavía no está disponible". */
  content?: LessonContent;
}

export type WorldNumber = 1 | 2 | 3 | 4 | 5;

export interface AcademyLevel {
  id: string;
  name: string;
  tag: string;
  /** Color del mundo del Modo Aventura que usa el nivel. */
  world: WorldNumber;
  /** Nivel cerrado para todos, con o sin Premium. */
  locked?: boolean;
  lessons: Lesson[];
}
