import { useState, useRef } from 'react';
import { evaluateImage } from '../services/gemini';
import type { EvaluationResult } from '../services/gemini';
import { useNavigate, useLocation } from 'react-router-dom';
import { getLevelStars, saveLevelStars, addXP } from '../utils/progress';
import {
  ArrowLeft, BookOpen, Upload, CheckCircle, Star,
  ChevronRight, Lightbulb, AlertTriangle, Camera, Trophy, Play,
  Clock, Users, BarChart2
} from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { BlockZone } from './cms/BlockZone';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface LevelStep {
  num: number;
  title: string;
  emoji: string;
  desc: string;
  tip: string;
}

export interface LevelError {
  icon: string;
  error: string;
  fix: string;
}

export interface LevelPageProps {
  worldName: string;
  worldEmoji: string;
  levelNum: number;
  levelName: string;
  levelEmoji: string;
  xpReward: number;

  gradientFrom: string;
  gradientTo: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  accentDark: string;
  stepActiveBg: string;
  stepActiveTxt: string;
  btnBg: string;
  btnShadow: string;

  missionTitle?: string;
  missionText: string;
  missionTags: { icon: string; label: string }[];
  steps: LevelStep[];
  errors: LevelError[];

  recipe?: {
    name: string;
    description: string;
    servings: string;
    time: string;
    difficulty: string;
    ingredients: string[];
    method: string[];
  };

  challengeTitle?: string;
  challengeHint?: string;
  evaluationCriteria?: { stars: string; label: string }[];

  backPath?: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export const LevelPage = ({
  worldName, worldEmoji, levelNum, levelName, levelEmoji, xpReward,
  gradientFrom, gradientTo,
  accentBg, accentBorder, accentText, accentDark,
  stepActiveBg, stepActiveTxt, btnBg, btnShadow,
  missionTitle = 'Tu Misión', missionText, missionTags,
  steps, errors, recipe,
  challengeTitle = 'Sube tu Reto',
  challengeHint = 'Fotografía tu resultado y súbelo para completar el nivel.',
  evaluationCriteria,
  backPath = '/mapa',
}: LevelPageProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<'idle' | 'reviewing' | 'approved' | 'rejected'>('idle');
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);

  const allStepsComplete = completedSteps.size === steps.length;
  const progress = (completedSteps.size / steps.length) * 100;

  const handleMarkStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      setUploadState('reviewing');
      let result: EvaluationResult;
      try {
        result = await evaluateImage(imageData, levelName, evaluationCriteria || []);
      } catch {
        result = { stars: 3, feedback: '¡Excelente trabajo! Técnica bien ejecutada.' };
      }
      setEvaluationResult(result);
      if (result.stars === 0) {
        // Imagen inválida — no guardar progreso ni XP
        setUploadState('rejected');
      } else {
        // Guardar progreso: XP solo si es la primera vez que se completa este nivel
        const isFirstCompletion = getLevelStars(location.pathname) === 0;
        saveLevelStars(location.pathname, result.stars);
        if (isFirstCompletion) addXP(xpReward);
        setUploadState('approved');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Derive a solid accent color from btnBg for dot indicators
  const dotColor = btnBg.split(' ')[0].replace('bg-', 'bg-');

  return (
    <div className="min-h-full bg-neutral-50">

      {/* ── Hero Header ── */}
      <div className={`relative bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white overflow-hidden`}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-12 w-24 h-24 rounded-full bg-black/10 translate-y-10" />

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
                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded-full">
                  <EditableText elementKey={`lvl_${levelNum}_worldEmoji`} defaultText={worldEmoji} />{' '}
                  <EditableText elementKey={`lvl_${levelNum}_worldName`} defaultText={worldName} />
                </span>
                <span className="text-xs text-white/50">›</span>
                <span className="text-xs font-bold text-white/70">Nivel {levelNum}</span>
              </div>
              <h1 className="text-2xl font-black mt-1 leading-tight">
                <EditableText elementKey={`lvl_${levelNum}_levelEmoji`} defaultText={levelEmoji} />{' '}
                <EditableText elementKey={`lvl_${levelNum}_levelName`} defaultText={levelName} />
              </h1>
            </div>

            {/* XP badge */}
            <div className="flex-shrink-0 bg-white/20 rounded-2xl px-3 py-2 text-center">
              <p className="text-[10px] text-white/60 font-semibold">Recompensa</p>
              <p className="font-black text-yellow-300 text-lg leading-none">+{xpReward}</p>
              <p className="text-[10px] text-white/60">XP</p>
            </div>
          </div>

          {/* Progress bar — flush to bottom of header */}
          <div className="max-w-3xl mx-auto mt-4">
            <div className="flex justify-between text-[11px] text-white/70 mb-1.5 px-0.5">
              <span className="font-semibold">{completedSteps.size}/{steps.length} pasos completados</span>
              <span className="font-bold">{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-t-none rounded-b-none overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

        {/* ── Academy shortcut ── */}
        <button
          onClick={() => navigate('/academia')}
          className="w-full flex items-center gap-3 bg-white border border-violet-100 rounded-2xl px-4 py-3 hover:bg-violet-50 transition-colors group text-left shadow-sm"
        >
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center flex-shrink-0 shadow-sm shadow-violet-300">
            <BookOpen size={18} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-violet-700 text-sm truncate">
              <EditableText elementKey={`lvl_${levelNum}_link_acad`} defaultText={`La Academia → Clase: ${levelName}`} as="span" />
            </p>
            <p className="text-xs text-violet-400">
              <EditableText elementKey={`lvl_${levelNum}_link_acad_desc`} defaultText="Teoría + técnica + errores comunes" as="span" />
            </p>
          </div>
          <ChevronRight size={16} className="text-violet-300 group-hover:translate-x-1 transition-transform flex-shrink-0" />
        </button>

        {/* ── Mission card ── */}
        <div className={`bg-white border ${accentBorder} rounded-2xl overflow-hidden shadow-sm`}>
          <div className={`bg-gradient-to-br ${accentBg} to-white px-5 py-4`}>
            <div className="flex items-start gap-3">
              <span className="text-3xl leading-none mt-0.5">🎯</span>
              <div className="flex-1">
                <h2 className={`font-black ${accentDark} text-base mb-1`}>
                  <EditableText elementKey={`lvl_${levelNum}_missionTitle`} defaultText={missionTitle} />
                </h2>
                {/* ✅ HTML rendering fixed: missionText supports <strong> tags */}
                <div
                  className={`${accentText} text-sm leading-relaxed`}
                  dangerouslySetInnerHTML={{ __html: missionText }}
                />
              </div>
            </div>
          </div>
          <div className={`border-t ${accentBorder} px-5 py-3 flex flex-wrap gap-2`}>
            {missionTags.map((tag, i) => (
              <span key={i} className={`flex items-center gap-1 text-xs font-bold ${accentBg} ${accentText} border ${accentBorder} px-2.5 py-1 rounded-full`}>
                {tag.icon} {tag.label}
              </span>
            ))}
            <span className="flex items-center gap-1 text-xs font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 px-2.5 py-1 rounded-full">
              <Star size={10} fill="currentColor" /> Hasta 3 ⭐
            </span>
          </div>
        </div>

        {/* ── Recipe card ── */}
        {recipe && (
          <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
            <button
              onClick={() => setShowRecipe(!showRecipe)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <span className="text-lg">📋</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-800 text-sm">Receta: {recipe.name}</p>
                  <p className="text-xs text-neutral-400">{recipe.servings} · {recipe.time} · {recipe.difficulty}</p>
                </div>
              </div>
              <ChevronRight size={16} className={`text-neutral-400 transition-transform duration-300 ${showRecipe ? 'rotate-90' : ''}`} />
            </button>

            {showRecipe && (
              <div className="border-t border-neutral-100">
                <p className="text-sm text-neutral-500 px-5 pt-4 pb-2 leading-relaxed">{recipe.description}</p>

                <div className="grid grid-cols-3 gap-3 px-5 pb-4">
                  {[
                    { icon: <Users size={14} />, label: 'Porciones', val: recipe.servings },
                    { icon: <Clock size={14} />, label: 'Tiempo', val: recipe.time },
                    { icon: <BarChart2 size={14} />, label: 'Dificultad', val: recipe.difficulty },
                  ].map((m, i) => (
                    <div key={i} className={`${accentBg} border ${accentBorder} rounded-xl p-3 text-center`}>
                      <div className={`flex justify-center mb-1 ${accentText}`}>{m.icon}</div>
                      <p className="text-[10px] text-neutral-400 font-medium">{m.label}</p>
                      <p className={`font-bold ${accentDark} text-sm mt-0.5`}>{m.val}</p>
                    </div>
                  ))}
                </div>

                <div className="px-5 pb-4 space-y-4">
                  <div>
                    <h4 className="font-bold text-neutral-700 text-sm mb-2.5 flex items-center gap-2">
                      🧂 <span>Ingredientes</span>
                    </h4>
                    <ul className="space-y-1.5">
                      {recipe.ingredients.map((ing, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-neutral-700">
                          <span className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${dotColor}`} />
                          {ing}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-700 text-sm mb-2.5 flex items-center gap-2">
                      👨‍🍳 <span>Preparación</span>
                    </h4>
                    <ol className="space-y-2.5">
                      {recipe.method.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm text-neutral-700">
                          <span className={`w-6 h-6 rounded-full ${stepActiveBg} ${stepActiveTxt} flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5`}>{i + 1}</span>
                          <span className="leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Step-by-step ── */}
        <div>
          <h2 className="text-base font-black text-neutral-800 mb-3 flex items-center gap-2">
            <div className={`w-7 h-7 rounded-lg ${stepActiveBg} ${stepActiveTxt} flex items-center justify-center`}>
              <Play size={14} fill="currentColor" />
            </div>
            Instrucciones Paso a Paso
          </h2>
          <div className="space-y-2.5">
            {steps.map((step, i) => {
              const isActive = activeStep === i;
              const isDone = completedSteps.has(i);
              return (
                <div
                  key={i}
                  className={`bg-white rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-sm ${
                    isDone
                      ? `${accentBorder} bg-gradient-to-r ${accentBg} to-white`
                      : isActive
                      ? `${accentBorder} shadow-md`
                      : 'border-neutral-100 hover:border-neutral-200'
                  }`}
                >
                  <button
                    className="w-full flex items-center gap-3 p-4 text-left"
                    onClick={() => setActiveStep(isActive ? -1 : i)}
                  >
                    {/* Step number */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm transition-all duration-200 ${
                      isDone
                        ? `${btnBg.split(' ')[0]} text-white shadow-sm`
                        : isActive
                        ? `${stepActiveBg} ${stepActiveTxt}`
                        : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {isDone ? <CheckCircle size={18} /> : <span className="text-base">{step.emoji}</span>}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-neutral-800 text-sm leading-snug">
                        <EditableText elementKey={`lvl_${levelNum}_step_${i}_title`} defaultText={step.title} />
                      </p>
                      {!isActive && !isDone && (
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {step.desc.substring(0, 60)}…
                        </p>
                      )}
                      {isDone && (
                        <p className={`text-xs font-semibold ${accentText} mt-0.5`}>Completado ✓</p>
                      )}
                    </div>

                    <ChevronRight
                      size={16}
                      className={`text-neutral-300 transition-transform duration-200 flex-shrink-0 ${isActive ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {isActive && (
                    <div className="px-4 pb-4 border-t border-neutral-100 pt-4 space-y-3">
                      <p className="text-sm text-neutral-700 leading-relaxed">
                        <EditableText elementKey={`lvl_${levelNum}_step_${i}_desc`} defaultText={step.desc} as="span" />
                      </p>

                      {/* Tip */}
                      <div className="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <Lightbulb size={15} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          <strong className="font-black">Tip Pro: </strong>
                          <EditableText elementKey={`lvl_${levelNum}_step_${i}_tip`} defaultText={step.tip} as="span" />
                        </p>
                      </div>

                      <button
                        onClick={(e) => { e.stopPropagation(); handleMarkStep(i); setActiveStep(-1); }}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${
                          isDone
                            ? 'bg-neutral-100 text-neutral-500'
                            : `${btnBg} text-white shadow-sm`
                        }`}
                      >
                        {isDone
                          ? <EditableText elementKey={`lvl_${levelNum}_btn_undone`} defaultText="↩ Marcar como pendiente" as="span" />
                          : <EditableText elementKey={`lvl_${levelNum}_btn_done`} defaultText="✓ Marcar como completado" as="span" />
                        }
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── All steps done banner ── */}
        {allStepsComplete && !uploadedImage && (
          <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white rounded-2xl p-5 text-center shadow-lg ${btnShadow}`}>
            <Trophy size={28} className="mx-auto mb-2" />
            <p className="font-black text-lg">¡Pasos completados! 🎉</p>
            <p className="text-white/80 text-sm mt-1">Ahora sube la foto de tu trabajo para reclamar las ⭐ y el XP.</p>
          </div>
        )}

        {/* ── Common errors ── */}
        <div className="bg-white border border-red-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-red-50 px-5 py-3 border-b border-red-100">
            <h3 className="font-black text-red-700 flex items-center gap-2 text-sm">
              <AlertTriangle size={15} /> Errores Más Comunes
            </h3>
          </div>
          <div className="divide-y divide-red-50">
            {errors.map((e, i) => (
              <div key={i} className="px-5 py-3.5 flex gap-3 hover:bg-red-50/50 transition-colors">
                <span className="text-xl flex-shrink-0 mt-0.5">{e.icon}</span>
                <div className="min-w-0">
                  <p className="font-bold text-neutral-800 text-sm">
                    <EditableText elementKey={`lvl_${levelNum}_err_${i}_err`} defaultText={e.error} />
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5 leading-relaxed">
                    <EditableText elementKey={`lvl_${levelNum}_err_${i}_fix`} defaultText={e.fix} />
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Image Upload Challenge ── */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
          <div className={`${accentBg} border-b ${accentBorder} px-5 py-4`}>
            <h3 className={`font-black ${accentDark} text-base flex items-center gap-2`}>
              <Camera size={18} /> {challengeTitle}
            </h3>
            <p className={`${accentText} text-xs mt-1`}>{challengeHint}</p>
          </div>

          <div className="p-5">
            {!uploadedImage ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`rounded-xl border-2 border-dashed transition-all cursor-pointer text-center py-10 px-4 ${
                  dragOver
                    ? `${accentBorder} ${accentBg}`
                    : `border-neutral-200 hover:${accentBorder} hover:${accentBg}`
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl ${accentBg} border ${accentBorder} flex items-center justify-center mx-auto mb-3`}>
                  <Upload size={24} className={accentText} />
                </div>
                <p className="font-bold text-neutral-700">Arrastra tu foto aquí</p>
                <p className="text-sm text-neutral-400 mt-1">o haz clic para seleccionar</p>
                <p className="text-xs text-neutral-300 mt-2">JPG, PNG · Máx 10 MB</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden">
                  <img src={uploadedImage} alt="Tu reto" className="w-full max-h-72 object-cover" />
                  {uploadState === 'reviewing' && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-3 text-white">
                      <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                      <p className="font-bold text-sm">Analizando tu trabajo…</p>
                    </div>
                  )}
                  {uploadState === 'approved' && (
                    <div className="absolute inset-0 bg-emerald-500/25 flex items-center justify-center">
                      <div className="bg-emerald-500 rounded-full p-4 shadow-2xl shadow-emerald-900/30">
                        <CheckCircle size={40} className="text-white" />
                      </div>
                    </div>
                  )}
                  {uploadState === 'rejected' && (
                    <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                      <div className="bg-red-600 rounded-full p-4 shadow-2xl shadow-red-900/30">
                        <AlertTriangle size={40} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>

                {uploadState === 'approved' && evaluationResult && (
                  <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} text-white rounded-2xl p-5 text-center shadow-lg ${btnShadow}`}>
                    <Trophy size={32} className="mx-auto mb-2" />
                    <p className="font-black text-xl">¡Reto Completado! 🎉</p>
                    <div className="flex justify-center gap-1 mt-2 text-2xl">
                      {Array.from({ length: evaluationResult.stars }).map((_, i) => <span key={i}>⭐</span>)}
                    </div>
                    <p className="text-white/90 text-sm mt-2 leading-relaxed italic">"{evaluationResult.feedback}"</p>
                    <p className="text-white/70 text-xs mt-3">Ganaste <strong className="font-black text-white">{xpReward} XP</strong></p>
                  </div>
                )}

                {uploadState === 'rejected' && evaluationResult && (
                  <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-center">
                    <AlertTriangle size={32} className="mx-auto mb-2 text-red-500" />
                    <p className="font-black text-lg text-red-700">Foto no válida ❌</p>
                    <p className="text-red-600 text-sm mt-2 leading-relaxed">{evaluationResult.feedback}</p>
                    <p className="text-red-400 text-xs mt-3">La foto debe mostrar claramente el resultado de la tarea para completar el nivel.</p>
                  </div>
                )}

                {uploadState !== 'reviewing' && (
                  <button
                    onClick={() => { setUploadedImage(null); setUploadState('idle'); setEvaluationResult(null); }}
                    className={`w-full py-2 text-sm font-bold transition-colors ${
                      uploadState === 'rejected'
                        ? 'text-red-500 hover:text-red-700'
                        : 'text-neutral-400 hover:text-red-500'
                    }`}
                  >
                    {uploadState === 'rejected' ? '📷 Volver a intentar con otra foto' : 'Cambiar foto'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Evaluation criteria */}
          {!uploadedImage && evaluationCriteria && (
            <div className={`border-t ${accentBorder} bg-neutral-50 px-5 py-4`}>
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3">¿Cómo se evalúa?</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {evaluationCriteria.map((c, i) => (
                  <div key={i} className="bg-white border border-neutral-100 rounded-xl p-2.5 shadow-sm">
                    <p className="text-lg">{c.stars}</p>
                    <p className="text-[10px] text-neutral-400 mt-1 leading-tight">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Dynamic Admin Blocks ── */}
        <div className="mt-2">
          <BlockZone zoneId={`lvl_${levelNum}_extras`} />
        </div>

        {/* ── Return to map ── */}
        {uploadState === 'approved' && (
          <button
            onClick={() => navigate(backPath)}
            className={`w-full py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r ${gradientFrom} ${gradientTo} hover:opacity-90 transition-all active:scale-95 shadow-lg ${btnShadow}`}
          >
            <EditableText elementKey={`lvl_${levelNum}_btn_back`} defaultText="🗺️ Volver al Mapa de Aventura" as="span" />
          </button>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
};
