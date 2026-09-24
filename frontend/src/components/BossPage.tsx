/**
 * Pantalla de un jefe del Modo Aventura. `level` trae la identidad del registro
 * y `content` los retos, consejos, receta y textos de `data/levels/<slug>.ts`.
 * Los colores salen de `WORLD_THEME[mundo].boss`.
 *
 * - Cada reto se supera subiendo una foto que `usePhotoEvaluation` puntúa.
 * - Con 1 estrella o más el reto queda superado; con 0 se muestra el motivo y la
 *   foto se quita a los 2,5 s para poder reintentar.
 * - El jefe cae cuando se superan todos los retos: se guardan 3 estrellas y,
 *   solo la primera vez, el XP.
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordLevelResult } from '../utils/progress';
import { useWakeLock } from '../hooks/useWakeLock';
import { usePhotoEvaluation } from '../hooks/usePhotoEvaluation';
import { CheckCircle, ChevronRight, Shield, Swords, Zap, Clock, Users, ChefHat } from 'lucide-react';
import { LevelHeader, LevelProgressBar } from './LevelHeader';
import { PhotoChallenge } from './PhotoChallenge';
import { WORLD_THEME } from '../data/worlds';
import type { BossTheme, WorldId } from '../data/worlds';
import { LEVELS } from '../data/adventure';
import type { PlacedLevel } from '../data/adventure';
import type { BossChallenge, BossContent } from '../data/levels/types';

// Pausa entre el último reto superado y la pantalla de victoria.
const VICTORY_DELAY_MS = 600;
const REJECTED_PHOTO_MS = 2500;

const starsText = (n: number) => `${n} ${n === 1 ? 'estrella' : 'estrellas'} de 3`;

const ChallengeCard = ({
  challenge, bossName, worldId, b, isDone, isExpanded, onToggle, onPassed,
}: {
  challenge: BossChallenge;
  bossName: string;
  worldId: WorldId;
  b: BossTheme;
  isDone: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onPassed: (id: number) => void;
}) => {
  const photo = usePhotoEvaluation({
    subject: challenge.name || 'Reto culinario',
    criteria: [{ stars: '⭐⭐⭐', label: challenge.eval }],
    onPass: () => onPassed(challenge.id),
  });
  const { status, result, clearImage } = photo;
  const isReviewing = status === 'reviewing';
  const panelId = `boss-challenge-${challenge.id}`;

  // Foto inválida o error: se quita la imagen para que pueda reintentar.
  useEffect(() => {
    if (status !== 'rejected') return;
    const t = setTimeout(clearImage, REJECTED_PHOTO_MS);
    return () => clearTimeout(t);
  }, [status, clearImage]);

  return (
    <div
      className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 motion-reduce:transition-none shadow-sm ${
        isDone ? `${b.doneBorder} ${b.doneCardBg}` : 'border-neutral-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full min-h-14 flex items-center gap-3 p-4 text-left"
      >
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${
          isDone ? `${b.doneBg} shadow-sm` : 'bg-neutral-100'
        }`} aria-hidden>
          {isDone ? <CheckCircle size={22} className="text-white" /> : challenge.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-black text-neutral-800 text-sm leading-snug">{challenge.name}</span>
          <span className={`block text-xs mt-0.5 font-semibold ${isDone ? b.text : 'text-neutral-400'}`}>
            {isDone
              ? <><span aria-hidden>{'⭐'.repeat(result?.stars || 3)} </span>Superado · {starsText(result?.stars || 3)}</>
              : 'Pendiente'}
          </span>
        </span>
        <ChevronRight
          size={16}
          aria-hidden
          className={`text-neutral-300 transition-transform duration-200 motion-reduce:transition-none flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div id={panelId} className="px-4 pb-5 border-t border-neutral-100 pt-4 space-y-3">
          <p className="text-sm text-neutral-700 leading-relaxed">{challenge.desc}</p>
          <div className="flex gap-2 bg-neutral-50 border border-neutral-100 rounded-xl p-3">
            <span className="text-neutral-400 text-xs font-black flex-shrink-0 mt-0.5 uppercase">Criterio</span>
            <p className="text-xs text-neutral-600 leading-relaxed min-w-0">{challenge.eval}</p>
          </div>

          <PhotoChallenge
            photo={photo}
            variant="boss"
            worldId={worldId}
            uploadLabel="Toma o sube una foto del reto"
            imageAlt={`Foto del reto ${challenge.name}`}
            reviewingText={`${bossName} está revisando tu foto…`}
          />

          {isDone && result && (
            <div role="status" className="bg-white border border-neutral-100 rounded-xl px-4 py-3 text-center shadow-sm">
              <div className="text-xl mb-1" aria-hidden>{'⭐'.repeat(result.stars)}</div>
              <p className="sr-only">{starsText(result.stars)}</p>
              <p className="text-xs text-neutral-600 italic [overflow-wrap:anywhere]">"{result.feedback}"</p>
            </div>
          )}

          {!isDone && !isReviewing && result && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-red-700">Foto no válida <span aria-hidden>❌</span></p>
              <p className="text-xs text-red-600 mt-1 [overflow-wrap:anywhere]">{result.feedback}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const BossPage = ({ level, content }: { level: PlacedLevel; content: BossContent }) => {
  const {
    bossSubtitle, quote, requirement, nextWorld,
    victoryTitle = '¡Jefe derrotado!', victoryDesc, returnLabel = 'Volver al mapa',
    challenges, tips, mainRecipe,
  } = content;
  const { title: bossName, emoji: bossEmoji, num: levelNum, xp: xpReward } = level;
  const { name: worldName, emoji: worldEmoji } = level.world;
  const isFinalBoss = level.num === LEVELS.length;
  const b = WORLD_THEME[level.world.id].boss;

  // Las recetas de jefe pasan de 45 min y el usuario cocina con las manos ocupadas.
  useWakeLock(true, { mediaSessionTitle: `Jefe: ${bossName}` });

  const navigate = useNavigate();
  const xpAwardedRef = useRef(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const [expandedId, setExpandedId] = useState<number | null>(challenges[0]?.id ?? null);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [firstWin, setFirstWin] = useState(true);

  const allDone = challenges.length > 0 && completedChallenges.size === challenges.length;
  const hpPercent = 100 - (completedChallenges.size / challenges.length) * 100;

  const handlePassed = (id: number) => {
    setCompletedChallenges(prev => new Set(prev).add(id));
  };

  // El progreso se guarda aquí y no dentro de un updater de estado, que
  // StrictMode ejecuta dos veces. La ref evita repetir el XP en la misma visita.
  useEffect(() => {
    if (!allDone) return;
    const t = setTimeout(() => {
      if (!xpAwardedRef.current) {
        xpAwardedRef.current = true;
        const { firstCompletion } = recordLevelResult(level.path, 3, xpReward);
        setFirstWin(firstCompletion);
      }
      setBossDefeated(true);
    }, VICTORY_DELAY_MS);
    return () => clearTimeout(t);
  }, [allDone, level.path, xpReward]);

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <LevelHeader
          gradient={b.header}
          decoration={
            <>
              <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none -mt-4 -mr-6 select-none pointer-events-none">
                {bossEmoji}
              </div>
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/15 -translate-x-8 translate-y-12" />
            </>
          }
          eyebrow={
            <>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${isFinalBoss ? 'bg-white/30 text-white' : 'bg-yellow-400/30 text-yellow-200'}`}>
                <span aria-hidden>{isFinalBoss ? '🏆' : '👑'} </span>{isFinalBoss ? 'Jefe final' : 'Jefe'}
              </span>
              <span className="text-xs text-white/50" aria-hidden>›</span>
              <span className="text-xs font-bold text-white/70"><span aria-hidden>{worldEmoji} </span>{worldName}</span>
            </>
          }
          title={<><span aria-hidden>{bossEmoji} </span>{bossName}</>}
          xp={xpReward}
          xpTone={isFinalBoss ? 'final' : 'boss'}
        >
          <LevelProgressBar
            label="Vida del jefe"
            caption={<><Shield size={10} aria-hidden /> Vida del jefe: {completedChallenges.size} de {challenges.length} retos superados</>}
            percent={hpPercent}
            heightClassName="h-3"
            fillClassName="bg-red-400"
            segments={challenges.length}
          />
        </LevelHeader>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <section className={`bg-gradient-to-br ${b.card} text-white rounded-2xl p-6 relative overflow-hidden border ${b.border}`}>
            <div className="absolute top-0 right-0 text-8xl opacity-15 -mt-4 -mr-4 select-none leading-none pointer-events-none" aria-hidden>
              {bossEmoji}
            </div>
            {isFinalBoss && (
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05),transparent)] pointer-events-none" aria-hidden />
            )}
            <div className="relative">
              <div className="flex items-center gap-4 mb-4">
                <span className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 bg-white/10 border ${b.border} ${isFinalBoss ? 'ring-4 ring-white/20' : ''}`} aria-hidden>
                  {bossEmoji}
                </span>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-widest ${b.text}`}>
                    <span aria-hidden>{isFinalBoss ? '🏆' : '⚔️'} </span>Nivel {levelNum}
                  </p>
                  <h2 className="text-2xl font-black leading-tight">{bossName}</h2>
                  <p className={`text-xs mt-0.5 ${b.textLight}`}>{bossSubtitle}</p>
                </div>
              </div>

              <blockquote className={`text-sm leading-relaxed italic border-l-2 ${b.border} pl-3 ${b.textFaint}`}>
                "{quote}"
              </blockquote>

              <p className={`flex items-center gap-2 mt-4 text-sm font-bold ${isFinalBoss ? 'text-white' : 'text-yellow-400'}`}>
                <Swords size={15} aria-hidden className="flex-shrink-0" /> {requirement}
              </p>
            </div>
          </section>

          {mainRecipe && (
            <section className={`bg-gradient-to-br ${b.card} rounded-2xl overflow-hidden border ${b.border} shadow-lg`}>
              <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
                <span className="text-3xl flex-shrink-0" aria-hidden>{mainRecipe.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${b.text} mb-0.5`}>
                    <ChefHat size={9} className="inline mr-1" aria-hidden />Receta del reto
                  </p>
                  <h3 className="text-lg font-black text-white leading-tight">{mainRecipe.name}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/15 flex-shrink-0 ${b.textLight}`}>
                  {mainRecipe.difficulty}
                </span>
              </div>

              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 border-b border-white/10 ${b.textFaint} text-xs font-semibold`}>
                <span className="flex items-center gap-1.5">
                  <Clock size={12} aria-hidden />{mainRecipe.time}
                </span>
                <span className="w-px h-3 bg-white/20" aria-hidden />
                <span className="flex items-center gap-1.5">
                  <Users size={12} aria-hidden />{mainRecipe.servings}
                </span>
              </div>

              <div className="px-5 pt-4 pb-3">
                <h4 className={`text-[10px] font-black uppercase tracking-widest ${b.text} mb-2`}>Ingredientes</h4>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {mainRecipe.ingredients.map((ing, i) => (
                    ing.trim().endsWith(':') ? (
                      <li key={i} className={`col-span-2 text-[10px] font-black uppercase tracking-widest ${b.textLight} mt-2 first:mt-0`}>
                        {ing.trim().slice(0, -1)}
                      </li>
                    ) : (
                      <li key={i} className={`text-xs ${b.textFaint} flex items-start gap-1.5 min-w-0`}>
                        <span className={`${b.text} font-black flex-shrink-0 mt-0.5`} aria-hidden>·</span>
                        <span className="min-w-0 [overflow-wrap:anywhere]">{ing}</span>
                      </li>
                    )
                  ))}
                </ul>
              </div>

              <div className="px-5 pb-4">
                <h4 className={`text-[10px] font-black uppercase tracking-widest ${b.text} mb-2 mt-1`}>Elaboración</h4>
                <ol className="space-y-2">
                  {mainRecipe.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className={`text-[10px] font-black w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 ${b.textLight}`}>
                        {i + 1}
                      </span>
                      <p className={`text-xs leading-relaxed min-w-0 ${b.textFaint}`}>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {mainRecipe.plating && (
                <div className={`mx-5 mb-5 p-3 rounded-xl bg-white/10 border ${b.border}`}>
                  <h4 className={`text-[10px] font-black uppercase tracking-widest ${b.text} mb-1`}><span aria-hidden>🍽️ </span>Emplatado</h4>
                  <p className={`text-xs leading-relaxed ${b.textFaint}`}>{mainRecipe.plating}</p>
                </div>
              )}
            </section>
          )}

          <section className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
              <h2 className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                <Zap size={13} className="text-amber-500" aria-hidden /> Estrategia para este jefe
              </h2>
            </div>
            <ol className="divide-y divide-amber-50">
              {tips.map((tip, i) => (
                <li key={i} className="px-5 py-3 flex items-start gap-3 text-sm text-amber-900">
                  <span className="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                  <span className="min-w-0">{tip}</span>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {challenges.map((ch, i) => {
              const done = completedChallenges.has(ch.id);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
                  aria-label={`Reto ${i + 1}: ${ch.name}${done ? ', superado' : ''}`}
                  className={`min-h-11 flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
                    done
                      ? `${b.doneBorder} ${b.doneCardBg}`
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                    done ? `${b.doneBg} shadow-sm` : 'bg-neutral-100'
                  }`} aria-hidden>
                    {done ? <CheckCircle size={20} className="text-white" /> : ch.emoji}
                  </span>
                  <span className={`text-[10px] font-bold leading-tight ${done ? b.text : 'text-neutral-500'}`} aria-hidden>
                    {done ? '✓ Superado' : `Reto ${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {challenges.map(challenge => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                bossName={bossName}
                worldId={level.world.id}
                b={b}
                isDone={completedChallenges.has(challenge.id)}
                isExpanded={expandedId === challenge.id}
                onToggle={() => setExpandedId(expandedId === challenge.id ? null : challenge.id)}
                onPassed={handlePassed}
              />
            ))}
          </div>

          {bossDefeated && (
            <section role="status" className={`bg-gradient-to-r ${b.victory} text-white rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden`}>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" aria-hidden />
              <div className="relative">
                <div className="text-6xl mb-4 motion-safe:animate-float" aria-hidden>{isFinalBoss ? '👑' : '🏆'}</div>
                <h2 className={`font-black mb-2 ${isFinalBoss ? 'text-4xl' : 'text-2xl'}`}>{victoryTitle}</h2>
                <p className="text-white/90 text-sm leading-relaxed max-w-sm mx-auto">{victoryDesc}</p>
                <div className="flex justify-center gap-1.5 my-4 text-3xl" role="img" aria-label="3 de 3 estrellas">⭐⭐⭐</div>
                {firstWin ? (
                  <p className={`inline-block font-black text-2xl ${isFinalBoss ? 'text-white' : 'text-yellow-200'} bg-white/20 px-6 py-2 rounded-full`}>
                    +{xpReward} XP
                  </p>
                ) : (
                  <p className="text-sm text-white/90">Ya habías ganado el XP de este jefe.</p>
                )}
                <p className="text-white/80 text-sm mt-4 font-semibold">{nextWorld}</p>
              </div>
            </section>
          )}

          {allDone && bossDefeated && (
            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className={`w-full min-h-12 py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r ${b.return} hover:opacity-90 transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 shadow-lg`}
            >
              <span aria-hidden>🗺️ </span>{returnLabel}
            </button>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
