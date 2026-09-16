/**
 * Filas de la lista de mercado de Sabores del Mundo y Mealprep. El estado vive
 * en `useMarketList`; aquí solo se pinta y se despachan acciones.
 */
import { Check, ChefHat, RefreshCw, XCircle } from 'lucide-react';
import { getSuggestedSubstitutes } from '../data/substitutes';
import { CATEGORY_ORDER } from '../data/groceryCategories';
import type { MarketItem, MarketList as MarketListState } from '../hooks/useMarketList';

interface MarketItemRowProps {
  item: MarketItem;
  market: MarketListState;
  /** Recibe la pregunta ya armada para Sous. */
  onAskChef: (question: string) => void;
}

export const MarketItemRow = ({ item, market, onAskChef }: MarketItemRowProps) => {
  const { checked, unavailable, swapped, expanded } = market.state;
  const isChecked = checked.includes(item.id);
  const isUnavailable = unavailable.includes(item.id);
  const substitute = swapped[item.id];
  const isSwapped = substitute !== undefined;
  const isExpanded = expanded === item.id;
  const panelId = `sustitutos-${item.id.replace(/[^a-z0-9]+/gi, '-')}`;
  const suggestions = isExpanded ? getSuggestedSubstitutes(item.name) : [];

  return (
    <li className={isUnavailable ? 'bg-red-50' : ''}>
      <div className="flex items-center gap-1 px-2 py-1">
        <button
          type="button"
          role="checkbox"
          aria-checked={isChecked}
          disabled={isUnavailable || isSwapped}
          onClick={() => market.toggleChecked(item.id)}
          className="flex-1 min-w-0 min-h-11 flex items-center gap-3 px-2 py-1 rounded-control text-left disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-700"
        >
          <span
            aria-hidden
            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
              isChecked ? 'bg-emerald-700 border-emerald-700' :
              isUnavailable ? 'border-red-300 bg-white' :
              isSwapped ? 'border-neutral-300 bg-neutral-100' :
              'border-neutral-400 bg-white'
            }`}
          >
            {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
          </span>
          <span className="min-w-0">
            <span className={`block text-sm [overflow-wrap:anywhere] ${
              isChecked || isSwapped ? 'line-through text-neutral-600' :
              isUnavailable ? 'line-through text-red-800' : 'text-neutral-900'
            }`}>
              {item.label}
            </span>
            {isSwapped && (
              <span className="flex items-center gap-1.5 mt-0.5 text-sm font-semibold text-neutral-900 [overflow-wrap:anywhere]">
                <RefreshCw size={14} className="text-brand-700 flex-shrink-0" aria-hidden />
                <span className="sr-only">Sustituto:</span>
                {substitute}
              </span>
            )}
          </span>
        </button>

        {isSwapped ? (
          <button
            type="button"
            onClick={() => market.undoSwap(item.id)}
            aria-label={`Deshacer el cambio de ${item.name}`}
            className="min-h-11 px-3 rounded-control text-sm font-semibold text-brand-700 hover:bg-brand-50 flex-shrink-0 transition-colors"
          >
            Deshacer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => market.toggleUnavailable(item.id)}
            aria-pressed={isUnavailable}
            aria-expanded={isUnavailable ? isExpanded : undefined}
            aria-controls={isUnavailable && isExpanded ? panelId : undefined}
            className={`min-h-11 px-3 flex items-center gap-1.5 rounded-control text-sm font-semibold flex-shrink-0 transition-colors ${
              isUnavailable ? 'bg-red-700 text-white hover:bg-red-800' : 'text-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <XCircle size={16} aria-hidden />
            {isUnavailable ? 'No disponible' : 'No lo consigo'}
          </button>
        )}
      </div>

      {isExpanded && (
        <div id={panelId} className="border-t border-red-200 px-4 py-3">
          <p className="text-sm font-semibold text-red-800 mb-2">Sustitutos sugeridos</p>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggestions.map(sub => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => market.swap(item.id, sub)}
                  className="min-h-11 px-4 bg-white border border-neutral-300 rounded-full text-sm font-semibold text-neutral-800 hover:bg-neutral-50 transition-colors"
                >
                  {sub}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-800 mb-2">No hay sustitutos sugeridos para este ingrediente.</p>
          )}
          <button
            type="button"
            onClick={() => {
              market.collapse();
              onAskChef(`No consigo "${item.name}". ¿Qué puedo usar como sustituto?`);
            }}
            className="min-h-11 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
          >
            <ChefHat size={16} aria-hidden />
            Preguntar a Sous por más opciones
          </button>
        </div>
      )}
    </li>
  );
};

/** Avisos sobre la lista: cuántos se reemplazaron y cuáles siguen sin sustituto. */
export const MarketSummaryBanner = ({ market, onAskChef }: Omit<MarketItemRowProps, 'item'>) => {
  const { pending, swappedCount } = market;
  if (pending.length === 0 && swappedCount === 0) return null;

  return (
    <div className="space-y-2">
      {swappedCount > 0 && (
        <p role="status" className="flex items-center gap-2 bg-white border border-neutral-200 rounded-card px-4 py-3 text-sm font-medium text-neutral-800">
          <RefreshCw size={16} className="text-brand-700 flex-shrink-0" aria-hidden />
          {swappedCount === 1 ? '1 ingrediente cambiado por un sustituto.' : `${swappedCount} ingredientes cambiados por sustitutos.`}
        </p>
      )}
      {pending.length > 0 && (
        <div role="status" className="bg-amber-50 border border-amber-200 rounded-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              {pending.length === 1 ? '1 ingrediente sin sustituto' : `${pending.length} ingredientes sin sustituto`}
            </p>
            <p className="text-sm text-amber-800">Sous puede sugerirte más opciones.</p>
          </div>
          <button
            type="button"
            onClick={() => onAskChef(
              `No consigo estos ingredientes: ${pending.map(i => i.name).join(', ')}. ¿Qué puedo usar como sustituto?`,
            )}
            className="min-h-11 px-4 flex items-center gap-1.5 rounded-control bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold flex-shrink-0 transition-colors"
          >
            <ChefHat size={16} aria-hidden />
            Pedir sustitutos
          </button>
        </div>
      )}
    </div>
  );
};

interface MarketListProps extends Omit<MarketItemRowProps, 'item'> {
  items: MarketItem[];
}

/** Lista agrupada por sección de la tienda. */
export const MarketList = ({ items, market, onAskChef }: MarketListProps) => (
  <div className="space-y-5">
    {CATEGORY_ORDER.map(category => {
      const inCategory = items.filter(i => i.category === category);
      if (inCategory.length === 0) return null;
      return (
        <section key={category}>
          <h2 className="text-sm font-semibold text-neutral-600 mb-2">{category}</h2>
          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            {inCategory.map(item => (
              <MarketItemRow key={item.id} item={item} market={market} onAskChef={onAskChef} />
            ))}
          </ul>
        </section>
      );
    })}
  </div>
);
