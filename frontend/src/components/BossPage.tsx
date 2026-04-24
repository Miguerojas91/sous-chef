/**
 * BossPage.tsx
 *
 * Componente base reutilizable para todos los niveles de jefe (Boss) del Modo Aventura.
 * Presenta la batalla culinaria en formato de "desafío foto" con múltiples recetas.
 * Cada Boss (ChefVegetalBoss, FlambeadorBoss, etc.) pasa sus propios `challenges`.
 *
 * Flujo del nivel Boss:
 * 1. El usuario elige uno de los desafíos disponibles.
 * 2. Lee la receta y los criterios de evaluación.
 * 3. Sube una foto de su resultado.
 * 4. La IA evalúa la foto via `evaluateImage()` del proxy.
 *    - Si `stars > 0`: se marca el desafío como completado y se suma XP.
 *    - Si `stars === 0`: se limpia la imagen después de 2.5 s para poder reintentar.
 * 5. El nivel Boss se completa cuando se aprueba al menos un desafío.
 *
 * Diferencias con LevelPage:
 * - Los bosses tienen múltiples recetas/desafíos (no solo pasos lineales).
 * - La recompensa de XP es mayor (definida por cada boss).
 * - Incluye animación de victoria y countdown de reintento.
 */

import { useState, useEffect, useRef } from 'react';
import { evaluateImage } from '../services/gemini';
import type { EvaluationResult } from '../services/gemini';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLevelStars, saveLevelStars, addXP } from '../utils/progress';
import {
  ArrowLeft, CheckCircle, ChevronRight, Shield, Swords, Zap, Upload, Clock, Users, ChefHat
} from 'lucide-react';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface BossChallenge {
  id: number;
  emoji: string;
  name: string;
  desc: string;
  eval: string;
}

export interface BossRecipe {
  name: string;
  emoji: string;
  servings: string;
  time: string;
  difficulty: string;
  ingredients: string[];
  steps: string[];
  plating?: string;
}

export interface BossPageProps {
  // Identity
  bossName: string;
  bossEmoji: string;
  bossSubtitle: string;
  levelNum: number;
  worldName: string;
  worldEmoji: string;
  xpReward: number;

  // Story
  quote: string;
  requirement: string;
  nextWorld: string;

  // Victory
  victoryTitle?: string;
  victoryDesc: string;
  returnLabel?: string;

  // Colors (full Tailwind class strings)
  headerGradient: string;   // e.g. "from-orange-600 via-red-600 to-rose-700"
  bossGradient: string;     // e.g. "from-orange-900 to-red-900"
  accentBorder: string;     // e.g. "border-orange-500/50"
  accentTextColor: string;  // e.g. "text-orange-400"
  accentTextLight: string;  // e.g. "text-orange-300"
  accentTextFaint: string;  // e.g. "text-orange-100"
  doneBg: string;           // e.g. "bg-orange-500"
  doneBorder: string;       // e.g. "border-orange-400"
  doneCardBg: string;       // e.g. "bg-orange-50"
  uploadBorderHover: string;// e.g. "border-orange-300 bg-orange-50 hover:bg-orange-100"
  reviewOverlay: string;    // e.g. "bg-orange-500/25"
  victoryGradient: string;  // e.g. "from-orange-400 to-red-500"
  returnGradient: string;   // e.g. "from-orange-500 to-red-600 shadow-orange-500/30"
  isFinalBoss?: boolean;

  challenges: BossChallenge[];
  tips: string[];
  mainRecipe?: BossRecipe;

  backPath?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const BossPage = ({
  bossName, bossEmoji, bossSubtitle, levelNum, worldName, worldEmoji, xpReward,
  quote, requirement, nextWorld,
  victoryTitle = '¡JEFE DERROTADO!', victoryDesc, returnLabel = '🗺️ Volver al Mapa de Aventura',
  headerGradient, bossGradient, accentBorder, accentTextColor, accentTextLight, accentTextFaint,
  doneBg, doneBorder, doneCardBg, uploadBorderHover, reviewOverlay, victoryGradient, returnGradient,
  isFinalBoss = false,
  challenges, tips, mainRecipe,
  backPath = '/mapa',
}: BossPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const xpAwardedRef = useRef(false);
  const [completedChallenges, setCompletedChallenges] = useState<Set<number>>(new Set());
  const [uploadedImages, setUploadedImages] = useState<Record<number, string>>({});
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(challenges[0]?.id ?? null);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [challengeResults, setChallengeResults] = useState<Record<number, EvaluationResult>>({});

  // Guardar progreso cuando el boss es derrotado
  useEffect(() => {
    if (!bossDefeated || xpAwardedRef.current) return;
    xpAwardedRef.current = true;
    const isFirstCompletion = getLevelStars(location.pathname) === 0;
    saveLevelStars(location.pathname, 3);
    if (isFirstCompletion) addXP(xpReward);
  }, [bossDefeated, location.pathname, xpReward]);

  const allDone = completedChallenges.size === challenges.length;
  const hpPercent = 100 - (completedChallenges.size / challenges.length) * 100;

  const handleFile = (id: number, file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setUploadedImages(prev => ({ ...prev, [id]: imageData }));
      setReviewingId(id);

      const challenge = challenges.find(c => c.id === id);
      let evalResult: EvaluationResult;
      try {
        const criteria = challenge
          ? [{ stars: '⭐⭐⭐', label: challenge.eval }]
          : [];
        evalResult = await evaluateImage(imageData, challenge?.name || 'Reto culinario', criteria);
      } catch {
        evalResult = { stars: 0, feedback: 'No pudimos conectar con el evaluador. Revisa tu conexión e intenta de nuevo.' };
      }

      setChallengeResults(prev => ({ ...prev, [id]: evalResult }));
      setReviewingId(null);

      // Solo marcar como completado si la imagen es válida (stars >= 1)
      if (evalResult.stars && evalResult.stars >= 1) {
        setCompletedChallenges(prev => {
          const next = new Set(prev);
          next.add(id);
          if (next.size === challenges.length) setTimeout(() => setBossDefeated(true), 600);
          return next;
        });
      } else {
        // Imagen inválida o error — limpiar imagen para que pueda reintentar
        setTimeout(() => {
          setUploadedImages(prev => { const n = { ...prev }; delete n[id]; return n; });
        }, 2500);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-full bg-neutral-50">

      {/* ── Header ── */}
      <div className={`relative bg-gradient-to-br ${headerGradient} text-white overflow-hidden`}>
        {/* Decorative big emoji */}
        <div className="absolute top-0 right-0 text-[120px] opacity-10 leading-none -mt-4 -mr-6 select-none pointer-events-none">
          {bossEmoji}
        </div>
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-black/15 -translate-x-8 translate-y-12" />

        <div className="relative px-5 pt-4 pb-0">
          <div className="flex items-start gap-3 max-w-3xl mx-auto">
            <button
              onClick={() => navigate(backPath)}
              className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0 mt-0.5"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isFinalBoss ? 'bg-white/30 text-white' : 'bg-yellow-400/30 text-yellow-200'}`}>
                  {isFinalBoss ? '🏆 MAESTRO FINAL' : '👑 JEFE FINAL'}
                </span>
                <span className="text-xs text-white/50">›</span>
                <span className="text-xs font-bold text-white/70">{worldEmoji} {worldName}</span>
              </div>
              <h1 className="text-2xl font-black mt-1 leading-tight">
                {bossEmoji} {bossName}
              </h1>
            </div>

            {/* XP badge */}
            <div className={`flex-shrink-0 rounded-2xl px-3 py-2 text-center ${isFinalBoss ? 'bg-white/30' : 'bg-white/20'}`}>
              <p className="text-[10px] text-white/60 font-semibold">Recompensa</p>
              <p className={`font-black text-xl leading-none ${isFinalBoss ? 'text-white' : 'text-yellow-300'}`}>+{xpReward}</p>
              <p className="text-[10px] text-white/60">XP</p>
            </div>
          </div>

          {/* Boss HP bar */}
          <div className="max-w-3xl mx-auto mt-4 mb-0">
            <div className="flex justify-between text-[11px] text-white/70 mb-1.5 px-0.5">
              <span className="flex items-center gap-1.5 font-semibold">
                <Shield size={10} /> Boss HP — {completedChallenges.size}/{challenges.length} superados
              </span>
              <span className="font-bold">{Math.round(hpPercent)}% restante</span>
            </div>
            {/* HP bar (depletes as you complete challenges) */}
            <div className="h-3 bg-white/20 rounded-t-none overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 transition-all duration-700 ease-out"
                style={{ width: `${hpPercent}%` }}
              />
              {/* Segmented ticks */}
              {challenges.map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full w-px bg-white/30"
                  style={{ left: `${((i + 1) / challenges.length) * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* Boss intro card */}
        <div className={`bg-gradient-to-br ${bossGradient} text-white rounded-2xl p-6 relative overflow-hidden border ${accentBorder}`}>
          <div className="absolute top-0 right-0 text-8xl opacity-15 -mt-4 -mr-4 select-none leading-none">
            {bossEmoji}
          </div>
          {isFinalBoss && (
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
          )}
          <div className="relative">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 bg-white/10 border ${accentBorder} ${isFinalBoss ? 'ring-4 ring-white/20' : ''}`}>
                {bossEmoji}
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest ${accentTextColor}`}>
                  {isFinalBoss ? '🏆' : '⚔️'} Nivel {levelNum}
                </p>
                <h2 className="text-2xl font-black leading-tight">{bossName}</h2>
                <p className={`text-xs mt-0.5 ${accentTextLight}`}>{bossSubtitle}</p>
              </div>
            </div>

            <blockquote className={`text-sm leading-relaxed italic border-l-2 ${accentBorder} pl-3 ${accentTextFaint}`}>
              "{quote}"
            </blockquote>

            <div className={`flex items-center gap-2 mt-4 text-sm font-bold ${isFinalBoss ? 'text-white' : 'text-yellow-400'}`}>
              <Swords size={15} /> {requirement}
            </div>
          </div>
        </div>

        {/* ── Main Recipe Card ── */}
        {mainRecipe && (
          <div className={`bg-gradient-to-br ${bossGradient} rounded-2xl overflow-hidden border ${accentBorder} shadow-lg`}>
            {/* Recipe header */}
            <div className="px-5 py-4 flex items-center gap-3 border-b border-white/10">
              <span className="text-3xl">{mainRecipe.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-widest ${accentTextColor} mb-0.5`}>
                  <ChefHat size={9} className="inline mr-1" />Receta del Reto Final
                </p>
                <h3 className="text-lg font-black text-white leading-tight">{mainRecipe.name}</h3>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/15 ${accentTextLight}`}>
                {mainRecipe.difficulty}
              </span>
            </div>

            {/* Meta row */}
            <div className={`flex items-center gap-4 px-5 py-3 border-b border-white/10 ${accentTextFaint} text-xs font-semibold`}>
              <span className="flex items-center gap-1.5">
                <Clock size={12} />{mainRecipe.time}
              </span>
              <span className="w-px h-3 bg-white/20" />
              <span className="flex items-center gap-1.5">
                <Users size={12} />{mainRecipe.servings}
              </span>
            </div>

            {/* Ingredients */}
            <div className="px-5 pt-4 pb-3">
              <p className={`text-[10px] font-black uppercase tracking-widest ${accentTextColor} mb-2`}>Ingredientes</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {mainRecipe.ingredients.map((ing, i) => (
                  <p key={i} className={`text-xs ${accentTextFaint} flex items-start gap-1.5`}>
                    <span className={`${accentTextColor} font-black flex-shrink-0 mt-0.5`}>·</span>
                    {ing}
                  </p>
                ))}
              </div>
            </div>

            {/* Steps */}
            <div className="px-5 pb-4">
              <p className={`text-[10px] font-black uppercase tracking-widest ${accentTextColor} mb-2 mt-1`}>Elaboración</p>
              <ol className="space-y-2">
                {mainRecipe.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className={`text-[10px] font-black w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 ${accentTextLight}`}>
                      {i + 1}
                    </span>
                    <p className={`text-xs leading-relaxed ${accentTextFaint}`}>{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Plating note */}
            {mainRecipe.plating && (
              <div className={`mx-5 mb-5 p-3 rounded-xl bg-white/10 border ${accentBorder}`}>
                <p className={`text-[10px] font-black uppercase tracking-widest ${accentTextColor} mb-1`}>🍽️ Emplatado</p>
                <p className={`text-xs leading-relaxed ${accentTextFaint}`}>{mainRecipe.plating}</p>
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="bg-white border border-amber-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-amber-50 border-b border-amber-100 px-5 py-3">
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
              <Zap size={13} className="text-amber-500" /> Estrategia del Jugador
            </p>
          </div>
          <ul className="divide-y divide-amber-50">
            {tips.map((tip, i) => (
              <li key={i} className="px-5 py-3 flex items-start gap-3 text-sm text-amber-900">
                <span className="text-amber-500 font-black text-xs mt-0.5 flex-shrink-0">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Progress overview */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {challenges.map((ch, i) => {
            const done = completedChallenges.has(ch.id);
            return (
              <button
                key={ch.id}
                onClick={() => setExpandedId(expandedId === ch.id ? null : ch.id)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all text-center ${
                  done
                    ? `${doneBorder} ${doneCardBg}`
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
                  done ? `${doneBg} shadow-sm` : 'bg-neutral-100'
                }`}>
                  {done ? <CheckCircle size={20} className="text-white" /> : ch.emoji}
                </div>
                <p className={`text-[10px] font-bold leading-tight ${done ? accentTextColor : 'text-neutral-500'}`}>
                  {done ? '✓ Listo' : `Reto ${i + 1}`}
                </p>
              </button>
            );
          })}
        </div>

        {/* Challenges */}
        <div className="space-y-3">
          {challenges.map(challenge => {
            const isDone = completedChallenges.has(challenge.id);
            const isReviewing = reviewingId === challenge.id;
            const img = uploadedImages[challenge.id];
            const isExpanded = expandedId === challenge.id;

            return (
              <div
                key={challenge.id}
                className={`bg-white rounded-2xl border-2 overflow-hidden transition-all duration-300 shadow-sm ${
                  isDone ? `${doneBorder} ${doneCardBg}` : 'border-neutral-200'
                }`}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : challenge.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all ${
                    isDone ? `${doneBg} shadow-sm` : 'bg-neutral-100'
                  }`}>
                    {isDone ? <CheckCircle size={22} className="text-white" /> : challenge.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-neutral-800 text-sm leading-snug">{challenge.name}</p>
                    <p className={`text-xs mt-0.5 font-semibold ${isDone ? accentTextColor : 'text-neutral-400'}`}>
                      {isDone
                        ? `${'⭐'.repeat(challengeResults[challenge.id]?.stars || 3)} Completado`
                        : 'Pendiente — haz clic para expandir'}
                    </p>
                  </div>
                  <ChevronRight
                    size={16}
                    className={`text-neutral-300 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-5 border-t border-neutral-100 pt-4 space-y-3">
                    <p className="text-sm text-neutral-700 leading-relaxed">{challenge.desc}</p>
                    <div className="flex gap-2 bg-neutral-50 border border-neutral-100 rounded-xl p-3">
                      <span className="text-neutral-400 text-xs font-black flex-shrink-0 mt-0.5">CRITERIO</span>
                      <p className="text-xs text-neutral-600 leading-relaxed">{challenge.eval}</p>
                    </div>

                    {!img ? (
                      <label className="block cursor-pointer">
                        <div className={`rounded-xl border-2 border-dashed transition-colors text-center py-10 px-4 ${uploadBorderHover}`}>
                          <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mx-auto mb-3 shadow-sm">
                            <Upload size={22} className="text-neutral-500" />
                          </div>
                          <p className="font-bold text-neutral-700 text-sm">Subir foto del reto</p>
                          <p className="text-xs text-neutral-400 mt-1">JPG o PNG · Máx 10 MB</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(challenge.id, f); }}
                        />
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden">
                        <img src={img} alt="Reto" className="w-full max-h-64 object-cover" />
                        {isReviewing && (
                          <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-3 text-white">
                            <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                            <p className="font-bold text-sm">{bossName} evalúa…</p>
                          </div>
                        )}
                        {isDone && !isReviewing && (
                          <div className={`absolute inset-0 ${reviewOverlay} flex items-center justify-center`}>
                            <div className={`${doneBg} rounded-full p-3 shadow-2xl`}>
                              <CheckCircle size={32} className="text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {isDone && challengeResults[challenge.id] && (
                      <div className="bg-white border border-neutral-100 rounded-xl px-4 py-3 text-center shadow-sm">
                        <div className="text-xl mb-1">{'⭐'.repeat(challengeResults[challenge.id].stars)}</div>
                        <p className="text-xs text-neutral-600 italic">"{challengeResults[challenge.id].feedback}"</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Victory */}
        {bossDefeated && (
          <div className={`bg-gradient-to-r ${victoryGradient} text-white rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] pointer-events-none" />
            <div className="relative">
              <div className="text-6xl mb-4 animate-float">{isFinalBoss ? '👑' : '🏆'}</div>
              <h2 className={`font-black mb-2 ${isFinalBoss ? 'text-4xl' : 'text-2xl'}`}>{victoryTitle}</h2>
              <p className="text-white/90 text-sm leading-relaxed max-w-sm mx-auto">{victoryDesc}</p>
              <div className="flex justify-center gap-1.5 my-4 text-3xl">⭐⭐⭐</div>
              <div className={`inline-block font-black text-2xl ${isFinalBoss ? 'text-white' : 'text-yellow-200'} bg-white/20 px-6 py-2 rounded-full`}>
                +{xpReward} XP
              </div>
              <p className="text-white/80 text-sm mt-4 font-semibold">{nextWorld}</p>
            </div>
          </div>
        )}

        {allDone && bossDefeated && (
          <button
            onClick={() => navigate(backPath)}
            className={`w-full py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r ${returnGradient} hover:opacity-90 transition-all active:scale-95 shadow-lg`}
          >
            {returnLabel}
          </button>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};
