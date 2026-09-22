/**
 * Lista de mercado de Sabores del Mundo y Mealprep. El estado vive en
 * `useMarketList`; aquí solo se pinta y se despachan acciones. Cada fila recibe
 * solo su estado y sus callbacks.
 *
 * Las píldoras ("No lo consigo", sustitutos, "deshacer") se ven pequeñas pero
 * cada botón tiene 44px de área táctil.
 */
import { Check, ChefHat, HelpCircle, RefreshCw, XCircle } from 'lucide-react';
import { getSuggestedSubstitutes } from '../data/substitutes';
import { CATEGORY_ORDER } from '../data/groceryCategories';
import type { MarketItem, MarketItemStatus, MarketListController, MarketSummary } from '../hooks/useMarketList';

/** `flavors`: una columna. `milprep`: dos columnas en escritorio. */
export type MarketListVariant = 'flavors' | 'milprep';

interface MarketItemRowProps {
  item: MarketItem;
  status: MarketItemStatus;
  onToggleChecked: () => void;
  onToggleUnavailable: () => void;
  onSwap: (substitute: string) => void;
  onUndoSwap: () => void;
  /** Cierra el panel y le pregunta a Sous por sustitutos. */
  onAskSubstitutes: () => void;
}

export const MarketItemRow = ({
  item, status, onToggleChecked, onToggleUnavailable, onSwap, onUndoSwap, onAskSubstitutes,
}: MarketItemRowProps) => {
  const { mark, substitute } = status;
  const isChecked = mark === 'checked';
  const isUnavailable = mark === 'unavailable';
  const isSwapped = mark === 'swapped';
  const isExpanded = status.expanded;
  const panelId = `sustitutos-${item.id.replace(/[^a-z0-9]+/gi, '-')}`;
  const suggestions = isExpanded ? getSuggestedSubstitutes(item.name) : [];

  const circle = (
    <span
      aria-hidden
      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
        isSwapped ? 'border-blue-300 bg-blue-50' :
        isChecked ? 'bg-green-500 border-green-500' :
        isUnavailable ? 'border-red-300 bg-red-50' :
        'border-neutral-300 group-hover:border-green-400'
      }`}
    >
      {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
    </span>
  );

  const name = (
    <span className={`block text-sm [overflow-wrap:anywhere] ${
      isChecked || isSwapped ? 'line-through text-neutral-400' :
      isUnavailable ? 'line-through text-red-400' : 'text-neutral-700'
    }`}>
      {item.label}
    </span>
  );

  return (
    <li className="rounded-xl overflow-hidden">
      <div className={`flex items-center gap-2 px-3 py-0.5 border transition-all ${
        isSwapped ? 'bg-blue-50 border-blue-100' :
        isChecked ? 'bg-green-50 border-green-100' :
        isUnavailable ? 'bg-red-50 border-red-200' :
        'border-transparent hover:bg-neutral-50'
      }`}>
        {isSwapped ? (
          // Con sustituto la casilla no aplica: la fila muestra el cambio y "deshacer".
          <div className="flex-1 min-w-0 min-h-11 flex items-center gap-3 py-1.5">
            {circle}
            <span className="min-w-0">
              {name}
              <span className="flex flex-wrap items-center gap-x-1.5 mt-0.5">
                <RefreshCw size={10} className="text-blue-500 flex-shrink-0" aria-hidden />
                <span className="sr-only">Sustituto:</span>
                <span className="text-xs font-semibold text-blue-600 [overflow-wrap:anywhere]">{substitute}</span>
                <button
                  type="button"
                  onClick={onUndoSwap}
                  aria-label={`Deshacer el cambio de ${item.name}`}
                  className="inline-flex items-center min-h-11 -my-3.5 px-1 text-xs text-blue-400 hover:text-blue-700 underline underline-offset-2"
                >
                  deshacer
                </button>
              </span>
            </span>
          </div>
        ) : (
          <button
            type="button"
            role="checkbox"
            aria-checked={isChecked}
            disabled={isUnavailable}
            onClick={onToggleChecked}
            className="group flex-1 min-w-0 min-h-11 flex items-center gap-3 py-1 text-left rounded-lg disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-orange-400 outline-none"
          >
            {circle}
            <span className="min-w-0">{name}</span>
          </button>
        )}

        {isSwapped ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-600 flex-shrink-0">
            <RefreshCw size={10} aria-hidden />Cambiado
          </span>
        ) : (
          <button
            type="button"
            onClick={onToggleUnavailable}
            aria-pressed={isUnavailable}
            aria-expanded={isUnavailable ? isExpanded : undefined}
            aria-controls={isUnavailable && isExpanded ? panelId : undefined}
            className="group min-h-11 flex items-center flex-shrink-0 outline-none"
          >
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all group-focus-visible:ring-2 group-focus-visible:ring-orange-400 ${
              isUnavailable ? 'bg-red-400 text-white' : 'bg-neutral-100 text-neutral-400 group-hover:bg-red-100 group-hover:text-red-500'
            }`}>
              <XCircle size={11} aria-hidden />
              {isUnavailable ? 'No disponible' : 'No lo consigo'}
            </span>
          </button>
        )}
      </div>

      {isExpanded && (
        <div id={panelId} className="bg-red-50 border border-red-200 border-t-0 rounded-b-xl px-4 py-3">
          <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-1">Sustitutos sugeridos</p>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-x-2 mb-1">
              {suggestions.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => onSwap(sub)}
                  className="group min-h-11 flex items-center outline-none"
                >
                  <span className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-xs font-semibold text-neutral-700 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500 group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-orange-400 transition-all shadow-sm">
                    {sub}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-red-400 italic my-2">No hay sustitutos sugeridos para este ingrediente.</p>
          )}
          <button
            type="button"
            onClick={onAskSubstitutes}
            className="min-h-11 flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors"
          >
            <ChefHat size={12} aria-hidden />
            Preguntar a Sous por más opciones <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </li>
  );
};

interface MarketListProps {
  items: MarketItem[];
  market: MarketListController;
  /** Recibe la pregunta ya armada para Sous. */
  onAskChef: (question: string) => void;
  variant?: MarketListVariant;
}

/** Avisos sobre la lista: cuántos se reemplazaron y cuáles siguen sin sustituto. */
const MarketSummaryBanner = ({ summary, onAskChef, variant }: {
  summary: MarketSummary; onAskChef: (question: string) => void; variant: MarketListVariant;
}) => {
  const pending = summary.missing;
  const swappedCount = summary.swapped.length;
  if (pending.length === 0 && swappedCount === 0) return null;
  const milprep = variant === 'milprep';

  return (
    <div className="space-y-2">
      {swappedCount > 0 && (
        <p role="status" className={`bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm font-semibold text-blue-700 ${milprep ? 'rounded-2xl px-4 py-3' : 'rounded-xl px-4 py-2.5'}`}>
          <RefreshCw size={milprep ? 15 : 14} className="text-blue-500 flex-shrink-0" aria-hidden />
          <span>
            {swappedCount === 1 ? '1 ingrediente cambiado por un sustituto.' : `${swappedCount} ingredientes cambiados por sustitutos.`}
            <span aria-hidden> ✓</span>
          </span>
        </p>
      )}
      {pending.length > 0 && (
        <div role="status" className={`bg-red-50 border border-red-200 flex items-center justify-between gap-3 ${milprep ? 'rounded-2xl p-4' : 'rounded-xl p-3'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <XCircle size={milprep ? 18 : 16} className="text-red-500 flex-shrink-0" aria-hidden />
            <div className="min-w-0">
              <p className="font-bold text-red-700 text-sm">
                {pending.length === 1 ? '1 ingrediente sin sustituto' : `${pending.length} ingredientes sin sustituto`}
              </p>
              <p className="text-xs text-red-500">Sous puede sugerirte más opciones.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAskChef(
              `No consigo estos ingredientes: ${pending.map(i => i.name).join(', ')}. ¿Qué puedo usar como sustituto?`,
            )}
            className={`min-h-11 flex items-center gap-1.5 px-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex-shrink-0 ${milprep ? 'shadow-sm' : ''}`}
          >
            <HelpCircle size={milprep ? 13 : 12} aria-hidden />
            Pedir sustitutos
          </button>
        </div>
      )}
    </div>
  );
};

/** Avisos y lista agrupada por sección de la tienda. */
export const MarketList = ({ items, market, onAskChef, variant = 'flavors' }: MarketListProps) => {
  const milprep = variant === 'milprep';
  return (
    <div className={milprep ? 'space-y-6' : 'space-y-4'}>
      <MarketSummaryBanner summary={market.summary} onAskChef={onAskChef} variant={variant} />
      <div className={milprep ? 'grid grid-cols-1 md:grid-cols-2 gap-8' : 'space-y-5'}>
        {CATEGORY_ORDER.map(category => {
          const inCategory = items.filter(i => i.category === category);
          if (inCategory.length === 0) return null;
          return (
            <section key={category}>
              <h2 className={milprep
                ? 'font-bold text-gray-700 bg-orange-50 px-3 py-1 rounded-md mb-3 inline-block shadow-sm text-sm uppercase tracking-wider'
                : 'text-xs font-bold uppercase tracking-wider text-neutral-500 bg-orange-50 px-3 py-1 rounded-md inline-block mb-2'}
              >
                {category}
              </h2>
              <ul className={milprep ? 'space-y-2' : 'space-y-1.5'}>
                {inCategory.map(item => (
                  <MarketItemRow
                    key={item.id}
                    item={item}
                    status={market.statusOf(item.id)}
                    onToggleChecked={() => market.toggleChecked(item.id)}
                    onToggleUnavailable={() => market.toggleUnavailable(item.id)}
                    onSwap={substitute => market.swap(item.id, substitute)}
                    onUndoSwap={() => market.undoSwap(item.id)}
                    onAskSubstitutes={() => {
                      market.collapse();
                      onAskChef(`No consigo "${item.name}". ¿Qué puedo usar como sustituto?`);
                    }}
                  />
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
};
