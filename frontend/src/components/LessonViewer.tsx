/**
 * Visor de clase a pantalla completa: lectura, quiz y resultados.
 * Se renderiza desde App.tsx, por eso no usa portal. No es un Dialog (no es
 * una hoja), pero se comporta como uno: rol, Escape y foco.
 *
 * levelColor/levelBg/levelBorder llegan como clases completas de Tailwind
 * desde los datos de la Academia.
 */

import { useState, useRef, useEffect, useId } from 'react';
import {
  ChevronRight, CheckCircle, AlertTriangle,
  Lightbulb, List, BookOpen, Award, RotateCcw, X,
} from 'lucide-react';
import { LESSON_CONTENT } from '../data/LessonContent';
import type { LessonSection } from '../data/LessonContent';
import { useWakeLock } from '../hooks/useWakeLock';
import { ScreenHeader } from './ui/ScreenHeader';

interface LessonViewerProps {
  lessonTitle: string;
  lessonEmoji: string;
  lessonDuration: string;
  levelName: string;
  levelColor: string;
  levelBg: string;
  levelBorder: string;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: (lessonTitle: string) => void;
}

const PRIMARY_BTN =
  'w-full min-h-11 flex items-center justify-center gap-2 px-4 rounded-control font-semibold text-sm text-white bg-brand-700 hover:bg-brand-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2';

const FOOTER = 'flex-shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white border-t border-neutral-200';

const Section = ({ s, lc, lb, lbr }: {
  s: LessonSection; lc: string; lb: string; lbr: string;
}) => {
  if (s.type === 'text') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${lc}`}>{s.title}</h3>}
      <p className="text-neutral-800 leading-relaxed text-sm">{s.content as string}</p>
    </div>
  );

  if (s.type === 'list') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${lc}`}>{s.title}</h3>}
      <ul className="space-y-2">
        {(s.content as string[]).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-800">
            {/* bg-current toma el color del nivel desde la clase de texto. */}
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current ${lc}`} aria-hidden />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (s.type === 'steps') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-3 ${lc}`}>{s.title}</h3>}
      <ol className="space-y-2">
        {(s.content as string[]).map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${lb} ${lc} font-bold flex items-center justify-center text-xs border ${lbr}`} aria-hidden>{i + 1}</span>
            <span className="text-neutral-800 leading-relaxed pt-0.5 min-w-0">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  if (s.type === 'tip') return (
    <div className={`mb-5 flex gap-3 p-3 rounded-card ${lb} border ${lbr}`}>
      <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${lc}`} aria-hidden />
      <p className="text-sm text-neutral-800 leading-relaxed min-w-0">
        {s.title && <span className="font-semibold">{s.title}. </span>}
        {s.content as string}
      </p>
    </div>
  );

  if (s.type === 'warning') return (
    <div className="mb-5 flex gap-3 p-3 rounded-card bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-800" aria-hidden />
      <p className="text-sm text-amber-800 leading-relaxed min-w-0">{s.content as string}</p>
    </div>
  );

  if (s.type === 'table') {
    const rows = s.content as { col1: string; col2: string }[];
    return (
      <div className="mb-5 overflow-x-auto">
        {s.title && <h3 className={`font-bold text-base mb-2 ${lc}`}>{s.title}</h3>}
        <table className="w-full text-sm border-collapse">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : lb}>
                <td className={`py-2 px-3 font-semibold border ${lbr} text-neutral-900 w-2/5`}>{row.col1}</td>
                <td className={`py-2 px-3 border ${lbr} text-neutral-700`}>{row.col2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
};

export const LessonViewer = ({
  lessonTitle, lessonEmoji, lessonDuration,
  levelName, levelColor, levelBg, levelBorder,
  isCompleted, onClose, onComplete,
}: LessonViewerProps) => {
  // Mientras la clase está abierta el usuario lee, a veces con las manos
  // ocupadas. El componente se desmonta al cerrar y el lock se libera solo.
  useWakeLock(true, { mediaSessionTitle: `Lección: ${lessonTitle}` });

  const key = lessonTitle.replace(/\s+/g, '');
  const data = LESSON_CONTENT[key];

  const [phase, setPhase] = useState<'reading' | 'quiz' | 'done'>('reading');
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [phase, quizIdx]);

  const resetQuiz = () => {
    setPhase('reading');
    setQuizIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrect(0);
  };

  // Escape hace lo mismo que el botón de cerrar visible: en el quiz vuelve a
  // la lectura, en las demás fases cierra el visor. Se guarda en ref para no
  // re-suscribir el listener en cada render.
  const escapeRef = useRef<() => void>(onClose);
  useEffect(() => {
    escapeRef.current = data && phase === 'quiz' ? resetQuiz : onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    rootRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      escapeRef.current();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  const question = data?.quiz[quizIdx];

  const handleAnswer = (idx: number) => {
    if (answered || !question) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === question.correct) setCorrect(c => c + 1);
  };

  const handleNext = () => {
    if (!data) return;
    if (quizIdx < data.quiz.length - 1) {
      setQuizIdx(q => q + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setPhase('done');
    }
  };

  const closeButton = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="w-11 h-11 flex items-center justify-center rounded-control text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
    >
      <X size={20} aria-hidden />
    </button>
  );

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-[150] h-dvh flex flex-col bg-white outline-none"
    >
      {!data && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <span className="text-5xl" aria-hidden>{lessonEmoji}</span>
          <h2 id={titleId} className="text-lg font-bold text-neutral-900 text-center">{lessonTitle}</h2>
          <p className="text-sm text-neutral-600 text-center">Esta clase todavía no está disponible.</p>
          <button type="button" onClick={onClose} className={`${PRIMARY_BTN} mt-2 max-w-xs`}>
            Volver a la Academia
          </button>
        </div>
      )}

      {data && phase === 'reading' && (
        <>
          <ScreenHeader
            className="pt-[env(safe-area-inset-top)]"
            title={<span id={titleId}>{lessonTitle}</span>}
            subtitle={`${levelName} · ${lessonDuration}`}
            actions={
              <>
                {isCompleted && (
                  <CheckCircle className="w-5 h-5 text-emerald-700" aria-label="Clase completada" role="img" />
                )}
                {closeButton('Cerrar clase', onClose)}
              </>
            }
          />

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
            <div className="max-w-2xl mx-auto">
              <p className={`mb-6 p-4 rounded-card ${levelBg} border ${levelBorder} text-sm font-semibold text-neutral-900 leading-relaxed`}>
                {data.intro}
              </p>
              {data.sections.map((section, i) => (
                <Section key={i} s={section} lc={levelColor} lb={levelBg} lbr={levelBorder} />
              ))}
              <div className="mt-6 mb-4">
                <h3 className={`flex items-center gap-2 mb-3 font-bold text-base ${levelColor}`}>
                  <List className="w-4 h-4" aria-hidden /> Puntos clave
                </h3>
                <ul className={`rounded-card border ${levelBorder} overflow-hidden`}>
                  {data.keyPoints.map((pt, i) => (
                    <li key={i} className={`flex items-start gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : levelBg} ${i !== 0 ? `border-t ${levelBorder}` : ''}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${levelColor}`} aria-hidden />
                      <p className="text-sm text-neutral-800 min-w-0">{pt}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className={FOOTER}>
            <button type="button" onClick={() => setPhase('quiz')} className={`${PRIMARY_BTN} max-w-2xl mx-auto`}>
              Responder el quiz <ChevronRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </>
      )}

      {data && phase === 'quiz' && question && (
        <>
          <ScreenHeader
            className="pt-[env(safe-area-inset-top)]"
            title={<span id={titleId}>Quiz: {lessonTitle}</span>}
            subtitle={`Pregunta ${quizIdx + 1} de ${data.quiz.length}`}
            actions={
              <>
                <div className="flex gap-1 pr-1" aria-hidden>
                  {data.quiz.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2 h-2 rounded-full ${i < quizIdx ? 'bg-emerald-700' : i === quizIdx ? `bg-current ${levelColor}` : 'bg-neutral-300'}`}
                    />
                  ))}
                </div>
                {closeButton('Salir del quiz y volver a la clase', resetQuiz)}
              </>
            }
          />

          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto">
              <h3 className="flex items-start gap-2 text-base font-extrabold text-neutral-900 leading-snug mb-6">
                <BookOpen className={`w-5 h-5 flex-shrink-0 ${levelColor}`} aria-hidden />
                <span className="min-w-0">{question.q}</span>
              </h3>
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  const isRight = i === question.correct;
                  const isSel = i === selected;
                  let style = 'border-neutral-200 bg-white hover:border-neutral-400';
                  let badge = 'border-neutral-300 text-neutral-600';
                  let mark = String.fromCharCode(65 + i);
                  if (answered) {
                    if (isRight) { style = 'border-emerald-700 bg-emerald-50'; badge = 'border-emerald-700 bg-emerald-700 text-white'; mark = '✓'; }
                    else if (isSel) { style = 'border-red-700 bg-red-50'; badge = 'border-red-700 bg-red-700 text-white'; mark = '✗'; }
                    else style = 'border-neutral-200 bg-white';
                  }
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={answered}
                      aria-pressed={answered ? isSel : undefined}
                      className={`w-full min-h-11 text-left flex items-center gap-3 p-4 rounded-card border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${style}`}
                    >
                      <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${badge}`} aria-hidden>
                        {mark}
                      </span>
                      <span className="text-sm text-neutral-800 leading-snug min-w-0">
                        {opt}
                        {answered && isRight && <span className="sr-only"> (respuesta correcta)</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div role="status" aria-live="polite">
                {answered && (
                  <div className={`mt-4 p-4 rounded-card border ${selected === question.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                    <p className={`text-sm font-bold mb-1 ${selected === question.correct ? 'text-emerald-800' : 'text-red-800'}`}>
                      {selected === question.correct ? '¡Correcto!' : 'Incorrecto'}
                    </p>
                    <p className="text-sm text-neutral-800 leading-relaxed">{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {answered && (
            <div className={FOOTER}>
              <button type="button" onClick={handleNext} className={`${PRIMARY_BTN} max-w-2xl mx-auto`}>
                {quizIdx < data.quiz.length - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
                <ChevronRight className="w-4 h-4" aria-hidden />
              </button>
            </div>
          )}
        </>
      )}

      {data && phase === 'done' && (() => {
        const pct = Math.round((correct / data.quiz.length) * 100);
        const passed = pct >= 66;
        return (
          <>
            <ScreenHeader
              className="pt-[env(safe-area-inset-top)]"
              title={lessonTitle}
              subtitle="Resultados del quiz"
              actions={closeButton('Cerrar sin marcar', onClose)}
            />
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center px-4 py-8 pb-[calc(2rem+env(safe-area-inset-bottom))] text-center">
              {passed
                ? <Award className="w-10 h-10 text-emerald-700 mb-3" aria-hidden />
                : <BookOpen className="w-10 h-10 text-amber-800 mb-3" aria-hidden />}
              <h2 id={titleId} className="text-xl font-extrabold text-neutral-900 mb-1">
                {passed ? '¡Clase completada!' : 'Repasa y vuelve a intentarlo'}
              </h2>
              <p className="text-neutral-600 text-sm mb-4">{correct} de {data.quiz.length} respuestas correctas ({pct}%)</p>
              <div
                className="w-full max-w-xs h-3 bg-neutral-200 rounded-full overflow-hidden mb-8"
                role="progressbar"
                aria-label="Respuestas correctas"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={pct}
              >
                <div className={`h-full rounded-full ${passed ? 'bg-emerald-700' : 'bg-amber-700'}`} style={{ width: `${pct}%` }} />
              </div>
              <div className={`w-full max-w-sm text-left rounded-card ${levelBg} border ${levelBorder} p-4 mb-6`}>
                <h3 className={`flex items-center gap-2 mb-3 text-sm font-semibold ${levelColor}`}>
                  <List className="w-4 h-4" aria-hidden /> Para recordar
                </h3>
                <ul className="space-y-2">
                  {data.keyPoints.slice(0, 3).map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-800">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current ${levelColor}`} aria-hidden />
                      <span className="min-w-0">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!passed && (
                <button
                  type="button"
                  onClick={resetQuiz}
                  className="mb-3 w-full max-w-sm min-h-11 flex items-center justify-center gap-2 rounded-control font-semibold text-sm border border-neutral-300 text-neutral-800 hover:bg-neutral-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
                >
                  <RotateCcw className="w-4 h-4" aria-hidden /> Repasar la clase
                </button>
              )}
              <button
                type="button"
                onClick={() => { onComplete(lessonTitle); onClose(); }}
                className={`${PRIMARY_BTN} max-w-sm`}
              >
                <CheckCircle className="w-4 h-4" aria-hidden />
                {isCompleted ? 'Volver a la Academia' : 'Marcar como completada'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 min-h-11 px-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
              >
                Volver sin marcar
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
};
