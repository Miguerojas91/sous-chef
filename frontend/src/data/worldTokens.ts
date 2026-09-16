/**
 * Colores de los mundos del Modo Aventura en hex. Es la única fuente:
 * tailwind.config.js los carga para los tokens `world-N` y el SVG del mapa los
 * usa directamente, porque en atributos `fill`/`stroke` no hay clases.
 *
 * `main` soporta texto blanco con contraste AA. `soft` es el fondo de sección y
 * `line` el borde claro. `dark` y `label` solo los usa el mapa (borde de nodo
 * completado y nombre del nivel).
 *
 * Tailwind lo importa con jiti desde Node: nada de alias ni imports con valor.
 */

import type { WorldId } from './worlds';

export interface WorldTokens {
  main: string;
  soft: string;
  line: string;
  dark: string;
  label: string;
}

export const WORLD_TOKENS: Record<WorldId, WorldTokens> = {
  1: { main: '#047857', soft: '#ecfdf5', line: '#a7f3d0', dark: '#065f46', label: '#064e3b' },
  2: { main: '#b91c1c', soft: '#fef2f2', line: '#fecaca', dark: '#991b1b', label: '#7f1d1d' },
  3: { main: '#1d4ed8', soft: '#eff6ff', line: '#bfdbfe', dark: '#1e40af', label: '#1e3a8a' },
  // El mundo 4 era violeta: pasa a pizarra.
  4: { main: '#334155', soft: '#f1f5f9', line: '#cbd5e1', dark: '#1e293b', label: '#0f172a' },
  5: { main: '#92400e', soft: '#fffbeb', line: '#fde68a', dark: '#78350f', label: '#78350f' },
};
