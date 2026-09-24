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
import { Trophy, Star, Check, Lock, Crown, X } from 'lucide-react';
import { WorldIcon } from './ui/WorldIcon';
import { isPremiumUser } from '../utils/membership';
import { Dialog } from './ui/Dialog';
import { WORLDS, LEVELS, getLevelStatus } from '../data/adventure';
import type { PlacedLevel, LevelStatus } from '../data/adventure';
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

const FONT = 'Nunito, system-ui, sans-serif';
const INK = '#251B15';
const MUTED = '#6E5F53';
const CREAM = '#FBF5EC';

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
  const tone = WORLD_TOKENS[world.id];
  const locked = status === 'locked';

  return (
    <Dialog title={level.name} hideTitle onClose={onClose} size="sm">
      <div className="-mx-5 -mt-5 rounded-t-sheet p-6 text-center text-white relative overflow-hidden" style={{ background: tone.main }}>
        <span className="absolute -right-6 -top-6 opacity-15" aria-hidden><WorldIcon world={world.id} size={140} strokeWidth={1.6} /></span>
        <span className="relative mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center" aria-hidden>
          {isBoss ? <Crown size={34} strokeWidth={2.3} /> : <WorldIcon world={world.id} size={32} strokeWidth={2.3} />}
        </span>
        <p className="font-display text-[28px] font-extrabold mt-2 relative leading-tight" aria-hidden>{level.title}</p>
        <p className="text-white/85 text-sm font-bold mt-0.5 relative">{isBoss ? 'Jefe final' : `Nivel ${level.num}`} · {world.name}</p>
        {status === 'completed' && stars > 0 && (
          <div className="flex justify-center gap-1 mt-2 relative" role="img" aria-label={`${stars} de 3 estrellas`}>
            {[0, 1, 2].map(si => (
              <Star key={si} size={22} aria-hidden className={si < stars ? 'text-amber-600 fill-amber-500' : 'text-white/40'} />
            ))}
          </div>
        )}
      </div>

      <div className="pt-5 space-y-3 pb-[env(safe-area-inset-bottom)] sm:pb-0">
        <dl className="grid grid-cols-2 gap-3">
          <div className="card-tactile p-3 text-center">
            <dt className="text-xs text-neutral-500 font-extrabold">Tipo</dt>
            <dd className="font-black text-ink">{isBoss ? 'Jefe' : 'Nivel'}</dd>
          </div>
          <div className="card-tactile p-3 text-center">
            <dt className="text-xs text-neutral-500 font-extrabold">Recompensa</dt>
            <dd className="font-black text-ink flex items-center justify-center gap-1.5"><span className="xp-coin" aria-hidden>XP</span>+{level.xp}</dd>
          </div>
        </dl>

        {locked && (
          <p className="flex items-center justify-center gap-2 text-center text-sm font-bold text-neutral-500 bg-neutral-100 rounded-2xl p-3">
            <Lock size={16} aria-hidden />Completa el nivel anterior para abrir este.
          </p>
        )}

        <button
          type="button"
          disabled={locked}
          onClick={() => onNavigate(level.path)}
          className={`w-full ${locked ? 'min-h-[52px] rounded-2xl font-black bg-neutral-200 text-neutral-500 cursor-not-allowed' : 'btn-3d'}`}
          style={locked ? undefined : { background: tone.main, ['--btn-shadow' as string]: tone.nodeDark }}
        >
          {status === 'completed' ? 'Repetir nivel' : status === 'active' ? 'Jugar' : 'Bloqueado'}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-11 py-2 text-sm font-extrabold text-neutral-500 hover:text-ink transition-colors"
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
  const totalStars = LEVELS.reduce((n, l) => n + (starsMap[l.path] ?? 0), 0);
  const user = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();

  const closeOnboarding = () => {
    setShowOnboarding(false);
    try { localStorage.setItem('sous_map_onboarding_seen', '1'); } catch { /* sin almacenamiento */ }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <header className="px-4 pt-2 pb-3 md:px-6 md:pt-5 flex flex-col gap-3 flex-shrink-0">
        <div>
          <h1 className="text-[32px] font-extrabold text-ink leading-none">Modo Aventura</h1>
          <p className="text-[15px] font-bold text-neutral-500 mt-1">5 mundos, 20 niveles. Cada nivel se gana con una foto.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <span className="pill-stat"><Star size={18} className="text-amber-600 fill-amber-500" aria-hidden />{totalStars} de {LEVELS.length * 3}<span className="sr-only">estrellas</span></span>
          <span className="pill-stat"><Check size={18} strokeWidth={3} className="text-emerald-600" aria-hidden />{completed}/{LEVELS.length} niveles</span>
          <span className="pill-stat"><span className="xp-coin" aria-hidden>XP</span>{user.xp ?? 0}</span>
        </div>
      </header>

      {showOnboarding && (
        <div className="mx-4 mb-3 card-tactile !border-amber-500 !bg-amber-50 pl-4 pr-1 py-2 flex items-start gap-3 flex-shrink-0">
                    <div className="flex-1 min-w-0 py-1">
            <p className="text-[15px] font-black text-ink">Te damos la bienvenida al Modo Aventura</p>
            <p className="text-sm font-semibold text-neutral-600 mt-0.5 leading-relaxed">
              Toca el nivel marcado con <strong>Jugar</strong>, aprende la técnica y sube una foto de tu resultado.
              Cada nivel que completas te da estrellas, XP y abre el siguiente.
            </p>
          </div>
          <button
            type="button"
            onClick={closeOnboarding}
            aria-label="Cerrar aviso"
            className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-control text-neutral-500 hover:text-ink transition-colors"
          >
            <X size={20} aria-hidden />
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
            <rect key={world.id} x={0} y={w * WORLD_H} width={SVG_W} height={WORLD_H} fill={CREAM} />
          ))}

          {/* La carretera va antes que los banners para que parezca entrar en ellos. */}
          <path d={pathD} fill="none" stroke="#EBDFCF" strokeWidth={8}
            strokeLinecap="round" strokeDasharray="1.5 16" />

          {WORLDS.map((world, w) => {
            const by = w * WORLD_H + 10;
            const bh = BANNER_H - 20;
            const bw = SVG_W - 20;
            const done = world.levels.filter(l => (starsMap[l.path] ?? 0) > 0).length;
            const pBarW = bw - 66;
            const pBarFill = pBarW * (done / world.levels.length);

            return (
              <g key={world.id}>
                <rect x={10} y={by + 4} width={bw} height={bh} rx={18} fill={WORLD_TOKENS[world.id].nodeDark} />
                <rect x={10} y={by} width={bw} height={bh} rx={18} fill={WORLD_TOKENS[world.id].main} />
                <rect x={20} y={by + bh / 2 - 17} width={34} height={34} rx={11} fill="rgba(255,255,255,0.18)" />
                <WorldIcon world={world.id} x={27} y={by + bh / 2 - 10} width={20} height={20} color="white" strokeWidth={2.3} />
                <text x={64} y={by + 15} fontSize={8} fontWeight="900" fill="rgba(255,255,255,0.85)" letterSpacing="0.6"
                  fontFamily={FONT} dominantBaseline="middle">{`MUNDO ${world.id} · ${world.subtitle.toUpperCase()}`}</text>
                <text x={64} y={by + 31} fontSize={14} fontWeight="800" fill="white"
                  fontFamily="'Bricolage Grotesque', Nunito, sans-serif" dominantBaseline="middle">{world.name}</text>
                <rect x={64} y={by + bh - 15} width={pBarW - 12} height={6} rx={3}
                  fill="rgba(255,255,255,0.28)" />
                <rect x={64} y={by + bh - 15} width={Math.max(pBarFill - 12 * (done / world.levels.length), done ? 6 : 0)} height={6} rx={3} fill="white" />
                <text x={64 + pBarW - 6} y={by + bh - 12} fontSize={9} fontWeight="900" fill="white"
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

            const locked = status === 'locked';
            const fill   = locked ? '#E9DFD2' : wc.nodeMain;
            const lip    = locked ? '#D6C8B6' : wc.nodeDark;
            const glyph  = locked ? '#9C8A78' : level.world.id === 5 ? INK : 'white';

            const hasStars = status === 'completed' && stars > 0;
            const hasBadge = status === 'active';
            // Debajo de la insignia o de las estrellas, sin tocarlas.
            const labelY   = y + r + (hasBadge ? 38 : hasStars ? 30 : 18);
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
                  <circle cx={x} cy={y} r={r + 8} fill="none" stroke={wc.line} strokeWidth={6} opacity={0.7} />
                )}

                <circle cx={x} cy={y + 5} r={r} fill={lip} />
                <circle className="node" cx={x} cy={y} r={r} fill={fill} />

                {status === 'completed'
                  ? (isBoss
                    ? <Crown x={x - 13} y={y - 13} width={26} height={26} color={glyph} strokeWidth={2.6} aria-hidden />
                    : <Check x={x - 12} y={y - 12} width={24} height={24} color={glyph} strokeWidth={3.2} aria-hidden />)
                  : locked
                  ? (isBoss
                    ? <Crown x={x - 13} y={y - 13} width={26} height={26} color={glyph} strokeWidth={2.4} aria-hidden />
                    : <Lock x={x - 10} y={y - 11} width={20} height={20} color={glyph} strokeWidth={2.4} aria-hidden />)
                  : (isBoss
                    ? <Crown x={x - 14} y={y - 14} width={28} height={28} color={glyph} strokeWidth={2.4} aria-hidden />
                    : <WorldIcon world={level.world.id} x={x - 12} y={y - 12} width={24} height={24} color={glyph} strokeWidth={2.4} />)}

                {hasStars && [-8, 0, 8].map((dx, si) => (
                  <text key={si} x={x + dx} y={y + r + 11} textAnchor="middle" dominantBaseline="middle"
                    fontSize={12} fill={si < stars ? '#F5B800' : '#E2D6C6'} stroke={si < stars ? '#C98F00' : '#CDBFAE'} strokeWidth={0.6} aria-hidden>★</text>
                ))}

                {hasBadge && (
                  <g aria-hidden>
                    <rect x={x - 22} y={y + r + 9} width={44} height={16} rx={8} fill={INK} />
                    <text x={x} y={y + r + 17.5} textAnchor="middle" dominantBaseline="middle"
                      fontSize={9} fontWeight="900" fill="white" fontFamily={FONT}>Jugar</text>
                  </g>
                )}

                <text x={x} y={labelY} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight="900"
                  fill={locked ? MUTED : INK}
                  stroke={CREAM} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round"
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
                <rect x={0} y={oy} width={SVG_W} height={WORLD_H} fill="rgba(37,27,21,0.5)" />
                <rect x={SVG_W / 2 - 72} y={oy + WORLD_H / 2 - 16} width={144} height={36} rx={14} fill="#C98F00" />
                <rect x={SVG_W / 2 - 72} y={oy + WORLD_H / 2 - 20} width={144} height={36} rx={14} fill="#F5B800" />
                <Lock x={SVG_W / 2 - 60} y={oy + WORLD_H / 2 - 9} width={14} height={14} color={INK} strokeWidth={2.6} aria-hidden />
                <text x={SVG_W / 2 + 9} y={oy + WORLD_H / 2 - 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight="900" fill={INK} fontFamily={FONT} aria-hidden>
                  Premium: ver plan
                </text>
                <text x={SVG_W / 2} y={oy + WORLD_H / 2 - 36} textAnchor="middle" dominantBaseline="middle"
                  fontSize={10} fontWeight="800" fill="rgba(255,255,255,0.85)" fontFamily={FONT} aria-hidden>
                  {world.name}
                </text>
              </g>
            );
          })}

          <Trophy x={136} y={SVG_H - 46} width={28} height={28} color="#C98F00" strokeWidth={2.3} aria-hidden />
          <text x={150} y={SVG_H - 10} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fontWeight="900" fill={INK} fontFamily={FONT}>Fin del recorrido</text>
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
