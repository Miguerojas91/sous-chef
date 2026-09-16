/**
 * La Academia: clases teóricas agrupadas en 4 niveles. Cada nivel es un
 * acordeón y cada clase una tarjeta expandible que abre el visor de clase.
 * Las clases premium llevan a /membresia si el usuario no tiene Premium.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPremiumUser } from '../utils/membership';
import { showToast } from '../utils/events';
import { BookOpen, Clock, ChevronDown, ChevronUp, Lock, CheckCircle, PlayCircle, Crown } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { LessonViewer } from './LessonViewer';
import { ACADEMY_LEVELS } from '../data/lessons';
import type { AcademyLevel, Lesson } from '../data/lessons';
import {
    TOTAL_LESSONS, canOpenLesson, cmsKeyFor, loadCompletedLessons, saveCompletedLessons,
} from '../data/academy';
import type { LessonAccess } from '../data/academy';
import { WORLD_CLASSES } from '../data/worlds';

const LessonCard = ({ lesson, level, access, isCompleted, onOpen }: {
    lesson: Lesson;
    level: AcademyLevel;
    access: LessonAccess;
    isCompleted: boolean;
    onOpen: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const key = cmsKeyFor(lesson);
    const cls = WORLD_CLASSES[level.world];
    const locked = access === 'locked';
    const panelId = `acad-lesson-${lesson.id}`;

    return (
        <div className={`rounded-card border ${open ? cls.line : 'border-neutral-200'} bg-white overflow-hidden`}>
            <button
                type="button"
                className="w-full min-h-14 text-left p-4 flex items-start gap-3 disabled:cursor-not-allowed"
                onClick={() => setOpen(o => !o)}
                disabled={locked}
                aria-expanded={locked ? undefined : open}
                aria-controls={locked ? undefined : panelId}
            >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                    <EditableText elementKey={`acad_lesson_${key}_emoji`} defaultText={lesson.emoji} as="span" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                        <span className="font-bold text-neutral-900 text-sm leading-snug min-w-0">
                            <EditableText elementKey={`acad_lesson_${key}_title`} defaultText={lesson.title} as="span" />
                        </span>
                        {lesson.isPremium && (
                            <Crown size={14} className="text-brand-700 flex-shrink-0 mt-0.5" aria-label="Premium" role="img" />
                        )}
                        {isCompleted && (
                            <CheckCircle size={14} className="text-emerald-700 flex-shrink-0 mt-0.5" aria-label="Completada" role="img" />
                        )}
                    </div>
                    <p className="flex items-center gap-1.5 mt-1 text-xs text-neutral-600 font-medium">
                        <Clock size={12} aria-hidden /> {lesson.duration}
                    </p>
                </div>
                {locked
                    ? <Lock size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />
                    : open
                        ? <ChevronUp size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />
                        : <ChevronDown size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />}
            </button>

            {open && (
                <div id={panelId} className={`px-4 pb-4 border-t ${cls.line} ${cls.soft}`}>
                    <div className="text-sm text-neutral-700 mt-3 leading-relaxed">
                        <EditableText elementKey={`acad_lesson_${key}_desc`} defaultText={lesson.description} as="p" />
                    </div>
                    <div className="mt-3">
                        <p className="text-sm font-semibold text-neutral-600 mb-2">Temas</p>
                        <ul className="space-y-1">
                            {lesson.topics.map((t, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-800">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${cls.bg}`} aria-hidden />
                                    <EditableText elementKey={`acad_lesson_${key}_top_${i}`} defaultText={t} as="span" />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        type="button"
                        onClick={onOpen}
                        className="mt-4 w-full min-h-11 flex items-center justify-center gap-2 px-4 rounded-control font-semibold text-sm text-white bg-brand-700 hover:bg-brand-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
                    >
                        {access === 'premium' ? <Lock size={16} aria-hidden /> : <PlayCircle size={16} aria-hidden />}
                        {access === 'premium' ? 'Ver Premium' : isCompleted ? 'Repasar clase' : 'Comenzar clase'}
                    </button>
                </div>
            )}
        </div>
    );
};

export const AcademyModule = () => {
    const navigate = useNavigate();
    const hasPremium = isPremiumUser();
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const [completedSet, setCompletedSet] = useState<Set<string>>(loadCompletedLessons);
    const [openLessonId, setOpenLessonId] = useState<string | null>(null);

    const markCompleted = (id: string) => {
        setCompletedSet(prev => {
            const next = new Set(prev);
            next.add(id);
            saveCompletedLessons(next);
            return next;
        });
    };

    const handleOpen = (lesson: Lesson, access: LessonAccess) => {
        if (access === 'premium') {
            showToast('Esta clase es de Premium.', 'info');
            navigate('/membresia');
            return;
        }
        if (access === 'open') setOpenLessonId(lesson.id);
    };

    const completedTotal = ACADEMY_LEVELS.reduce(
        (n, l) => n + l.lessons.filter(lesson => completedSet.has(lesson.id)).length, 0,
    );

    return (
        <div className="p-4 md:p-6 w-full max-w-5xl mx-auto">
            {openLessonId && (
                <LessonViewer
                    lessonId={openLessonId}
                    isCompleted={completedSet.has(openLessonId)}
                    onClose={() => setOpenLessonId(null)}
                    onComplete={markCompleted}
                />
            )}

            <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3">
                <div className="min-w-0">
                    <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 flex items-center gap-2">
                        <BookOpen className="text-brand-700 flex-shrink-0" size={22} aria-hidden />
                        <EditableText elementKey="academy_title" defaultText="La Academia" as="span" />
                    </h2>
                    <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
                        <EditableText elementKey="academy_subtitle" defaultText="Clases cortas de técnica y teoría de cocina. Cada una termina con un quiz y te prepara para los retos del Modo Aventura." as="span" />
                    </p>
                </div>
                <div className="flex-shrink-0 sm:text-right">
                    <p id="academy-progress-label" className="text-sm text-neutral-600 font-medium">
                        {completedTotal}/{TOTAL_LESSONS} clases completadas
                    </p>
                    <div
                        className="w-full sm:w-40 h-2 bg-neutral-200 rounded-full overflow-hidden mt-1"
                        role="progressbar"
                        aria-labelledby="academy-progress-label"
                        aria-valuemin={0}
                        aria-valuemax={TOTAL_LESSONS}
                        aria-valuenow={completedTotal}
                    >
                        <div className="h-full bg-brand-700 rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(completedTotal / TOTAL_LESSONS) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {ACADEMY_LEVELS.map((level, li) => {
                    const cls = WORLD_CLASSES[level.world];
                    const levelCompleted = level.lessons.filter(l => completedSet.has(l.id)).length;
                    const expanded = activeLevel === li || activeLevel === null;

                    return (
                        <section key={level.id} className={`rounded-card border ${cls.line} overflow-hidden`}>
                            <button
                                type="button"
                                className={`w-full min-h-14 flex items-center justify-between gap-3 px-4 py-3 ${cls.soft}`}
                                onClick={() => setActiveLevel(activeLevel === li ? null : li)}
                                aria-expanded={expanded}
                                aria-controls={`academy-level-${level.id}`}
                            >
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <span className={`text-lg font-extrabold ${cls.text}`}>{level.name}</span>
                                    <span className="text-sm font-semibold text-neutral-600">{level.tag}</span>
                                    {level.locked && (
                                        <span className="inline-flex items-center gap-1 text-sm text-neutral-600 self-center">
                                            <Lock size={14} aria-hidden /> Bloqueado
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm text-neutral-600 font-medium">
                                        {levelCompleted}/{level.lessons.length}
                                    </span>
                                    <div className="w-20 h-1.5 bg-white rounded-full overflow-hidden hidden sm:block" aria-hidden>
                                        <div className={`h-full rounded-full ${cls.bg}`}
                                            style={{ width: `${(levelCompleted / level.lessons.length) * 100}%` }} />
                                    </div>
                                    {expanded
                                        ? <ChevronUp size={18} className="text-neutral-500" aria-hidden />
                                        : <ChevronDown size={18} className="text-neutral-500" aria-hidden />}
                                </div>
                            </button>

                            {expanded && (
                                <div id={`academy-level-${level.id}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 bg-neutral-50">
                                    {level.lessons.map(lesson => {
                                        const access = canOpenLesson(lesson, { premium: hasPremium, levelLocked: !!level.locked });
                                        return (
                                            <LessonCard
                                                key={lesson.id}
                                                lesson={lesson}
                                                level={level}
                                                access={access}
                                                isCompleted={completedSet.has(lesson.id)}
                                                onOpen={() => handleOpen(lesson, access)}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
};
