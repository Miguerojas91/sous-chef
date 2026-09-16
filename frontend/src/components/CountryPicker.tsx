/**
 * Selector de país, en dos formatos:
 * - `modal`: hoja/diálogo. Se muestra una vez a usuarios con sesión que aún no
 *   eligieron país, y desde el perfil.
 * - `inline`: dentro del registro en AuthScreen.
 *
 * `onSkip` en modo modal guarda 'OTHER' (lo decide quien llama) para no volver
 * a preguntar.
 */
import React from 'react';
import { COUNTRIES } from '../data/countries';
import { Dialog } from './ui/Dialog';

interface CountryPickerProps {
  mode?: 'modal' | 'inline';
  onSelect: (code: string) => void;
  onSkip?: () => void;
}

const INTRO = 'Así Sous te propone recetas con ingredientes que consigues donde compras.';

const CountryList = ({ onSelect }: { onSelect: (code: string) => void }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {COUNTRIES.map(c => (
      <li key={c.code}>
        <button
          type="button"
          onClick={() => onSelect(c.code)}
          className="w-full min-h-12 flex items-center gap-3 px-4 rounded-control border border-neutral-300 hover:border-brand-700 hover:bg-brand-50 transition-colors text-left"
        >
          <span className="text-2xl leading-none" aria-hidden>{c.flag}</span>
          <span className="text-sm font-semibold text-neutral-900 flex-1">{c.name}</span>
        </button>
      </li>
    ))}
  </ul>
);

export const CountryPicker: React.FC<CountryPickerProps> = ({ mode = 'inline', onSelect, onSkip }) => {
  if (mode === 'modal') {
    return (
      <Dialog
        title="¿Desde qué país cocinas?"
        description={INTRO}
        onClose={onSkip ?? (() => {})}
        footer={onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full min-h-11 rounded-control text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            Prefiero no decirlo
          </button>
        )}
      >
        <div className="mt-4">
          <CountryList onSelect={onSelect} />
        </div>
      </Dialog>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-extrabold text-neutral-900">¿Desde qué país cocinas?</h2>
      <p className="text-sm text-neutral-600 leading-snug mt-1 mb-4">{INTRO}</p>
      <CountryList onSelect={onSelect} />
    </div>
  );
};
