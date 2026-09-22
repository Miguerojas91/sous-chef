/**
 * La Academia: clases teóricas agrupadas en 4 niveles. Cada nivel es un
 * acordeón y cada clase una tarjeta expandible que abre el visor de clase.
 * Las clases premium llevan a /membresia si el usuario no tiene Premium.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPremiumUser } from '../utils/membership';
import { showToast } from '../utils/events';
import { BookOpen, Clock, ChevronDown, ChevronUp, Lock, CheckCircle, PlayCircle, Star } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { LessonViewer } from './LessonViewer';
import { ACADEMY_LEVELS } from '../data/lessons';
import type { AcademyLevel, Lesson } from '../data/lessons';
import {
    TOTAL_LESSONS, canOpenLesson, cmsKeyFor, loadCompletedLessons, saveCompletedLessons,
} from '../data/academy';
import type { LessonAccess } from '../data/academy';
import { WORLD_THEME } from '../data/worlds';

const LessonCard = ({ lesson, level, access, isCompleted, onOpen }: {
    lesson: Lesson;
    level: AcademyLevel;
    access: LessonAccess;
    isCompleted: boolean;
    onOpen: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const key = cmsKeyFor(lesson);
    const a = WORLD_THEME[level.world].academy;
    const locked = access === 'locked';
    const panelId = `acad-lesson-${lesson.id}`;

    return (
        <div className={`rounded-xl border ${open ? a.border : 'border-neutral-200'} bg-white overflow-hidden transition-all duration-200 motion-reduce:transition-none shadow-sm hover:shadow-md`}>
            <button
                type="button"
                className="w-full min-h-14 text-left p-4 flex items-start gap-3 group disabled:cursor-not-allowed"
                onClick={() => setOpen(o => !o)}
                disabled={locked}
                aria-expanded={locked ? undefined : open}
                aria-controls={locked ? undefined : panelId}
            >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                    <EditableText elementKey={`acad_lesson_${key}_emoji`} defaultText={lesson.emoji} as="span" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-neutral-800 text-sm leading-snug min-w-0">
                            <EditableText elementKey={`acad_lesson_${key}_title`} defaultText={lesson.title} as="span" />
                        </span>
                        {lesson.isPremium && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                <Star size={9} fill="currentColor" aria-hidden /> PREMIUM
                            </span>
                        )}
                        {isCompleted && (
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" aria-label="Completada" role="img" />
                        )}
                    </div>
                    <p className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-medium">
                        <Clock size={12} aria-hidden /> {lesson.duration}
                        {locked && <Lock size={12} className="text-neutral-300" aria-hidden />}
                    </p>
                </div>
                {locked
                    ? <Lock size={16} className="text-neutral-300 flex-shrink-0 mt-1" aria-hidden />
                    : open
                        ? <ChevronUp size={16} className="text-neutral-400 flex-shrink-0 mt-1" aria-hidden />
                        : <ChevronDown size={16} className="text-neutral-400 flex-shrink-0 mt-1" aria-hidden />}
            </button>

            {open && (
                <div id={panelId} className={`px-4 pb-4 border-t ${a.border} ${a.bg}`}>
                    <div className="text-sm text-neutral-600 mt-3 leading-relaxed">
                        <EditableText elementKey={`acad_lesson_${key}_desc`} defaultText={lesson.description} as="p" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Temas</p>
                        <ul className="space-y-1">
                            {lesson.topics.map((t, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.dot}`} aria-hidden />
                                    <EditableText elementKey={`acad_lesson_${key}_top_${i}`} defaultText={t} as="span" />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button
                        type="button"
                        onClick={onOpen}
                        className={`mt-4 w-full min-h-11 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2 ${
                            lesson.isPremium
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600'
                                : 'bg-orange-500 hover:bg-orange-600'
                        }`}
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
        <div className="p-6 md:p-8 w-full max-w-5xl mx-auto">
            {openLessonId && (
                <LessonViewer
                    lessonId={openLessonId}
                    isCompleted={completedSet.has(openLessonId)}
                    onClose={() => setOpenLessonId(null)}
                    onComplete={markCompleted}
                />
            )}

            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-neutral-200 pb-6">
                <div className="min-w-0">
                    <h2 className="text-3xl font-black text-neutral-800 flex items-center gap-3">
                        <BookOpen className="text-orange-500 flex-shrink-0" size={32} aria-hidden />
                        <EditableText elementKey="academy_title" defaultText="La Academia" as="span" />
                    </h2>
                    <p className="text-neutral-500 mt-2 font-medium max-w-2xl">
                        <EditableText elementKey="academy_subtitle" defaultText="Clases cortas de técnica y teoría de cocina. Cada una termina con un quiz y te prepara para los retos del Modo Aventura." as="span" />
                    </p>
                </div>
                <div className="flex-shrink-0 md:text-right">
                    <p id="academy-progress-label" className="text-sm text-neutral-500 font-medium">
                        {completedTotal}/{TOTAL_LESSONS} clases completadas
                    </p>
                    <div
                        className="w-full md:w-40 h-2 bg-neutral-100 rounded-full overflow-hidden mt-1"
                        role="progressbar"
                        aria-labelledby="academy-progress-label"
                        aria-valuemin={0}
                        aria-valuemax={TOTAL_LESSONS}
                        aria-valuenow={completedTotal}
                    >
                        <div className="h-full bg-orange-500 rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(completedTotal / TOTAL_LESSONS) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {ACADEMY_LEVELS.map((level, li) => {
                    const a = WORLD_THEME[level.world].academy;
                    const levelCompleted = level.lessons.filter(l => completedSet.has(l.id)).length;
                    const expanded = activeLevel === li || activeLevel === null;

                    return (
                        <section key={level.id} className={`rounded-2xl border-2 ${a.border} overflow-hidden`}>
                            <button
                                type="button"
                                className={`w-full min-h-14 flex items-center justify-between gap-3 px-5 py-4 ${a.bg} transition-colors`}
                                onClick={() => setActiveLevel(activeLevel === li ? null : li)}
                                aria-expanded={expanded}
                                aria-controls={`academy-level-${level.id}`}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-wrap">
                                    <span className={`text-sm font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${a.bg} ${a.color} border ${a.border}`}>
                                        {level.tag}
                                    </span>
                                    <span className={`text-xl font-black ${a.color}`}>{level.name}</span>
                                    {level.locked && (
                                        <span className="inline-flex items-center text-neutral-400">
                                            <Lock size={16} aria-hidden /><span className="sr-only">Bloqueado</span>
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm text-neutral-500 font-medium hidden sm:block">
                                        {levelCompleted}/{level.lessons.length}
                                    </span>
                                    <div className="w-20 h-1.5 bg-white rounded-full overflow-hidden hidden sm:block" aria-hidden>
                                        <div className={`h-full rounded-full ${a.dot}`}
                                            style={{ width: `${(levelCompleted / level.lessons.length) * 100}%` }} />
                                    </div>
                                    {expanded
                                        ? <ChevronUp size={18} className="text-neutral-400" aria-hidden />
                                        : <ChevronDown size={18} className="text-neutral-400" aria-hidden />}
                                </div>
                            </button>

                            {expanded && (
                                <div id={`academy-level-${level.id}`} className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-neutral-50 ${level.locked ? 'opacity-60 select-none' : ''}`}>
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
