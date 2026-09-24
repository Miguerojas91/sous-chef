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
  1: { main: '#237F47', soft: '#DDF1E3', line: '#86C79C', bannerB: '#1D6A3B', nodeMain: '#237F47', nodeDark: '#185C33', label: '#123F24' },
  2: { main: '#CC3B21', soft: '#FFF3EF', line: '#F2A08A', bannerB: '#AE3019', nodeMain: '#CC3B21', nodeDark: '#962812', label: '#6E1F10' },
  3: { main: '#2A6FC4', soft: '#E0ECFA', line: '#98BBE8', bannerB: '#235FAA', nodeMain: '#2A6FC4', nodeDark: '#1C4F8E', label: '#12305A' },
  4: { main: '#6E4BD1', soft: '#ECE6FB', line: '#B7A5EE', bannerB: '#5E3DBE', nodeMain: '#6E4BD1', nodeDark: '#4E31A0', label: '#2F1E60' },
  5: { main: '#9C6C00', soft: '#FFF3C4', line: '#FFD54F', bannerB: '#7A5600', nodeMain: '#F5B800', nodeDark: '#C98F00', label: '#5C4100' },
};
