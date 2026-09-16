/**
 * Contenido de cada nivel del Modo Aventura. Nombre, emoji, XP, número y mundo
 * no van aquí: salen del registro de `data/adventure.ts`.
 */

import type { EvaluationCriterion } from '../../hooks/usePhotoEvaluation';

export interface LevelStep {
  title: string;
  desc: string;
  tip: string;
}

export interface LevelError {
  icon: string;
  error: string;
  fix: string;
}

export interface LevelRecipe {
  name: string;
  description: string;
  servings: string;
  time: string;
  difficulty: string;
  ingredients: string[];
  method: string[];
}

export interface LevelContent {
  /** Admite **negrita** y <strong> (se pinta con SafeText). */
  missionText: string;
  missionTags: string[];
  steps: LevelStep[];
  errors: LevelError[];
  recipe?: LevelRecipe;
  challengeHint: string;
  evaluationCriteria: EvaluationCriterion[];
}

export interface BossChallenge {
  id: number;
  emoji: string;
  name: string;
  desc: string;
  eval: string;
}

export interface BossRecipe {
  name: string;
  emoji: string;
  servings: string;
  time: string;
  difficulty: string;
  /** Un elemento que termina en ":" se muestra como subtítulo de grupo. */
  ingredients: string[];
  steps: string[];
  plating?: string;
}

export interface BossContent {
  bossSubtitle: string;
  quote: string;
  requirement: string;
  nextWorld: string;
  victoryTitle?: string;
  victoryDesc: string;
  returnLabel?: string;
  challenges: BossChallenge[];
  tips: string[];
  mainRecipe: BossRecipe;
}
