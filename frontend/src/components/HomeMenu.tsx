/**
 * HomeMenu.tsx
 *
 * Menú principal de la aplicación. Muestra una cuadrícula de tarjetas
 * con acceso directo a cada uno de los cinco módulos de Sous Chef:
 *
 * 1. Cocinemos      — Asistente IA de cocina en tiempo real.
 * 2. Modo Aventura  — Mapa gamificado de habilidades culinarias.
 * 3. Sabores del Mundo — Masterclasses de cocina internacional.
 * 4. La Academia    — Entrenamiento teórico y técnicas base.
 * 5. Mealprep       — Planificador inteligente de comidas semanales.
 *
 * Los textos de los títulos y subtítulos son editables vía el CMS
 * visual usando el componente `<EditableText>`.
 *
 * Layout:
 * - Fila 1: Cocinemos + Modo Aventura (flex, 50/50)
 * - Fila 2: Sabores + Academia (flex, 50/50)
 * - Fila 3: Mealprep centrado (50% de ancho)
 */

import { useNavigate } from 'react-router-dom';
import { Compass, Map as MapIcon, Globe, BookOpen, CalendarDays } from 'lucide-react';
import { EditableText } from './cms/EditableText';

/** Definición de un módulo en el menú principal. */
interface Module {
  /** Identificador único, usado como clave de CMS para textos editables. */
  id: string;
  /** Ruta de navegación al hacer clic. */
  path: string;
  /** Icono de lucide-react mostrado junto al título. */
  icon: React.ComponentType<{ size?: number; className?: string }>;
  /** Título corto del módulo. */
  title: string;
  /** Descripción de una línea visible en la tarjeta. */
  subtitle: string;
  /** Clases Tailwind del gradiente de fondo de la tarjeta. */
  gradient: string;
  /** Emoji grande decorativo en la parte superior de la tarjeta. */
  emoji: string;
  /** Clase de color de fondo claro (actualmente no usada en la tarjeta). */
  bg: string;
}

/** Lista ordenada de módulos que aparecen en el menú principal. */
const modules: Module[] = [
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

/**
 * Página de inicio con cuadrícula de módulos.
 * Navega al módulo correspondiente cuando el usuario toca una tarjeta.
 */
export const HomeMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full px-4 pt-4 pb-3 overflow-hidden">

      {/* Encabezado con título editable */}
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

      {/* Cuadrícula de módulos */}
      <div className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Fila 1: Cocinemos + Modo Aventura */}
        <div className="flex gap-3 flex-1 min-h-0">
          {modules.slice(0, 2).map(mod => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.path)} />
          ))}
        </div>
        {/* Fila 2: Sabores del Mundo + La Academia */}
        <div className="flex gap-3 flex-1 min-h-0">
          {modules.slice(2, 4).map(mod => (
            <ModuleCard key={mod.id} mod={mod} onClick={() => navigate(mod.path)} />
          ))}
        </div>
        {/* Fila 3: Mealprep centrado */}
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

// ── Tarjeta individual de módulo ──────────────────────────────────────────────

/** Props del componente ModuleCard. */
interface ModuleCardProps {
  /** Datos del módulo a mostrar. */
  mod: Module;
  /** Función de navegación al hacer clic. */
  onClick: () => void;
  /**
   * Si es `true`, la tarjeta ocupa el 50% del ancho en lugar de flex-1.
   * Usado para la tarjeta de Mealprep en la fila 3.
   */
  wide?: boolean;
}

/**
 * Tarjeta de módulo con gradiente, emoji, título y subtítulo editables.
 * Incluye círculos decorativos absolutos y animaciones hover/active.
 */
function ModuleCard({ mod, onClick, wide = false }: ModuleCardProps) {
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
      {/* Círculos decorativos de fondo */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

      {/* Emoji decorativo con animación hover */}
      <span className="text-3xl drop-shadow relative z-10 group-hover:scale-110 transition-transform duration-200">
        {mod.emoji}
      </span>

      {/* Título y subtítulo editables vía CMS */}
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
