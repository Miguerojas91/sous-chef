/** Rangos por XP. Única fuente para el header, el inicio y el perfil. */

export interface Rank { name: string; minXp: number }

export const RANKS: Rank[] = [
  { name: 'Iniciado', minXp: 0 },
  { name: 'Cocinero de Partida', minXp: 500 },
  { name: 'Sous Chef', minXp: 1500 },
  { name: 'Chef de Cuisine', minXp: 5000 },
  { name: 'Maestría Culinaria', minXp: 15000 },
];

/** Tope del último rango, solo para dibujar su barra. */
const LAST_CAP = 50000;

export interface RankInfo {
  rank: string;
  index: number;
  next: string | null;
  xp: number;
  nextRankXp: number;
  /** 0 a 100 dentro del rango actual. */
  progress: number;
}

export function getRankInfo(xp: number): RankInfo {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  let index = 0;
  RANKS.forEach((r, i) => { if (safeXp >= r.minXp) index = i; });
  const base = RANKS[index].minXp;
  const cap = RANKS[index + 1]?.minXp ?? LAST_CAP;
  return {
    rank: RANKS[index].name,
    index,
    next: RANKS[index + 1]?.name ?? null,
    xp: safeXp,
    nextRankXp: cap,
    progress: Math.min(((safeXp - base) / (cap - base)) * 100, 100),
  };
}
