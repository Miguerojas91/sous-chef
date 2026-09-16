/**
 * HomeMenu.tsx
 *
 * Menú principal de la app. Cuadrícula de tarjetas con acceso directo
 * a los módulos de Sous Chef:
 *
 *   1. Cocinemos        — Asistente IA de cocina en tiempo real.
 *   2. Modo Aventura    — Mapa gamificado de habilidades.
 *   3. Sabores del Mundo — Masterclasses internacionales.
 *   4. La Academia      — Entrenamiento teórico.
 *   5. Mealprep         — Planificador semanal.
 *
 * Los textos son editables vía CMS (`<EditableText>`).
 *
 * Layout: 2 + 2 + 1 (Mealprep centrado).
 *
 * a11y:
 * - `<main>` + `<nav>` + `<header>` semánticos.
 * - Cada tarjeta es un `<Link>` (navegación, no acción) con `aria-label`
 *   compuesto por título + subtítulo.
 * - Iconos y emojis decorativos `aria-hidden="true"`.
 * - `focus-visible` dispara un anillo claro solo con teclado.
 */

import { Link } from 'react-router-dom';
import { Compass, Map as MapIcon, Globe, BookOpen, CalendarDays } from 'lucide-react';
import { EditableText } from './cms/EditableText';

// ── Tipos y datos de los módulos ──────────────────────────────────────────────

/** Definición de un módulo en el menú principal. */
interface Module {
  /** Identificador único, usado como clave de CMS para textos editables. */
  id: string;
  /** Ruta de navegación al hacer clic. */
  path: string;
  /** Icono de lucide-react mostrado junto al título. */
  icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>;
  /** Título corto del módulo. */
  title: string;
  /** Descripción de una línea visible en la tarjeta. */
  subtitle: string;
  /** Clases Tailwind del gradiente de fondo. */
  gradient: string;
  /** Emoji decorativo (oculto a screen readers). */
  emoji: string;
}

/** Módulos en orden de aparición en el menú. */
const modules: Module[] = [
  { id: 'descubridor', path: '/cocinar', icon: Compass,      title: 'Cocinemos',         subtitle: 'Asistente IA',          gradient: 'from-orange-400 to-red-500',     emoji: '🍳' },
  { id: 'tesoro',      path: '/mapa',    icon: MapIcon,      title: 'Modo Aventura',     subtitle: 'Mapa de habilidades',   gradient: 'from-amber-400 to-yellow-500',   emoji: '🗺️' },
  { id: 'sabores',     path: '/sabores', icon: Globe,        title: 'Sabores del Mundo', subtitle: 'Masterclasses globales',gradient: 'from-emerald-400 to-teal-500',   emoji: '🌍' },
  { id: 'academia',    path: '/academia',icon: BookOpen,     title: 'La Academia',       subtitle: 'Entrenamiento teórico', gradient: 'from-violet-400 to-purple-600',  emoji: '📚' },
  { id: 'milprep',     path: '/milprep', icon: CalendarDays, title: 'Mealprep',          subtitle: 'Meal prep inteligente', gradient: 'from-blue-400 to-cyan-500',      emoji: '🗓️' },
];

// ── Estilos invariantes del card (fuera del componente para evitar rebuilds) ──
const CARD_BASE =
  'group relative text-left rounded-2xl p-4 ' +
  'bg-gradient-to-br shadow-lg overflow-hidden ' +
  'transition-all duration-200 ease-out ' +
  'active:scale-95 hover:scale-[1.02] hover:shadow-xl ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2 ' +
  'flex flex-col justify-between';

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * Página de inicio con cuadrícula de módulos.
 */
export const HomeMenu = () => {
  return (
    <main
      aria-labelledby="home-title"
      className="flex flex-col h-full px-4 pt-4 pb-3 overflow-hidden"
    >
      {/* Encabezado */}
      <header className="flex-shrink-0 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-orange-500 mb-0.5">
            <EditableText as="span" elementKey="home_welcome_sub" defaultText="Bienvenido a" />
          </p>
          <h1 id="home-title" className="text-2xl font-extrabold text-neutral-900 tracking-tight leading-none">
            <EditableText as="span" elementKey="home_title_main" defaultText="Sous " />
            <EditableText
              as="span"
              elementKey="home_title_accent"
              defaultText="Chef"
              className="bg-gradient-to-r from-orange-500 to-rose-500 bg-clip-text text-transparent"
            />
          </h1>
        </div>
        <span className="text-3xl" role="img" aria-label="Chef">👨‍🍳</span>
      </header>

      {/* Navegación principal */}
      <nav aria-label="Módulos de Sous Chef" className="flex-1 flex flex-col gap-3 min-h-0">
        {/* Fila 1: Cocinemos + Modo Aventura */}
        <div className="flex gap-3 flex-1 min-h-0">
          {modules.slice(0, 2).map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
        {/* Fila 2: Sabores + Academia */}
        <div className="flex gap-3 flex-1 min-h-0">
          {modules.slice(2, 4).map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
        {/* Fila 3: Mealprep centrado */}
        <div className="flex justify-center flex-1 min-h-0">
          <ModuleCard mod={modules[4]} wide />
        </div>
      </nav>
    </main>
  );
};

// ── Tarjeta individual de módulo ──────────────────────────────────────────────

interface ModuleCardProps {
  mod: Module;
  /** Si es `true`, ocupa 50% del ancho (Mealprep en la fila 3). */
  wide?: boolean;
}

/**
 * Tarjeta-link a un módulo. Es `<Link>` (no `<button>`) porque navega:
 * Cmd+click abre en nueva pestaña, el navegador muestra la URL en hover, etc.
 */
function ModuleCard({ mod, wide = false }: ModuleCardProps) {
  const Icon = mod.icon;
  const widthClass = wide ? 'w-1/2' : 'flex-1';

  return (
    <Link
      to={mod.path}
      aria-label={`${mod.title}: ${mod.subtitle}`}
      className={`${CARD_BASE} bg-gradient-to-br ${mod.gradient} ${widthClass}`}
    >
      {/* Círculos decorativos */}
      <span aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <span aria-hidden="true" className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

      {/* Emoji decorativo */}
      <span
        aria-hidden="true"
        className="text-3xl drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-200"
      >
        {mod.emoji}
      </span>

      {/* Título y subtítulo */}
      <div className="relative z-10">
        <div className="flex items-center gap-1.5 mb-1">
          <Icon size={13} aria-hidden className="text-white/90 flex-shrink-0" />
          <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight">
            <EditableText elementKey={`home_mod_${mod.id}_title`} defaultText={mod.title} as="span" />
          </h2>
        </div>
        <p className="text-xs font-medium text-white/95 leading-tight">
          <EditableText elementKey={`home_mod_${mod.id}_sub`} defaultText={mod.subtitle} as="span" />
        </p>
      </div>
    </Link>
  );
}
