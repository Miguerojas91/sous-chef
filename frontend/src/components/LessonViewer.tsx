/**
 * LessonViewer.tsx
 *
 * Overlay full-screen del visor de clase.
 * Renderizado desde App.tsx/Layout, por lo que no necesita portal.
 * Fases: lectura → quiz → resultados.
 */

import { useState, useRef, useEffect } from 'react';
import {
  X, ChevronRight, CheckCircle, AlertTriangle,
  Lightbulb, List, BookOpen, Award, ChevronDown
} from 'lucide-react';
import { LESSON_CONTENT } from '../data/LessonContent';
import type { LessonSection } from '../data/LessonContent';

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

// ── helpers de color ───────────────────────────────────────────────────────────

function colorBtn(c: string) {
  if (c.includes('emerald')) return 'bg-emerald-500 hover:bg-emerald-600';
  if (c.includes('blue'))    return 'bg-blue-500 hover:bg-blue-600';
  if (c.includes('violet'))  return 'bg-violet-500 hover:bg-violet-600';
  if (c.includes('yellow'))  return 'bg-yellow-500 hover:bg-yellow-600';
  return 'bg-orange-500 hover:bg-orange-600';
}

function colorDot(c: string) {
  if (c.includes('emerald')) return 'bg-emerald-400';
  if (c.includes('blue'))    return 'bg-blue-400';
  if (c.includes('violet'))  return 'bg-violet-400';
  return 'bg-orange-400';
}

// ── sección de contenido ───────────────────────────────────────────────────────

const Section = ({ s, lc, lb, lbr }: {
  s: LessonSection; lc: string; lb: string; lbr: string;
}) => {
  if (s.type === 'text') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${lc}`}>{s.title}</h3>}
      <p className="text-neutral-700 leading-relaxed text-sm">{s.content as string}</p>
    </div>
  );

  if (s.type === 'list') return (
    <div className="mb-5">
      {s.title && <h3 className={`font-bold text-base mb-2 ${lc}`}>{s.title}</h3>}
      <ul className="space-y-2">
        {(s.content as string[]).map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorDot(lc)}`} />
            {item}
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
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${lb} ${lc} font-bold flex items-center justify-center text-xs border ${lbr}`}>{i + 1}</span>
            <span className="text-neutral-700 leading-relaxed pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );

  if (s.type === 'tip') return (
    <div className={`mb-5 flex gap-3 p-3 rounded-xl ${lb} border ${lbr}`}>
      <Lightbulb className={`w-4 h-4 flex-shrink-0 mt-0.5 ${lc}`} />
      <p className="text-sm text-neutral-700 leading-relaxed">{s.content as string}</p>
    </div>
  );

  if (s.type === 'warning') return (
    <div className="mb-5 flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
      <p className="text-sm text-amber-800 leading-relaxed">{s.content as string}</p>
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
                <td className={`py-2 px-3 font-semibold border ${lbr} text-neutral-800 w-2/5`}>{row.col1}</td>
                <td className={`py-2 px-3 border ${lbr} text-neutral-600`}>{row.col2}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
};

// ── componente principal ───────────────────────────────────────────────────────

export const LessonViewer = ({
  lessonTitle, lessonEmoji, lessonDuration,
  levelName, levelColor, levelBg, levelBorder,
  isCompleted, onClose, onComplete,
}: LessonViewerProps) => {

  const key = lessonTitle.replace(/\s+/g, '');
  const data = LESSON_CONTENT[key];

  const [phase, setPhase] = useState<'reading' | 'quiz' | 'done'>('reading');
  const [quizIdx, setQuizIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); }, [phase, quizIdx]);

  const btn = colorBtn(levelColor);
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

  const resetQuiz = () => {
    setPhase('reading');
    setQuizIdx(0);
    setSelected(null);
    setAnswered(false);
    setCorrect(0);
  };

  // ── Wrapper único — siempre fixed inset-0 z-[9999] ──────────────────────────
  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 9999, backgroundColor: 'white' }}
      className="flex flex-col"
    >

      {/* ── Sin contenido ── */}
      {!data && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
          <span className="text-5xl">{lessonEmoji}</span>
          <p className="text-lg font-bold text-neutral-700 text-center">{lessonTitle}</p>
          <p className="text-sm text-neutral-400 text-center">Esta clase estará disponible próximamente.</p>
          <button onClick={onClose} className="mt-2 px-6 py-2 bg-orange-500 text-white rounded-full font-bold text-sm">
            Volver a la Academia
          </button>
        </div>
      )}

      {/* ── Fase: lectura ── */}
      {data && phase === 'reading' && (
        <>
          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3 ${levelBg} border-b ${levelBorder} flex-shrink-0`}>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
              <X className={`w-5 h-5 ${levelColor}`} />
            </button>
            <span className="text-2xl">{lessonEmoji}</span>
            <div className="flex-1 min-w-0">
              <h2 className={`font-black text-sm leading-tight ${levelColor} truncate`}>{lessonTitle}</h2>
              <p className="text-xs text-neutral-500">{levelName} · {lessonDuration}</p>
            </div>
            {isCompleted && <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
          </div>

          {/* Contenido */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
            <div className={`mb-6 p-4 rounded-2xl ${levelBg} border ${levelBorder}`}>
              <p className={`text-sm font-semibold ${levelColor} leading-relaxed`}>{data.intro}</p>
            </div>
            {data.sections.map((section, i) => (
              <Section key={i} s={section} lc={levelColor} lb={levelBg} lbr={levelBorder} />
            ))}
            <div className="mt-6 mb-4">
              <div className={`flex items-center gap-2 mb-3 ${levelColor}`}>
                <List className="w-4 h-4" />
                <h3 className="font-black text-sm uppercase tracking-wide">Puntos clave</h3>
              </div>
              <div className={`rounded-xl border ${levelBorder} overflow-hidden`}>
                {data.keyPoints.map((pt, i) => (
                  <div key={i} className={`flex items-start gap-3 px-4 py-3 ${i % 2 === 0 ? 'bg-white' : levelBg} ${i !== 0 ? `border-t ${levelBorder}` : ''}`}>
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${levelColor}`} />
                    <p className="text-sm text-neutral-700">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="h-4" />
          </div>

          {/* Footer */}
          <div className={`flex-shrink-0 px-4 py-3 bg-white border-t ${levelBorder}`}>
            <button
              onClick={() => setPhase('quiz')}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm ${btn} transition-colors`}
            >
              Responder el quiz <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}

      {/* ── Fase: quiz ── */}
      {data && phase === 'quiz' && question && (
        <>
          {/* Header */}
          <div className={`flex items-center gap-3 px-4 py-3 ${levelBg} border-b ${levelBorder} flex-shrink-0`}>
            <button onClick={resetQuiz} className="p-1.5 rounded-full hover:bg-black/10 transition-colors">
              <X className={`w-5 h-5 ${levelColor}`} />
            </button>
            <BookOpen className={`w-5 h-5 ${levelColor}`} />
            <div className="flex-1">
              <p className={`text-xs font-bold uppercase tracking-wide ${levelColor}`}>Quiz · {lessonTitle}</p>
              <p className="text-xs text-neutral-500">Pregunta {quizIdx + 1} de {data.quiz.length}</p>
            </div>
            <div className="flex gap-1">
              {data.quiz.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i < quizIdx ? 'bg-emerald-400' : i === quizIdx ? levelColor.replace('text-', 'bg-') : 'bg-neutral-200'}`} />
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
            <h3 className="text-base font-black text-neutral-800 leading-snug mb-6">{question.q}</h3>
            <div className="space-y-3">
              {question.options.map((opt, i) => {
                const isRight = i === question.correct;
                const isSel = i === selected;
                let style = 'border-neutral-200 bg-white hover:border-neutral-300';
                if (answered) {
                  if (isRight) style = 'border-emerald-400 bg-emerald-50';
                  else if (isSel) style = 'border-red-400 bg-red-50';
                  else style = 'border-neutral-200 bg-white opacity-60';
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
                    className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${style}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border-2 ${
                      answered && isRight ? 'border-emerald-400 bg-emerald-400 text-white' :
                      answered && isSel && !isRight ? 'border-red-400 bg-red-400 text-white' :
                      'border-neutral-300 text-neutral-500'
                    }`}>
                      {answered && isRight ? '✓' : answered && isSel && !isRight ? '✗' : String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm text-neutral-700 leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>
            {answered && (
              <div className={`mt-4 p-4 rounded-xl ${selected === question.correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`text-xs font-bold mb-1 ${selected === question.correct ? 'text-emerald-700' : 'text-red-700'}`}>
                  {selected === question.correct ? '✓ ¡Correcto!' : '✗ Incorrecto'}
                </p>
                <p className="text-sm text-neutral-700 leading-relaxed">{question.explanation}</p>
              </div>
            )}
          </div>

          {answered && (
            <div className={`flex-shrink-0 px-4 py-3 bg-white border-t ${levelBorder}`}>
              <button onClick={handleNext}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm ${btn} transition-colors`}
              >
                {quizIdx < data.quiz.length - 1 ? 'Siguiente pregunta' : 'Ver resultados'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Fase: resultados ── */}
      {data && phase === 'done' && (() => {
        const pct = Math.round((correct / data.quiz.length) * 100);
        const passed = pct >= 66;
        return (
          <div ref={scrollRef} className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="text-6xl mb-4">{passed ? '🏆' : '📖'}</div>
            <h2 className="text-2xl font-black text-neutral-800 mb-1">{passed ? '¡Clase completada!' : 'Sigue aprendiendo'}</h2>
            <p className="text-neutral-500 text-sm mb-6">{correct} de {data.quiz.length} respuestas correctas — {pct}%</p>
            <div className="w-full max-w-xs h-3 bg-neutral-100 rounded-full overflow-hidden mb-8">
              <div className={`h-full rounded-full transition-all duration-700 ${passed ? 'bg-emerald-400' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
            </div>
            <div className={`w-full max-w-sm text-left rounded-2xl ${levelBg} border ${levelBorder} p-4 mb-6`}>
              <div className={`flex items-center gap-2 mb-3 ${levelColor}`}>
                <Award className="w-4 h-4" />
                <p className="text-xs font-black uppercase tracking-wide">Recuerda siempre</p>
              </div>
              <ul className="space-y-2">
                {data.keyPoints.slice(0, 3).map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-neutral-700">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${colorDot(levelColor)}`} />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            {!passed && (
              <button onClick={resetQuiz}
                className="mb-3 w-full max-w-sm flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border-2 border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <ChevronDown className="w-4 h-4 rotate-180" /> Repasar la clase
              </button>
            )}
            <button onClick={() => { onComplete(lessonTitle); onClose(); }}
              className={`w-full max-w-sm flex items-center justify-center gap-2 py-3 rounded-xl font-black text-white text-sm ${btn} transition-colors`}
            >
              <CheckCircle className="w-4 h-4" />
              {isCompleted ? 'Volver a la Academia' : 'Marcar como completado'}
            </button>
            <button onClick={onClose} className="mt-3 text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
              Volver sin marcar
            </button>
          </div>
        );
      })()}

    </div>
  );
};
