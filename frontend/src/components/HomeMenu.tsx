/**
 * Inicio: acceso a los cinco módulos. Si hay una receta en curso en
 * Cocinemos, arriba aparece "Continuar tu receta", que es lo que más se busca
 * al volver a la app con la olla en el fuego.
 *
 * Los textos se editan desde el CMS (`EditableText`); las claves no deben
 * cambiar o se pierden los textos ya guardados.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, Compass, Map as MapIcon, Globe, BookOpen, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EditableText } from './cms/EditableText';

interface Module {
  /** Clave de CMS: no cambiar. */
  id: string;
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const modules: Module[] = [
  { id: 'descubridor', path: '/cocinar',  icon: Compass,      title: 'Cocinemos',         subtitle: 'Sous te guía paso a paso' },
  { id: 'tesoro',      path: '/mapa',     icon: MapIcon,      title: 'Modo Aventura',     subtitle: 'Aprende técnicas por niveles' },
  { id: 'sabores',     path: '/sabores',  icon: Globe,        title: 'Sabores del Mundo', subtitle: 'Recetas de otros países' },
  { id: 'academia',    path: '/academia', icon: BookOpen,     title: 'La Academia',       subtitle: 'Clases cortas con quiz' },
  { id: 'milprep',     path: '/milprep',  icon: CalendarDays, title: 'Mealprep',          subtitle: 'Cocina una vez, come toda la semana' },
];

function hasCookingInProgress(): boolean {
  try {
    return !!localStorage.getItem('sous_cooking_meta') && !!localStorage.getItem('sous_chat_cooking');
  } catch {
    return false;
  }
}

export const HomeMenu = () => {
  const resume = hasCookingInProgress();

  return (
    <section aria-labelledby="home-title" className="flex-1 overflow-y-auto bg-neutral-50">
      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        <h1 id="home-title" className="text-2xl font-extrabold text-neutral-900 tracking-tight">
          <EditableText as="span" elementKey="home_title_main" defaultText="Sous " />
          <EditableText as="span" elementKey="home_title_accent" defaultText="Chef" className="text-brand-700" />
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          <EditableText as="span" elementKey="home_welcome_sub" defaultText="¿Qué hacemos hoy?" />
        </p>

        {resume && (
          <Link
            to="/cocinar"
            className="mt-5 min-h-16 flex items-center gap-3 px-4 py-3 rounded-card bg-brand-700 hover:bg-brand-800 text-white transition-colors"
          >
            <span className="flex-1 min-w-0">
              <span className="block text-base font-bold">Continuar tu receta</span>
              <span className="block text-sm text-white">Sous guardó la conversación donde la dejaste.</span>
            </span>
            <ChevronRight size={22} aria-hidden />
          </Link>
        )}

        <nav aria-label="Módulos" className="mt-5">
          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            {modules.map(mod => {
              const Icon = mod.icon;
              return (
                <li key={mod.id}>
                  <Link
                    to={mod.path}
                    className="min-h-16 flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-700 transition-colors"
                  >
                    <Icon size={22} className="text-brand-700 flex-shrink-0" aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-base font-bold text-neutral-900">
                        <EditableText elementKey={`home_mod_${mod.id}_title`} defaultText={mod.title} as="span" />
                      </span>
                      <span className="block text-sm text-neutral-600">
                        <EditableText elementKey={`home_mod_${mod.id}_sub`} defaultText={mod.subtitle} as="span" />
                      </span>
                    </span>
                    <ChevronRight size={20} className="text-neutral-500 flex-shrink-0" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
};
