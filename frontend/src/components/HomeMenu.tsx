import { useNavigate } from 'react-router-dom';
import { Compass, Map as MapIcon, Globe, BookOpen, CalendarDays } from 'lucide-react';
import { EditableText } from './cms/EditableText';

const modules = [
    {
        id: 'descubridor',
        path: '/cocinar',
        icon: Compass,
        title: 'Cocinemos',
        subtitle: 'Asistente IA',
        gradient: 'from-orange-400 to-red-500',
        emoji: '🍳',
        bg: 'bg-orange-50',
    },
    {
        id: 'tesoro',
        path: '/mapa',
        icon: MapIcon,
        title: 'Modo Aventura',
        subtitle: 'Mapa de habilidades',
        gradient: 'from-amber-400 to-yellow-500',
        emoji: '🗺️',
        bg: 'bg-amber-50',
    },
    {
        id: 'sabores',
        path: '/sabores',
        icon: Globe,
        title: 'Sabores del Mundo',
        subtitle: 'Masterclasses globales',
        gradient: 'from-emerald-400 to-teal-500',
        emoji: '🌍',
        bg: 'bg-emerald-50',
    },
    {
        id: 'academia',
        path: '/academia',
        icon: BookOpen,
        title: 'La Academia',
        subtitle: 'Entrenamiento teórico',
        gradient: 'from-violet-400 to-purple-600',
        emoji: '📚',
        bg: 'bg-violet-50',
    },
    {
        id: 'milprep',
        path: '/milprep',
        icon: CalendarDays,
        title: 'Mealprep',
        subtitle: 'Meal prep inteligente',
        gradient: 'from-blue-400 to-cyan-500',
        emoji: '🗓️',
        bg: 'bg-blue-50',
    },
];

export const HomeMenu = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col h-full px-4 pt-4 pb-3 overflow-hidden">

            {/* Header */}
            <div className="flex-shrink-0 mb-4 flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold tracking-widest uppercase text-orange-500 mb-0.5">
                        <EditableText as="span" elementKey="home_welcome_sub" defaultText="Bienvenido a" />
                    </p>
                    <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight leading-none">
                        <EditableText as="span" elementKey="home_title_main" defaultText="Sous " />
                        <EditableText
                            as="span"
                            elementKey="home_title_accent"
                            defaultText="Chef"
                            className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"
                        />
                    </h1>
                </div>
                <span className="text-3xl">👨‍🍳</span>
            </div>

            {/* Grid de módulos */}
            <div className="flex-1 flex flex-col gap-3 min-h-0">
                {/* Fila 1 */}
                <div className="flex gap-3 flex-1 min-h-0">
                    {modules.slice(0, 2).map(mod => (
                        <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.path)} />
                    ))}
                </div>
                {/* Fila 2 */}
                <div className="flex gap-3 flex-1 min-h-0">
                    {modules.slice(2, 4).map(mod => (
                        <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.path)} />
                    ))}
                </div>
                {/* Fila 3: último módulo centrado */}
                <div className="flex justify-center flex-1 min-h-0">
                    <ModuleCard
                        key={modules[4].id}
                        mod={modules[4]}
                        onClick={() => navigate(modules[4].path)}
                        wide
                    />
                </div>
            </div>
        </div>
    );
};

// ── Card individual ────────────────────────────────────────────────────────────

function ModuleCard({
    mod,
    onClick,
    wide = false,
}: {
    mod: typeof modules[number];
    onClick: () => void;
    wide?: boolean;
}) {
    const Icon = mod.icon;
    return (
        <button
            onClick={onClick}
            className={`
                group relative text-left rounded-2xl p-4
                bg-gradient-to-br ${mod.gradient}
                shadow-lg
                transition-all duration-200 ease-out
                active:scale-95 hover:scale-[1.02] hover:shadow-xl
                focus:outline-none overflow-hidden
                ${wide ? 'w-1/2' : 'flex-1'}
                flex flex-col justify-between
            `}
        >
            {/* Círculos decorativos */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

            {/* Emoji */}
            <span className="text-3xl drop-shadow relative z-10 group-hover:scale-110 transition-transform duration-200">
                {mod.emoji}
            </span>

            {/* Título + subtítulo */}
            <div className="relative z-10">
                <div className="flex items-center gap-1.5 mb-1">
                    <Icon size={13} className="text-white/80 flex-shrink-0" />
                    <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight">
                        <EditableText elementKey={`home_mod_${mod.id}_title`} defaultText={mod.title} as="span" />
                    </h2>
                </div>
                <p className="text-xs font-medium text-white/80 leading-tight">
                    <EditableText elementKey={`home_mod_${mod.id}_sub`} defaultText={mod.subtitle} as="span" />
                </p>
            </div>
        </button>
    );
}
