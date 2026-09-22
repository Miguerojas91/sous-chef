/**
 * Encabezado de pantalla compartido: botón volver de 44px, título y una zona
 * de acciones a la derecha. Reemplaza los encabezados que cada módulo armaba
 * con tamaños y estilos distintos.
 */
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';

interface ScreenHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  actions?: ReactNode;
  tone?: 'light' | 'dark';
  className?: string;
}

export const ScreenHeader = ({
  title, subtitle, onBack, backLabel = 'Volver', actions, tone = 'light', className = '',
}: ScreenHeaderProps) => {
  const dark = tone === 'dark';
  return (
    <header
      className={`flex items-center gap-1 min-h-12 px-2 flex-shrink-0 border-b ${
        dark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white border-neutral-100 text-neutral-800'
      } ${onBack ? '' : 'pl-4'} ${className}`}
    >
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className={`w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${
            dark ? 'text-neutral-200 hover:bg-neutral-800' : 'text-neutral-600 hover:bg-neutral-100'
          }`}
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
      )}
      <div className="flex-1 min-w-0 py-1.5">
        <h1 className="text-base font-extrabold leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className={`text-xs leading-tight truncate ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-1 flex-shrink-0">{actions}</div>}
    </header>
  );
};
