import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy, ChefHat, Star } from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface GameLevel {
  id: number;
  name: string;
  emoji: string;
  type: 'normal' | 'boss';
  stars?: number;
  xp: number;
  path?: string;
}

interface World {
  id: number;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  levels: GameLevel[];
}

// ─── DATA ─────────────────────────────────────────────────────────────────────

const WORLDS: World[] = [
  {
    id: 1, name: 'Isla del Cuchillo', subtitle: 'Dominio del corte', emoji: '🔪',
    gradient: 'from-emerald-400 to-teal-600',
    levels: [
      { id: 1,  name: 'Juliana',          emoji: '🥕', type: 'normal', stars: 3, xp: 50,  path: '/mapa/juliana' },
      { id: 2,  name: 'Brunoise',         emoji: '🧅', type: 'normal', stars: 3, xp: 50,  path: '/mapa/brunoise' },
      { id: 3,  name: 'Chiffonade',       emoji: '🌿', type: 'normal', stars: 2, xp: 50,  path: '/mapa/chiffonade' },
      { id: 4,  name: 'Chef Vegetal',     emoji: '🥦', type: 'boss',   stars: 1, xp: 200, path: '/mapa/chef-vegetal' },
    ],
  },
  {
    id: 2, name: 'Valle del Fuego', subtitle: 'Salsas y calor', emoji: '🔥',
    gradient: 'from-orange-400 to-red-600',
    levels: [
      { id: 5,  name: 'Sofrito',          emoji: '🧄', type: 'normal', stars: 3, xp: 75,  path: '/mapa/sofrito' },
      { id: 6,  name: 'Maillard',         emoji: '🥩', type: 'normal', stars: 2, xp: 75,  path: '/mapa/maillard' },
      { id: 7,  name: 'Emulsión',         emoji: '🥚', type: 'normal', stars: 1, xp: 75,  path: '/mapa/emulsion' },
      { id: 8,  name: 'El Flambeador',    emoji: '🍳', type: 'boss',   stars: 0, xp: 250, path: '/mapa/flambeador' },
    ],
  },
  {
    id: 3, name: 'Mar de Sabores', subtitle: 'Fondos y caldos', emoji: '🌊',
    gradient: 'from-blue-400 to-cyan-600',
    levels: [
      { id: 9,  name: 'Fondo Blanco',     emoji: '🍲', type: 'normal', stars: 0, xp: 100, path: '/mapa/fondo-blanco' },
      { id: 10, name: 'Fondo Oscuro',     emoji: '🥣', type: 'normal', stars: 0, xp: 100, path: '/mapa/fondo-oscuro' },
      { id: 11, name: 'Fumet',            emoji: '🐟', type: 'normal', stars: 0, xp: 100, path: '/mapa/fumet' },
      { id: 12, name: 'Maestro Salsas',   emoji: '🫕', type: 'boss',   stars: 0, xp: 300, path: '/mapa/maestro-salsas' },
    ],
  },
  {
    id: 4, name: 'Pico del Maestro', subtitle: 'Técnicas avanzadas', emoji: '🏔️',
    gradient: 'from-violet-500 to-purple-700',
    levels: [
      { id: 13, name: 'Sous-Vide',        emoji: '🌡️', type: 'normal', stars: 0, xp: 150, path: '/mapa/sous-vide' },
      { id: 14, name: 'Esferificación',   emoji: '⚗️', type: 'normal', stars: 0, xp: 150, path: '/mapa/esferificacion' },
      { id: 15, name: 'Fermentación',     emoji: '🍞', type: 'normal', stars: 0, xp: 150, path: '/mapa/fermentacion' },
      { id: 16, name: 'El Alquimista',    emoji: '🔬', type: 'boss',   stars: 0, xp: 400, path: '/mapa/alquimista' },
    ],
  },
  {
    id: 5, name: 'Castillo del Chef', subtitle: 'Alta cocina', emoji: '👑',
    gradient: 'from-yellow-400 to-amber-600',
    levels: [
      { id: 17, name: 'Menú Degustación', emoji: '🍽️', type: 'normal', stars: 0, xp: 200, path: '/mapa/menu-degustacion' },
      { id: 18, name: 'Maridaje',         emoji: '🍷', type: 'normal', stars: 0, xp: 200, path: '/mapa/maridaje' },
      { id: 19, name: 'Alta Cocina',      emoji: '🥂', type: 'normal', stars: 0, xp: 200, path: '/mapa/alta-cocina' },
      { id: 20, name: 'El Gran Chef',     emoji: '👨‍🍳', type: 'boss',   stars: 0, xp: 1000, path: '/mapa/gran-chef' },
    ],
  },
];

// ─── MAP GEOMETRY ──────────────────────────────────────────────────────────────

const SVG_W   = 300;
const BANNER_H = 88;     // world banner height
const NODE_STEP = 122;   // vertical distance between node centres within a world
const WORLD_H  = BANNER_H + 4 * NODE_STEP;   // 576 px per world zone
const PAD_TOP  = 0;
const PAD_BOT  = 70;
const SVG_H    = PAD_TOP + 5 * WORLD_H + PAD_BOT;  // 2950 px total

// X positions for each of the 20 levels — creates a winding S-curve path
const XPOS = [
  240, 150,  60, 150,   // World 1 → right / centre / left / centre
  240, 150,  60, 150,   // World 2 → same
  240, 150,  60, 150,   // World 3 → same
   60, 150, 240, 150,   // World 4 → mirrored for variety
  240, 150,  60, 150,   // World 5 → same as 1-3
];

// SVG-native accent colours per world
const WCOLS = [
  { bg: '#d1fae5', road: '#059669', roadGlow: '#6ee7b7', nodeMain: '#10b981', nodeDark: '#047857', bannerA: '#059669', bannerB: '#0d9488', label: '#064e3b' },
  { bg: '#fff7ed', road: '#ea580c', roadGlow: '#fdba74', nodeMain: '#f97316', nodeDark: '#c2410c', bannerA: '#ea580c', bannerB: '#e11d48', label: '#7c2d12' },
  { bg: '#dbeafe', road: '#2563eb', roadGlow: '#93c5fd', nodeMain: '#3b82f6', nodeDark: '#1d4ed8', bannerA: '#2563eb', bannerB: '#0891b2', label: '#1e3a8a' },
  { bg: '#ede9fe', road: '#7c3aed', roadGlow: '#c4b5fd', nodeMain: '#8b5cf6', nodeDark: '#6d28d9', bannerA: '#7c3aed', bannerB: '#a21caf', label: '#4c1d95' },
  { bg: '#fef9c3', road: '#d97706', roadGlow: '#fcd34d', nodeMain: '#f59e0b', nodeDark: '#b45309', bannerA: '#d97706', bannerB: '#ea580c', label: '#78350f' },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const ALL_LEVELS = WORLDS.flatMap(w => w.levels);

function getLevelStatus(level: GameLevel): 'completed' | 'active' | 'locked' {
  if ((level.stars ?? 0) > 0) return 'completed';
  const idx = ALL_LEVELS.findIndex(l => l.id === level.id);
  const prev = ALL_LEVELS[idx - 1];
  if (!prev || (prev.stars ?? 0) > 0) return 'active';
  return 'locked';
}

function getPos(i: number): { x: number; y: number } {
  const w = Math.floor(i / 4);
  const p = i % 4;
  return {
    x: XPOS[i],
    y: PAD_TOP + w * WORLD_H + BANNER_H + p * NODE_STEP + NODE_STEP / 2,
  };
}

/** Smooth cubic-bezier path through all node centres */
function buildPath(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY} ${p1.x} ${midY} ${p1.x} ${p1.y}`;
  }
  return d;
}

// ─── MODAL ────────────────────────────────────────────────────────────────────

const LevelModal = ({
  level, wi, onClose, onNavigate,
}: {
  level: GameLevel;
  wi: number;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) => {
  const status = getLevelStatus(level);
  const isBoss = level.type === 'boss';
  const world = WORLDS[wi];
  const stars = level.stars ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-br ${world.gradient} p-6 text-center text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" />
          <span className="text-5xl block mb-1 relative">{level.emoji}</span>
          {isBoss && <span className="text-xl relative">👑</span>}
          <h3 className="text-xl font-black mt-1 relative">{level.name}</h3>
          <p className="text-white/75 text-sm mt-0.5 relative">Nivel {level.id} · {world.name}</p>
          {status === 'completed' && stars > 0 && (
            <div className="flex justify-center gap-1 mt-2 relative">
              {[0, 1, 2].map(si => (
                <Star
                  key={si}
                  size={16}
                  className={si < stars ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}
                  fill={si < stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-400 font-medium">Tipo</p>
              <p className="font-bold text-neutral-800 text-sm">{isBoss ? '⚔️ Jefe' : '🎯 Normal'}</p>
            </div>
            <div className="bg-neutral-50 rounded-xl p-3 text-center">
              <p className="text-xs text-neutral-400 font-medium">Recompensa</p>
              <p className="font-bold text-orange-600 text-sm">+{level.xp} XP</p>
            </div>
          </div>

          {status === 'locked' && (
            <p className="text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl p-3">
              🔒 Completa el nivel anterior para desbloquear este.
            </p>
          )}

          <button
            disabled={status === 'locked'}
            onClick={() => level.path && onNavigate(level.path)}
            className={`w-full py-3 rounded-xl font-black text-white transition-all active:scale-95 ${
              status === 'locked'
                ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : `bg-gradient-to-r ${world.gradient} hover:opacity-90 shadow-lg`
            }`}
          >
            {status === 'completed' ? '🔄 Repetir nivel' : status === 'active' ? '🚀 ¡Comenzar!' : '🔒 Bloqueado'}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN MAP ─────────────────────────────────────────────────────────────────

export const SkillTreeMap = () => {
  const [selected, setSelected] = useState<{ level: GameLevel; wi: number } | null>(null);
  const navigate = useNavigate();

  const pts = ALL_LEVELS.map((_, i) => getPos(i));
  const pathD = buildPath(pts);

  const completed = ALL_LEVELS.filter(l => (l.stars ?? 0) > 0).length;
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  return (
    <div className="w-full min-h-full flex flex-col">

      {/* ── Top stats bar ── */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat size={19} />
          <span className="font-black text-base">Modo Aventura</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-yellow-300" />
            <span className="font-bold text-sm">{completed}/{ALL_LEVELS.length} niveles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-300" />
            <span className="font-bold text-sm">{user.xp ?? 0} XP</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable map ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block' }}
        >
            {/* ── Defs ── */}
            <defs>
              {WORLDS.map((_, w) => (
                <linearGradient key={w} id={`wg${w}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={WCOLS[w].bannerA} />
                  <stop offset="100%" stopColor={WCOLS[w].bannerB} />
                </linearGradient>
              ))}
              <filter id="nodeShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.22" />
              </filter>
              <filter id="activeGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="bannerShadow" x="-10%" y="-30%" width="120%" height="160%">
                <feDropShadow dx="0" dy="3" stdDeviation="5" floodOpacity="0.18" />
              </filter>
            </defs>

            {/* ── World background zones ── */}
            {WORLDS.map((_, w) => (
              <rect
                key={w}
                x={0}
                y={PAD_TOP + w * WORLD_H}
                width={SVG_W}
                height={WORLD_H}
                fill={WCOLS[w].bg}
              />
            ))}

            {/* ── Road (drawn behind banners so it "enters" each banner) ── */}
            {/* Outer road shadow */}
            <path d={pathD} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={24}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Road body */}
            <path d={pathD} fill="none" stroke="#6b7280" strokeWidth={20}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Road surface */}
            <path d={pathD} fill="none" stroke="#d1d5db" strokeWidth={14}
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Road dashes */}
            <path d={pathD} fill="none" stroke="white" strokeWidth={4}
              strokeDasharray="20 18" strokeLinecap="round" opacity={0.9} />

            {/* ── World banners (on top of road) ── */}
            {WORLDS.map((world, w) => {
              const by = PAD_TOP + w * WORLD_H + 10;
              const bh = BANNER_H - 20;
              const bw = SVG_W - 20;
              const done = world.levels.filter(l => (l.stars ?? 0) > 0).length;
              const pBarW = bw - 66;
              const pBarFill = pBarW * (done / world.levels.length);

              return (
                <g key={w} filter="url(#bannerShadow)">
                  {/* Banner background */}
                  <rect x={10} y={by} width={bw} height={bh} rx={13} fill={`url(#wg${w})`} />
                  {/* Shine overlay */}
                  <rect x={10} y={by} width={bw} height={bh / 2} rx={13}
                    fill="white" opacity={0.1} />

                  {/* World emoji */}
                  <text x={32} y={by + bh / 2 + 1}
                    textAnchor="middle" dominantBaseline="central"
                    fontSize={22}>{world.emoji}</text>

                  {/* World name */}
                  <text x={52} y={by + 16}
                    fontSize={11} fontWeight="800" fill="white"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    dominantBaseline="middle">{world.name}</text>

                  {/* World subtitle */}
                  <text x={52} y={by + 30}
                    fontSize={8.5} fill="rgba(255,255,255,0.82)"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    dominantBaseline="middle">{world.subtitle}</text>

                  {/* Progress bar track */}
                  <rect x={52} y={by + bh - 16} width={pBarW} height={5} rx={2.5}
                    fill="rgba(255,255,255,0.28)" />
                  {/* Progress bar fill */}
                  <rect x={52} y={by + bh - 16} width={pBarFill} height={5} rx={2.5}
                    fill="white" />
                  {/* Progress text */}
                  <text x={52 + pBarW + 6} y={by + bh - 13}
                    fontSize={7.5} fill="rgba(255,255,255,0.88)"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    dominantBaseline="middle">{done}/{world.levels.length}</text>
                </g>
              );
            })}

            {/* ── Level nodes ── */}
            {ALL_LEVELS.map((level, i) => {
              const { x, y } = getPos(i);
              const wi = Math.floor(i / 4);
              const wc = WCOLS[wi];
              const isBoss = level.type === 'boss';
              const status = getLevelStatus(level);
              const r = isBoss ? 33 : 26;
              const stars = level.stars ?? 0;

              // Visual state
              const fill   = status === 'completed' ? wc.nodeMain
                           : status === 'active'    ? 'white'
                           :                          '#374151';
              const stroke = status === 'completed' ? wc.nodeDark
                           : status === 'active'    ? wc.nodeMain
                           :                          '#4b5563';
              const sw     = status === 'active' ? 3.5 : 2;

              // Label Y: below node, adjusted for stars/badge
              const hasStars  = status === 'completed' && stars > 0;
              const hasBadge  = status === 'active';
              const labelY    = y + r + (hasStars || hasBadge ? 22 : 14);

              return (
                <g
                  key={level.id}
                  onClick={() => status !== 'locked' && setSelected({ level, wi })}
                  style={{ cursor: status === 'locked' ? 'default' : 'pointer' }}
                >
                  {/* Active glow halo */}
                  {status === 'active' && (
                    <circle cx={x} cy={y} r={r + 10}
                      fill={wc.roadGlow} opacity={0.45}
                      filter="url(#activeGlow)" />
                  )}

                  {/* Boss gold dashed ring */}
                  {isBoss && status !== 'locked' && (
                    <circle cx={x} cy={y} r={r + 6}
                      fill="none" stroke="#fbbf24" strokeWidth={2.5}
                      strokeDasharray="7 5" />
                  )}

                  {/* Drop shadow */}
                  <circle cx={x} cy={y + 2.5} r={r}
                    fill="rgba(0,0,0,0.18)" filter="url(#nodeShadow)" />

                  {/* Main node circle */}
                  <circle cx={x} cy={y} r={r}
                    fill={fill} stroke={stroke} strokeWidth={sw} />

                  {/* Inner highlight ring (completed only) */}
                  {status === 'completed' && (
                    <circle cx={x} cy={y} r={r - 5}
                      fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
                  )}

                  {/* Emoji or lock icon */}
                  {status === 'locked' ? (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                      fontSize={isBoss ? 19 : 15}>🔒</text>
                  ) : (
                    <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                      fontSize={isBoss ? 22 : 17}>{level.emoji}</text>
                  )}

                  {/* Crown above boss node */}
                  {isBoss && status !== 'locked' && (
                    <text x={x} y={y - r - 5}
                      textAnchor="middle" dominantBaseline="auto"
                      fontSize={15}>👑</text>
                  )}

                  {/* Stars (completed nodes) */}
                  {hasStars && (
                    <>
                      {[-8, 0, 8].map((dx, si) => (
                        <text key={si}
                          x={x + dx} y={y + r + 11}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize={10}
                          fill={si < stars ? '#fbbf24' : 'rgba(0,0,0,0.18)'}>★</text>
                      ))}
                    </>
                  )}

                  {/* "¡Jugar!" badge (active node) */}
                  {hasBadge && (
                    <g>
                      <rect x={x - 20} y={y + r + 5} width={40} height={14} rx={7}
                        fill="#f97316" />
                      <text x={x} y={y + r + 13}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={8} fontWeight="bold" fill="white"
                        fontFamily="Plus Jakarta Sans, sans-serif">¡Jugar!</text>
                    </g>
                  )}

                  {/* Level name label */}
                  <text x={x} y={labelY}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={8} fontWeight="700"
                    fill={status === 'locked' ? '#9ca3af' : wc.label}
                    fontFamily="Plus Jakarta Sans, sans-serif">
                    {level.name}
                  </text>
                </g>
              );
            })}

            {/* ── Finish flag ── */}
            <text x={150} y={SVG_H - 30}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={28}>🏆</text>
            <text x={150} y={SVG_H - 10}
              textAnchor="middle" dominantBaseline="middle"
              fontSize={9} fontWeight="800" fill="#78350f"
              fontFamily="Plus Jakarta Sans, sans-serif">¡Maestría Culinaria!</text>
        </svg>
      </div>

      {/* ── Level modal ── */}
      {selected && (
        <LevelModal
          level={selected.level}
          wi={selected.wi}
          onClose={() => setSelected(null)}
          onNavigate={path => { setSelected(null); navigate(path); }}
        />
      )}
    </div>
  );
};
