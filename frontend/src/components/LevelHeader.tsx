/**
 * Piezas comunes de LevelPage y BossPage: el encabezado con volver al mapa y
 * la recompensa de XP, y la barra de progreso (pasos o vida del jefe).
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from './ui/ScreenHeader';

export const LevelHeader = ({ title, subtitle, xp }: { title: ReactNode; subtitle: ReactNode; xp: number }) => {
  const navigate = useNavigate();
  return (
    <ScreenHeader
      title={title}
      subtitle={subtitle}
      onBack={() => navigate('/mapa')}
      backLabel="Volver al mapa"
      actions={<span className="pr-3 text-sm font-semibold text-brand-700 whitespace-nowrap">+{xp} XP</span>}
    />
  );
};

interface LevelProgressBarProps {
  /** Nombre accesible de la barra. */
  label: string;
  caption: ReactNode;
  percent: number;
  /** `inverse`: sobre el color del mundo. `light`: sobre blanco, con `fillClassName`. */
  tone: 'inverse' | 'light';
  fillClassName?: string;
  /** Divide la barra en tramos iguales con separadores. */
  segments?: number;
}

export const LevelProgressBar = ({ label, caption, percent, tone, fillClassName = '', segments = 1 }: LevelProgressBarProps) => {
  const inverse = tone === 'inverse';
  const rounded = Math.round(percent);
  return (
    <>
      <div className={`flex justify-between gap-2 text-sm mb-1.5 ${inverse ? '' : 'text-neutral-900'}`}>
        <span className="font-semibold min-w-0">{caption}</span>
        <span className="font-bold flex-shrink-0">{rounded}%</span>
      </div>
      <div
        className={`relative rounded-full overflow-hidden ${inverse ? 'h-2 bg-white/30' : 'h-3 bg-neutral-200'}`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out motion-reduce:transition-none ${inverse ? 'bg-white' : fillClassName}`}
          style={{ width: `${percent}%` }}
        />
        {Array.from({ length: segments - 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px bg-white"
            style={{ left: `${((i + 1) / segments) * 100}%` }}
            aria-hidden
          />
        ))}
      </div>
    </>
  );
};
