/**
 * Pantalla de un jefe del Modo Aventura. `level` trae la identidad del registro
 * y `content` los retos, consejos, receta y textos de `data/levels/<slug>.ts`.
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
import { CheckCircle, ChevronRight, Swords, Clock, Users, Star, Trophy } from 'lucide-react';
import { LevelHeader, LevelProgressBar } from './LevelHeader';
import { PhotoChallenge } from './PhotoChallenge';
import { WORLD_CLASSES } from '../data/worlds';
import type { WorldClasses } from '../data/worlds';
import { LEVELS } from '../data/adventure';
import type { PlacedLevel } from '../data/adventure';
import type { BossChallenge, BossContent } from '../data/levels/types';

// Pausa entre el último reto superado y la pantalla de victoria.
const VICTORY_DELAY_MS = 600;
const REJECTED_PHOTO_MS = 2500;

const starsText = (n: number) => `${n} ${n === 1 ? 'estrella' : 'estrellas'} de 3`;

const ChallengeCard = ({
  challenge, bossName, w, isDone, isExpanded, onToggle, onPassed,
}: {
  challenge: BossChallenge;
  bossName: string;
  w: WorldClasses;
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
      className={`rounded-card border overflow-hidden transition-colors ${
        isDone ? `${w.line} ${w.soft}` : 'border-neutral-200 bg-white'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={panelId}
        className="w-full min-h-14 flex items-center gap-3 p-4 text-left"
      >
        <span className="w-9 flex items-center justify-center text-2xl flex-shrink-0" aria-hidden>
          {isDone ? <CheckCircle size={26} className={w.text} /> : challenge.emoji}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-bold text-neutral-900 text-sm leading-snug">{challenge.name}</span>
          <span className={`block text-sm mt-0.5 font-semibold ${isDone ? w.text : 'text-neutral-600'}`}>
            {isDone ? `Superado · ${starsText(result?.stars || 3)}` : 'Pendiente'}
          </span>
        </span>
        <ChevronRight
          size={20}
          aria-hidden
          className={`text-neutral-500 transition-transform motion-reduce:transition-none flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div id={panelId} className="px-4 pb-5 border-t border-neutral-200 pt-4 space-y-3">
          <p className="text-sm text-neutral-800 leading-relaxed">{challenge.desc}</p>
          <p className="text-sm bg-white border border-neutral-200 rounded-control p-3 text-neutral-700 leading-relaxed">
            <strong className="font-semibold text-neutral-900">Criterio: </strong>{challenge.eval}
          </p>

          <PhotoChallenge
            photo={photo}
            w={w}
            uploadLabel="Toma o sube una foto del reto"
            imageAlt={`Foto del reto ${challenge.name}`}
            reviewingText={`${bossName} está revisando tu foto…`}
          />

          {isDone && result && (
            <div role="status" className="bg-white border border-neutral-200 rounded-control px-4 py-3">
              <p className="text-sm font-semibold text-neutral-900">{starsText(result.stars)}</p>
              <p className="text-sm text-neutral-700 mt-1 [overflow-wrap:anywhere]">{result.feedback}</p>
            </div>
          )}

          {!isDone && !isReviewing && result && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-control px-4 py-3">
              <p className="text-sm font-semibold text-red-800">Foto no válida</p>
              <p className="text-sm text-red-800 mt-1 [overflow-wrap:anywhere]">{result.feedback}</p>
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
  const worldName = level.world.name;
  const isFinalBoss = level.num === LEVELS.length;
  const w = WORLD_CLASSES[level.world.id];

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
      <LevelHeader
        title={bossName}
        subtitle={`${isFinalBoss ? 'Jefe final' : 'Jefe'} · ${worldName}`}
        xp={xpReward}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="bg-white border-b border-neutral-200">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <LevelProgressBar
              tone="light"
              label="Vida del jefe"
              caption={`Vida del jefe: ${completedChallenges.size} de ${challenges.length} retos superados`}
              percent={hpPercent}
              fillClassName={hpPercent < 25 ? 'bg-red-700' : w.bg}
              segments={challenges.length}
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
          <section className={`${w.bg} text-white rounded-card p-5`}>
            <div className="flex items-center gap-4 mb-4">
              <span className="w-16 h-16 flex items-center justify-center text-5xl leading-none flex-shrink-0" aria-hidden>
                {bossEmoji}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Nivel {levelNum}</p>
                <h2 className="text-xl md:text-2xl font-extrabold leading-tight">{bossName}</h2>
                <p className="text-sm text-white">{bossSubtitle}</p>
              </div>
            </div>

            <blockquote className="text-sm leading-relaxed border-l-2 border-white/50 pl-3 text-white">
              {quote}
            </blockquote>

            <p className="flex items-center gap-2 mt-4 text-sm font-semibold text-white">
              <Swords size={16} aria-hidden /> {requirement}
            </p>
          </section>

          {mainRecipe && (
            <section className="bg-neutral-900 text-white rounded-card overflow-hidden border border-neutral-800">
              <div className="px-4 py-4 flex items-center gap-3 border-b border-neutral-800">
                <span className="text-3xl flex-shrink-0" aria-hidden>{mainRecipe.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-neutral-300">Receta del reto</p>
                  <h3 className="text-lg font-extrabold text-white leading-tight">{mainRecipe.name}</h3>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 border-b border-neutral-800 text-neutral-200 text-sm">
                <span className="flex items-center gap-1.5"><Clock size={14} aria-hidden />{mainRecipe.time}</span>
                <span className="flex items-center gap-1.5"><Users size={14} aria-hidden />{mainRecipe.servings}</span>
                <span>{mainRecipe.difficulty}</span>
              </div>

              <div className="px-4 pt-4 pb-3">
                <h4 className="text-sm font-semibold text-neutral-300 mb-2">Ingredientes</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {mainRecipe.ingredients.map((ing, i) => (
                    ing.trim().endsWith(':') ? (
                      <li key={i} className="sm:col-span-2 text-sm font-semibold text-white mt-2 first:mt-0">
                        {ing.trim().slice(0, -1)}
                      </li>
                    ) : (
                      <li key={i} className="text-sm text-neutral-200 flex items-start gap-2">
                        <span className="text-neutral-400 flex-shrink-0" aria-hidden>·</span>
                        <span className="min-w-0">{ing}</span>
                      </li>
                    )
                  ))}
                </ul>
              </div>

              <div className="px-4 pb-4">
                <h4 className="text-sm font-semibold text-neutral-300 mb-2 mt-1">Elaboración</h4>
                <ol className="space-y-2.5">
                  {mainRecipe.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-xs font-bold w-6 h-6 rounded-full bg-neutral-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-neutral-200 min-w-0">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>

              {mainRecipe.plating && (
                <div className="mx-4 mb-4 p-3 rounded-control bg-neutral-800 border border-neutral-700">
                  <h4 className="text-sm font-semibold text-neutral-300 mb-1">Emplatado</h4>
                  <p className="text-sm leading-relaxed text-neutral-200">{mainRecipe.plating}</p>
                </div>
              )}
            </section>
          )}

          <section className="bg-white border border-neutral-200 rounded-card overflow-hidden">
            <h2 className="px-4 py-3 border-b border-neutral-200 text-sm font-semibold text-neutral-900">
              Estrategia para este jefe
            </h2>
            <ol className="divide-y divide-neutral-100">
              {tips.map((tip, i) => (
                <li key={i} className="px-4 py-3 flex items-start gap-3 text-sm text-neutral-800">
                  <span className="text-neutral-600 font-bold flex-shrink-0">{i + 1}.</span>
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
                  className={`min-h-11 flex flex-col items-center gap-1 p-3 rounded-card border transition-colors text-center ${
                    done ? `${w.line} ${w.soft}` : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <span className="h-8 flex items-center justify-center text-2xl" aria-hidden>
                    {done ? <CheckCircle size={26} className={w.text} /> : ch.emoji}
                  </span>
                  <span className={`text-sm font-semibold leading-tight ${done ? w.text : 'text-neutral-700'}`} aria-hidden>
                    {done ? 'Superado' : `Reto ${i + 1}`}
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
                w={w}
                isDone={completedChallenges.has(challenge.id)}
                isExpanded={expandedId === challenge.id}
                onToggle={() => setExpandedId(expandedId === challenge.id ? null : challenge.id)}
                onPassed={handlePassed}
              />
            ))}
          </div>

          {bossDefeated && (
            <section role="status" className={`${w.bg} text-white rounded-card p-6 text-center`}>
              <Trophy size={48} className="mx-auto mb-3 motion-safe:animate-pop" aria-hidden />
              <h2 className="font-extrabold mb-2 text-2xl md:text-3xl">{victoryTitle}</h2>
              <p className="text-white text-sm leading-relaxed max-w-sm mx-auto">{victoryDesc}</p>
              <div className="flex justify-center gap-1.5 my-4" aria-label="3 de 3 estrellas">
                {[0, 1, 2].map(i => <Star key={i} size={28} fill="currentColor" aria-hidden />)}
              </div>
              {firstWin ? (
                <p className="inline-block font-extrabold text-xl text-white bg-black/20 px-5 py-1.5 rounded-full">
                  +{xpReward} XP
                </p>
              ) : (
                <p className="text-sm text-white">Ya habías ganado el XP de este jefe.</p>
              )}
              <p className="text-white text-sm mt-4 font-semibold">{nextWorld}</p>
            </section>
          )}

          {allDone && bossDefeated && (
            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className={`w-full min-h-12 rounded-control font-bold text-white text-base ${w.bg} hover:opacity-90 transition-opacity`}
            >
              {returnLabel}
            </button>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
