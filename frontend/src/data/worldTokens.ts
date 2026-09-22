/**
 * Colores de los mundos del Modo Aventura en hex. tailwind.config.js los carga
 * para los tokens `world-N` (main, soft, line) y el SVG del mapa los usa
 * directamente, porque en atributos `fill`/`stroke` no hay clases.
 *
 * `main` es el color del banner (inicio del degradado) y `bannerB` su final.
 * `soft` es el fondo de la zona del mundo y `line` el halo del nodo activo.
 * `nodeMain`/`nodeDark` pintan el nodo completado y `label` el nombre del nivel.
 *
 * Tailwind lo importa con jiti desde Node: nada de alias ni imports con valor.
 */

import type { WorldId } from './worlds';

export interface WorldTokens {
  main: string;
  soft: string;
  line: string;
  bannerB: string;
  nodeMain: string;
  nodeDark: string;
  label: string;
}

export const WORLD_TOKENS: Record<WorldId, WorldTokens> = {
  1: { main: '#059669', soft: '#d1fae5', line: '#6ee7b7', bannerB: '#0d9488', nodeMain: '#10b981', nodeDark: '#047857', label: '#064e3b' },
  2: { main: '#ea580c', soft: '#fff7ed', line: '#fdba74', bannerB: '#e11d48', nodeMain: '#f97316', nodeDark: '#c2410c', label: '#7c2d12' },
  3: { main: '#2563eb', soft: '#dbeafe', line: '#93c5fd', bannerB: '#0891b2', nodeMain: '#3b82f6', nodeDark: '#1d4ed8', label: '#1e3a8a' },
  4: { main: '#7c3aed', soft: '#ede9fe', line: '#c4b5fd', bannerB: '#a21caf', nodeMain: '#8b5cf6', nodeDark: '#6d28d9', label: '#4c1d95' },
  5: { main: '#d97706', soft: '#fef9c3', line: '#fcd34d', bannerB: '#ea580c', nodeMain: '#f59e0b', nodeDark: '#b45309', label: '#78350f' },
};
