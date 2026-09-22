/**
 * Visor de clase a pantalla completa: lectura, quiz y resultados.
 * No es un Dialog (no es una hoja), pero se comporta como uno vía useModal.
 * Va en portal porque la Academia vive dentro del área desplazable del layout.
 * Los colores salen de `WORLD_THEME[nivel.world].academy`.
 */

import { useState, useRef, useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight, CheckCircle, AlertTriangle, ChevronDown,
  Lightbulb, List, BookOpen, Award, X,
} from 'lucide-react';
import { findLesson } from '../data/academy';
import type { AcademyLevel, Lesson, LessonContent, LessonSection } from '../data/lessons';
import { WORLD_THEME } from '../data/worlds';
import type { AcademyTheme } from '../data/worlds';
import { useWakeLock } from '../hooks/useWakeLock';
import { useModal } from '../hooks/useModal';

interface LessonViewerProps {
  lessonId: string;
  isCompleted: boolean;
  onClose: () => void;
  onComplete: (lessonId: string) => void;
}

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2';

const primaryBtn = (a: AcademyTheme) =>
  `w-full min-h-11 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm transition-colors ${a.btn} ${FOCUS_RING}`;

const footer = (a: AcademyTheme) =>
  `flex-shrink-0 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white border-t ${a.border}`;

const Section = ({ s, a }: { s: LessonSection; a: AcademyTheme }) => {
  if (s.type === 'text') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${a.color}`}>{s.title}</h3>}
      <p className="text-neutral-700 leading-relaxed text-sm">{s.content}</p>
    </div>
  );

  if (s.type === 'list') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${a.color}`}>{s.title}</h3>}
      <ul className="space-y-2">
        {s.content.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.viewerDot}`} aria-hidden />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (s.type === 'steps') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-3 ${a.color}`}>{s.title}</h3>}
      <ol className="space-y-2">
        {s.content.map((step, i) => (
          <li key={i} className="flex items-start gap-3 text-sm">
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${a.bg} ${a.color} font-bold flex items-center justify-center text-xs border ${a.border}`} aria-hidden>{i + 1}</span>
            <span className="text-neutral-700 leading-relaxed pt-0.5 min-w-0">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  if (s.type === 'tip') return (
    <div className={`mb-5 flex gap-3 p-3 rounded-xl ${a.bg} border ${a.border}`}>
      <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.color}`} aria-hidden />
      <p className="text-sm text-neutral-700 leading-relaxed min-w-0">
        {s.title && <span className="font-semibold">{s.title}. </span>}
        {s.content}
      </p>
    </div>
  );

  if (s.type === 'warning') return (
    <div className="mb-5 flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" aria-hidden />
      <p className="text-sm text-amber-800 leading-relaxed min-w-0">{s.content}</p>
    </div>
  );

  if (s.type === 'table') return (
    <div className="mb-5 overflow-x-auto">
      {s.title && <h3 className={`font-bold text-base mb-2 ${a.color}`}>{s.title}</h3>}
      <table className="w-full text-sm border-collapse">
        <tbody>
          {s.content.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-white' : a.bg}>
              <td className={`py-2 px-3 font-semibold border ${a.border} text-neutral-800 w-2/5`}>{row.col1}</td>
              <td className={`py-2 px-3 border ${a.border} text-neutral-600`}>{row.col2}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return null;
};

const CloseButton = ({ label, onClick, a }: { label: string; onClick: () => void; a: AcademyTheme }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className="w-11 h-11 -ml-1.5 flex-shrink-0 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
  >
    <X className={`w-5 h-5 ${a.color}`} aria-hidden />
  </button>
);

/** Barra superior del visor en el color del nivel. */
const ViewerHeader = ({ a, children }: { a: AcademyTheme; children: ReactNode }) => (
  <div className={`flex items-center gap-3 px-4 py-2 pt-[calc(0.5rem+env(safe-area-inset-top))] ${a.bg} border-b ${a.border} flex-shrink-0`}>
    {children}
  </div>
);

/**
 * Contenedor modal del visor. Se monta una vez por clase: las fases cambian
 * solo sus hijos, así useModal no reinicia el foco ni la pila al avanzar.
 * El foco inicial va al contenedor para que el lector anuncie el título.
 */
const ViewerShell = ({ titleId, onEscape, children }: {
  titleId: string;
  onEscape: () => void;
  children: ReactNode;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);
  useModal(rootRef, { onEscape, initialFocusRef: rootRef });
  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-[150] h-dvh flex flex-col bg-white outline-none"
    >
      {children}
    </div>
  );
};

export const LessonViewer = ({ lessonId, ...rest }: LessonViewerProps) => {
  const found = findLesson(lessonId);
  if (!found) return null;
  return createPortal(<LessonPanel lesson={found.lesson} level={found.level} {...rest} />, document.body);
};

type PanelProps = Omit<LessonViewerProps, 'lessonId'> & { lesson: Lesson; level: AcademyLevel };

const LessonPanel = (props: PanelProps) => {
  const { lesson, onClose } = props;
  const titleId = useId();

  // Mientras la clase está abierta el usuario lee, a veces con las manos
  // ocupadas. El componente se desmonta al cerrar y el lock se libera solo.
  useWakeLock(true, { mediaSessionTitle: `Lección: ${lesson.title}` });

  if (!lesson.content) {
    return (
      <ViewerShell titleId={titleId} onEscape={onClose}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 pt-[calc(2rem+env(safe-area-inset-top))] pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <span className="text-5xl" aria-hidden>{lesson.emoji}</span>
          <h2 id={titleId} className="text-lg font-bold text-neutral-700 text-center">{lesson.title}</h2>
          <p className="text-sm text-neutral-400 text-center">Esta clase todavía no está disponible.</p>
          <button
            type="button"
            onClick={onClose}
            className={`mt-2 min-h-11 px-6 py-2 bg-orange-500 text-white rounded-full font-bold text-sm ${FOCUS_RING}`}
          >
            Volver a la Academia
          </button>
        </div>
      </ViewerShell>
    );
  }

  return <LessonFlow {...props} content={lesson.content} titleId={titleId} />;
};

type Phase = { name: 'reading' } | { name: 'quiz' } | { name: 'done'; correct: number };

const LessonFlow = ({ lesson, level, content, titleId, isCompleted, onClose, onComplete }: PanelProps & {
  content: LessonContent;
  titleId: string;
}) => {
  const [phase, setPhase] = useState<Phase>({ name: 'reading' });
  const a = WORLD_THEME[level.world].academy;
  const backToReading = () => setPhase({ name: 'reading' });

  // Escape hace lo mismo que el botón de cerrar visible: en el quiz vuelve a
  // la lectura, en las demás fases cierra el visor.
  return (
    <ViewerShell titleId={titleId} onEscape={phase.name === 'quiz' ? backToReading : onClose}>
      {phase.name === 'reading' && (
        <Reading
          lesson={lesson}
          levelName={level.name}
          content={content}
          a={a}
          titleId={titleId}
          isCompleted={isCompleted}
          onClose={onClose}
          onStartQuiz={() => setPhase({ name: 'quiz' })}
        />
      )}
      {phase.name === 'quiz' && (
        <Quiz
          lessonTitle={lesson.title}
          content={content}
          a={a}
          titleId={titleId}
          onExit={backToReading}
          onFinish={correct => setPhase({ name: 'done', correct })}
        />
      )}
      {phase.name === 'done' && (
        <Results
          lessonTitle={lesson.title}
          content={content}
          a={a}
          titleId={titleId}
          correct={phase.correct}
          isCompleted={isCompleted}
          onRetry={backToReading}
          onComplete={() => { onComplete(lesson.id); onClose(); }}
          onClose={onClose}
        />
      )}
    </ViewerShell>
  );
};

const Reading = ({ lesson, levelName, content, a, titleId, isCompleted, onClose, onStartQuiz }: {
  lesson: Lesson;
  levelName: string;
  content: LessonContent;
  a: AcademyTheme;
  titleId: string;
  isCompleted: boolean;
  onClose: () => void;
  onStartQuiz: () => void;
}) => (
  <>
    <ViewerHeader a={a}>
      <CloseButton label="Cerrar clase" onClick={onClose} a={a} />
      <span className="text-2xl" aria-hidden>{lesson.emoji}</span>
      <div className="flex-1 min-w-0">
        <h2 id={titleId} className={`font-black text-sm leading-tight ${a.color} truncate`}>{lesson.title}</h2>
        <p className="text-xs text-neutral-500">{levelName} · {lesson.duration}</p>
      </div>
      {isCompleted && (
        <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" aria-label="Clase completada" role="img" />
      )}
    </ViewerHeader>

    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5">
      <div className="max-w-2xl mx-auto">
        <div className={`mb-6 p-4 rounded-2xl ${a.bg} border ${a.border}`}>
          <p className={`text-sm font-semibold ${a.color} leading-relaxed`}>{content.intro}</p>
        </div>
        {content.sections.map((section, i) => (
          <Section key={i} s={section} a={a} />
        ))}
        <div className="mt-6 mb-4">
          <h3 className={`flex items-center gap-2 mb-3 font-black text-sm uppercase tracking-wide ${a.color}`}>
            <List className="w-4 h-4" aria-hidden /> Puntos clave
          </h3>
          <ul className={`rounded-xl border ${a.border} overflow-hidden`}>
            {content.keyPoints.map((pt, i) => (
              <li key={i} className={`flex items-start gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : a.bg} ${i !== 0 ? `border-t ${a.border}` : ''}`}>
                <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.color}`} aria-hidden />
                <p className="text-sm text-neutral-700 min-w-0">{pt}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="h-4" />
      </div>
    </div>

    <div className={footer(a)}>
      <button type="button" onClick={onStartQuiz} className={`${primaryBtn(a)} max-w-2xl mx-auto`}>
        Responder el quiz <ChevronRight className="w-4 h-4" aria-hidden />
      </button>
    </div>
  </>
);

const Quiz = ({ lessonTitle, content, a, titleId, onExit, onFinish }: {
  lessonTitle: string;
  content: LessonContent;
  a: AcademyTheme;
  titleId: string;
  onExit: () => void;
  onFinish: (correct: number) => void;
}) => {
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const answered = selected !== null;
  const total = content.quiz.length;
  const question = content.quiz[quizIdx];

  // Cada pregunta nueva empieza arriba; entre fases no hace falta porque
  // cada fase monta su propio contenedor desplazable.
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [quizIdx]);

  if (!question) return null;
  const isLast = quizIdx === total - 1;

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    if (idx === question.correct) setCorrect(c => c + 1);
  };

  const handleNext = () => {
    if (isLast) {
      onFinish(correct);
      return;
    }
    setQuizIdx(q => q + 1);
    setSelected(null);
  };

  return (
    <>
      <ViewerHeader a={a}>
        <CloseButton label="Salir del quiz y volver a la clase" onClick={onExit} a={a} />
        <BookOpen className={`w-5 h-5 flex-shrink-0 ${a.color}`} aria-hidden />
        <div className="flex-1 min-w-0">
          <h2 id={titleId} className={`text-xs font-bold uppercase tracking-wide ${a.color} truncate`}>Quiz · {lessonTitle}</h2>
          <p className="text-xs text-neutral-500">Pregunta {quizIdx + 1} de {total}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0" aria-hidden>
          {content.quiz.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i < quizIdx ? 'bg-emerald-400' : i === quizIdx ? a.quizDot : 'bg-neutral-200'}`}
            />
          ))}
        </div>
      </ViewerHeader>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <h3 className="text-base font-black text-neutral-800 leading-snug mb-6">{question.q}</h3>
          <div className="space-y-3">
            {question.options.map((opt, i) => {
              const isRight = i === question.correct;
              const isSel = i === selected;
              let style = 'border-neutral-200 bg-white hover:border-neutral-300';
              let badge = 'border-neutral-300 text-neutral-500';
              let mark = String.fromCharCode(65 + i);
              if (answered) {
                if (isRight) { style = 'border-emerald-400 bg-emerald-50'; badge = 'border-emerald-400 bg-emerald-400 text-white'; mark = '✓'; }
                else if (isSel) { style = 'border-red-400 bg-red-50'; badge = 'border-red-400 bg-red-400 text-white'; mark = '✗'; }
                else style = 'border-neutral-200 bg-white opacity-60';
              }
              return (
                <button
                  type="button"
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={answered}
                  aria-pressed={answered ? isSel : undefined}
                  className={`w-full min-h-11 text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 ${style}`}
                >
                  <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${badge}`} aria-hidden>
                    {mark}
                  </span>
                  <span className="text-sm text-neutral-700 leading-snug min-w-0">
                    {opt}
                    {answered && isRight && <span className="sr-only"> (respuesta correcta)</span>}
                  </span>
                </button>
              );
            })}
          </div>
          <div role="status" aria-live="polite">
            {answered && (
              <div className={`mt-4 p-4 rounded-xl border ${selected === question.correct ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className={`text-xs font-bold mb-1 ${selected === question.correct ? 'text-emerald-700' : 'text-red-700'}`}>
                  <span aria-hidden>{selected === question.correct ? '✓ ' : '✗ '}</span>
                  {selected === question.correct ? '¡Correcto!' : 'Incorrecto'}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {answered && (
        <div className={footer(a)}>
          <button type="button" onClick={handleNext} className={`${primaryBtn(a)} max-w-2xl mx-auto`}>
            {isLast ? 'Ver resultados' : 'Siguiente pregunta'}
            <ChevronRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      )}
    </>
  );
};

const PASS_PERCENT = 66;

const Results = ({ lessonTitle, content, a, titleId, correct, isCompleted, onRetry, onComplete, onClose }: {
  lessonTitle: string;
  content: LessonContent;
  a: AcademyTheme;
  titleId: string;
  correct: number;
  isCompleted: boolean;
  onRetry: () => void;
  onComplete: () => void;
  onClose: () => void;
}) => {
  const total = content.quiz.length;
  const pct = Math.round((correct / total) * 100);
  const passed = pct >= PASS_PERCENT;

  return (
    <>
      <ViewerHeader a={a}>
        <CloseButton label="Cerrar sin marcar" onClick={onClose} a={a} />
        <div className="flex-1 min-w-0">
          <p className={`font-black text-sm leading-tight ${a.color} truncate`}>{lessonTitle}</p>
          <p className="text-xs text-neutral-500">Resultados del quiz</p>
        </div>
      </ViewerHeader>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 py-10 pb-[calc(2.5rem+env(safe-area-inset-bottom))] text-center">
        <div className="text-6xl mb-4" aria-hidden>{passed ? '🏆' : '📖'}</div>
        <h2 id={titleId} className="text-2xl font-black text-neutral-800 mb-1">
          {passed ? '¡Clase completada!' : 'Repasa y vuelve a intentarlo'}
        </h2>
        <p className="text-neutral-500 text-sm mb-6">{correct} de {total} respuestas correctas ({pct}%)</p>
        <div
          className="w-full max-w-xs h-3 bg-neutral-100 rounded-full overflow-hidden mb-8"
          role="progressbar"
          aria-label="Respuestas correctas"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className={`h-full rounded-full transition-all duration-700 motion-reduce:transition-none ${passed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
        </div>
        <div className={`w-full max-w-sm text-left rounded-2xl ${a.bg} border ${a.border} p-4 mb-6`}>
          <h3 className={`flex items-center gap-2 mb-3 text-xs font-black uppercase tracking-wide ${a.color}`}>
            <Award className="w-4 h-4" aria-hidden /> Para recordar
          </h3>
          <ul className="space-y-2">
            {content.keyPoints.slice(0, 3).map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.viewerDot}`} aria-hidden />
                <span className="min-w-0">{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        {!passed && (
          <button
            type="button"
            onClick={onRetry}
            className={`mb-3 w-full max-w-sm min-h-11 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors ${FOCUS_RING}`}
          >
            <ChevronDown className="w-4 h-4 rotate-180" aria-hidden /> Repasar la clase
          </button>
        )}
        <button type="button" onClick={onComplete} className={`${primaryBtn(a)} max-w-sm`}>
          <CheckCircle className="w-4 h-4" aria-hidden />
          {isCompleted ? 'Volver a la Academia' : 'Marcar como completada'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-11 px-4 text-xs text-neutral-400 hover:text-neutral-600 transition-colors rounded-control focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700"
        >
          Volver sin marcar
        </button>
      </div>
    </>
  );
};
