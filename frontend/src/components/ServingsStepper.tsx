/** Selector de número de personas de Sabores del Mundo y Mealprep. */
import { Minus, Plus } from 'lucide-react';

export const MIN_SERVINGS = 1;
export const MAX_SERVINGS = 20;

interface ServingsStepperProps {
  value: number;
  onChange: (value: number) => void;
}

const buttonClass =
  'w-11 h-11 rounded-full border border-neutral-300 bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-500 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-700';

/** En los límites el botón se deshabilita en vez de avisar. */
export const ServingsStepper = ({ value, onChange }: ServingsStepperProps) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    <button
      type="button"
      onClick={() => onChange(Math.max(MIN_SERVINGS, value - 1))}
      disabled={value <= MIN_SERVINGS}
      aria-label="Una persona menos"
      className={buttonClass}
    >
      <Minus size={16} aria-hidden />
    </button>
    <span aria-live="polite" className="w-8 text-center text-lg font-extrabold text-neutral-900 tabular-nums">
      <span className="sr-only">Personas: </span>{value}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(MAX_SERVINGS, value + 1))}
      disabled={value >= MAX_SERVINGS}
      aria-label="Una persona más"
      className={buttonClass}
    >
      <Plus size={16} aria-hidden />
    </button>
  </div>
);
