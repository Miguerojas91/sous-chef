/**
 * CountryPicker.tsx
 *
 * Modal/inline picker para seleccionar el país del usuario.
 *
 * Dos modos:
 *  - `mode="modal"`  — overlay full-screen one-shot. Se muestra UNA vez para
 *    usuarios que ya tienen sesión pero todavía no eligieron país (legacy).
 *  - `mode="inline"` — versión embebida dentro de un formulario (p.ej.
 *    paso de registro en AuthScreen).
 *
 * Al elegir, llama `onSelect(code)` con el código ISO. Si `mode="modal"`,
 * también permite "Skip" (guarda 'OTHER' para no preguntar de nuevo).
 */
import React from 'react';
import { COUNTRIES } from '../data/countries';
import { Globe } from 'lucide-react';

interface CountryPickerProps {
  mode?: 'modal' | 'inline';
  onSelect: (code: string) => void;
  onSkip?: () => void;
}

export const CountryPicker: React.FC<CountryPickerProps> = ({
  mode = 'inline',
  onSelect,
  onSkip,
}) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    mode === 'modal' ? (
      <div className="fixed inset-0 z-[300] bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    ) : (
      <div>{children}</div>
    );

  return (
    <Wrapper>
      <div className={`${mode === 'modal' ? 'p-6 border-b border-neutral-100' : 'mb-4'}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-orange-400 to-rose-500 p-2 rounded-xl">
            <Globe className="text-white w-5 h-5" />
          </div>
          <h2 className="text-lg font-black text-neutral-900">¿Desde qué país cocinas?</h2>
        </div>
        <p className="text-sm text-neutral-500 leading-snug">
          Así Sous te sugiere recetas con ingredientes que encuentras en tu tienda — sin
          recetas con ingredientes que no consigues.
        </p>
      </div>

      <div className={`${mode === 'modal' ? 'overflow-y-auto p-3 flex-1' : 'max-h-[420px] overflow-y-auto'} grid grid-cols-1 sm:grid-cols-2 gap-2`}>
        {COUNTRIES.map(c => (
          <button
            key={c.code}
            type="button"
            onClick={() => onSelect(c.code)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-200 hover:border-orange-400 hover:bg-orange-50 transition-colors text-left"
          >
            <span className="text-2xl leading-none" aria-hidden>{c.flag}</span>
            <span className="text-sm font-semibold text-neutral-800 flex-1">{c.name}</span>
          </button>
        ))}
      </div>

      {mode === 'modal' && onSkip && (
        <div className="p-4 border-t border-neutral-100 bg-neutral-50">
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-xs text-neutral-500 hover:text-neutral-700 transition-colors py-1"
          >
            Prefiero no decir — usa recetas neutras
          </button>
        </div>
      )}
    </Wrapper>
  );
};
