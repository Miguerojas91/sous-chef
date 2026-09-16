/** Clases de color de cada mundo del Modo Aventura (tokens `world-N`). */

export type WorldId = 1 | 2 | 3 | 4 | 5;

// Clases completas escritas a mano: Tailwind no genera clases armadas en runtime.
export const WORLD_CLASSES: Record<WorldId, {
  bg: string; text: string; soft: string; line: string; border: string;
}> = {
  1: { bg: 'bg-world-1', text: 'text-world-1', soft: 'bg-world-1-soft', line: 'border-world-1-line', border: 'border-world-1' },
  2: { bg: 'bg-world-2', text: 'text-world-2', soft: 'bg-world-2-soft', line: 'border-world-2-line', border: 'border-world-2' },
  3: { bg: 'bg-world-3', text: 'text-world-3', soft: 'bg-world-3-soft', line: 'border-world-3-line', border: 'border-world-3' },
  4: { bg: 'bg-world-4', text: 'text-world-4', soft: 'bg-world-4-soft', line: 'border-world-4-line', border: 'border-world-4' },
  5: { bg: 'bg-world-5', text: 'text-world-5', soft: 'bg-world-5-soft', line: 'border-world-5-line', border: 'border-world-5' },
};
