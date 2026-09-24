/**
 * Inicio: saludo, módulos (Explora), "Continuar tu receta" si hay una receta
 * en curso, el siguiente reto del Modo Aventura, rango y racha.
 *
 * Los textos de los módulos se editan desde el CMS (`EditableText`); sus claves
 * no deben cambiar o se pierden los textos ya guardados.
 */

import { Link } from 'react-router-dom';
import { ChevronRight, MessageCircle, ChefHat, Globe, BookOpen, CalendarDays, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { hasCookingInProgress } from '../utils/cookingSessionStore';
import { LEVELS, getLevelStatus } from '../data/adventure';
import { WORLD_TOKENS } from '../data/worldTokens';
import { readLevelStars } from '../utils/progress';
import { RankCard, StreakCard } from './ui/GameStats';
import { useGameState } from '../hooks/useGameState';
import { WorldIcon } from './ui/WorldIcon';

interface Module {
  /** Clave de CMS: no cambiar. */
  id: string;
  path: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Clases del cuadro del ícono. */
  tone: string;
}

const modules: Module[] = [
  { id: 'descubridor', path: '/cocinar',  icon: ChefHat,      title: 'Cocinemos',         subtitle: 'Sous te guía paso a paso',            tone: 'bg-orange-100 text-orange-600' },
  { id: 'sabores',     path: '/sabores',  icon: Globe,        title: 'Sabores del Mundo', subtitle: 'Recetas de otros países',             tone: 'bg-blue-100 text-blue-500' },
  { id: 'academia',    path: '/academia', icon: BookOpen,     title: 'La Academia',       subtitle: 'Clases cortas con quiz',              tone: 'bg-violet-100 text-violet-500' },
  { id: 'milprep',     path: '/milprep',  icon: CalendarDays, title: 'Mealprep',          subtitle: 'Cocina una vez, come toda la semana', tone: 'bg-emerald-100 text-emerald-600' },
];

function nextLevel() {
  const stars = readLevelStars();
  return LEVELS.find(l => getLevelStatus(l.path, stars) === 'active') ?? null;
}

export const HomeMenu = () => {
  const resume = hasCookingInProgress();
  const { username, rank, streak, week, today } = useGameState();
  const level = nextLevel();

  return (
    <section aria-labelledby="home-title" className="flex flex-col flex-1 min-h-0 px-4 pt-2 pb-6 md:p-6 overflow-y-auto">
      <header className="mb-4 flex flex-col gap-1">
        {username && <p className="text-base font-extrabold text-neutral-500">Hola, {username}</p>}
        <h1 id="home-title" className="text-[32px] md:text-[40px] font-extrabold text-ink leading-none">
          <EditableText as="span" elementKey="home_greeting_title" defaultText="¿Qué cocinamos hoy?" />
        </h1>
      </header>

      <section aria-labelledby="explore-title" className="mb-5">
        <h2 id="explore-title" className="text-[22px] font-extrabold text-ink mb-3">Explora</h2>
        <nav aria-label="Módulos de Sous Chef" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {modules.map(mod => <ModuleCard key={mod.id} mod={mod} />)}
        </nav>
      </section>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:gap-5">
        <div className="flex flex-col gap-4 md:gap-5 min-w-0">
          {resume && (
            <Link to="/cocinar" className="card-tactile px-4 py-3.5 flex items-center gap-3 hover:border-orange-300 transition-colors">
              <span className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                <MessageCircle size={26} strokeWidth={2.3} className="text-orange-600" aria-hidden />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[17px] font-black text-ink">Continuar tu receta</span>
                <span className="block text-sm font-bold text-neutral-500">Sous guardó la conversación donde la dejaste.</span>
              </span>
              <ChevronRight size={24} strokeWidth={2.6} className="text-neutral-500 flex-shrink-0" aria-hidden />
            </Link>
          )}

          {level && (
            <section aria-labelledby="next-challenge">
              <div className="flex items-baseline justify-between mb-3">
                <h2 id="next-challenge" className="text-[22px] font-extrabold text-ink">Tu siguiente reto</h2>
                <Link to="/mapa" className="text-[15px] font-extrabold text-orange-600 hover:text-orange-800">Ver mapa</Link>
              </div>
              <div
                className="relative overflow-hidden rounded-3xl p-5 md:p-6 text-white flex flex-col gap-3.5"
                style={{ background: WORLD_TOKENS[level.world.id].main, boxShadow: `0 5px 0 ${WORLD_TOKENS[level.world.id].nodeDark}` }}
              >
                <span className="absolute -right-5 -top-4 opacity-15 pointer-events-none" aria-hidden>
                  <WorldIcon world={level.world.id} size={150} strokeWidth={1.6} />
                </span>
                <span className="text-[13px] font-black uppercase tracking-widest text-white/85">
                  {level.world.name} · Nivel {level.num}
                </span>
                <span className="font-display text-[32px] md:text-[40px] font-extrabold leading-none">{level.title}</span>
                <span className="flex gap-2 flex-wrap">
                  <span className="h-8 px-3 rounded-full bg-white/15 border-2 border-white/30 flex items-center text-[13px] font-extrabold">+{level.xp} XP</span>
                  <span className="h-8 px-3 rounded-full bg-white/15 border-2 border-white/30 flex items-center gap-1.5 text-[13px] font-extrabold">
                    <Clock size={14} strokeWidth={2.5} aria-hidden />
                    {level.kind === 'boss' ? 'Jefe final' : 'Reto con foto'}
                  </span>
                </span>
                <Link
                  to={level.path}
                  className="btn-3d bg-white md:self-start md:min-w-[200px]"
                  style={{ color: WORLD_TOKENS[level.world.id].main, ['--btn-shadow' as string]: 'rgb(0 0 0 / 0.22)' }}
                >
                  Jugar
                </Link>
              </div>
            </section>
          )}

        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <RankCard rank={rank} />
          <StreakCard streak={streak} week={week} today={today} />
        </div>
      </div>
    </section>
  );
};

function ModuleCard({ mod }: { mod: Module }) {
  const Icon = mod.icon;
  return (
    <Link
      to={mod.path}
      className="card-tactile p-4 min-h-[150px] flex flex-col gap-3 hover:border-neutral-300 active:translate-y-[2px] transition-transform"
    >
      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${mod.tone}`}>
        <Icon size={26} strokeWidth={2.3} aria-hidden />
      </span>
      <span className="flex flex-col gap-1">
        <span className="font-display text-lg font-extrabold text-ink leading-tight">
          <EditableText elementKey={`home_mod_${mod.id}_title`} defaultText={mod.title} as="span" />
        </span>
        <span className="text-sm font-bold text-neutral-500 leading-snug">
          <EditableText elementKey={`home_mod_${mod.id}_sub`} defaultText={mod.subtitle} as="span" />
        </span>
      </span>
    </Link>
  );
}
