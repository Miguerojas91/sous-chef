import { useState } from 'react';
import { ArrowLeft, PlayCircle, Book, Camera, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BrunoiseLesson = () => {
    const [activeTab, setActiveTab] = useState<'teoria' | 'practica'>('teoria');
    const [isCompleted, setIsCompleted] = useState(false);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    <Link to="/mapa" className="p-2 hover:bg-neutral-100 rounded-full transition-colors text-neutral-500">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-orange-500 bg-orange-50 px-2 py-1 rounded">Nivel 1 • Básico</span>
                        </div>
                        <h1 className="text-2xl font-black text-neutral-800 mt-1">Corte Brunoise</h1>
                    </div>
                </div>

                {isCompleted ? (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full font-bold">
                        <CheckCircle size={20} />
                        <span>Técnica Dominada</span>
                    </div>
                ) : (
                    <div className="text-right">
                        <span className="block text-sm text-neutral-500 font-medium">Recompensa</span>
                        <span className="font-bold text-orange-500">+100 XP</span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex px-6 border-b border-neutral-100">
                <button
                    onClick={() => setActiveTab('teoria')}
                    className={`px-6 py-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'teoria' ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
                >
                    <Book size={18} /> Teoría y Técnica
                </button>
                <button
                    onClick={() => setActiveTab('practica')}
                    className={`px-6 py-4 font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'practica' ? 'border-orange-500 text-orange-600' : 'border-transparent text-neutral-500 hover:text-neutral-800'}`}
                >
                    <Camera size={18} /> Práctica (Chef Agent)
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-neutral-50">
                {activeTab === 'teoria' ? (
                    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Video Placeholder */}
                        <div className="w-full aspect-video bg-neutral-900 rounded-2xl overflow-hidden relative group cursor-pointer shadow-lg shadow-neutral-200/50 border border-neutral-200">
                            <img src="https://images.unsplash.com/photo-1606851181057-73ebab99d989?auto=format&fit=crop&q=80&w=1000" alt="Corte Brunoise" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-white/20 backdrop-blur-md p-4 rounded-full text-white transform group-hover:scale-110 transition-transform">
                                    <PlayCircle size={48} strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 flex justify-between text-white drop-shadow-md">
                                <span className="font-bold tracking-wide">Masterclass: El corte perfecto</span>
                                <span className="font-mono text-sm">03:45</span>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
                            <h2 className="text-xl font-bold text-neutral-800 mb-4">¿Qué es el corte Brunoise?</h2>
                            <p className="text-neutral-600 leading-relaxed mb-6">
                                El brunoise es una forma de cortar verduras en pequeños dados (de 1 a 2 mm de lado) sobre una tabla de cortar.
                                Suele elaborarse a partir de un corte en juliana y luego un corte transversal a minúsculos dados.
                            </p>

                            <h3 className="font-bold text-neutral-800 mb-3 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-500" />
                                ¿Para qué se utiliza?
                            </h3>
                            <ul className="space-y-2 text-neutral-600 ml-4 mb-8">
                                <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">•</span> Bases para salsas y guisos (sofritos).</li>
                                <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">•</span> Rellenos finos donde la textura no debe opacar el ingrediente principal.</li>
                                <li className="flex items-start gap-2"><span className="text-orange-400 font-bold">•</span> Decoración (guarniciones).</li>
                            </ul>

                            <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
                                <h4 className="font-bold text-blue-800 mb-2">💡 El Secreto del Chef</h4>
                                <p className="text-blue-700 text-sm">
                                    La clave para un brunoise perfecto es mantener un cuchillo **muy afilado** y asegurar una base plana en la verdura antes de cortar, para evitar que ruede y cause accidentes.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button
                                onClick={() => setActiveTab('practica')}
                                className="bg-neutral-900 text-white px-8 py-3 rounded-full font-bold hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20"
                            >
                                Ir a la Práctica
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto flex flex-col items-center justify-center text-center space-y-6 pt-12 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-4">
                            <Camera size={48} />
                        </div>
                        <h2 className="text-2xl font-black text-neutral-800">¡Hora de practicar!</h2>
                        <p className="text-neutral-600 max-w-md mx-auto">
                            Corta media cebolla o zanahoria en Brunoise. Cuando estés listo, activa a **Sous** para que supervise tu técnica.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-8">
                            <button className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 p-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                                <Camera size={20} /> Tomar Foto Final
                            </button>
                            <Link to="/" className="bg-orange-500 hover:bg-orange-600 text-white p-4 rounded-xl font-bold transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                                Activar Asistente de Voz
                            </Link>
                        </div>

                        {!isCompleted && (
                            <button
                                onClick={() => setIsCompleted(true)}
                                className="mt-12 text-sm font-bold text-neutral-400 hover:text-green-500 underline decoration-dotted transition-colors"
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
