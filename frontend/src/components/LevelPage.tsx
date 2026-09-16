/**
 * Pantalla de un nivel normal del Modo Aventura. `level` trae la identidad
 * (nombre, emoji, XP, número y mundo) del registro y `content` el contenido de
 * `data/levels/<slug>.ts`.
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
  BookOpen, Star, ChevronRight, Lightbulb,
  AlertTriangle, Camera, Trophy, Clock, Users, BarChart2, Check,
} from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { BlockZone } from './cms/BlockZone';
import { SafeText } from '../utils/safeText';
import { LevelHeader, LevelProgressBar } from './LevelHeader';
import { PhotoChallenge } from './PhotoChallenge';
import { WORLD_CLASSES } from '../data/worlds';
import type { PlacedLevel } from '../data/adventure';
import type { LevelContent } from '../data/levels/types';

export const LevelPage = ({ level, content }: { level: PlacedLevel; content: LevelContent }) => {
  const { missionText, missionTags, steps, errors, recipe, challengeHint, evaluationCriteria } = content;
  const { num: levelNum, title: levelName, emoji: levelEmoji, xp: xpReward } = level;
  const worldName = level.world.name;
  const w = WORLD_CLASSES[level.world.id];

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
      <LevelHeader
        title={<EditableText elementKey={`lvl_${levelNum}_levelName`} defaultText={levelName} />}
        subtitle={<><EditableText elementKey={`lvl_${levelNum}_worldName`} defaultText={worldName} /> · Nivel {levelNum}</>}
        xp={xpReward}
      />

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`${w.bg} text-white`}>
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <span className="text-3xl leading-none flex-shrink-0" aria-hidden>
              <EditableText elementKey={`lvl_${levelNum}_levelEmoji`} defaultText={levelEmoji} />
            </span>
            <div className="flex-1 min-w-0">
              <LevelProgressBar
                tone="inverse"
                label="Pasos completados"
                caption={`${completedSteps.size} de ${steps.length} pasos`}
                percent={progress}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
          <button
            type="button"
            onClick={() => navigate('/academia')}
            className="w-full min-h-14 flex items-center gap-3 bg-white border border-neutral-200 rounded-card px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
          >
            <BookOpen size={20} className="text-neutral-600 flex-shrink-0" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block font-semibold text-neutral-900 text-sm">
                <EditableText elementKey={`lvl_${levelNum}_link_acad`} defaultText={`Clase en la Academia: ${levelName}`} as="span" />
              </span>
              <span className="block text-sm text-neutral-600">
                <EditableText elementKey={`lvl_${levelNum}_link_acad_desc`} defaultText="Teoría, técnica y errores comunes" as="span" />
              </span>
            </span>
            <ChevronRight size={20} className="text-neutral-500 flex-shrink-0" aria-hidden />
          </button>

          <section className="bg-white border border-neutral-200 rounded-card overflow-hidden">
            <div className={`${w.soft} px-4 py-4`}>
              <h2 className="font-bold text-neutral-900 text-base mb-1">
                <EditableText elementKey={`lvl_${levelNum}_missionTitle`} defaultText="Tu misión" />
              </h2>
              {/* SafeText admite **negrita** y <strong> sin innerHTML, así no abre un XSS si el texto pasa a ser dinámico. */}
              <div className="text-neutral-800 text-sm leading-relaxed">
                <SafeText text={missionText} />
              </div>
            </div>
            <ul className="border-t border-neutral-200 px-4 py-3 flex flex-wrap gap-2">
              {missionTags.map((tag, i) => (
                <li key={i} className="text-xs font-semibold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full">
                  {tag}
                </li>
              ))}
              <li className="flex items-center gap-1 text-xs font-semibold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full">
                <Star size={12} fill="currentColor" aria-hidden /> Hasta 3 estrellas
              </li>
            </ul>
          </section>

          {recipe && (
            <section className="bg-white border border-neutral-200 rounded-card overflow-hidden">
              <button
                type="button"
                onClick={() => setShowRecipe(!showRecipe)}
                aria-expanded={showRecipe}
                className="w-full min-h-14 flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-neutral-900 text-sm">Receta: {recipe.name}</span>
                  <span className="block text-sm text-neutral-600">{recipe.servings} · {recipe.time} · {recipe.difficulty}</span>
                </span>
                <ChevronRight size={20} aria-hidden className={`text-neutral-500 flex-shrink-0 transition-transform motion-reduce:transition-none ${showRecipe ? 'rotate-90' : ''}`} />
              </button>

              {showRecipe && (
                <div className="border-t border-neutral-100 px-4 pb-4">
                  <p className="text-sm text-neutral-700 pt-4 pb-3 leading-relaxed">{recipe.description}</p>

                  <dl className="flex flex-wrap gap-x-5 gap-y-2 pb-4 text-sm">
                    {[
                      { icon: <Users size={16} aria-hidden />, label: 'Porciones', val: recipe.servings },
                      { icon: <Clock size={16} aria-hidden />, label: 'Tiempo', val: recipe.time },
                      { icon: <BarChart2 size={16} aria-hidden />, label: 'Dificultad', val: recipe.difficulty },
                    ].map((m, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <span className={w.text}>{m.icon}</span>
                        <dt className="text-neutral-600">{m.label}:</dt>
                        <dd className="font-semibold text-neutral-900">{m.val}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm mb-2">Ingredientes</h3>
                      <ul className="space-y-1.5">
                        {recipe.ingredients.map((ing, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-800">
                            <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${w.bg}`} aria-hidden />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-900 text-sm mb-2">Preparación</h3>
                      <ol className="space-y-2.5">
                        {recipe.method.map((step, i) => (
                          <li key={i} className="flex gap-3 text-sm text-neutral-800">
                            <span className={`w-6 h-6 rounded-full ${w.soft} ${w.text} flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5`}>{i + 1}</span>
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
            <h2 className="text-base font-bold text-neutral-900 mb-3">Instrucciones paso a paso</h2>
            <div className="space-y-2.5">
              {steps.map((step, i) => {
                const isActive = activeStep === i;
                const isDone = completedSteps.has(i);
                return (
                  <div
                    key={i}
                    className={`rounded-card border overflow-hidden transition-colors ${
                      isDone
                        ? `${w.line} ${w.soft}`
                        : isActive
                        ? `${w.border} bg-white`
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full min-h-14 flex items-center gap-3 p-4 text-left"
                      onClick={() => setActiveStep(isActive ? -1 : i)}
                      aria-expanded={isActive}
                    >
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                        isDone
                          ? `${w.bg} text-white`
                          : isActive
                          ? `${w.soft} ${w.text}`
                          : 'bg-neutral-100 text-neutral-700'
                      }`}>
                        {isDone ? <Check size={18} aria-label="Completado" /> : i + 1}
                      </span>

                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-neutral-900 text-sm leading-snug">
                          <EditableText elementKey={`lvl_${levelNum}_step_${i}_title`} defaultText={step.title} />
                        </span>
                        {!isActive && !isDone && (
                          <span className="block text-sm text-neutral-600 mt-0.5 line-clamp-1">{step.desc}</span>
                        )}
                        {isDone && (
                          <span className={`block text-sm font-semibold ${w.text} mt-0.5`}>Completado</span>
                        )}
                      </span>

                      <ChevronRight
                        size={20}
                        aria-hidden
                        className={`text-neutral-500 transition-transform motion-reduce:transition-none flex-shrink-0 ${isActive ? 'rotate-90' : ''}`}
                      />
                    </button>

                    {isActive && (
                      <div className="px-4 pb-4 border-t border-neutral-100 pt-4 space-y-3">
                        <p className="text-sm text-neutral-800 leading-relaxed">
                          <EditableText elementKey={`lvl_${levelNum}_step_${i}_desc`} defaultText={step.desc} as="span" />
                        </p>

                        <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-control p-3">
                          <Lightbulb size={16} className="text-amber-800 flex-shrink-0 mt-0.5" aria-hidden />
                          <p className="text-sm text-amber-800 leading-relaxed">
                            <strong className="font-bold">Consejo: </strong>
                            <EditableText elementKey={`lvl_${levelNum}_step_${i}_tip`} defaultText={step.tip} as="span" />
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleMarkStep(i); setActiveStep(-1); }}
                          className={`w-full min-h-11 rounded-control font-semibold text-sm transition-colors ${
                            isDone
                              ? 'border border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50'
                              : `${w.bg} text-white hover:opacity-90`
                          }`}
                        >
                          {isDone
                            ? <EditableText elementKey={`lvl_${levelNum}_btn_undone`} defaultText="Marcar como pendiente" as="span" />
                            : <EditableText elementKey={`lvl_${levelNum}_btn_done`} defaultText="Marcar como completado" as="span" />
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
            <div role="status" className={`${w.soft} border ${w.line} rounded-card p-4 flex items-start gap-3`}>
              <Trophy size={22} className={`${w.text} flex-shrink-0`} aria-hidden />
              <div className="min-w-0">
                <p className="font-bold text-neutral-900">Pasos completados</p>
                <p className="text-neutral-800 text-sm mt-0.5">Ahora sube la foto de tu resultado para ganar estrellas y XP.</p>
              </div>
            </div>
          )}

          <section className="bg-white border border-neutral-200 rounded-card overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <h2 className="font-bold text-red-800 flex items-center gap-2 text-sm">
                <AlertTriangle size={16} aria-hidden /> Errores más comunes
              </h2>
            </div>
            <ul className="divide-y divide-neutral-100">
              {errors.map((e, i) => (
                <li key={i} className="px-4 py-3.5 flex gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5" aria-hidden>{e.icon}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 text-sm">
                      <EditableText elementKey={`lvl_${levelNum}_err_${i}_err`} defaultText={e.error} />
                    </p>
                    <p className="text-sm text-neutral-600 mt-0.5 leading-relaxed">
                      <EditableText elementKey={`lvl_${levelNum}_err_${i}_fix`} defaultText={e.fix} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-white border border-neutral-200 rounded-card overflow-hidden">
            <div className={`${w.soft} border-b ${w.line} px-4 py-4`}>
              <h2 className="font-bold text-neutral-900 text-base flex items-center gap-2">
                <Camera size={18} className={w.text} aria-hidden /> Sube tu reto
              </h2>
              <p className="text-neutral-800 text-sm mt-1">{challengeHint}</p>
            </div>

            <div className="p-4 space-y-4">
              <PhotoChallenge
                photo={photo}
                w={w}
                uploadLabel="Toma o sube una foto"
                imageAlt="Foto de tu resultado"
                reviewingText="Revisando tu foto…"
              />

              {uploadedImage && (
                <>
                  {uploadState === 'approved' && evaluationResult && (
                    <div role="status" className={`${w.bg} text-white rounded-card p-5 text-center`}>
                      <Trophy size={32} className="mx-auto mb-2" aria-hidden />
                      <p className="font-extrabold text-xl">¡Reto completado!</p>
                      <div className="flex justify-center gap-1 mt-2" aria-label={`${evaluationResult.stars} de 3 estrellas`}>
                        {Array.from({ length: evaluationResult.stars }).map((_, i) => (
                          <Star key={i} size={24} fill="currentColor" aria-hidden />
                        ))}
                      </div>
                      <p className="text-white text-sm mt-2 leading-relaxed [overflow-wrap:anywhere]">{evaluationResult.feedback}</p>
                      <p className="text-white text-sm mt-3">
                        {xpEarned > 0
                          ? <>Ganaste <strong className="font-extrabold">{xpEarned} XP</strong></>
                          : 'Ya habías ganado el XP de este nivel.'}
                      </p>
                    </div>
                  )}

                  {uploadState === 'rejected' && evaluationResult && (
                    <div role="alert" className="bg-red-50 border border-red-200 rounded-card p-4">
                      <p className="font-bold text-red-800">Foto no válida</p>
                      <p className="text-red-800 text-sm mt-1 leading-relaxed [overflow-wrap:anywhere]">{evaluationResult.feedback}</p>
                      <p className="text-red-800 text-sm mt-2">La foto debe mostrar claramente el resultado de la tarea para completar el nivel.</p>
                    </div>
                  )}

                  {uploadState !== 'reviewing' && (
                    <button
                      type="button"
                      onClick={resetPhoto}
                      className={`w-full min-h-11 rounded-control text-sm font-semibold transition-colors ${
                        uploadState === 'rejected'
                          ? 'bg-brand-700 text-white hover:bg-brand-800'
                          : 'border border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                      }`}
                    >
                      {uploadState === 'rejected' ? 'Intentar con otra foto' : 'Cambiar foto'}
                    </button>
                  )}
                </>
              )}
            </div>

            {!uploadedImage && (
              <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-4">
                <h3 className="text-sm font-semibold text-neutral-600 mb-2">¿Cómo se evalúa?</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {evaluationCriteria.map((c, i) => (
                    <li key={i} className="bg-white border border-neutral-200 rounded-control px-3 py-2 flex items-center gap-2 sm:flex-col sm:text-center">
                      <span className="text-base flex-shrink-0">{c.stars}</span>
                      <span className="text-sm text-neutral-800 leading-snug min-w-0">{c.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <BlockZone zoneId={`lvl_${levelNum}_extras`} />

          {uploadState === 'approved' && (
            <button
              type="button"
              onClick={() => navigate('/mapa')}
              className={`w-full min-h-12 rounded-control font-bold text-white text-base ${w.bg} hover:opacity-90 transition-opacity`}
            >
              <EditableText elementKey={`lvl_${levelNum}_btn_back`} defaultText="Volver al mapa" as="span" />
            </button>
          )}

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
};
