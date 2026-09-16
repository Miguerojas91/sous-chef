/**
 * Mapa del Modo Aventura: un SVG de ~2950 px de alto con 5 mundos y 20 niveles
 * unidos por una carretera en S.
 *
 * - Un nivel se desbloquea cuando el anterior tiene al menos 1 estrella.
 * - Los mundos 3 a 5 muestran un bloqueo de Premium si el usuario no está suscrito.
 * - El aviso de primera visita se oculta para siempre con `sous_map_onboarding_seen`.
 * - Las estrellas por nivel se leen de `localStorage['sous_level_stars']`.
 */

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Star, X } from 'lucide-react';
import { isPremiumUser } from '../utils/membership';
import { Dialog } from './ui/Dialog';
import { ScreenHeader } from './ui/ScreenHeader';

// Índices 0-based: Mar de Sabores, Pico del Maestro, Castillo del Chef.
const PREMIUM_WORLDS = new Set([2, 3, 4]);

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
  id: 1 | 2 | 3 | 4 | 5;
  name: string;
  subtitle: string;
  emoji: string;
  levels: GameLevel[];
}

const WORLDS: World[] = [
  {
    id: 1, name: 'Isla del Cuchillo', subtitle: 'Técnicas de corte', emoji: '🔪',
    levels: [
      { id: 1,  name: 'Juliana',          emoji: '🥕', type: 'normal', stars: 3, xp: 50,  path: '/mapa/juliana' },
      { id: 2,  name: 'Brunoise',         emoji: '🧅', type: 'normal', stars: 3, xp: 50,  path: '/mapa/brunoise' },
      { id: 3,  name: 'Chiffonade',       emoji: '🌿', type: 'normal', stars: 2, xp: 50,  path: '/mapa/chiffonade' },
      { id: 4,  name: 'Chef Vegetal',     emoji: '🥦', type: 'boss',   stars: 1, xp: 200, path: '/mapa/chef-vegetal' },
    ],
  },
  {
    id: 2, name: 'Valle del Fuego', subtitle: 'Salsas y calor', emoji: '🔥',
    levels: [
      { id: 5,  name: 'Sofrito',          emoji: '🧄', type: 'normal', stars: 3, xp: 75,  path: '/mapa/sofrito' },
      { id: 6,  name: 'Maillard',         emoji: '🥩', type: 'normal', stars: 2, xp: 75,  path: '/mapa/maillard' },
      { id: 7,  name: 'Emulsión',         emoji: '🥚', type: 'normal', stars: 1, xp: 75,  path: '/mapa/emulsion' },
      { id: 8,  name: 'El Flambeador',    emoji: '🍳', type: 'boss',   stars: 0, xp: 250, path: '/mapa/flambeador' },
    ],
  },
  {
    id: 3, name: 'Mar de Sabores', subtitle: 'Fondos y caldos', emoji: '🌊',
    levels: [
      { id: 9,  name: 'Fondo Blanco',     emoji: '🍲', type: 'normal', stars: 0, xp: 100, path: '/mapa/fondo-blanco' },
      { id: 10, name: 'Fondo Oscuro',     emoji: '🥣', type: 'normal', stars: 0, xp: 100, path: '/mapa/fondo-oscuro' },
      { id: 11, name: 'Fumet',            emoji: '🐟', type: 'normal', stars: 0, xp: 100, path: '/mapa/fumet' },
      { id: 12, name: 'Maestro Salsas',   emoji: '🫕', type: 'boss',   stars: 0, xp: 300, path: '/mapa/maestro-salsas' },
    ],
  },
  {
    id: 4, name: 'Pico del Maestro', subtitle: 'Técnicas avanzadas', emoji: '🏔️',
    levels: [
      { id: 13, name: 'Sous-Vide',        emoji: '🌡️', type: 'normal', stars: 0, xp: 150, path: '/mapa/sous-vide' },
      { id: 14, name: 'Esferificación',   emoji: '⚗️', type: 'normal', stars: 0, xp: 150, path: '/mapa/esferificacion' },
      { id: 15, name: 'Fermentación',     emoji: '🍞', type: 'normal', stars: 0, xp: 150, path: '/mapa/fermentacion' },
      { id: 16, name: 'El Alquimista',    emoji: '🔬', type: 'boss',   stars: 0, xp: 400, path: '/mapa/alquimista' },
    ],
  },
  {
    id: 5, name: 'Castillo del Chef', subtitle: 'Alta cocina', emoji: '👑',
    levels: [
      { id: 17, name: 'Menú Degustación', emoji: '🍽️', type: 'normal', stars: 0, xp: 200, path: '/mapa/menu-degustacion' },
      { id: 18, name: 'Maridaje',         emoji: '🍷', type: 'normal', stars: 0, xp: 200, path: '/mapa/maridaje' },
      { id: 19, name: 'Alta Cocina',      emoji: '🥂', type: 'normal', stars: 0, xp: 200, path: '/mapa/alta-cocina' },
      { id: 20, name: 'El Gran Chef',     emoji: '👨‍🍳', type: 'boss',   stars: 0, xp: 1000, path: '/mapa/gran-chef' },
    ],
  },
];

const SVG_W    = 300;
const BANNER_H = 88;
const NODE_STEP = 122;
const WORLD_H  = BANNER_H + 4 * NODE_STEP;
const PAD_BOT  = 70;
const SVG_H    = 5 * WORLD_H + PAD_BOT;

// Posición X de cada nivel: dibuja la S. El mundo 4 va en espejo para variar.
const XPOS = [
  240, 150,  60, 150,
  240, 150,  60, 150,
  240, 150,  60, 150,
   60, 150, 240, 150,
  240, 150,  60, 150,
];

// El SVG no puede usar clases de Tailwind: repite en hex los tokens world-N
// (main = DEFAULT, bg = soft, glow = line) más un tono oscuro para bordes y texto.
const WCOLS = [
  { bg: '#ecfdf5', glow: '#a7f3d0', main: '#047857', dark: '#065f46', label: '#064e3b' },
  { bg: '#fef2f2', glow: '#fecaca', main: '#b91c1c', dark: '#991b1b', label: '#7f1d1d' },
  { bg: '#eff6ff', glow: '#bfdbfe', main: '#1d4ed8', dark: '#1e40af', label: '#1e3a8a' },
  { bg: '#f1f5f9', glow: '#cbd5e1', main: '#334155', dark: '#1e293b', label: '#0f172a' },
  { bg: '#fffbeb', glow: '#fde68a', main: '#92400e', dark: '#78350f', label: '#78350f' },
];

// Clases completas escritas a mano: Tailwind no genera clases armadas en runtime.
const WORLD_BTN: Record<World['id'], string> = {
  1: 'bg-world-1',
  2: 'bg-world-2',
  3: 'bg-world-3',
  4: 'bg-world-4',
  5: 'bg-world-5',
};

const FONT = 'Plus Jakarta Sans, sans-serif';

const ALL_LEVELS = WORLDS.flatMap(w => w.levels);

type LevelStatus = 'completed' | 'active' | 'locked';

function getLevelStatus(level: GameLevel, starsMap: Record<string, number>): LevelStatus {
  if ((starsMap[level.path ?? ''] ?? 0) > 0) return 'completed';
  const idx = ALL_LEVELS.findIndex(l => l.id === level.id);
  const prev = ALL_LEVELS[idx - 1];
  if (!prev) return 'active';
  if ((starsMap[prev.path ?? ''] ?? 0) > 0) return 'active';
  return 'locked';
}

function getPos(i: number): { x: number; y: number } {
  const w = Math.floor(i / 4);
  const p = i % 4;
  return {
    x: XPOS[i],
    y: w * WORLD_H + BANNER_H + p * NODE_STEP + NODE_STEP / 2,
  };
}

function buildPath(pts: { x: number; y: number }[]): string {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 1], p1 = pts[i];
    const midY = (p0.y + p1.y) / 2;
    d += ` C ${p0.x} ${midY} ${p1.x} ${midY} ${p1.x} ${p1.y}`;
  }
  return d;
}

function readStars(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem('sous_level_stars') || '{}') as Record<string, number>;
  } catch { return {}; }
}

// Los <g> del SVG hacen de botón: Enter y espacio deben activarlos como a uno real.
const onActivateKey = (action: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

const LevelModal = ({
  level, wi, status, stars, onClose, onNavigate,
}: {
  level: GameLevel;
  wi: number;
  status: LevelStatus;
  stars: number;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) => {
  const isBoss = level.type === 'boss';
  const world = WORLDS[wi];

  return (
    <Dialog
      title={level.name}
      description={`Nivel ${level.id} · ${world.name}`}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-11 rounded-control border border-neutral-300 text-neutral-800 font-semibold text-sm hover:bg-neutral-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={status === 'locked'}
            onClick={() => level.path && onNavigate(level.path)}
            className={`flex-1 min-h-11 rounded-control font-semibold text-sm transition-opacity ${
              status === 'locked'
                ? 'bg-neutral-200 text-neutral-600 cursor-not-allowed'
                : `${WORLD_BTN[world.id]} text-white hover:opacity-90`
            }`}
          >
            {status === 'completed' ? 'Repetir nivel' : status === 'active' ? 'Empezar nivel' : 'Bloqueado'}
          </button>
        </div>
      }
    >
      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl leading-none" aria-hidden>{level.emoji}</span>
          {status === 'completed' && stars > 0 && (
            <div className="flex gap-1" aria-label={`${stars} de 3 estrellas`}>
              {[0, 1, 2].map(si => (
                <Star
                  key={si}
                  size={18}
                  aria-hidden
                  className={si < stars ? 'text-amber-500' : 'text-neutral-300'}
                  fill={si < stars ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-50 border border-neutral-200 rounded-card p-3">
            <dt className="text-xs text-neutral-600">Tipo</dt>
            <dd className="font-semibold text-neutral-900 text-sm">{isBoss ? 'Jefe' : 'Nivel normal'}</dd>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-card p-3">
            <dt className="text-xs text-neutral-600">Recompensa</dt>
            <dd className="font-semibold text-brand-700 text-sm">+{level.xp} XP</dd>
          </div>
        </dl>

        {status === 'locked' && (
          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-card p-3">
            Completa el nivel anterior para desbloquear este.
          </p>
        )}
      </div>
    </Dialog>
  );
};

export const SkillTreeMap = () => {
  const [selected, setSelected] = useState<{ level: GameLevel; wi: number } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('sous_map_onboarding_seen'); } catch { return false; }
  });
  const navigate = useNavigate();
  const isPremium = isPremiumUser();

  // Se lee en cada render: al volver de un nivel el mapa se monta de nuevo.
  const starsMap = readStars();

  const pts = ALL_LEVELS.map((_, i) => getPos(i));
  const pathD = buildPath(pts);

  const completed = ALL_LEVELS.filter(l => (starsMap[l.path ?? ''] ?? 0) > 0).length;
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const closeOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('sous_map_onboarding_seen', '1'); } catch { /* sin almacenamiento */ }
  };

  return (
    <div className="w-full h-full flex flex-col bg-neutral-50">
      <ScreenHeader
        title="Modo Aventura"
        subtitle={`${completed} de ${ALL_LEVELS.length} niveles`}
        actions={
          <span className="flex items-center gap-1.5 pr-3 text-sm font-semibold text-neutral-900 whitespace-nowrap">
            <Trophy size={16} className="text-brand-700" aria-hidden />
            {user.xp ?? 0} XP
          </span>
        }
      />

      {showOnboarding && (
        <div className="bg-amber-50 border-b border-amber-200 pl-4 pr-1 py-2 flex items-start gap-2 flex-shrink-0">
          <div className="flex-1 min-w-0 py-1">
            <p className="text-sm font-bold text-amber-800">Te damos la bienvenida al Modo Aventura</p>
            <p className="text-sm text-amber-800 mt-0.5 leading-relaxed">
              Toca el nivel marcado con <strong>Jugar</strong>, aprende la técnica y sube una foto de tu resultado.
              Cada nivel que completas te da estrellas, XP y abre el siguiente.
            </p>
          </div>
          <button
            type="button"
            onClick={closeOnboarding}
            aria-label="Cerrar aviso"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control text-amber-800 hover:bg-amber-100 transition-colors"
          >
            <X size={18} aria-hidden />
          </button>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          width="100%"
          style={{ display: 'block' }}
          role="group"
          aria-label="Mapa de niveles"
        >
          <defs>
            <filter id="activeGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {WORLDS.map((_, w) => (
            <rect key={w} x={0} y={w * WORLD_H} width={SVG_W} height={WORLD_H} fill={WCOLS[w].bg} />
          ))}

          {/* La carretera va antes que los banners para que parezca entrar en ellos. */}
          <path d={pathD} fill="none" stroke="#4b5563" strokeWidth={20}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="#d4d4d4" strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="white" strokeWidth={4}
            strokeDasharray="20 18" strokeLinecap="round" />

          {WORLDS.map((world, w) => {
            const by = w * WORLD_H + 10;
            const bh = BANNER_H - 20;
            const bw = SVG_W - 20;
            const done = world.levels.filter(l => (starsMap[l.path ?? ''] ?? 0) > 0).length;
            const pBarW = bw - 70;
            const pBarFill = pBarW * (done / world.levels.length);

            return (
              <g key={w}>
                <rect x={10} y={by} width={bw} height={bh} rx={13} fill={WCOLS[w].main} />
                <text x={32} y={by + bh / 2 + 1} textAnchor="middle" dominantBaseline="central"
                  fontSize={22} aria-hidden>{world.emoji}</text>
                <text x={52} y={by + 17} fontSize={12} fontWeight="800" fill="white"
                  fontFamily={FONT} dominantBaseline="middle">{world.name}</text>
                <text x={52} y={by + 32} fontSize={10} fill="white"
                  fontFamily={FONT} dominantBaseline="middle">{world.subtitle}</text>
                <rect x={52} y={by + bh - 16} width={pBarW} height={5} rx={2.5}
                  fill="rgba(255,255,255,0.3)" />
                <rect x={52} y={by + bh - 16} width={pBarFill} height={5} rx={2.5} fill="white" />
                <text x={52 + pBarW + 6} y={by + bh - 13} fontSize={10} fill="white"
                  fontFamily={FONT} dominantBaseline="middle">{done}/{world.levels.length}</text>
              </g>
            );
          })}

          {ALL_LEVELS.map((level, i) => {
            const { x, y } = getPos(i);
            const wi = Math.floor(i / 4);
            const wc = WCOLS[wi];
            const isBoss = level.type === 'boss';
            const status = getLevelStatus(level, starsMap);
            const r = isBoss ? 33 : 26;
            const stars = starsMap[level.path ?? ''] ?? 0;

            const fill   = status === 'completed' ? wc.main : status === 'active' ? 'white' : '#404040';
            const stroke = status === 'completed' ? wc.dark : status === 'active' ? wc.main : '#525252';
            const sw     = status === 'active' ? 3.5 : 2;

            const hasStars = status === 'completed' && stars > 0;
            const hasBadge = status === 'active';
            // Debajo de la insignia (16 px) o de las estrellas, sin tocarlas.
            const labelY   = y + r + (hasBadge ? 33 : hasStars ? 27 : 14);
            const open = () => setSelected({ level, wi });
            const interactive = status !== 'locked';
            const statusText = status === 'completed'
              ? `completado, ${stars} de 3 estrellas`
              : status === 'active' ? 'disponible' : 'bloqueado';

            return (
              <g
                key={level.id}
                onClick={interactive ? open : undefined}
                onKeyDown={interactive ? onActivateKey(open) : undefined}
                role={interactive ? 'button' : 'img'}
                tabIndex={interactive ? 0 : undefined}
                aria-label={`${level.name}, ${isBoss ? 'jefe' : `nivel ${level.id}`}, ${statusText}`}
                style={{ cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
                className="[&:focus-visible>circle.node]:stroke-brand-700 [&:focus-visible>circle.node]:[stroke-width:5px]"
              >
                {status === 'active' && (
                  <circle cx={x} cy={y} r={r + 10} fill={wc.glow} opacity={0.6} filter="url(#activeGlow)" />
                )}

                {isBoss && status !== 'locked' && (
                  <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#b45309" strokeWidth={2.5}
                    strokeDasharray="7 5" />
                )}

                <circle className="node" cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />

                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontSize={status === 'locked' ? (isBoss ? 19 : 15) : (isBoss ? 22 : 17)} aria-hidden>
                  {status === 'locked' ? '🔒' : level.emoji}
                </text>

                {hasStars && [-9, 0, 9].map((dx, si) => (
                  <text key={si} x={x + dx} y={y + r + 12} textAnchor="middle" dominantBaseline="middle"
                    fontSize={12} fill={si < stars ? '#d97706' : 'rgba(0,0,0,0.2)'} aria-hidden>★</text>
                ))}

                {hasBadge && (
                  <g aria-hidden>
                    <rect x={x - 22} y={y + r + 5} width={44} height={16} rx={8} fill="#c2410c" />
                    <text x={x} y={y + r + 13.5} textAnchor="middle" dominantBaseline="middle"
                      fontSize={10} fontWeight="bold" fill="white" fontFamily={FONT}>Jugar</text>
                  </g>
                )}

                <text x={x} y={labelY} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight="700"
                  fill={status === 'locked' ? '#525252' : wc.label}
                  stroke="white" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
                  fontFamily={FONT} aria-hidden>
                  {level.name}
                </text>
              </g>
            );
          })}

          {!isPremium && WORLDS.map((world, w) => {
            if (!PREMIUM_WORLDS.has(w)) return null;
            const oy = w * WORLD_H;
            const goPremium = () => navigate('/membresia');
            return (
              <g
                key={`plock-${w}`}
                onClick={goPremium}
                onKeyDown={onActivateKey(goPremium)}
                role="button"
                tabIndex={0}
                aria-label={`${world.name} requiere Premium. Ver plan`}
                className="[&:focus-visible>rect:first-child]:[stroke:#fdba74] [&:focus-visible>rect:first-child]:[stroke-width:6px]"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <rect x={0} y={oy} width={SVG_W} height={WORLD_H} fill="rgba(0,0,0,0.6)" />
                <text x={SVG_W / 2} y={oy + WORLD_H / 2 - 36} textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight="700" fill="white" fontFamily={FONT} aria-hidden>
                  {world.name}
                </text>
                <rect x={SVG_W / 2 - 62} y={oy + WORLD_H / 2 - 20} width={124} height={40} rx={20} fill="#c2410c" />
                <text x={SVG_W / 2} y={oy + WORLD_H / 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={12} fontWeight="800" fill="white" fontFamily={FONT} aria-hidden>
                  🔒 Premium: ver plan
                </text>
              </g>
            );
          })}

          <text x={150} y={SVG_H - 32} textAnchor="middle" dominantBaseline="middle" fontSize={28} aria-hidden>🏆</text>
          <text x={150} y={SVG_H - 10} textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fontWeight="800" fill="#78350f" fontFamily={FONT}>Fin del recorrido</text>
        </svg>
      </div>

      {selected && (
        <LevelModal
          level={selected.level}
          wi={selected.wi}
          status={getLevelStatus(selected.level, starsMap)}
          stars={starsMap[selected.level.path ?? ''] ?? 0}
          onClose={() => setSelected(null)}
          onNavigate={path => { setSelected(null); navigate(path); }}
        />
      )}
    </div>
  );
};
