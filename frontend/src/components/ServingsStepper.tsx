/**
 * Selector de número de personas de Sabores del Mundo y Mealprep.
 *
 * Variantes de aspecto:
 * - `round`: botones redondos blancos (resumen de la receta en Sabores).
 * - `compact`: píldora naranja con ícono de personas (mercado de Sabores).
 * - `square`: botones cuadrados con − y + (Mealprep).
 *
 * Los botones se ven pequeños pero el área táctil es de 44px; el margen
 * negativo evita que el control crezca.
 */
import type { ReactNode } from 'react';
import { Minus, Plus, Users } from 'lucide-react';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

type Variant = 'round' | 'compact' | 'square';

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
  variant?: Variant;
}

const HIT: Record<Variant, string> = {
  round: 'w-11 h-11 -m-1.5',
  compact: 'w-11 h-11 -m-2.5',
  square: 'w-11 h-11 -m-1.5',
};

const FACE: Record<Variant, string> = {
  round: 'w-8 h-8 rounded-full bg-white border border-neutral-200 group-hover:border-orange-400 group-hover:text-orange-500 group-active:scale-90',
  compact: 'w-6 h-6 rounded-full bg-white border border-neutral-200 group-hover:border-orange-400 group-active:scale-90',
  square: 'w-8 h-8 rounded-md bg-white shadow-sm border border-gray-200 text-gray-600 group-hover:text-orange-600 group-hover:border-orange-300',
};

const CONTAINER: Record<Variant, string> = {
  round: 'gap-3',
  compact: 'gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5',
  square: 'gap-3',
};

const StepButton = ({ variant, label, disabled, onClick, children }: {
  variant: Variant; label: string; disabled: boolean; onClick: () => void; children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    className={`group relative flex-shrink-0 flex items-center justify-center outline-none disabled:cursor-not-allowed ${HIT[variant]}`}
  >
    <span
      className={`flex items-center justify-center transition-all group-disabled:opacity-40 group-focus-visible:ring-2 group-focus-visible:ring-orange-400 ${FACE[variant]}`}
    >
      {children}
    </span>
  </button>
);

/** En los límites el botón se deshabilita en vez de avisar. */
export const ServingsStepper = ({ value, onChange, variant = 'round' }: ServingsStepperProps) => {
  const iconSize = variant === 'compact' ? 11 : 14;
  const minus = variant === 'square'
    ? <span aria-hidden>-</span>
    : <Minus size={iconSize} aria-hidden />;
  const plus = variant === 'square'
    ? <span aria-hidden>+</span>
    : <Plus size={iconSize} aria-hidden />;

  return (
    <div className={`flex items-center flex-shrink-0 ${CONTAINER[variant]}`}>
      <StepButton
        variant={variant}
        label="Una persona menos"
        disabled={value <= MIN_SERVINGS}
        onClick={() => onChange(Math.max(MIN_SERVINGS, value - 1))}
      >
        {minus}
      </StepButton>
      {variant === 'compact' ? (
        <span aria-live="polite" className="flex items-center gap-1 text-sm font-bold text-orange-700 tabular-nums">
          <Users size={12} aria-hidden />
          <span className="sr-only">Personas: </span>{value}
        </span>
      ) : (
        <span
          aria-live="polite"
          className={`w-6 text-center tabular-nums ${variant === 'round' ? 'text-xl font-black text-neutral-800' : 'font-bold'}`}
        >
          <span className="sr-only">Personas: </span>{value}
        </span>
      )}
      <StepButton
        variant={variant}
        label="Una persona más"
        disabled={value >= MAX_SERVINGS}
        onClick={() => onChange(Math.min(MAX_SERVINGS, value + 1))}
      >
        {plus}
      </StepButton>
    </div>
  );
};
