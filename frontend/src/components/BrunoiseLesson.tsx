import { useState } from 'react';
import { ArrowLeft, PlayCircle, Book, Camera, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BrunoiseLesson = () => {
    const [activeTab, setActiveTab] = useState<'teoria' | 'practica'>('teoria');
    const [isCompleted, setIsCompleted] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-4 md:p-6 border-b border-neutral-200 flex items-center justify-between gap-3 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3 min-w-0">
                    <Link
                        to="/mapa"
                        aria-label="Volver al mapa"
                        className="w-11 h-11 flex items-center justify-center hover:bg-neutral-100 rounded-full transition-colors text-neutral-600 focus-visible:ring-2 focus-visible:ring-brand-700"
                    >
                        <ArrowLeft size={24} aria-hidden="true" />
                    </Link>
                    <div className="min-w-0">
                        <span className="text-sm font-semibold text-neutral-600">Nivel 1 • Básico</span>
                        <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900">Corte Brunoise</h1>
                    </div>
                </div>

                {isCompleted ? (
                    <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-3 py-2 rounded-full font-bold text-sm">
                        <CheckCircle size={18} aria-hidden="true" />
                        <span>Técnica completada</span>
                    </div>
                ) : (
                    <div className="text-right">
                        <span className="block text-sm text-neutral-600 font-medium">Recompensa</span>
                        <span className="font-bold text-brand-700">+100 XP</span>
                    </div>
                )}
            </div>

            <div className="flex px-4 md:px-6 border-b border-neutral-200">
                <button
                    type="button"
                    onClick={() => setActiveTab('teoria')}
                    className={`min-h-11 px-4 md:px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'teoria' ? 'border-brand-700 text-brand-700' : 'border-transparent text-neutral-600 hover:text-neutral-900'}`}
                >
                    <Book size={18} aria-hidden="true" /> Teoría y técnica
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab('practica')}
                    className={`min-h-11 px-4 md:px-6 py-3 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'practica' ? 'border-brand-700 text-brand-700' : 'border-transparent text-neutral-600 hover:text-neutral-900'}`}
                >
                    <Camera size={18} aria-hidden="true" /> Práctica
                </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 bg-neutral-50">
                {activeTab === 'teoria' ? (
                    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8 motion-safe:animate-fade-in">
                        {/* marcador de posición: todavía no hay video real */}
                        <div className="w-full aspect-video bg-neutral-900 rounded-card overflow-hidden relative border border-neutral-200">
                            <img src="https://images.unsplash.com/photo-1606851181057-73ebab99d989?auto=format&fit=crop&q=80&w=1000" alt="Corte brunoise" className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-neutral-900/70 p-4 rounded-full text-white">
                                    <PlayCircle size={48} strokeWidth={1.5} aria-hidden="true" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-neutral-900/80 px-4 py-2 flex justify-between gap-3 text-white">
                                <span className="font-bold min-w-0">Video: corte brunoise</span>
                                <span className="font-mono text-sm">03:45</span>
                            </div>
                        </div>

                        <div className="bg-white p-4 md:p-8 rounded-card border border-neutral-200">
                            <h2 className="text-xl font-bold text-neutral-900 mb-4">¿Qué es el corte brunoise?</h2>
                            <p className="text-neutral-600 leading-relaxed mb-6">
                                El brunoise es una forma de cortar verduras en pequeños dados (de 1 a 2 mm de lado) sobre una tabla de cortar.
                                Suele elaborarse a partir de un corte en juliana y luego un corte transversal a minúsculos dados.
                            </p>

                            <h3 className="font-bold text-neutral-900 mb-3">¿Para qué se utiliza?</h3>
                            <ul className="space-y-2 text-neutral-600 ml-4 mb-8">
                                <li className="flex items-start gap-2"><span className="text-brand-700 font-bold" aria-hidden="true">•</span> Bases para salsas y guisos (sofritos).</li>
                                <li className="flex items-start gap-2"><span className="text-brand-700 font-bold" aria-hidden="true">•</span> Rellenos finos donde la textura no debe opacar el ingrediente principal.</li>
                                <li className="flex items-start gap-2"><span className="text-brand-700 font-bold" aria-hidden="true">•</span> Decoración (guarniciones).</li>
                            </ul>

                            <div className="bg-brand-50 border border-brand-100 p-4 md:p-6 rounded-card">
                                <h4 className="font-bold text-brand-800 mb-2">Consejo</h4>
                                <p className="text-brand-800 text-sm">
                                    Para un buen brunoise, usa un cuchillo <strong>muy afilado</strong> y deja una base plana en la verdura antes de cortar, para que no ruede y cause accidentes.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('practica')}
                                className="min-h-11 bg-neutral-900 text-white px-6 rounded-control font-bold hover:bg-neutral-800 transition-colors focus-visible:ring-2 focus-visible:ring-brand-700"
                            >
                                Ir a la práctica
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6 pt-8 motion-safe:animate-fade-in">
                        <Camera size={48} className="text-brand-700" aria-hidden="true" />
                        <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900">¡Hora de practicar!</h2>
                        <p className="text-neutral-600 max-w-md mx-auto">
                            Corta media cebolla o zanahoria en brunoise. Cuando estés listo, activa a <strong>Sous</strong> para que supervise tu técnica.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mt-6">
                            <button type="button" className="min-h-11 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 p-4 rounded-control font-bold transition-colors flex items-center justify-center gap-2">
                                <Camera size={20} aria-hidden="true" /> Tomar foto final
                            </button>
                            <Link to="/" className="min-h-11 bg-brand-700 hover:bg-brand-800 text-white p-4 rounded-control font-bold transition-colors flex items-center justify-center gap-2">
                                Activar asistente de voz
                            </Link>
                        </div>

                        {!isCompleted && (
                            <button
                                type="button"
                                onClick={() => setIsCompleted(true)}
                                className="min-h-11 mt-8 text-sm font-bold text-neutral-600 hover:text-emerald-700 underline decoration-dotted transition-colors"
                            >
                                [DevMode: Simular Validación Exitosa]
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
