/**
 * Piezas de progreso del rediseño: tarjeta de rango y racha semanal. Las usan
 * Inicio y Perfil con los datos de `useGameState`.
 */

import { Check, Flame, Shield } from 'lucide-react';
import type { RankInfo } from '../../utils/rank';
import type { WeekDay } from '../../utils/streak';

export function XpBar({ percent, className = 'bg-amber-500', label }: { percent: number; className?: string; label: string }) {
  return (
    <span
      className="bar-track block"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(percent)}
    >
      <span className={`bar-fill ${className}`} style={{ width: `${Math.max(percent, percent > 0 ? 4 : 0)}%` }} />
    </span>
  );
}

export function RankCard({ rank }: { rank: RankInfo }) {
  return (
    <section aria-label="Tu rango" className="card-tactile p-4 flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="w-14 h-14 rounded-[18px] bg-amber-100 border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
          <Shield size={30} strokeWidth={2.3} className="text-amber-600" aria-hidden />
        </span>
        <span className="flex-1 min-w-0 flex flex-col">
          <span className="text-xs font-extrabold uppercase tracking-wider text-neutral-500">Tu rango</span>
          <span className="font-display text-2xl font-extrabold text-ink leading-tight">{rank.rank}</span>
        </span>
        <span className="text-sm font-extrabold text-neutral-500">{rank.index + 1} de 5</span>
      </div>
      <XpBar percent={rank.progress} label="Progreso al siguiente rango" />
      <div className="flex justify-between gap-2 text-sm font-extrabold">
        <span>{rank.xp} / {rank.nextRankXp} XP</span>
        {rank.next && <span className="text-neutral-500 text-right">Sigue: {rank.next}</span>}
      </div>
    </section>
  );
}

export function StreakWeek({ week }: { week: WeekDay[] }) {
  return (
    <ol className="flex justify-between" aria-label="Días cocinados esta semana">
      {week.map((d, i) => (
        <li key={i} className={`flex flex-col items-center gap-1 text-xs font-extrabold ${d.isFuture ? 'text-neutral-500' : 'text-ink'}`}>
          {d.active ? (
            <span className="w-9 h-9 rounded-full bg-flame flex items-center justify-center shadow-[inset_0_-3px_0_rgb(0_0_0/0.15)]">
              <Check size={18} strokeWidth={3} className="text-white" aria-hidden />
            </span>
          ) : d.isToday ? (
            <span className="w-9 h-9 rounded-full border-[3px] border-dashed border-flame flex items-center justify-center">
              <Flame size={18} strokeWidth={2.4} className="text-flame" aria-hidden />
            </span>
          ) : (
            <span className="w-9 h-9 rounded-full bg-neutral-100" />
          )}
          <span aria-hidden>{d.label}</span>
          <span className="sr-only">{d.active ? 'cocinaste' : d.isToday ? 'hoy, pendiente' : 'sin actividad'}</span>
        </li>
      ))}
    </ol>
  );
}

export function StreakCard({ streak, week, today }: { streak: number; week: WeekDay[]; today: boolean }) {
  const title = streak === 0 ? 'Empieza tu racha' : `${streak} ${streak === 1 ? 'día' : 'días'} de racha`;
  const sub = today ? 'Ya cocinaste hoy.' : streak > 0 ? 'Cocina hoy para mantenerla.' : 'Completa un nivel, una clase o cocina con Sous.';
  return (
    <section aria-label="Racha" className="card-tactile p-4 flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span className="w-14 h-14 rounded-[18px] bg-flame-soft flex items-center justify-center flex-shrink-0">
          <Flame size={32} strokeWidth={2.4} className="text-flame" aria-hidden />
        </span>
        <span className="flex flex-col">
          <span className="font-display text-[22px] font-extrabold text-ink leading-tight">{title}</span>
          <span className="text-sm font-bold text-neutral-500">{sub}</span>
        </span>
      </div>
      <StreakWeek week={week} />
    </section>
  );
}
