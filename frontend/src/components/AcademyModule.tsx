/**
 * La Academia: clases teóricas agrupadas en 4 niveles. Cada nivel es un
 * acordeón y cada clase una tarjeta expandible que abre el visor de clase.
 * Las clases premium llevan a /membresia si el usuario no tiene Premium.
 * El progreso (clases completadas) se guarda en localStorage por título.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isPremiumUser } from '../utils/membership';
import { BookOpen, Clock, ChevronDown, ChevronUp, Lock, CheckCircle, PlayCircle, Crown } from 'lucide-react';
import { EditableText } from './cms/EditableText';

const COMPLETED_KEY = 'sous_academy_completed';

/** Abre el visor de clase en el nivel Layout (mismo patrón que el toast). */
export function openLesson(detail: {
    title: string; emoji: string; duration: string;
    levelName: string; levelColor: string; levelBg: string; levelBorder: string;
    isCompleted: boolean;
}) {
    window.dispatchEvent(new CustomEvent('sous:openLesson', { detail }));
}

interface Lesson {
    title: string;
    /**
     * Clave fija para el CMS cuando el título cambió. Las claves de
     * EditableText se guardaron con el título viejo sin espacios.
     */
    cmsKey?: string;
    duration: string;
    isPremium?: boolean;
    description: string;
    topics: string[];
    emoji: string;
}

interface Level {
    name: string;
    tag: string;
    /** Clases completas: Tailwind no genera clases armadas en tiempo de ejecución. */
    color: string;
    bg: string;
    border: string;
    dot: string;
    locked?: boolean;
    lessons: Lesson[];
}

/** Títulos renombrados: migra el progreso guardado con el título anterior. */
const LEGACY_TITLES: Record<string, string> = {
    'Mise en Place: El Arte de la Preparación': 'Mise en Place: Organiza tu Estación',
    'Fondos Básicos: El Alma de la Cocina': 'Fondos Básicos de Cocina',
    'Reacción de Maillard: El Secreto del Sabor': 'Reacción de Maillard y el Dorado',
};

const lessonKey = (lesson: Lesson) => lesson.cmsKey ?? lesson.title.replace(/\s+/g, '');

const LEVELS: Level[] = [
    {
        name: 'Cimientos',
        tag: 'Básico',
        color: 'text-world-1',
        bg: 'bg-world-1-soft',
        border: 'border-world-1-line',
        dot: 'bg-world-1',
        lessons: [
            {
                emoji: '🧼',
                title: 'Higiene y Seguridad en la Cocina',
                duration: '15:00',
                description: 'Los principios para trabajar en una cocina segura: zona de peligro de temperatura, contaminación cruzada y protocolos HACCP básicos.',
                topics: ['Zona de peligro de temperatura', 'Contaminación cruzada', 'Lavado de manos correcto', 'Almacenamiento seguro de alimentos'],
            },
            {
                emoji: '🔪',
                title: 'Anatomía del Cuchillo de Chef',
                duration: '08:45',
                description: 'Las partes del cuchillo de chef, los tipos de acero y cómo mantener el filo con piedra y chaira.',
                topics: ['Partes del cuchillo', 'Acero inoxidable vs. carbono', 'Afilado con piedra', 'Técnica de la chaira'],
            },
            {
                emoji: '🥕',
                title: 'Corte Juliana: Técnica y Práctica',
                duration: '14:30',
                description: 'La juliana es un corte en bastones de 3 mm × 3 mm × 6 cm, muy usado en cocina profesional. Aprende a laminar, apilar y cortar bastones parejos. Es la base del Nivel 1 del Modo Aventura.',
                topics: [
                    'Medidas: 3mm × 3mm × 6cm',
                    'Técnica del corte base para estabilizar',
                    'Laminado y apilado de 3 a 4 láminas',
                    'Garra de gato y posición de los nudillos',
                    'Aplicaciones: salteados, sopas, guarniciones',
                ],
            },
            {
                emoji: '🌡️',
                title: 'Temperaturas Seguras de Cocción',
                duration: '12:20',
                description: 'Las temperaturas internas seguras para aves, cerdo, carne de res y mariscos, y cómo verificarlas con termómetro.',
                topics: ['Carnes rojas: 63°C mínimo', 'Aves: 74°C mínimo', 'Mariscos: 63°C mínimo', 'Uso correcto del termómetro'],
            },
            {
                emoji: '🥩',
                title: 'Mise en Place: Organiza tu Estación',
                cmsKey: 'MiseenPlace:ElArtedelaPreparación',
                duration: '10:00',
                description: 'El principio de "cada cosa en su lugar" que ordena el trabajo en una cocina profesional. Aprende a organizar tu estación para cocinar sin carreras.',
                topics: ['Concepto francés de mise en place', 'Organización de la estación', 'Orden de preparación', 'Gestión del tiempo en cocina'],
            },
            {
                emoji: '🐟',
                title: 'Manejo y Conservación de Proteínas',
                duration: '18:10',
                description: 'Cómo comprar, almacenar y preparar carnes, pescados y mariscos para que lleguen frescos y seguros al plato.',
                topics: ['Temperatura de refrigeración', 'FIFO: primero en entrar, primero en salir', 'Descongelación segura', 'Signos de frescura y putrefacción'],
            },
            {
                emoji: '🥣',
                title: 'Fondos Básicos de Cocina',
                cmsKey: 'FondosBásicos:ElAlmadelaCocina',
                duration: '22:00',
                description: 'Los 4 fondos clásicos y cómo prepararlos. De ellos salen las salsas madre de la cocina francesa.',
                topics: ['Fondo blanco de ternera', 'Fondo oscuro', 'Fumet de pescado', 'Fondo de verduras vegetariano'],
            },
        ],
    },
    {
        name: 'Técnica',
        tag: 'Intermedio',
        color: 'text-world-3',
        bg: 'bg-world-3-soft',
        border: 'border-world-3-line',
        dot: 'bg-world-3',
        lessons: [
            {
                emoji: '🥚',
                title: 'Ciencia de las Emulsiones',
                duration: '22:15',
                description: 'La física y la química detrás de mayonesas, vinagretas y salsa holandesa. Por qué se cortan y cómo rescatarlas.',
                topics: ['Emulsiones permanentes vs temporales', 'El papel de la lecitina del huevo', 'Salsa holandesa y béarnaise', 'Técnica de vinagreta estable'],
            },
            {
                emoji: '🥩',
                title: 'Reacción de Maillard y el Dorado',
                cmsKey: 'ReaccióndeMaillard:ElSecretodelSabor',
                duration: '19:30',
                description: 'La reacción entre azúcares y aminoácidos que dora la comida y le da sabor tostado. Cómo lograr una costra dorada y pareja en carnes, pan y vegetales.',
                topics: ['Química: azúcares + aminoácidos', 'Temperatura óptima (>140°C)', 'Por qué sellar no "retiene los jugos"', 'Técnicas de sellado en sartén y horno'],
            },
            {
                emoji: '🥫',
                title: 'Las 5 Salsas Madre Francesas',
                duration: '35:00',
                description: 'Bechamel, velouté, española, tomate y holandesa. Con estas 5 puedes preparar cientos de salsas derivadas.',
                topics: ['Bechamel y roux blanco', 'Velouté con fondo claro', 'Española con fondo oscuro', 'Salsa de tomate francesa vs italiana'],
            },
            {
                emoji: '🌿',
                title: 'Cortes Avanzados de Verduras',
                duration: '20:00',
                description: 'Juliana, brunoise, paisana, chiffonade, tournée y barrel. Los cortes clásicos de la cocina profesional, con sus tamaños y usos.',
                topics: ['Brunoise fino (3mm) y grueso', 'Juliana clásica y chiffonade de hierbas', 'Tornear vegetales (tournée)', 'Macedonia y jardinera'],
            },
            {
                emoji: '💧',
                title: 'Cocción Húmeda vs. Cocción Seca',
                duration: '28:00',
                description: 'Cuándo brasear, cuándo hornear, cuándo saltear y cuándo hervir. El método que eliges cambia la textura y el sabor del resultado.',
                topics: ['Métodos secos: grilla, horno, saltear', 'Métodos húmedos: pochar, hervir, vapor, brasear', 'Temperatura baja y lenta vs alta y rápida', 'Cuándo usar cada método según el corte'],
            },
            {
                emoji: '🍞',
                title: 'Fermentación Básica: Masa Madre',
                duration: '30:00',
                isPremium: true,
                description: 'Inicia tu primer cultivo de masa madre y entiende la fermentación láctica que convierte harina y agua en pan.',
                topics: ['Levaduras silvestres y bacterias lácticas', 'Refrescar un starter', 'Hidratación de la masa (60-80%)', 'Primera y segunda fermentación'],
            },
        ],
    },
    {
        name: 'Maestría',
        tag: 'Avanzado',
        color: 'text-world-4',
        bg: 'bg-world-4-soft',
        border: 'border-world-4-line',
        dot: 'bg-world-4',
        lessons: [
            {
                emoji: '🌡️',
                title: 'Cocina Sous-Vide y Pasteurización',
                duration: '42:15',
                isPremium: true,
                description: 'Cocción al vacío en agua a temperatura controlada, para lograr el mismo punto de cocción de borde a borde.',
                topics: ['Principio de pasteurización por tiempo/temperatura', 'Tablas de tiempo para carnes, aves y pescados', 'Sellado post-cocción para costra', 'Seguridad alimentaria en temperaturas bajas'],
            },
            {
                emoji: '⚗️',
                title: 'Esferificación Básica e Inversa',
                duration: '35:00',
                isPremium: true,
                description: 'La técnica que popularizó Ferran Adrià. Crea esferas de jugo que estallan en la boca usando alginato de sodio y cloruro de calcio.',
                topics: ['Alginato de sodio y cloruro de calcio', 'Esferificación directa: para líquidos sin calcio', 'Esferificación inversa: para lácteos', 'Proporciones y tiempos exactos'],
            },
            {
                emoji: '🥩',
                title: 'Despiece Completo de Res y Cerdo',
                duration: '55:00',
                isPremium: true,
                description: 'Aprende a deshuesar y despiezar una pieza entera de res y cerdo. Identifica los cortes, sus usos culinarios y su valor comercial.',
                topics: ['Costilla de res: punto de incisión', 'Lomo, solomillo y entrecot diferencias', 'Despiece de cerdo ibérico', 'Aprovechamiento de huesos para fondo'],
            },
            {
                emoji: '🎂',
                title: 'Pastelería Avanzada: Cremas y Rellenos',
                duration: '48:00',
                isPremium: true,
                description: 'Crème brûlée, crème pâtissière, ganache de chocolate y mousse. Las bases de la pastelería clásica francesa.',
                topics: ['Crema pastelera y sus variantes', 'Temperado de chocolate', 'Ganache: proporciones y texturas', 'Montaje de mousse de chocolate'],
            },
            {
                emoji: '💨',
                title: 'Geles, Espumas y Cocina Molecular',
                duration: '40:00',
                isPremium: true,
                description: 'Agar-agar, metilcelulosa y lecitina de soja para espumas. Cómo usar la cocina molecular en platos reales.',
                topics: ['Agar-agar vs gelatina: diferencias clave', 'Gel caliente con agar', 'Espumas con lecitina de soja', 'Aceite de oliva en polvo con maltodextrina'],
            },
            {
                emoji: '🎨',
                title: 'Paletas de Sabor y Creatividad Culinaria',
                duration: '32:00',
                description: 'Cómo combinar sabores para crear tus propios platos. La rueda de sabores, el equilibrio entre dulce, salado, ácido, amargo y umami, y el maridaje de ingredientes.',
                topics: ['Rueda de sabores de Flavorpairing.com', 'Umami: el quinto sabor', 'Contraste vs armonía en el plato', 'Cómo crear un plato desde cero'],
            },
        ],
    },
    {
        name: 'Élite',
        tag: 'Experto',
        color: 'text-world-5',
        bg: 'bg-world-5-soft',
        border: 'border-world-5-line',
        dot: 'bg-world-5',
        locked: true,
        lessons: [
            {
                emoji: '🍽️',
                title: 'Diseño de Menú Degustación',
                duration: '60:00',
                isPremium: true,
                description: 'Cómo construir un menú de 8 tiempos coherente, con equilibrio entre sabores y progresión de pesos.',
                topics: ['Metodología de diseño de menú', 'Progresión de sabores e intensidades', 'Amuse-bouche hasta mignardises', 'Maridaje vino por tiempo'],
            },
            {
                emoji: '🍷',
                title: 'Maridaje Avanzado: Vino y Gastronomía',
                duration: '45:00',
                isPremium: true,
                description: 'Las reglas del maridaje clásico y cuándo romperlas. Vinos por región, uva y estructura para cada tipo de plato.',
                topics: ['Taninos vs acidez en carnes rojas', 'Blancos con pescado: por qué y cuándo no', 'Champagne con fritos', 'Maridaje con vinos de postre y quesos'],
            },
            {
                emoji: '🇫🇷',
                title: 'Alta Cocina Francesa Clásica',
                duration: '70:00',
                isPremium: true,
                description: 'Escoffier, Bocuse y la brigada clásica. Técnicas de haute cuisine que siguen presentes en la cocina occidental.',
                topics: ['Sistema de brigada de Escoffier', 'Tournedos Rossini y técnica de foie', 'Blanquette de veau clásica', 'Tarta tatin y crepes suzette'],
            },
            {
                emoji: '🔬',
                title: 'Gastronomía Molecular Avanzada',
                duration: '65:00',
                isPremium: true,
                description: 'De Heston Blumenthal a Grant Achatz. Técnicas de vanguardia explicadas desde la ciencia de los alimentos.',
                topics: ['Nitrógeno líquido: seguridad y aplicaciones', 'Transglutaminasa: pegamento de carne', 'Sous-vide a temperaturas extremas', 'Deconstrucción de platos clásicos'],
            },
            {
                emoji: '🥩',
                title: 'Carnicería Artesanal Completa',
                duration: '80:00',
                isPremium: true,
                description: 'Despiece completo de cordero, ternera y cerdo. Charcutería artesanal: panceta curada, jamón y embutidos.',
                topics: ['Costeleta frenched de cordero', 'Curado: sal, azúcar y nitritos', 'Maduración en seco (dry aging)', 'Elaboración de chorizo y longaniza'],
            },
            {
                emoji: '👨‍🍳',
                title: 'Liderazgo y Gestión de Brigada',
                duration: '50:00',
                isPremium: true,
                description: 'Cómo liderar una cocina: manejo del estrés, comunicación en el pase, control de costos y formación del equipo.',
                topics: ['Comunicación en el pase (oui chef)', 'Control de food cost y mermas', 'Gestión de inventario FIFO', 'Cómo manejar el servicio en rush'],
            },
        ],
    },
];

const TOTAL_LESSONS = LEVELS.reduce((n, l) => n + l.lessons.length, 0);

const LessonCard = ({ lesson, level, premiumLocked, isCompleted, onOpen }: {
    lesson: Lesson;
    level: Level;
    premiumLocked?: boolean;
    isCompleted: boolean;
    onOpen: () => void;
}) => {
    const [open, setOpen] = useState(false);
    const key = lessonKey(lesson);
    const panelId = `acad-lesson-${key.replace(/[^\w-]/g, '')}`;

    return (
        <div className={`rounded-card border ${open ? level.border : 'border-neutral-200'} bg-white overflow-hidden`}>
            <button
                type="button"
                className="w-full min-h-14 text-left p-4 flex items-start gap-3 disabled:cursor-not-allowed"
                onClick={() => setOpen(o => !o)}
                disabled={level.locked}
                aria-expanded={level.locked ? undefined : open}
                aria-controls={level.locked ? undefined : panelId}
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
                {level.locked
                    ? <Lock size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />
                    : open
                        ? <ChevronUp size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />
                        : <ChevronDown size={16} className="text-neutral-500 flex-shrink-0 mt-1" aria-hidden />}
            </button>

            {open && (
                <div id={panelId} className={`px-4 pb-4 border-t ${level.border} ${level.bg}`}>
                    <div className="text-sm text-neutral-700 mt-3 leading-relaxed">
                        <EditableText elementKey={`acad_lesson_${key}_desc`} defaultText={lesson.description} as="p" />
                    </div>
                    <div className="mt-3">
                        <p className="text-sm font-semibold text-neutral-600 mb-2">Temas</p>
                        <ul className="space-y-1">
                            {lesson.topics.map((t, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-800">
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${level.dot}`} aria-hidden />
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
                        {premiumLocked ? <Lock size={16} aria-hidden /> : <PlayCircle size={16} aria-hidden />}
                        {premiumLocked ? 'Ver Premium' : isCompleted ? 'Repasar clase' : 'Comenzar clase'}
                    </button>
                </div>
            )}
        </div>
    );
};

function loadCompleted(): Set<string> {
    try {
        const raw = localStorage.getItem(COMPLETED_KEY);
        const titles: string[] = raw ? JSON.parse(raw) : [];
        return new Set(titles.map(t => LEGACY_TITLES[t] ?? t));
    } catch { return new Set(); }
}

function saveCompleted(set: Set<string>) {
    try {
        localStorage.setItem(COMPLETED_KEY, JSON.stringify([...set]));
    } catch { /* sin almacenamiento (modo privado): el progreso vive solo en memoria */ }
}

export const AcademyModule = () => {
    const navigate = useNavigate();
    const hasPremium = isPremiumUser();
    const [activeLevel, setActiveLevel] = useState<number | null>(null);
    const [completedSet, setCompletedSet] = useState<Set<string>>(loadCompleted);

    // El visor vive en App.tsx y avisa por evento cuando se completa una clase.
    useEffect(() => {
        const handler = (e: Event) => {
            const { title } = (e as CustomEvent<{ title: string }>).detail;
            setCompletedSet(prev => {
                const next = new Set(prev);
                next.add(title);
                saveCompleted(next);
                return next;
            });
        };
        window.addEventListener('sous:lessonComplete', handler);
        return () => window.removeEventListener('sous:lessonComplete', handler);
    }, []);

    const completedTotal = LEVELS.reduce(
        (n, l) => n + l.lessons.filter(lesson => completedSet.has(lesson.title)).length, 0,
    );

    return (
        <div className="p-4 md:p-6 w-full max-w-5xl mx-auto">
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
                {LEVELS.map((level, li) => {
                    const levelCompleted = level.lessons.filter(l => completedSet.has(l.title)).length;
                    const expanded = activeLevel === li || activeLevel === null;

                    return (
                        <section key={li} className={`rounded-card border ${level.border} overflow-hidden`}>
                            <button
                                type="button"
                                className={`w-full min-h-14 flex items-center justify-between gap-3 px-4 py-3 ${level.bg}`}
                                onClick={() => setActiveLevel(activeLevel === li ? null : li)}
                                aria-expanded={expanded}
                                aria-controls={`academy-level-${li}`}
                            >
                                <div className="flex items-baseline gap-2 min-w-0">
                                    <span className={`text-lg font-extrabold ${level.color}`}>{level.name}</span>
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
                                        <div className={`h-full rounded-full ${level.dot}`}
                                            style={{ width: `${(levelCompleted / level.lessons.length) * 100}%` }} />
                                    </div>
                                    {expanded
                                        ? <ChevronUp size={18} className="text-neutral-500" aria-hidden />
                                        : <ChevronDown size={18} className="text-neutral-500" aria-hidden />}
                                </div>
                            </button>

                            {expanded && (
                                <div id={`academy-level-${li}`} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 sm:p-4 bg-neutral-50">
                                    {level.lessons.map((lesson, lsi) => (
                                        <LessonCard
                                            key={lsi}
                                            lesson={lesson}
                                            level={level}
                                            isCompleted={completedSet.has(lesson.title)}
                                            premiumLocked={!!lesson.isPremium && !hasPremium}
                                            onOpen={() => {
                                                if (lesson.isPremium && !hasPremium) {
                                                    window.dispatchEvent(new CustomEvent('sous:toast', {
                                                        detail: { msg: 'Esta clase es de Premium.', type: 'info' },
                                                    }));
                                                    navigate('/membresia');
                                                    return;
                                                }
                                                openLesson({
                                                    title: lesson.title,
                                                    emoji: lesson.emoji,
                                                    duration: lesson.duration,
                                                    levelName: level.name,
                                                    levelColor: level.color,
                                                    levelBg: level.bg,
                                                    levelBorder: level.border,
                                                    isCompleted: completedSet.has(lesson.title),
                                                });
                                            }}
                                        />
                                    ))}
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
        </div>
    );
};
