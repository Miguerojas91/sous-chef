/**
 * Piezas comunes de LevelPage y BossPage: el encabezado en degradado del mundo
 * (volver al mapa, título y recompensa de XP) y su barra de progreso (pasos o
 * vida del jefe), pegada al borde inferior.
 */

import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type XpTone = 'level' | 'boss' | 'final';

const XP_BOX: Record<XpTone, string> = {
  level: 'bg-white/20',
  boss: 'bg-white/20',
  final: 'bg-white/30',
};

const XP_VALUE: Record<XpTone, string> = {
  level: 'text-lg text-yellow-300',
  boss: 'text-xl text-yellow-300',
  final: 'text-xl text-white',
};

interface LevelHeaderProps {
  /** Clases completas del degradado, p. ej. `from-emerald-500 to-teal-600`. */
  gradient: string;
  /** Adornos detrás del contenido (círculos, emoji de fondo). */
  decoration: ReactNode;
  /** Fila de etiquetas sobre el título. */
  eyebrow: ReactNode;
  title: ReactNode;
  xp: number;
  xpTone?: XpTone;
  /** Barra de progreso al pie del encabezado. */
  children: ReactNode;
}

export const LevelHeader = ({ gradient, decoration, eyebrow, title, xp, xpTone = 'level', children }: LevelHeaderProps) => {
  const navigate = useNavigate();
  return (
    <header className={`relative bg-gradient-to-br ${gradient} text-white overflow-hidden`}>
      <div aria-hidden>{decoration}</div>

      <div className="relative px-5 pt-4 pb-0">
        <div className="flex items-start gap-3 max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/mapa')}
            aria-label="Volver al mapa"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft size={18} aria-hidden />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">{eyebrow}</div>
            <h1 className="text-2xl font-black mt-1 leading-tight [overflow-wrap:anywhere]">{title}</h1>
          </div>

          <div className={`flex-shrink-0 rounded-2xl px-3 py-2 text-center ${XP_BOX[xpTone]}`}>
            <p className="text-[10px] text-white/60 font-semibold">Recompensa</p>
            <p className={`font-black leading-none ${XP_VALUE[xpTone]}`}>+{xp}</p>
            <p className="text-[10px] text-white/60">XP</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-4">{children}</div>
      </div>
    </header>
  );
};

interface LevelProgressBarProps {
  /** Nombre accesible de la barra. */
  label: string;
  caption: ReactNode;
  /** Texto de la derecha; por defecto el porcentaje. */
  valueText?: ReactNode;
  percent: number;
  /** Clases del relleno (degradado). */
  fillClassName: string;
  /** Alto de la barra, `h-2.5` o `h-3`. */
  heightClassName: string;
  /** Divide la barra en tramos iguales con separadores (vida del jefe). */
  segments?: number;
}

export const LevelProgressBar = ({
  label, caption, valueText, percent, fillClassName, heightClassName, segments = 0,
}: LevelProgressBarProps) => {
  const rounded = Math.round(percent);
  return (
    <>
      <div className="flex justify-between gap-2 text-[11px] text-white/70 mb-1.5 px-0.5">
        <span className="font-semibold min-w-0 flex items-center gap-1.5">{caption}</span>
        <span className="font-bold flex-shrink-0">{valueText ?? `${rounded}%`}</span>
      </div>
      <div
        className={`relative ${heightClassName} bg-white/20 overflow-hidden`}
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
      >
        <div
          className={`h-full transition-all duration-700 ease-out motion-reduce:transition-none ${fillClassName}`}
          style={{ width: `${percent}%` }}
        />
        {Array.from({ length: segments }, (_, i) => (
          <div
            key={i}
            className="absolute top-0 h-full w-px bg-white/30"
            style={{ left: `${((i + 1) / segments) * 100}%` }}
            aria-hidden
          />
        ))}
      </div>
    </>
  );
};
