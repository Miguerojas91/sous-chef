/**
 * Estado de la lista de mercado compartida por Sabores del Mundo y Mealprep:
 * qué ya tiene el usuario, qué no consigue y con qué lo reemplazó.
 *
 * Las marcas van por `id`, no por el texto visible: en Mealprep el texto
 * incluye la cantidad y cambia con las porciones.
 */
import { useCallback, useMemo, useReducer } from 'react';
import type { GroceryCategory } from '../data/groceryCategories';

export interface MarketItem {
  /** Estable ante cambios de porciones. */
  id: string;
  /** Nombre del ingrediente, sin cantidad. Se usa para sustitutos y prompts. */
  name: string;
  /** Texto de la fila, p. ej. "300 g de Pollo". */
  label: string;
  /** Cantidad para los prompts, p. ej. "300 g". */
  quantity?: string;
  category: GroceryCategory;
}

interface MarketState {
  checked: string[];
  unavailable: string[];
  /** id → sustituto elegido. */
  swapped: Record<string, string>;
  /** Fila con el panel de sustitutos abierto. */
  expanded: string | null;
}

type MarketAction =
  | { type: 'toggleChecked'; id: string }
  | { type: 'toggleUnavailable'; id: string }
  | { type: 'swap'; id: string; substitute: string }
  | { type: 'undoSwap'; id: string }
  | { type: 'collapse' }
  | { type: 'setChecked'; ids: string[] }
  | { type: 'reset' };

const INITIAL: MarketState = { checked: [], unavailable: [], swapped: {}, expanded: null };

const without = (list: string[], id: string) => list.filter(x => x !== id);

function reducer(state: MarketState, action: MarketAction): MarketState {
  switch (action.type) {
    case 'toggleChecked': {
      const { id } = action;
      if (state.unavailable.includes(id) || id in state.swapped) return state;
      return {
        ...state,
        checked: state.checked.includes(id) ? without(state.checked, id) : [...state.checked, id],
      };
    }
    case 'toggleUnavailable': {
      const { id } = action;
      if (state.unavailable.includes(id)) {
        return { ...state, unavailable: without(state.unavailable, id), expanded: null };
      }
      return {
        ...state,
        checked: without(state.checked, id),
        unavailable: [...state.unavailable, id],
        expanded: id,
      };
    }
    case 'swap':
      return {
        ...state,
        unavailable: without(state.unavailable, action.id),
        swapped: { ...state.swapped, [action.id]: action.substitute },
        expanded: null,
      };
    case 'undoSwap': {
      const swapped = { ...state.swapped };
      delete swapped[action.id];
      return { ...state, swapped };
    }
    case 'collapse':
      return { ...state, expanded: null };
    case 'setChecked':
      return { ...state, checked: action.ids };
    case 'reset':
      return INITIAL;
  }
}

export interface MarketSummary {
  obtained: MarketItem[];
  /** No conseguidos y sin sustituto. */
  missing: MarketItem[];
  swapped: { item: MarketItem; substitute: string }[];
  notMarked: MarketItem[];
}

export function useMarketList(items: MarketItem[]) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Las marcas de ingredientes que ya no están en la lista (receta quitada) se
  // conservan por si vuelve, pero no cuentan.
  const summary = useMemo<MarketSummary>(() => {
    const result: MarketSummary = { obtained: [], missing: [], swapped: [], notMarked: [] };
    for (const item of items) {
      const substitute = state.swapped[item.id];
      if (substitute !== undefined) result.swapped.push({ item, substitute });
      else if (state.unavailable.includes(item.id)) result.missing.push(item);
      else if (state.checked.includes(item.id)) result.obtained.push(item);
      else result.notMarked.push(item);
    }
    return result;
  }, [items, state]);

  const checkable = useMemo(
    () => items.filter(i => !state.unavailable.includes(i.id) && !(i.id in state.swapped)),
    [items, state.unavailable, state.swapped],
  );
  const allChecked = checkable.length > 0 && checkable.every(i => state.checked.includes(i.id));

  const toggleAllChecked = useCallback(() => {
    dispatch({ type: 'setChecked', ids: allChecked ? [] : checkable.map(i => i.id) });
  }, [allChecked, checkable]);

  return {
    state,
    /** Estado por grupos, para el resumen y los prompts. */
    summary,
    pending: summary.missing,
    swappedCount: summary.swapped.length,
    /** Sin marcar como conseguido ni reemplazado. */
    uncheckedCount: summary.notMarked.length + summary.missing.length,
    allChecked,
    toggleAllChecked,
    toggleChecked: (id: string) => dispatch({ type: 'toggleChecked', id }),
    toggleUnavailable: (id: string) => dispatch({ type: 'toggleUnavailable', id }),
    swap: (id: string, substitute: string) => dispatch({ type: 'swap', id, substitute }),
    undoSwap: (id: string) => dispatch({ type: 'undoSwap', id }),
    collapse: () => dispatch({ type: 'collapse' }),
    reset: () => dispatch({ type: 'reset' }),
  };
}

export type MarketList = ReturnType<typeof useMarketList>;
