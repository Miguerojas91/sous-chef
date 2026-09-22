/**
 * Selector de país, en dos formatos:
 * - `modal`: diálogo centrado. Se muestra una vez a usuarios con sesión que aún
 *   no eligieron país, y desde el perfil.
 * - `inline`: dentro del registro en AuthScreen.
 *
 * En modo modal, `onSkip` es la respuesta explícita "Prefiero no decirlo" (quien
 * llama decide si la guarda). `onDismiss` es cerrar sin responder (Escape,
 * tocar fuera): no debe guardar nada, para volver a preguntar otro día.
 */
import React from 'react';
import { Globe } from 'lucide-react';
import { COUNTRIES } from '../data/countries';
import { Dialog } from './ui/Dialog';

interface CountryPickerProps {
  mode?: 'modal' | 'inline';
  onSelect: (code: string) => void;
  onSkip?: () => void;
  onDismiss?: () => void;
}

const TITLE = '¿Desde qué país cocinas?';
const INTRO = 'Así Sous te propone recetas con ingredientes que consigues donde compras.';

const CountryList = ({ onSelect }: { onSelect: (code: string) => void }) => (
  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
    {COUNTRIES.map(c => (
      <li key={c.code}>
        <button
          type="button"
          onClick={() => onSelect(c.code)}
          className="w-full min-h-12 flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
        >
          <span className="text-2xl leading-none" aria-hidden>{c.flag}</span>
          <span className="text-sm font-semibold text-neutral-800 flex-1">{c.name}</span>
        </button>
      </li>
    ))}
  </ul>
);

export const CountryPicker: React.FC<CountryPickerProps> = ({ mode = 'inline', onSelect, onSkip, onDismiss }) => {
  if (mode === 'modal') {
    return (
      <Dialog
        title={TITLE}
        description={INTRO}
        icon={<Globe className="w-5 h-5" />}
        onClose={onDismiss ?? onSkip ?? (() => {})}
        footer={onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full min-h-11 rounded-xl text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            Prefiero no decirlo
          </button>
        )}
      >
        <CountryList onSelect={onSelect} />
      </Dialog>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-gradient-to-br from-orange-400 to-rose-500 p-2 rounded-xl" aria-hidden>
            <Globe className="text-white w-5 h-5" />
          </span>
          <h2 className="text-lg font-black text-neutral-900">{TITLE}</h2>
        </div>
        <p className="text-sm text-neutral-500 leading-snug">{INTRO}</p>
      </div>
      <div className="max-h-[420px] overflow-y-auto">
        <CountryList onSelect={onSelect} />
      </div>
    </div>
  );
};
