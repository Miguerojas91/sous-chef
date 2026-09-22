/**
 * Inicio: acceso a los cinco módulos en una cuadrícula 2 + 2 + 1 (Mealprep
 * centrado). Si hay una receta en curso en Cocinemos, arriba aparece
 * "Continuar tu receta", que es lo que más se busca al volver a la app con la
 * olla en el fuego.
 *
 * Los textos se editan desde el CMS (`EditableText`); las claves no deben
 * cambiar o se pierden los textos ya guardados.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Compass, Map as MapIcon, Globe, BookOpen, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { hasCookingInProgress } from '../utils/cookingSessionStore';

interface Module {
  /** Clave de CMS: no cambiar. */
  id: string;
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Clases Tailwind del gradiente de fondo. */
  gradient: string;
  /** Emoji decorativo (oculto a lectores de pantalla). */
  emoji: string;
}

const modules: Module[] = [
  { id: 'descubridor', path: '/cocinar',  icon: Compass,      title: 'Cocinemos',         subtitle: 'Sous te guía paso a paso',            gradient: 'from-orange-400 to-red-500',    emoji: '🍳' },
  { id: 'tesoro',      path: '/mapa',     icon: MapIcon,      title: 'Modo Aventura',     subtitle: 'Aprende técnicas por niveles',        gradient: 'from-amber-400 to-yellow-500',  emoji: '🗺️' },
  { id: 'sabores',     path: '/sabores',  icon: Globe,        title: 'Sabores del Mundo', subtitle: 'Recetas de otros países',             gradient: 'from-emerald-400 to-teal-500',  emoji: '🌍' },
  { id: 'academia',    path: '/academia', icon: BookOpen,     title: 'La Academia',       subtitle: 'Clases cortas con quiz',              gradient: 'from-violet-400 to-purple-600', emoji: '📚' },
  { id: 'milprep',     path: '/milprep',  icon: CalendarDays, title: 'Mealprep',          subtitle: 'Cocina una vez, come toda la semana', gradient: 'from-blue-400 to-cyan-500',     emoji: '🗓️' },
];

const CARD_BASE =
  'group relative text-left rounded-2xl p-4 ' +
  'bg-gradient-to-br shadow-lg overflow-hidden ' +
  'transition-all duration-200 ease-out ' +
  'active:scale-95 hover:scale-[1.02] hover:shadow-xl ' +
  'focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 focus-visible:ring-offset-2 ' +
  'flex flex-col justify-between';

export const HomeMenu = () => {
  const resume = hasCookingInProgress();

  return (
    <section
      aria-labelledby="home-title"
      className="flex flex-col flex-1 min-h-0 px-4 pt-4 pb-3 overflow-y-auto"
    >
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
        <span className="text-3xl" aria-hidden="true">👨‍🍳</span>
      </header>

      {resume && (
        <Link
          to="/cocinar"
          className="group relative flex-shrink-0 mb-3 min-h-16 flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-200 overflow-hidden transition-all duration-200 ease-out active:scale-95 hover:scale-[1.02] hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-orange-300 focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
          <span aria-hidden="true" className="absolute -bottom-6 left-10 w-16 h-16 rounded-full bg-white/10" />
          <span aria-hidden="true" className="relative z-10 text-3xl drop-shadow-lg group-hover:scale-110 transition-transform duration-200">🔥</span>
          <span className="relative z-10 flex-1 min-w-0">
            <span className="block text-base font-extrabold tracking-tight">Continuar tu receta</span>
            <span className="block text-sm font-medium text-white/95">Sous guardó la conversación donde la dejaste.</span>
          </span>
          <ChevronRight size={22} className="relative z-10 flex-shrink-0" aria-hidden />
        </Link>
      )}

      <nav aria-label="Módulos de Sous Chef" className="flex-1 flex flex-col gap-3 min-h-[24rem]">
        <div className="flex gap-3 flex-1 min-h-[7.5rem]">
          {modules.slice(0, 2).map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
        <div className="flex gap-3 flex-1 min-h-[7.5rem]">
          {modules.slice(2, 4).map(mod => (
            <ModuleCard key={mod.id} mod={mod} />
          ))}
        </div>
        <div className="flex justify-center flex-1 min-h-[7.5rem]">
          <ModuleCard mod={modules[4]} wide />
        </div>
      </nav>
    </section>
  );
};

function ModuleCard({ mod, wide = false }: { mod: Module; wide?: boolean }) {
  const Icon = mod.icon;
  const widthClass = wide ? 'w-1/2' : 'flex-1 min-w-0';

  return (
    <Link
      to={mod.path}
      className={`${CARD_BASE} ${mod.gradient} ${widthClass}`}
    >
      <span aria-hidden="true" className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
      <span aria-hidden="true" className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />

      <span
        aria-hidden="true"
        className="text-3xl drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-200"
      >
        {mod.emoji}
      </span>

      <span className="relative z-10 block">
        <span className="flex items-center gap-1.5 mb-1">
          <Icon size={13} aria-hidden className="text-white/90 flex-shrink-0" />
          <span className="text-sm font-extrabold text-white tracking-tight leading-tight">
            <EditableText elementKey={`home_mod_${mod.id}_title`} defaultText={mod.title} as="span" />
          </span>
        </span>
        <span className="block text-xs font-medium text-white/95 leading-tight">
          <EditableText elementKey={`home_mod_${mod.id}_sub`} defaultText={mod.subtitle} as="span" />
        </span>
      </span>
    </Link>
  );
}
