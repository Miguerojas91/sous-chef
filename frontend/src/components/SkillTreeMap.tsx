/**
 * Mapa del Modo Aventura: un SVG de ~2950 px de alto con los mundos y niveles de
 * `data/adventure.ts` unidos por una carretera en S.
 *
 * - Estado de cada nivel (completado, disponible, bloqueado): `getLevelStatus`.
 * - Los mundos Premium muestran un bloqueo si el usuario no está suscrito.
 * - El aviso de primera visita se oculta para siempre con `sous_map_onboarding_seen`.
 * - Colores: hex de `WORLD_TOKENS` en el SVG y degradados de `WORLD_THEME` en el modal.
 */

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy, ChefHat, Star } from 'lucide-react';
import { isPremiumUser } from '../utils/membership';
import { Dialog } from './ui/Dialog';
import { WORLDS, LEVELS, getLevelStatus } from '../data/adventure';
import type { PlacedLevel, LevelStatus } from '../data/adventure';
import { WORLD_THEME } from '../data/worlds';
import { WORLD_TOKENS } from '../data/worldTokens';
import { readLevelStars } from '../utils/progress';

const SVG_W    = 300;
const BANNER_H = 88;
const NODE_STEP = 122;
const WORLD_H  = BANNER_H + 4 * NODE_STEP;
const PAD_BOT  = 70;
const SVG_H    = WORLDS.length * WORLD_H + PAD_BOT;

// Posición X de cada nivel: dibuja la S. El mundo 4 va en espejo para variar.
const XPOS = [
  240, 150,  60, 150,
  240, 150,  60, 150,
  240, 150,  60, 150,
   60, 150, 240, 150,
  240, 150,  60, 150,
];

const FONT = 'Plus Jakarta Sans, sans-serif';

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

// Los <g> del SVG hacen de botón: Enter y espacio deben activarlos como a uno real.
const onActivateKey = (action: () => void) => (e: KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    action();
  }
};

const LevelModal = ({
  level, status, stars, onClose, onNavigate,
}: {
  level: PlacedLevel;
  status: LevelStatus;
  stars: number;
  onClose: () => void;
  onNavigate: (path: string) => void;
}) => {
  const isBoss = level.kind === 'boss';
  const { world } = level;
  const gradient = WORLD_THEME[world.id].map.gradient;

  // El título del Dialog queda oculto y se pinta dentro del encabezado en degradado.
  return (
    <Dialog title={level.name} hideTitle onClose={onClose} size="sm">
      <div className={`-mx-5 -mt-5 rounded-t-sheet bg-gradient-to-br ${gradient} p-6 text-center text-white relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_top_right,white,transparent)]" aria-hidden />
        <span className="text-5xl block mb-1 relative" aria-hidden>{level.emoji}</span>
        {isBoss && <span className="text-xl relative" aria-hidden>👑</span>}
        <p className="text-xl font-black mt-1 relative" aria-hidden>{level.name}</p>
        <p className="text-white/75 text-sm mt-0.5 relative">Nivel {level.num} · {world.name}</p>
        {status === 'completed' && stars > 0 && (
          <div className="flex justify-center gap-1 mt-2 relative" role="img" aria-label={`${stars} de 3 estrellas`}>
            {[0, 1, 2].map(si => (
              <Star
                key={si}
                size={16}
                aria-hidden
                className={si < stars ? 'text-yellow-300 fill-yellow-300' : 'text-white/30'}
                fill={si < stars ? 'currentColor' : 'none'}
              />
            ))}
          </div>
        )}
      </div>

      <div className="pt-5 space-y-3 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <dl className="grid grid-cols-2 gap-3">
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <dt className="text-xs text-neutral-400 font-medium">Tipo</dt>
            <dd className="font-bold text-neutral-800 text-sm"><span aria-hidden>{isBoss ? '⚔️' : '🎯'} </span>{isBoss ? 'Jefe' : 'Normal'}</dd>
          </div>
          <div className="bg-neutral-50 rounded-xl p-3 text-center">
            <dt className="text-xs text-neutral-400 font-medium">Recompensa</dt>
            <dd className="font-bold text-orange-600 text-sm">+{level.xp} XP</dd>
          </div>
        </dl>

        {status === 'locked' && (
          <p className="text-center text-sm text-neutral-500 bg-neutral-50 rounded-xl p-3">
            <span aria-hidden>🔒 </span>Completa el nivel anterior para desbloquear este.
          </p>
        )}

        <button
          type="button"
          disabled={status === 'locked'}
          onClick={() => onNavigate(level.path)}
          className={`w-full min-h-11 py-3 rounded-xl font-black text-white transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
            status === 'locked'
              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              : `bg-gradient-to-r ${gradient} hover:opacity-90 shadow-lg`
          }`}
        >
          {status === 'completed'
            ? <><span aria-hidden>🔄 </span>Repetir nivel</>
            : status === 'active'
            ? <><span aria-hidden>🚀 </span>¡Comenzar!</>
            : <><span aria-hidden>🔒 </span>Bloqueado</>}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-11 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </Dialog>
  );
};

export const SkillTreeMap = () => {
  const [selected, setSelected] = useState<PlacedLevel | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    try { return !localStorage.getItem('sous_map_onboarding_seen'); } catch { return false; }
  });
  const navigate = useNavigate();
  const isPremium = isPremiumUser();

  // Se lee en cada render: al volver de un nivel el mapa se monta de nuevo.
  const starsMap = readLevelStars();

  const pts = LEVELS.map((_, i) => getPos(i));
  const pathD = buildPath(pts);

  const completed = LEVELS.filter(l => (starsMap[l.path] ?? 0) > 0).length;
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const closeOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('sous_map_onboarding_seen', '1'); } catch { /* sin almacenamiento */ }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat size={19} aria-hidden className="flex-shrink-0" />
          <h1 className="font-black text-base leading-tight">Modo Aventura</h1>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Flame size={14} className="text-yellow-300" aria-hidden />
            <span className="font-bold text-sm whitespace-nowrap">{completed}/{LEVELS.length} niveles</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={14} className="text-yellow-300" aria-hidden />
            <span className="font-bold text-sm whitespace-nowrap">{user.xp ?? 0} XP</span>
          </div>
        </div>
      </header>

      {showOnboarding && (
        <div className="bg-amber-50 border-b border-amber-200 pl-4 pr-1 py-2 flex items-start gap-3 flex-shrink-0">
          <span className="text-2xl flex-shrink-0 py-1" aria-hidden>🗺️</span>
          <div className="flex-1 min-w-0 py-1">
            <p className="text-sm font-black text-amber-800">Te damos la bienvenida al Modo Aventura</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Toca el nivel marcado con <strong>¡Jugar!</strong>, aprende la técnica y sube una foto de tu resultado.
              Cada nivel que completas te da estrellas, XP y abre el siguiente.
            </p>
          </div>
          <button
            type="button"
            onClick={closeOnboarding}
            aria-label="Cerrar aviso"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control text-amber-500 hover:text-amber-700 transition-colors text-lg leading-none"
          >
            <span aria-hidden>✕</span>
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
            {WORLDS.map(world => (
              <linearGradient key={world.id} id={`wg${world.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={WORLD_TOKENS[world.id].main} />
                <stop offset="100%" stopColor={WORLD_TOKENS[world.id].bannerB} />
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

          {WORLDS.map((world, w) => (
            <rect key={world.id} x={0} y={w * WORLD_H} width={SVG_W} height={WORLD_H} fill={WORLD_TOKENS[world.id].soft} />
          ))}

          {/* La carretera va antes que los banners para que parezca entrar en ellos. */}
          <path d={pathD} fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth={24}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="#6b7280" strokeWidth={20}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="#d1d5db" strokeWidth={14}
            strokeLinecap="round" strokeLinejoin="round" />
          <path d={pathD} fill="none" stroke="white" strokeWidth={4}
            strokeDasharray="20 18" strokeLinecap="round" opacity={0.9} />

          {WORLDS.map((world, w) => {
            const by = w * WORLD_H + 10;
            const bh = BANNER_H - 20;
            const bw = SVG_W - 20;
            const done = world.levels.filter(l => (starsMap[l.path] ?? 0) > 0).length;
            const pBarW = bw - 66;
            const pBarFill = pBarW * (done / world.levels.length);

            return (
              <g key={world.id} filter="url(#bannerShadow)">
                <rect x={10} y={by} width={bw} height={bh} rx={13} fill={`url(#wg${world.id})`} />
                <rect x={10} y={by} width={bw} height={bh / 2} rx={13} fill="white" opacity={0.1} />
                <text x={32} y={by + bh / 2 + 1} textAnchor="middle" dominantBaseline="central"
                  fontSize={22} aria-hidden>{world.emoji}</text>
                <text x={52} y={by + 16} fontSize={11} fontWeight="800" fill="white"
                  fontFamily={FONT} dominantBaseline="middle">{world.name}</text>
                <text x={52} y={by + 30} fontSize={8.5} fill="rgba(255,255,255,0.82)"
                  fontFamily={FONT} dominantBaseline="middle">{world.subtitle}</text>
                <rect x={52} y={by + bh - 16} width={pBarW} height={5} rx={2.5}
                  fill="rgba(255,255,255,0.28)" />
                <rect x={52} y={by + bh - 16} width={pBarFill} height={5} rx={2.5} fill="white" />
                <text x={52 + pBarW + 6} y={by + bh - 13} fontSize={7.5} fill="rgba(255,255,255,0.88)"
                  fontFamily={FONT} dominantBaseline="middle">{done}/{world.levels.length}</text>
              </g>
            );
          })}

          {LEVELS.map((level, i) => {
            const { x, y } = getPos(i);
            const wc = WORLD_TOKENS[level.world.id];
            const isBoss = level.kind === 'boss';
            const status = getLevelStatus(level.path, starsMap);
            const r = isBoss ? 33 : 26;
            const stars = starsMap[level.path] ?? 0;

            const fill   = status === 'completed' ? wc.nodeMain : status === 'active' ? 'white' : '#374151';
            const stroke = status === 'completed' ? wc.nodeDark : status === 'active' ? wc.nodeMain : '#4b5563';
            const sw     = status === 'active' ? 3.5 : 2;

            const hasStars = status === 'completed' && stars > 0;
            const hasBadge = status === 'active';
            // Debajo de la insignia o de las estrellas, sin tocarlas.
            const labelY   = y + r + (hasBadge ? 33 : hasStars ? 27 : 14);
            const open = () => setSelected(level);
            const interactive = status !== 'locked';
            const statusText = status === 'completed'
              ? `completado, ${stars} de 3 estrellas`
              : status === 'active' ? 'disponible' : 'bloqueado';

            return (
              <g
                key={level.path}
                onClick={interactive ? open : undefined}
                onKeyDown={interactive ? onActivateKey(open) : undefined}
                role={interactive ? 'button' : 'img'}
                tabIndex={interactive ? 0 : undefined}
                aria-label={`${level.name}, ${isBoss ? 'jefe' : `nivel ${level.num}`}, ${statusText}`}
                style={{ cursor: interactive ? 'pointer' : 'default', outline: 'none' }}
                className="[&:focus-visible>circle.node]:stroke-brand-700 [&:focus-visible>circle.node]:[stroke-width:5px]"
              >
                {status === 'active' && (
                  <circle cx={x} cy={y} r={r + 10} fill={wc.line} opacity={0.45} filter="url(#activeGlow)" />
                )}

                {isBoss && status !== 'locked' && (
                  <circle cx={x} cy={y} r={r + 6} fill="none" stroke="#fbbf24" strokeWidth={2.5}
                    strokeDasharray="7 5" />
                )}

                <circle cx={x} cy={y + 2.5} r={r} fill="rgba(0,0,0,0.18)" filter="url(#nodeShadow)" />

                <circle className="node" cx={x} cy={y} r={r} fill={fill} stroke={stroke} strokeWidth={sw} />

                {status === 'completed' && (
                  <circle cx={x} cy={y} r={r - 5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
                )}

                <text x={x} y={y} textAnchor="middle" dominantBaseline="central"
                  fontSize={status === 'locked' ? (isBoss ? 19 : 15) : (isBoss ? 22 : 17)} aria-hidden>
                  {status === 'locked' ? '🔒' : level.emoji}
                </text>

                {isBoss && status !== 'locked' && (
                  <text x={x} y={y - r - 5} textAnchor="middle" dominantBaseline="auto"
                    fontSize={15} aria-hidden>👑</text>
                )}

                {hasStars && [-8, 0, 8].map((dx, si) => (
                  <text key={si} x={x + dx} y={y + r + 11} textAnchor="middle" dominantBaseline="middle"
                    fontSize={10} fill={si < stars ? '#fbbf24' : 'rgba(0,0,0,0.18)'} aria-hidden>★</text>
                ))}

                {hasBadge && (
                  <g aria-hidden>
                    <rect x={x - 20} y={y + r + 5} width={40} height={14} rx={7} fill="#f97316" />
                    <text x={x} y={y + r + 13} textAnchor="middle" dominantBaseline="middle"
                      fontSize={8} fontWeight="bold" fill="white" fontFamily={FONT}>¡Jugar!</text>
                  </g>
                )}

                <text x={x} y={labelY} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fontWeight="700"
                  fill={status === 'locked' ? '#9ca3af' : wc.label}
                  stroke="white" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
                  fontFamily={FONT} aria-hidden>
                  {level.name}
                </text>
              </g>
            );
          })}

          {!isPremium && WORLDS.map((world, w) => {
            if (!world.premium) return null;
            const oy = w * WORLD_H;
            const goPremium = () => navigate('/membresia');
            return (
              <g
                key={`plock-${world.id}`}
                onClick={goPremium}
                onKeyDown={onActivateKey(goPremium)}
                role="button"
                tabIndex={0}
                aria-label={`${world.name} requiere Premium. Ver plan`}
                className="[&:focus-visible>rect:first-child]:[stroke:#fdba74] [&:focus-visible>rect:first-child]:[stroke-width:6px]"
                style={{ cursor: 'pointer', outline: 'none' }}
              >
                <rect x={0} y={oy} width={SVG_W} height={WORLD_H} fill="rgba(0,0,0,0.55)" />
                <rect x={SVG_W / 2 - 52} y={oy + WORLD_H / 2 - 22} width={104} height={44} rx={22}
                  fill="#f97316" filter="url(#nodeShadow)" />
                <text x={SVG_W / 2} y={oy + WORLD_H / 2 - 5} textAnchor="middle" dominantBaseline="middle"
                  fontSize={18} aria-hidden>👑🔒</text>
                <text x={SVG_W / 2} y={oy + WORLD_H / 2 + 12} textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fontWeight="800" fill="white" fontFamily={FONT} aria-hidden>
                  Premium: ver plan
                </text>
                <text x={SVG_W / 2} y={oy + WORLD_H / 2 - 38} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9} fill="rgba(255,255,255,0.6)" fontFamily={FONT} aria-hidden>
                  {world.name}
                </text>
              </g>
            );
          })}

          <text x={150} y={SVG_H - 30} textAnchor="middle" dominantBaseline="middle" fontSize={28} aria-hidden>🏆</text>
          <text x={150} y={SVG_H - 10} textAnchor="middle" dominantBaseline="middle"
            fontSize={9} fontWeight="800" fill="#78350f" fontFamily={FONT}>Fin del recorrido</text>
        </svg>
      </div>

      {selected && (
        <LevelModal
          level={selected}
          status={getLevelStatus(selected.path, starsMap)}
          stars={starsMap[selected.path] ?? 0}
          onClose={() => setSelected(null)}
          onNavigate={path => { setSelected(null); navigate(path); }}
        />
      )}
    </div>
  );
};
