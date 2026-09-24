/**
 * Pantalla de un nivel normal del Modo Aventura. `level` trae la identidad
 * (nombre, emoji, XP, número y mundo) del registro y `content` el contenido de
 * `data/levels/<slug>.ts`. Los colores salen de `WORLD_THEME[mundo].level`.
 *
 * - Aprende: acordeón de pasos. Los pasos hechos persisten en `sous_steps_{ruta}`.
 * - Evalúa: el usuario sube una foto y `usePhotoEvaluation` la puntúa.
 *   Con 1 estrella o más se guarda la puntuación y, solo la primera vez, el XP.
 *   Con 0 estrellas se muestra el motivo y no se marca el nivel.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { recordLevelResult } from '../utils/progress';
import { useWakeLock } from '../hooks/useWakeLock';
import { usePhotoEvaluation } from '../hooks/usePhotoEvaluation';
import { track, Events } from '../utils/analytics';
import {
  BookOpen, Star, ChevronRight, Lightbulb, CheckCircle,
  AlertTriangle, Camera, Trophy, Clock, Users, BarChart2, Play,
} from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { BlockZone } from './cms/BlockZone';
import { SafeText } from '../utils/safeText';
import { LevelHeader, LevelProgressBar } from './LevelHeader';
import { PhotoChallenge } from './PhotoChallenge';
import { WORLD_THEME } from '../data/worlds';
import type { PlacedLevel } from '../data/adventure';
import type { LevelContent } from '../data/levels/types';

export const LevelPage = ({ level, content }: { level: PlacedLevel; content: LevelContent }) => {
  const { missionText, missionTags, steps, errors, recipe, challengeHint, evaluationCriteria } = content;
  const { num: levelNum, title: levelName, emoji: levelEmoji, xp: xpReward } = level;
  const { name: worldName, emoji: worldEmoji } = level.world;
  const t = WORLD_THEME[level.world.id].level;

  // El usuario tiene las manos en la tabla o la sartén: la pantalla no debe apagarse.
  useWakeLock(true, { mediaSessionTitle: `Cocinando: ${levelName}` });

  useEffect(() => {
    track(Events.LevelOpened, { level: levelName, world: worldName });
  }, [levelName, worldName]);

  const navigate = useNavigate();

  const stepsKey = `sous_steps_${level.path}`;
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() => {
    try {
      const raw = localStorage.getItem(stepsKey);
      return raw ? new Set<number>(JSON.parse(raw) as number[]) : new Set();
    } catch { return new Set(); }
  });
  const [xpEarned, setXpEarned] = useState(0);
  const [showRecipe, setShowRecipe] = useState(false);

  const photo = usePhotoEvaluation({
    subject: levelName,
    criteria: evaluationCriteria,
    onSubmit: () => track(Events.LevelPhotoSubmitted, { level: levelName, world: worldName }),
    onFail: () => track(Events.LevelEvalFailed, { level: levelName, stars: 0 }),
    onPass: (result) => {
      const { firstCompletion } = recordLevelResult(level.path, result.stars, xpReward);
      const earned = firstCompletion ? xpReward : 0;
      setXpEarned(earned);
      track(Events.LevelCompleted, {
        level: levelName,
        world: worldName,
        stars: result.stars,
        first_completion: firstCompletion,
        xp_earned: earned,
      });
    },
  });
  const { image: uploadedImage, status: uploadState, result: evaluationResult } = photo;

  const allStepsComplete = completedSteps.size === steps.length;
  const progress = steps.length ? (completedSteps.size / steps.length) * 100 : 0;

  const handleMarkStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      try { localStorage.setItem(stepsKey, JSON.stringify([...next])); } catch { /* sin almacenamiento */ }
      return next;
    });
  };

  const resetPhoto = () => {
    photo.reset();
    setXpEarned(0);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <LevelHeader
          gradient={t.gradient}
          decoration={
            <>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
              <div className="absolute bottom-0 left-12 w-24 h-24 rounded-full bg-black/10 translate-y-10" />
            </>
          }
          eyebrow={
            <>
              <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                <span aria-hidden>{worldEmoji} </span>
                <EditableText elementKey={`lvl_${levelNum}_worldName`} defaultText={worldName} />
              </span>
              <span className="text-xs text-white/50" aria-hidden>›</span>
              <span className="text-xs font-bold text-white/70">Nivel {levelNum}</span>
            </>
          }
          title={
            <>
              <span aria-hidden><EditableText elementKey={`lvl_${levelNum}_levelEmoji`} defaultText={levelEmoji} /></span>{' '}
              <EditableText elementKey={`lvl_${levelNum}_levelName`} defaultText={levelName} />
            </>
          }
          xp={xpReward}
        >
          <LevelProgressBar
            label="Pasos completados"
            caption={`${completedSteps.size} de ${steps.length} pasos`}
            percent={progress}
            heightClassName="h-2.5"
            fillClassName="bg-yellow-300 rounded-full"
          />
        </LevelHeader>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          <button
            type="button"
            onClick={() => navigate('/academia')}
            className="w-full min-h-14 flex items-center gap-3 bg-white border border-violet-100 rounded-2xl px-4 py-3 hover:bg-violet-50 transition-colors group text-left shadow-sm"
          >
            <span className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-300" aria-hidden>
              <BookOpen size={18} className="text-white" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-violet-700 text-sm truncate">
                <EditableText elementKey={`lvl_${levelNum}_link_acad`} defaultText={`Clase en la Academia: ${levelName}`} as="span" />
              </span>
              <span className="block text-xs text-violet-400">
                <EditableText elementKey={`lvl_${levelNum}_link_acad_desc`} defaultText="Teoría, técnica y errores comunes" as="span" />
              </span>
            </span>
            <ChevronRight size={16} className="text-violet-300 group-hover:translate-x-1 transition-transform motion-reduce:transition-none flex-shrink-0" aria-hidden />
          </button>

          <section className={`bg-white border ${t.accentBorder} rounded-2xl overflow-hidden shadow-sm`}>
            <div className={`bg-gradient-to-br ${t.accentBg} to-white px-5 py-4`}>
              <div className="flex items-start gap-3">
                <span className="text-3xl leading-none mt-0.5" aria-hidden>🎯</span>
                <div className="flex-1 min-w-0">
                  <h2 className={`font-black ${t.accentDark} text-base mb-1`}>
                    <EditableText elementKey={`lvl_${levelNum}_missionTitle`} defaultText="Tu misión" />
                  </h2>
                  {/* SafeText admite **negrita** y <strong> sin innerHTML, así no abre un XSS si el texto pasa a ser dinámico. */}
                  <div className={`${t.accentText} text-sm leading-relaxed`}>
                    <SafeText text={missionText} />
                  </div>
                </div>
              </div>
            </div>
            <ul className={`border-t ${t.accentBorder} px-5 py-3 flex flex-wrap gap-2`}>
              {missionTags.map((tag, i) => (
                <li key={i} className={`flex items-center gap-1 text-xs font-bold ${t.accentBg} ${t.accentText} border ${t.accentBorder} px-2.5 py-1 rounded-full`}>
                  <span aria-hidden>{tag.icon}</span> {tag.label}
                </li>
              ))}
              <li className="flex items-center gap-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full">
                <Star size={10} fill="currentColor" aria-hidden /> Hasta 3 estrellas
              </li>
            </ul>
          </section>

          {recipe && (
            <section className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => setShowRecipe(!showRecipe)}
                aria-expanded={showRecipe}
                className="w-full min-h-14 flex items-center justify-between gap-3 px-5 py-4 hover:bg-neutral-50 transition-colors"
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0" aria-hidden>
                    <span className="text-lg">📋</span>
                  </span>
                  <span className="text-left min-w-0">
                    <span className="block font-bold text-neutral-800 text-sm">Receta: {recipe.name}</span>
                    <span className="block text-xs text-neutral-400">{recipe.servings} · {recipe.time} · {recipe.difficulty}</span>
                  </span>
                </span>
                <ChevronRight size={16} aria-hidden className={`text-neutral-400 flex-shrink-0 transition-transform duration-300 motion-reduce:transition-none ${showRecipe ? 'rotate-90' : ''}`} />
              </button>

              {showRecipe && (
                <div className="border-t border-neutral-100">
                  <p className="text-sm text-neutral-500 px-5 pt-4 pb-2 leading-relaxed">{recipe.description}</p>

                  <dl className="grid grid-cols-3 gap-3 px-5 pb-4">
                    {[
                      { icon: <Users size={14} aria-hidden />, label: 'Porciones', val: recipe.servings },
                      { icon: <Clock size={14} aria-hidden />, label: 'Tiempo', val: recipe.time },
                      { icon: <BarChart2 size={14} aria-hidden />, label: 'Dificultad', val: recipe.difficulty },
                    ].map((m, i) => (
                      <div key={i} className={`${t.accentBg} border ${t.accentBorder} rounded-xl p-3 text-center min-w-0`}>
                        <div className={`flex justify-center mb-1 ${t.accentText}`}>{m.icon}</div>
                        <dt className="text-[10px] text-neutral-400 font-medium">{m.label}</dt>
                        <dd className={`font-bold ${t.accentDark} text-sm mt-0.5 [overflow-wrap:anywhere]`}>{m.val}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="px-5 pb-4 space-y-4">
                    <div>
                      <h3 className="font-bold text-neutral-700 text-sm mb-2.5 flex items-center gap-2">
                        <span aria-hidden>🧂</span> <span>Ingredientes</span>
                      </h3>
                      <ul className="space-y-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                            <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${t.solid}`} aria-hidden />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-700 text-sm mb-2.5 flex items-center gap-2">
                        <span aria-hidden>👨‍🍳</span> <span>Preparación</span>
                      </h3>
                      <ol className="space-y-2.5">
                        {recipe.method.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-neutral-700">
                            <span className={`w-6 h-6 rounded-full ${t.stepActiveBg} ${t.stepActiveTxt} flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5`}>{i + 1}</span>
                            <span className="leading-relaxed pt-0.5 min-w-0">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          <section>
            <h2 className="text-base font-black text-neutral-800 mb-3 flex items-center gap-2">
              <span className={`w-7 h-7 rounded-lg ${t.stepActiveBg} ${t.stepActiveTxt} flex items-center justify-center`} aria-hidden>
                <Play size={14} fill="currentColor" />
              </span>
              Instrucciones paso a paso
            </h2>
            <div className="space-y-2.5">
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                const isDone = completedSteps.has(i);
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-2xl border-2 transition-all duration-200 motion-reduce:transition-none overflow-hidden shadow-sm ${
                      isDone
                        ? `${t.accentBorder} bg-gradient-to-r ${t.accentBg} to-white`
                        : isActive
                        ? `${t.accentBorder} shadow-md`
                        : 'border-neutral-100 hover:border-neutral-200'
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full min-h-14 flex items-center gap-3 p-4 text-left"
                      onClick={() => setActiveStep(isActive ? -1 : i)}
                      aria-expanded={isActive}
                    >
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm transition-all duration-200 motion-reduce:transition-none ${
                        isDone
                          ? `${t.solid} text-white shadow-sm`
                          : isActive
                          ? `${t.stepActiveBg} ${t.stepActiveTxt}`
                          : 'bg-neutral-100 text-neutral-500'
                      }`}>
                        {isDone
                          ? <CheckCircle size={18} aria-label="Completado" />
                          : <span className="text-base" aria-hidden>{step.emoji}</span>}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className="block font-bold text-neutral-800 text-sm leading-snug">
                          <EditableText elementKey={`lvl_${levelNum}_step_${i}_title`} defaultText={step.title} />
                        </span>
                        {!isActive && !isDone && (
                          <span className="block text-xs text-neutral-400 mt-0.5 line-clamp-1">{step.desc}</span>
                        )}
                        {isDone && (
                          <span className={`block text-xs font-semibold ${t.accentText} mt-0.5`}>Completado <span aria-hidden>✓</span></span>
                        )}
                      </span>

                      <ChevronRight
                        size={16}
                        aria-hidden
                        className={`text-neutral-300 transition-transform duration-200 motion-reduce:transition-none flex-shrink-0 ${isActive ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {isActive && (
                      <div className="px-4 pb-4 border-t border-neutral-100 pt-4 space-y-3">
                        <p className="text-sm text-neutral-700 leading-relaxed">
                          <EditableText elementKey={`lvl_${levelNum}_step_${i}_desc`} defaultText={step.desc} as="span" />
                        </p>

                        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" aria-hidden />
                          <p className="text-xs text-amber-800 leading-relaxed">
                            <strong className="font-black">Consejo: </strong>
                            <EditableText elementKey={`lvl_${levelNum}_step_${i}_tip`} defaultText={step.tip} as="span" />
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMarkStep(i); setActiveStep(-1); }}
                          className={`w-full min-h-11 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 ${
                            isDone
                              ? 'bg-neutral-100 text-neutral-500'
                              : `${t.btn} text-white shadow-sm`
                          }`}
                        >
                          {isDone
                            ? <><span aria-hidden>↩ </span><EditableText elementKey={`lvl_${levelNum}_btn_undone`} defaultText="Marcar como pendiente" as="span" /></>
                            : <><span aria-hidden>✓ </span><EditableText elementKey={`lvl_${levelNum}_btn_done`} defaultText="Marcar como completado" as="span" /></>
                          }
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {allStepsComplete && !uploadedImage && (
            <div role="status" className={`bg-gradient-to-r ${t.gradient} text-white rounded-2xl p-5 text-center shadow-lg ${t.shadow}`}>
              <Trophy size={28} className="mx-auto mb-2" aria-hidden />
              <p className="font-black text-lg">Pasos completados <span aria-hidden>🎉</span></p>
              <p className="text-white/80 text-sm mt-1">Ahora sube la foto de tu resultado para ganar estrellas y XP.</p>
            </div>
          )}

          <section className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-red-50 px-5 py-3 border-b border-red-100">
              <h2 className="font-black text-red-700 flex items-center gap-2 text-sm">
                <AlertTriangle size={15} aria-hidden /> Errores más comunes
              </h2>
            </div>
            <ul className="divide-y divide-red-50">
              {errors.map((e, i) => (
                <li key={i} className="px-5 py-3.5 flex gap-3 hover:bg-red-50/50 transition-colors">
                  <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden>{e.icon}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-neutral-800 text-sm">
                      <EditableText elementKey={`lvl_${levelNum}_err_${i}_err`} defaultText={e.error} />
                    </p>
                    <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                      <EditableText elementKey={`lvl_${levelNum}_err_${i}_fix`} defaultText={e.fix} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <div className={`${t.accentBg} border-b ${t.accentBorder} px-5 py-4`}>
              <h2 className={`font-black ${t.accentDark} text-base flex items-center gap-2`}>
                <Camera size={18} aria-hidden /> Sube tu reto
              </h2>
              <p className={`${t.accentText} text-xs mt-1`}>{challengeHint}</p>
            </div>

            <div className="p-5 space-y-4">
              <PhotoChallenge
                photo={photo}
                variant="level"
                worldId={level.world.id}
                uploadLabel="Toma o sube una foto"
                imageAlt="Foto de tu resultado"
                reviewingText="Revisando tu foto…"
              />

              {uploadedImage && (
                <>
                  {uploadState === 'approved' && evaluationResult && (
                    <div role="status" className={`bg-gradient-to-r ${t.gradient} text-white rounded-2xl p-5 text-center shadow-lg ${t.shadow}`}>
                      <Trophy size={32} className="mx-auto mb-2" aria-hidden />
                      <p className="font-black text-xl">¡Reto completado! <span aria-hidden>🎉</span></p>
                      <div className="flex justify-center gap-1 mt-2 text-2xl" role="img" aria-label={`${evaluationResult.stars} de 3 estrellas`}>
                        {Array.from({ length: evaluationResult.stars }).map((_, i) => <span key={i} aria-hidden>⭐</span>)}
                      </div>
                      <p className="text-white/90 text-sm mt-2 leading-relaxed italic [overflow-wrap:anywhere]">"{evaluationResult.feedback}"</p>
                      <p className="text-white/70 text-xs mt-3">
                        {xpEarned > 0
                          ? <>Ganaste <strong className="font-black text-white">{xpEarned} XP</strong></>
                          : 'Ya habías ganado el XP de este nivel.'}
                      </p>
                    </div>
                  )}

                  {uploadState === 'rejected' && evaluationResult && (
                    <div role="alert" className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-center">
                      <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" aria-hidden />
                      <p className="font-black text-lg text-red-700">Foto no válida <span aria-hidden>❌</span></p>
                      <p className="text-red-600 text-sm mt-2 leading-relaxed [overflow-wrap:anywhere]">{evaluationResult.feedback}</p>
                      <p className="text-red-400 text-xs mt-3">La foto debe mostrar claramente el resultado de la tarea para completar el nivel.</p>
                    </div>
                  )}

                  {uploadState !== 'reviewing' && (
                    <button
                      type="button"
                      onClick={resetPhoto}
                      className={`w-full min-h-11 py-2 text-sm font-bold transition-colors ${
                        uploadState === 'rejected'
                          ? 'text-red-500 hover:text-red-700'
                          : 'text-neutral-400 hover:text-red-500'
                      }`}
                    >
                      {uploadState === 'rejected'
                        ? <><span aria-hidden>📷 </span>Intentar con otra foto</>
                        : 'Cambiar foto'}
                    </button>
                  )}
                </>
              )}
            </div>

            {!uploadedImage && (
              <div className={`border-t ${t.accentBorder} bg-neutral-50 px-5 py-4`}>
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">¿Cómo se evalúa?</h3>
                <ul className="grid grid-cols-3 gap-2 text-center">
                  {evaluationCriteria.map((c, i) => (
                    <li key={i} className="bg-white border border-neutral-100 rounded-xl p-2.5 shadow-sm min-w-0">
                      <p className="text-lg">{c.stars}</p>
                      <p className="text-[10px] text-neutral-400 mt-1 leading-tight [overflow-wrap:anywhere]">{c.label}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <div className="mt-2">
            <BlockZone zoneId={`lvl_${levelNum}_extras`} />
          </div>

          {uploadState === 'approved' && (
            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className={`w-full min-h-12 py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r ${t.gradient} hover:opacity-90 transition-all active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100 shadow-lg ${t.shadow}`}
            >
              <span aria-hidden>🗺️ </span><EditableText elementKey={`lvl_${levelNum}_btn_back`} defaultText="Volver al mapa" as="span" />
            </button>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
