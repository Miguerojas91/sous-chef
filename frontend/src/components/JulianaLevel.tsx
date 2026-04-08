import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, Upload, CheckCircle, Star,
    Clock, ChevronRight, Lightbulb, AlertTriangle, Camera, Trophy, Play
} from 'lucide-react';

// ─── DATA ─────────────────────────────────────────────────────────────────────

const STEPS = [
    {
        num: 1,
        title: 'Prepara tu mise en place',
        emoji: '🧑‍🍳',
        desc: 'Antes de cortar cualquier cosa, organiza tu estación. Necesitas: tabla de cortar limpia y antideslizante, cuchillo de chef afilado (o un santoku), y tu vegetal elegido. Recomendamos zanahoria o calabacín para empezar.',
        tip: 'Coloca un paño húmedo DEBAJO de la tabla para que no se mueva mientras cortas. Esto es lo que hace cada cocinero profesional.',
    },
    {
        num: 2,
        title: 'Estabiliza el vegetal: el corte base',
        emoji: '🔪',
        desc: 'Corta una rodaja fina del lado más largo del vegetal para crear una superficie plana. Esto es el "corte base" y evita que la zanahoria ruede mientras trabajas. Colócala con el lado plano hacia abajo: ahora es segura.',
        tip: 'Un vegetal que se mueve = un dedo en peligro. El corte base es el primer paso de todo chef profesional antes de cualquier corte.',
    },
    {
        num: 3,
        title: 'Corta láminas (planches)',
        emoji: '📏',
        desc: 'Con el vegetal estabilizado, córtalo en láminas de 3 mm de grosor a lo largo. Usa la técnica de "garra de gato": los nudillos hacia afuera y la yema de los dedos doblada hacia adentro para protegerlos. El cuchillo guía contra los nudillos.',
        tip: 'El grosor estándar de Juliana es 3 mm × 3 mm × 6 cm. En la cocina profesional se mide con calibrador. Entrena el ojo con una regla la primera vez.',
    },
    {
        num: 4,
        title: 'Apila las láminas y corta los bastones',
        emoji: '🥕',
        desc: 'Apila 3–4 láminas una sobre otra (no más, o resbalan). Ahora corta a lo largo del eje del vegetal en bastones de 3 mm de ancho. El resultado: tiras uniformes de 3mm × 3mm × 6cm. ¡Eso es Juliana!',
        tip: 'Mantén una velocidad constante y deja que el peso del cuchillo haga el trabajo. No presiones hacia abajo con fuerza. El filo corta, la fuerza no.',
    },
    {
        num: 5,
        title: 'Consistencia y uniformidad',
        emoji: '✅',
        desc: 'Revisa tus bastones: ¿tienen el mismo grosor? ¿La misma longitud? En un restaurante, si los bastones no son uniformes no salen al plato. La uniformidad no es estética — es funcional: garantiza cocción homogénea.',
        tip: 'El primer juliana nunca es perfecto. El décimo empieza a verse bien. El centésimo es profesional. La velocidad viene sola.',
    },
];

const COMMON_ERRORS = [
    { icon: '↔️', error: 'Grosor inconsistente', fix: 'Mantén el cuchillo perpendicular a la tabla y usa los nudillos como guía constante.' },
    { icon: '📐', error: 'Bastones demasiado cortos', fix: 'Debe ser 6 cm. Si tu vegetal es más corto, úsalo entero o usa un vegetal más largo.' },
    { icon: '🌀', error: 'Láminas que resbalan al apilar', fix: 'Apila máximo 3–4 láminas. Más que eso y pierdes control sobre el corte.' },
    { icon: '🦺', error: 'Cuchillo sin filo', fix: 'Un cuchillo sin filo es más peligroso que uno afilado. Requiere más presión y desvía el corte.' },
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const JulianaLevel = () => {
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);

    const [activeStep, setActiveStep] = useState(0);
    const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadState, setUploadState] = useState<'idle' | 'reviewing' | 'approved' | 'feedback'>('idle');
    const [dragOver, setDragOver] = useState(false);

    const allStepsComplete = completedSteps.size === STEPS.length;

    const handleMarkStep = (idx: number) => {
        setCompletedSteps(prev => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const handleFile = (file: File) => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = e => {
            setUploadedImage(e.target?.result as string);
            setUploadState('reviewing');
            // Simulate AI review after 2s
            setTimeout(() => setUploadState('approved'), 2500);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    return (
        <div className="min-h-full bg-white">
            {/* ── Top bar ── */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-4">
                <div className="flex items-center gap-3 max-w-3xl mx-auto">
                    <button onClick={() => navigate('/mapa')} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                        <ArrowLeft size={18} />
                    </button>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">🔪 Isla del Cuchillo</span>
                            <span className="text-xs text-white/60">›</span>
                            <span className="text-xs font-bold text-white/80">Nivel 1</span>
                        </div>
                        <h1 className="text-xl font-black mt-0.5">🥕 Corte Juliana</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-white/60">Recompensa</p>
                        <p className="font-black text-yellow-300">+50 XP</p>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="max-w-3xl mx-auto mt-3">
                    <div className="flex justify-between text-xs text-white/70 mb-1">
                        <span>{completedSteps.size}/{STEPS.length} pasos</span>
                        <span>{Math.round((completedSteps.size / STEPS.length) * 100)}%</span>
                    </div>
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                            style={{ width: `${(completedSteps.size / STEPS.length) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

                {/* ── Academy shortcut banner ── */}
                <button
                    onClick={() => navigate('/academia')}
                    className="w-full flex items-center gap-3 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 hover:bg-violet-100 transition-colors group text-left"
                >
                    <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center flex-shrink-0">
                        <BookOpen size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                        <p className="font-bold text-violet-700 text-sm">Ir a La Academia → Clase: Corte Juliana</p>
                        <p className="text-xs text-violet-500">Teoría + técnica + errores comunes antes de intentarlo</p>
                    </div>
                    <ChevronRight size={16} className="text-violet-400 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* ── Objective card ── */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                        <span className="text-3xl">🎯</span>
                        <div>
                            <h2 className="font-black text-emerald-800 text-lg">Tu Misión</h2>
                            <p className="text-emerald-700 text-sm mt-1 leading-relaxed">
                                Cortar <strong>una zanahoria o calabacín entero</strong> en bastones <strong>Juliana uniformes</strong>:
                                3 mm × 3 mm × 6 cm. Fotografía tu resultado en la tabla y súbelo para completar el nivel.
                            </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full"><Clock size={11} /> ~20 min</span>
                                <span className="flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">📏 3mm × 3mm × 6cm</span>
                                <span className="flex items-center gap-1 text-xs font-bold bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full"><Star size={11} /> Hasta 3 ⭐</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Step-by-step instructions ── */}
                <div>
                    <h2 className="text-lg font-black text-neutral-800 mb-3 flex items-center gap-2">
                        <Play size={18} className="text-emerald-500" /> Instrucciones Paso a Paso
                    </h2>
                    <div className="space-y-3">
                        {STEPS.map((step, i) => {
                            const isActive = activeStep === i;
                            const isDone = completedSteps.has(i);
                            return (
                                <div
                                    key={i}
                                    className={`rounded-xl border-2 transition-all duration-200 overflow-hidden ${isDone ? 'border-emerald-300 bg-emerald-50' : isActive ? 'border-emerald-400 bg-white shadow-md' : 'border-neutral-200 bg-white'}`}
                                >
                                    <button
                                        className="w-full flex items-center gap-3 p-4 text-left"
                                        onClick={() => setActiveStep(isActive ? -1 : i)}
                                    >
                                        {/* Step circle */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm transition-colors ${isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-500'}`}>
                                            {isDone ? <CheckCircle size={18} /> : step.num}
                                        </div>
                                        <div className="flex-1">
                                            <span className="font-bold text-neutral-800 text-sm">{step.emoji} {step.title}</span>
                                        </div>
                                        <ChevronRight size={16} className={`text-neutral-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                    </button>

                                    {isActive && (
                                        <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
                                            <p className="text-sm text-neutral-700 leading-relaxed">{step.desc}</p>

                                            {/* Tip */}
                                            <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                <Lightbulb size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                                <p className="text-xs text-amber-800 leading-relaxed"><strong>Tip Pro:</strong> {step.tip}</p>
                                            </div>

                                            {/* Mark done button */}
                                            <button
                                                onClick={() => handleMarkStep(i)}
                                                className={`mt-3 w-full py-2.5 rounded-lg font-bold text-sm transition-all active:scale-95 ${isDone ? 'bg-neutral-100 text-neutral-500' : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'}`}
                                            >
                                                {isDone ? '↩ Marcar como pendiente' : '✓ Marcar como completado'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── Common errors ── */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <h3 className="font-black text-red-700 flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} /> Errores Más Comunes
                    </h3>
                    <div className="space-y-2">
                        {COMMON_ERRORS.map((e, i) => (
                            <div key={i} className="bg-white rounded-xl border border-red-100 p-3 flex gap-3">
                                <span className="text-xl flex-shrink-0">{e.icon}</span>
                                <div>
                                    <p className="font-bold text-neutral-800 text-sm">{e.error}</p>
                                    <p className="text-xs text-neutral-600 mt-0.5">{e.fix}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Image Upload Challenge ── */}
                <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50 overflow-hidden">
                    <div className="p-5">
                        <h3 className="font-black text-emerald-800 text-lg flex items-center gap-2 mb-1">
                            <Camera size={20} /> Sube tu Reto
                        </h3>
                        <p className="text-emerald-700 text-sm mb-4">
                            Fotografía tu corte juliana en la tabla, de frente, con buena luz. Necesitamos ver la uniformidad de los bastones.
                        </p>

                        {!uploadedImage ? (
                            <div
                                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                                className={`rounded-xl border-2 border-dashed transition-all cursor-pointer text-center py-10 px-4 ${dragOver ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-300 bg-white hover:bg-emerald-50'}`}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload size={36} className="mx-auto text-emerald-400 mb-3" />
                                <p className="font-bold text-neutral-700">Arrastra tu foto aquí</p>
                                <p className="text-sm text-neutral-500 mt-1">o haz clic para seleccionar</p>
                                <p className="text-xs text-neutral-400 mt-2">JPG, PNG · Máx 10 MB</p>
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                                />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Preview */}
                                <div className="relative rounded-xl overflow-hidden">
                                    <img src={uploadedImage} alt="Tu reto" className="w-full max-h-72 object-cover rounded-xl" />
                                    {uploadState === 'reviewing' && (
                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white">
                                            <div className="w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin" />
                                            <p className="font-bold text-sm">Analizando tu corte…</p>
                                        </div>
                                    )}
                                    {uploadState === 'approved' && (
                                        <div className="absolute inset-0 bg-emerald-500/30 flex flex-col items-center justify-center gap-2">
                                            <div className="bg-emerald-500 rounded-full p-3 shadow-xl">
                                                <CheckCircle size={36} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status messages */}
                                {uploadState === 'approved' && (
                                    <div className="bg-emerald-500 text-white rounded-xl p-4 text-center">
                                        <Trophy size={28} className="mx-auto mb-2" />
                                        <p className="font-black text-lg">¡Reto Completado! 🎉</p>
                                        <p className="text-emerald-100 text-sm mt-1">Tu Juliana se ve genial. Ganaste <strong>50 XP</strong> y <strong>⭐⭐⭐</strong></p>
                                        <div className="flex justify-center gap-1 mt-2 text-2xl">⭐⭐⭐</div>
                                    </div>
                                )}

                                {/* Change photo */}
                                {uploadState !== 'reviewing' && (
                                    <button
                                        onClick={() => { setUploadedImage(null); setUploadState('idle'); }}
                                        className="w-full py-2 text-sm font-bold text-neutral-500 hover:text-red-500 transition-colors"
                                    >
                                        Cambiar foto
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Evaluation criteria */}
                    {!uploadedImage && (
                        <div className="border-t border-emerald-200 bg-white px-5 py-4">
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">¿Cómo se evalúa?</p>
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {[
                                    { stars: '⭐⭐⭐', label: 'Bastones uniformes, 3mm, buen filo' },
                                    { stars: '⭐⭐', label: 'Grosor regular, alguna variación' },
                                    { stars: '⭐', label: 'Intentaste el corte, grosor irregular' },
                                ].map((c, i) => (
                                    <div key={i} className="bg-neutral-50 rounded-lg p-2">
                                        <p className="text-base">{c.stars}</p>
                                        <p className="text-[10px] text-neutral-500 mt-1 leading-tight">{c.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Complete Level CTA ── */}
                {allStepsComplete && !uploadedImage && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl p-5 text-center">
                        <Trophy size={32} className="mx-auto mb-2" />
                        <p className="font-black text-lg">¡Pasos completados!</p>
                        <p className="text-emerald-100 text-sm mt-1">Ahora sube la foto de tu corte para reclamar las estrellas y el XP.</p>
                    </div>
                )}

                {uploadState === 'approved' && (
                    <button
                        onClick={() => navigate('/mapa')}
                        className="w-full py-4 rounded-2xl font-black text-white text-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-emerald-500/30"
                    >
                        🗺️ Volver al Mapa de Aventura
                    </button>
                )}

                <div className="h-4" />
            </div>
        </div>
    );
};
