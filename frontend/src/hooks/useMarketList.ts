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

/** Marcas del usuario, en la forma en que se guardan en localStorage. */
export interface MarketMarks {
  checked: string[];
  unavailable: string[];
  /** id → sustituto elegido. */
  swapped: Record<string, string>;
}

interface MarketState extends MarketMarks {
  /** Fila con el panel de sustitutos abierto. No se guarda. */
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

const EMPTY_MARKS: MarketMarks = { checked: [], unavailable: [], swapped: {} };

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
      return { ...EMPTY_MARKS, expanded: null };
  }
}

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every(x => typeof x === 'string');

/** Valida marcas leídas de localStorage. Devuelve `null` si no tienen la forma esperada. */
export function parseMarketMarks(value: unknown): MarketMarks | null {
  if (typeof value !== 'object' || value === null) return null;
  const { checked, unavailable, swapped } = value as Record<string, unknown>;
  if (!isStringArray(checked) || !isStringArray(unavailable)) return null;
  if (typeof swapped !== 'object' || swapped === null || Array.isArray(swapped)) return null;
  if (!Object.values(swapped).every(x => typeof x === 'string')) return null;
  return { checked, unavailable, swapped: swapped as Record<string, string> };
}

export type MarketItemMark = 'none' | 'checked' | 'unavailable' | 'swapped';

export interface MarketItemStatus {
  mark: MarketItemMark;
  /** Solo con `mark === 'swapped'`. */
  substitute?: string;
  /** Panel de sustitutos abierto. */
  expanded: boolean;
}

export interface MarketSummary {
  obtained: MarketItem[];
  /** No conseguidos y sin sustituto. */
  missing: MarketItem[];
  swapped: { item: MarketItem; substitute: string }[];
  notMarked: MarketItem[];
}

/** Cambios de ingredientes para los mensajes a Sous, con la cantidad si la hay. */
export interface MarketChanges {
  swaps: { name: string; quantity?: string; substitute: string }[];
  missing: { name: string; quantity?: string }[];
}

export const marketChanges = (summary: MarketSummary): MarketChanges => ({
  swaps: summary.swapped.map(({ item, substitute }) => ({ name: item.name, quantity: item.quantity, substitute })),
  missing: summary.missing.map(({ name, quantity }) => ({ name, quantity })),
});

export const withQuantity = (i: { name: string; quantity?: string }) =>
  i.quantity ? `${i.name} (${i.quantity})` : i.name;

/**
 * Frases de "cambié X por Y" y "no conseguí Z" que el usuario le cuenta a Sous
 * en el primer mensaje. Sin cambios, lista vacía.
 */
export function describeMarketChanges({ swaps, missing }: MarketChanges): string[] {
  const lines: string[] = [];
  if (swaps.length > 0) {
    lines.push(`Cambié estos ingredientes: ${swaps.map(s => `${withQuantity(s)} por ${s.substitute}`).join(', ')}.`);
  }
  if (missing.length > 0) {
    lines.push(`No conseguí estos ingredientes: ${missing.map(withQuantity).join(', ')}.`);
  }
  return lines;
}

export function useMarketList(items: MarketItem[], initialMarks?: MarketMarks | null) {
  const [state, dispatch] = useReducer(
    reducer,
    initialMarks,
    (marks): MarketState => ({ ...(marks ?? EMPTY_MARKS), expanded: null }),
  );
  const { checked, unavailable, swapped, expanded } = state;

  // Las marcas de ingredientes que ya no están en la lista (receta quitada) se
  // conservan por si vuelve, pero no cuentan.
  const summary = useMemo<MarketSummary>(() => {
    const result: MarketSummary = { obtained: [], missing: [], swapped: [], notMarked: [] };
    for (const item of items) {
      const substitute = swapped[item.id];
      if (substitute !== undefined) result.swapped.push({ item, substitute });
      else if (unavailable.includes(item.id)) result.missing.push(item);
      else if (checked.includes(item.id)) result.obtained.push(item);
      else result.notMarked.push(item);
    }
    return result;
  }, [items, checked, unavailable, swapped]);

  const marks = useMemo<MarketMarks>(() => ({ checked, unavailable, swapped }), [checked, unavailable, swapped]);

  const statusOf = useCallback((id: string): MarketItemStatus => {
    const isExpanded = expanded === id;
    const substitute = swapped[id];
    if (substitute !== undefined) return { mark: 'swapped', substitute, expanded: isExpanded };
    if (unavailable.includes(id)) return { mark: 'unavailable', expanded: isExpanded };
    if (checked.includes(id)) return { mark: 'checked', expanded: isExpanded };
    return { mark: 'none', expanded: isExpanded };
  }, [checked, unavailable, swapped, expanded]);

  const checkable = useMemo(
    () => items.filter(i => !unavailable.includes(i.id) && !(i.id in swapped)),
    [items, unavailable, swapped],
  );
  const allChecked = checkable.length > 0 && checkable.every(i => checked.includes(i.id));

  const toggleAllChecked = useCallback(() => {
    dispatch({ type: 'setChecked', ids: allChecked ? [] : checkable.map(i => i.id) });
  }, [allChecked, checkable]);

  return {
    /** Estado por grupos, para el resumen, los avisos y los prompts. */
    summary,
    /** Marcas para guardar; se restauran con `initialMarks`. */
    marks,
    statusOf,
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

export type MarketListController = ReturnType<typeof useMarketList>;
