import { useState } from 'react';
import { BookOpen, Star, Clock, ChevronDown, ChevronUp, Lock, CheckCircle, PlayCircle } from 'lucide-react';
import { EditableText } from './cms/EditableText';

interface Lesson {
    title: string;
    duration: string;
    isPremium?: boolean;
    completed?: boolean;
    description: string;
    topics: string[];
    emoji: string;
}

interface Level {
    name: string;
    tag: string;
    color: string;
    bg: string;
    border: string;
    locked?: boolean;
    lessons: Lesson[];
}

const LEVELS: Level[] = [
    {
        name: 'Cimientos',
        tag: 'Básico',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        lessons: [
            {
                emoji: '🧼',
                title: 'Higiene y Seguridad en la Cocina',
                duration: '15:00',
                completed: true,
                description: 'Los principios fundamentales para trabajar en una cocina segura. Aprende sobre temperatura de peligro, contaminación cruzada y protocolos HACCP básicos.',
                topics: ['Zona de peligro de temperatura', 'Contaminación cruzada', 'Lavado de manos correcto', 'Almacenamiento seguro de alimentos'],
            },
            {
                emoji: '🔪',
                title: 'Anatomía del Cuchillo de Chef',
                duration: '08:45',
                completed: true,
                description: 'Conoce todas las partes del cuchillo de chef, los tipos de acero y cómo mantener el filo con piedra y chaira.',
                topics: ['Partes del cuchillo', 'Acero inoxidable vs. carbono', 'Afilado con piedra', 'Técnica de la chaira'],
            },
            {
                emoji: '🥕',
                title: 'Corte Juliana: Técnica y Práctica',
                duration: '14:30',
                completed: true,
                description: 'La Juliana es el corte de bastones más importante en cocina profesional — 3 mm × 3 mm × 6 cm. Aprende la técnica de laminado, apilado y corte en bastones con precisión. Este conocimiento es la base del Nivel 1 del Modo Aventura.',
                topics: [
                    'Medidas exactas: 3mm × 3mm × 6cm',
                    'Técnica del corte base para estabilizar',
                    'Laminado y apilado de 3–4 láminas',
                    'Garra de gato y posición de los nudillos',
                    'Aplicaciones: salteados, sopas, guarniciones',
                ],
            },
            {
                emoji: '🌡️',
                title: 'Temperaturas Seguras de Cocción',
                duration: '12:20',
                completed: true,
                description: 'Las temperaturas internas exactas para aves, cerdo, carne de res, mariscos y cómo verificarlas correctamente.',
                topics: ['Carnes rojas: 63°C mínimo', 'Aves: 74°C mínimo', 'Mariscos: 63°C mínimo', 'Uso correcto del termómetro'],
            },
            {
                emoji: '🥩',
                title: 'Mise en Place: El Arte de la Preparación',
                duration: '10:00',
                description: 'El principio de "cada cosa en su lugar" que estructura el trabajo profesional. Aprende a organizar tu estación de trabajo para cocinar con eficiencia.',
                topics: ['Concepto francés de mise en place', 'Organización de la estación', 'Orden de preparación', 'Gestión del tiempo en cocina'],
            },
            {
                emoji: '🐟',
                title: 'Manejo y Conservación de Proteínas',
                duration: '18:10',
                description: 'Cómo comprar, almacenar y preparar carnes, pescados y mariscos correctamente para maximizar frescura y seguridad.',
                topics: ['Temperatura de refrigeración', 'FIFO: primero en entrar, primero en salir', 'Descongelación segura', 'Signos de frescura y putrefacción'],
            },
            {
                emoji: '🥣',
                title: 'Fondos Básicos: El Alma de la Cocina',
                duration: '22:00',
                description: 'Los 4 fondos clásicos que son la base de toda cocina profesional. Sin fondos no hay salsas, y sin salsas no hay cocina francesa.',
                topics: ['Fondo blanco de ternera', 'Fondo oscuro', 'Fumet de pescado', 'Fondo de verduras vegetariano'],
            },
        ],
    },
    {
        name: 'Técnica',
        tag: 'Intermedio',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        lessons: [
            {
                emoji: '🥚',
                title: 'Ciencia de las Emulsiones',
                duration: '22:15',
                isPremium: true,
                completed: true,
                description: 'Aprende la física y química detrás de mayonesas, vinagretas y salsas holandesa. Por qué se cortan y cómo rescatarlas.',
                topics: ['Emulsiones permanentes vs temporales', 'El papel de la lecitina del huevo', 'Salsa holandesa y béarnaise', 'Técnica de vinagreta estable'],
            },
            {
                emoji: '🥩',
                title: 'Reacción de Maillard: El Secreto del Sabor',
                duration: '19:30',
                description: 'La reacción química más importante en cocina. Cómo crear esa costra dorada perfecta en carnes, pan y vegetales.',
                topics: ['Química: azúcares + aminoácidos', 'Temperatura óptima (>140°C)', 'Por qué NO se debe sellar para "retener jugos"', 'Técnicas de sellado en sartén y horno'],
            },
            {
                emoji: '🥫',
                title: 'Las 5 Salsas Madre Francesas',
                duration: '35:00',
                isPremium: true,
                description: 'Bechamel, velouté, española, tomate y holandesa. Domina estas 5 y puedes preparar cientos de salsas derivadas.',
                topics: ['Bechamel y roux blanco', 'Velouté con fondo claro', 'Española con fondo oscuro', 'Salsa de tomate francesa vs italiana'],
            },
            {
                emoji: '🌿',
                title: 'Cortes Avanzados de Verduras',
                duration: '20:00',
                description: 'Juliana, brunoise, paisana, chiffonade, tournée y barrel. Los cortes clásicos de la cocina profesional con diferentes tamaños y aplicaciones.',
                topics: ['Brunoise fino (3mm) y grueso', 'Juliana clásica y chiffonade de hierbas', 'Tornear vegetales (tournée)', 'Macedonia y jardinera'],
            },
            {
                emoji: '💧',
                title: 'Cocción Húmeda vs. Cocción Seca',
                duration: '28:00',
                description: 'Entiende cuándo brasear, cuando hornear, cuándo saltear y cuándo hervir. La elección correcta transforma un ingredient ordinario en extraordinario.',
                topics: ['Métodos secos: grilla, horno, saltear', 'Métodos húmedos: pochar, hervir, vapore brasear', 'Temperatura baja y lenta vs alta y rápida', 'Cuándo usar cada método según el corte'],
            },
            {
                emoji: '🍞',
                title: 'Fermentación Básica: Masa Madre',
                duration: '30:00',
                isPremium: true,
                description: 'Inicia tu primer cultivo de masa madre y entiende la fermentación láctica que transforma harina y agua en pan con carácter.',
                topics: ['Levaduras silvestres y bacterias lácticas', 'Refrescar un starter', 'Hidratación de la masa (60-80%)', 'Primera y segunda fermentación'],
            },
        ],
    },
    {
        name: 'Maestría',
        tag: 'Avanzado',
        color: 'text-violet-700',
        bg: 'bg-violet-50',
        border: 'border-violet-200',
        lessons: [
            {
                emoji: '🌡️',
                title: 'Cocina Sous-Vide y Pasteurización',
                duration: '42:15',
                isPremium: true,
                description: 'Cocción al vacío a temperatura controlada. La técnica usada en los mejores restaurantes del mundo para lograr exactitud absoluta.',
                topics: ['Principio de pasteurización por tiempo/temperatura', 'Tablas de tiempo para carnes, aves y pescados', 'Sellado post-cocción para costra', 'Seguridad alimentaria en temperaturas bajas'],
            },
            {
                emoji: '⚗️',
                title: 'Esferificación Básica e Inversa',
                duration: '35:00',
                isPremium: true,
                description: 'La técnica estrella de Ferran Adrià. Crea esferas de jugo que estallan en la boca usando alginato de sodio y cloruro de calcio.',
                topics: ['Alginato de sodio y cloruro de calcio', 'Esferificación directa: para líquidos sin calcio', 'Esferificación inversa: para lácteos', 'Proporciones y tiempos exactos'],
            },
            {
                emoji: '🥩',
                title: 'Despiece Completo de Res y Cerdo',
                duration: '55:00',
                isPremium: true,
                description: 'Aprende a deshuesar y despiece una pieza entera de res y cerdo. Identifica todos los cortes, usos culinarios y valores comerciales.',
                topics: ['Costilla de res: punto de incisión', 'Lomo, solomillo y entrecot diferencias', 'Despiece de cerdo ibérico', 'Aprovechamiento de huesos para fondo'],
            },
            {
                emoji: '🎂',
                title: 'Pastelería Avanzada: Cremas y Rellenos',
                duration: '48:00',
                isPremium: true,
                description: 'Crème brûlée, crème pâtissière, ganache de chocolate y mousse. Los pilares de la pastelería clásica francesa.',
                topics: ['Crema pastelera y sus variantes', 'Temperado de chocolate', 'Ganache: proporciones y texturas', 'Montaje de mousse de chocolate'],
            },
            {
                emoji: '💨',
                title: 'Geles, Espumas y Cocina Molecular',
                duration: '40:00',
                isPremium: true,
                description: 'Agar-agar, metilcelulosa, lecitina de soja para espumas. La gastronomía molecular desmitificada para aplicaciones reales.',
                topics: ['Agar-agar vs gelatina: diferencias clave', 'Gel caliente con agar', 'Espumas con lecitina de soja', 'Aceite de oliva en polvo con maltodextrina'],
            },
            {
                emoji: '🎨',
                title: 'Paletas de Sabor y Creatividad Culinaria',
                duration: '32:00',
                description: 'Cómo pensar como chef creativo. La rueda de sabores, el equilibrio de dulce-salado-ácido-amargo-umami y el maridaje de ingredientes.',
                topics: ['Rueda de sabores de Flavorpairing.com', 'Umami: el quinto sabor', 'Contraste vs armonía en el plato', 'Cómo crear un plato desde cero'],
            },
        ],
    },
    {
        name: 'Élite',
        tag: 'Experto',
        color: 'text-yellow-700',
        bg: 'bg-yellow-50',
        border: 'border-amber-200',
        locked: true,
        lessons: [
            {
                emoji: '🍽️',
                title: 'Diseño de Menú Degustación',
                duration: '60:00',
                isPremium: true,
                description: 'Cómo construir un menú de 8 tiempos cohesionado, con narrativa, equilibrio entre sabores y progresión de pesos.',
                topics: ['Metodología de diseño de menú', 'Progresión de sabores e intensidades', 'Amuse-bouche hasta mignardises', 'Maridaje vino por tiempo'],
            },
            {
                emoji: '🍷',
                title: 'Maridaje Avanzado: Vino y Gastronomía',
                duration: '45:00',
                isPremium: true,
                description: 'Las reglas del maridaje clásico y cómo romperlas. Vinos por región, uva y estructura para cada tipo de plato.',
                topics: ['Taninos vs acidez en carnes rojas', 'Blancos con pescado: por qué y cuándo no', 'Champagne con fritos: el maridaje más subestimado', 'Maridaje con vinos de postre y quesos'],
            },
            {
                emoji: '🇫🇷',
                title: 'Alta Cocina Francesa Clásica',
                duration: '70:00',
                isPremium: true,
                description: 'El canon: Escoffier, Bocuse y la brigada clásica. Técnicas de haute cuisine que son la columna vertebral de toda la cocina occidental.',
                topics: ['Sistema de brigada de Escoffier', 'Tournedos Rossini y técnica de foie', 'Blanquette de veau clásica', 'Tarta tatin y crepes suzette'],
            },
            {
                emoji: '🔬',
                title: 'Gastronomía Molecular Avanzada',
                duration: '65:00',
                isPremium: true,
                description: 'De Heston Blumenthal a Grant Achatz. Las técnicas más vanguardistas de la cocina moderna con fundamentos científicos sólidos.',
                topics: ['Nitrógeno líquido: seguridad y aplicaciones', 'Transglutaminasa: pegamento de carne', 'Sous-vide a temperaturas extremas', 'Deconstrucción de platos clásicos'],
            },
            {
                emoji: '🥩',
                title: 'Carnicería Artesanal Completa',
                duration: '80:00',
                isPremium: true,
                description: 'Despiece completo de cordero, ternera y cerdo. Corte de charcutería artesanal: panceta curada, jamón y embutidos.',
                topics: ['Costeleta frenched de cordero', 'Curing: sal, azúcar y nitritos', 'Maduración en seco (dry aging)', 'Elaboración de chorizo y longaniza'],
            },
            {
                emoji: '👨‍🍳',
                title: 'Liderazgo y Gestión de Brigada',
                duration: '50:00',
                isPremium: true,
                description: 'Cómo liderar una cocina: gestión de estrés, comunicación en el pase, control de costos y mentoría del equipo.',
                topics: ['Comunicación en el pase (oui chef)', 'Control de food cost y mermas', 'Gestión de inventario FIFO', 'Cómo manejar el servicio en rush'],
            },
        ],
    },
];

const LessonCard = ({ lesson, levelBg, levelBorder, levelColor, levelLocked }: {
    lesson: Lesson;
    levelBg: string;
    levelBorder: string;
    levelColor: string;
    levelLocked?: boolean;
}) => {
    const [open, setOpen] = useState(false);

    return (
        <div className={`rounded-xl border ${open ? levelBorder : 'border-neutral-200'} bg-white overflow-hidden transition-all duration-200 shadow-sm hover:shadow-md`}>
            <button
                className="w-full text-left p-4 flex items-start gap-3 group"
                onClick={() => !levelLocked && setOpen(o => !o)}
                disabled={levelLocked}
            >
                <span className="text-2xl flex-shrink-0 mt-0.5">
                    <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_emoji`} defaultText={lesson.emoji} as="span" />
                </span>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className={`font-bold text-neutral-800 group-hover:${levelColor} transition-colors text-sm leading-snug`}>
                            <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_title`} defaultText={lesson.title} as="span" />
                        </h4>
                        {lesson.isPremium && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                                <Star size={9} fill="currentColor" /> PREMIUM
                            </span>
                        )}
                        {lesson.completed && (
                            <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-neutral-400 font-medium">
                        <Clock size={12} /> {lesson.duration}
                        {levelLocked && <Lock size={12} className="text-neutral-300" />}
                    </div>
                </div>
                {!levelLocked && (
                    open ? <ChevronUp size={16} className="text-neutral-400 flex-shrink-0 mt-1" /> : <ChevronDown size={16} className="text-neutral-400 flex-shrink-0 mt-1" />
                )}
                {levelLocked && <Lock size={16} className="text-neutral-300 flex-shrink-0 mt-1" />}
            </button>

            {open && (
                <div className={`px-4 pb-4 border-t ${levelBorder} ${levelBg} animate-in slide-in-from-top-1 duration-200`}>
                    <div className="text-sm text-neutral-600 mt-3 leading-relaxed">
                        <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_desc`} defaultText={lesson.description} as="p" />
                    </div>
                    <div className="mt-3">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Temas cubiertos</p>
                        <ul className="space-y-1">
                            {lesson.topics.map((t, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-neutral-700">
                                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${levelBg.replace('bg-', 'bg-').replace('-50', '-400')}`} style={{ background: '' }} />
                                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${levelColor.replace('text-', 'bg-').replace('-700', '-400')}`}></span>
                                    <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_top_${i}`} defaultText={t} as="span" />
                                </li>
                            ))}
                        </ul>
                    </div>
                    <button className={`mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-bold text-sm text-white transition-colors ${lesson.isPremium ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600' : 'bg-orange-500 hover:bg-orange-600'}`}>
                        <PlayCircle size={16} />
                        {lesson.completed ? 
                            <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_btn_r`} defaultText="Repasar clase" as="span" /> : 
                            <EditableText elementKey={`acad_lesson_${lesson.title.replace(/\s+/g, '')}_btn_s`} defaultText="Comenzar clase" as="span" />
                        }
                    </button>
                </div>
            )}
        </div>
    );
};

export const AcademyModule = () => {
    const [activeLevel, setActiveLevel] = useState<number | null>(null);

    const completedTotal = LEVELS.flatMap(l => l.lessons).filter(l => l.completed).length;
    const total = LEVELS.flatMap(l => l.lessons).length;

    return (
        <div className="p-6 md:p-8 w-full max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-end gap-4 border-b border-neutral-200 pb-6">
                <div>
                    <h2 className="text-3xl font-black text-neutral-800 flex items-center gap-3">
                        <BookOpen className="text-orange-500" size={32} />
                        <EditableText elementKey="academy_title" defaultText="La Academia" as="span" />
                    </h2>
                    <p className="text-neutral-500 mt-2 font-medium max-w-2xl">
                        <EditableText elementKey="academy_subtitle" defaultText="Tu biblioteca de conocimiento culinario. Domina la teoría antes de enfrentarte a los desafíos del Modo Aventura." as="span" />
                    </p>
                </div>
                <div className="flex-shrink-0 text-right">
                    <p className="text-sm text-neutral-500 font-medium">{completedTotal}/{total} clases completadas</p>
                    <div className="w-40 h-2 bg-neutral-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${(completedTotal / total) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {LEVELS.map((level, li) => {
                    const levelCompleted = level.lessons.filter(l => l.completed).length;

                    return (
                        <section key={li} className={`rounded-2xl border-2 ${level.border} overflow-hidden`}>
                            {/* Level Header */}
                            <button
                                className={`w-full flex items-center justify-between px-5 py-4 ${level.bg} transition-colors`}
                                onClick={() => setActiveLevel(activeLevel === li ? null : li)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-extrabold uppercase tracking-widest px-3 py-1 rounded-full ${level.bg} ${level.color} border ${level.border}`}>
                                        {level.tag}
                                    </span>
                                    <h3 className={`text-xl font-black ${level.color}`}>{level.name}</h3>
                                    {level.locked && <Lock size={16} className="text-neutral-400" />}
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-neutral-500 font-medium hidden sm:block">
                                        {levelCompleted}/{level.lessons.length}
                                    </span>
                                    <div className="w-20 h-1.5 bg-white rounded-full overflow-hidden hidden sm:block">
                                        <div className={`h-full rounded-full ${level.color.replace('text-', 'bg-').replace('-700', '-400')}`}
                                            style={{ width: `${(levelCompleted / level.lessons.length) * 100}%` }} />
                                    </div>
                                    {activeLevel === li ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
                                </div>
                            </button>

                            {/* Lessons */}
                            {(activeLevel === li || activeLevel === null) && (
                                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-neutral-50 ${level.locked ? 'opacity-60 pointer-events-none select-none' : ''}`}>
                                    {level.lessons.map((lesson, lsi) => (
                                        <LessonCard
                                            key={lsi}
                                            lesson={lesson}
                                            levelBg={level.bg}
                                            levelBorder={level.border}
                                            levelColor={level.color}
                                            levelLocked={level.locked}
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
