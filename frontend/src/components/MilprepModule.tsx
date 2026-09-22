/**
 * Mealprep: el usuario elige hasta 7 recetas, revisa la lista de compras
 * consolidada y cocina con Sous.
 *
 * Pestañas:
 * - Recetas: selección del catálogo (`data/milprepRecipes.ts`).
 * - Mercado: ingredientes sumados y escalados por número de personas, con
 *   marca de "ya lo tengo", "no lo consigo" y sustitutos sugeridos.
 * - Cocinar: chat de texto y voz. Los prompts de los dos modos se arman con
 *   las recetas, personas y cambios de ingredientes (`services/prompts/milprep.ts`).
 *
 * Recetas, personas, pestaña y marcas del mercado se guardan en localStorage
 * para sobrevivir a un F5 o a salir y volver al módulo: el prompt se rearma con
 * ellas y tiene que coincidir con el chat restaurado.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, BookOpen, MessageSquare, CheckCircle2, Clock, CalendarDays } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { MILPREP_RECIPES, type Recipe } from '../data/milprepRecipes';
import { ChatSessionScreen } from './ChatSessionScreen';
import { MarketList } from './MarketItemRow';
import { MAX_SERVINGS, MIN_SERVINGS, ServingsStepper } from './ServingsStepper';
import { Dialog } from './ui/Dialog';
import { useCookingChatSession } from '../hooks/useCookingChatSession';
import {
  marketChanges, parseMarketMarks, useMarketList, type MarketItem, type MarketMarks,
} from '../hooks/useMarketList';
import {
  buildMilprepFirstMessage, buildMilprepTextPrompt, buildMilprepVoicePrompt, plural,
  type MilprepPromptContext,
} from '../services/prompts/milprep';
import { showToast } from '../utils/events';

const MILPREP_SESSION_KEY = 'sous_milprep_session';
const MILPREP_CHAT_KEY    = 'sous_chat_milprep';
const MAX_RECIPES = 7;

type Tab = 'mercado' | 'recetas' | 'chat';
const TAB_IDS: readonly Tab[] = ['recetas', 'mercado', 'chat'];

interface MilprepSession {
  selectedRecipeIds: string[];
  peopleCount: number;
  activeTab: Tab;
  market: MarketMarks;
}

/**
 * Lee la sesión guardada campo por campo: lo que no tenga la forma esperada se
 * descarta. Las sesiones viejas traen `chatStarted`, que ahora se ignora (se
 * deriva del historial del chat) y no tienen `market`.
 */
function loadMilprepSession(): Partial<MilprepSession> {
  let raw: unknown;
  try { raw = JSON.parse(localStorage.getItem(MILPREP_SESSION_KEY) ?? 'null'); }
  catch { return {}; }
  if (typeof raw !== 'object' || raw === null) return {};
  const { selectedRecipeIds, peopleCount, activeTab, market } = raw as Record<string, unknown>;
  const session: Partial<MilprepSession> = {};
  if (Array.isArray(selectedRecipeIds) && selectedRecipeIds.every(id => typeof id === 'string')) {
    session.selectedRecipeIds = selectedRecipeIds.slice(0, MAX_RECIPES);
  }
  if (typeof peopleCount === 'number' && Number.isInteger(peopleCount)) {
    session.peopleCount = Math.min(MAX_SERVINGS, Math.max(MIN_SERVINGS, peopleCount));
  }
  if (TAB_IDS.includes(activeTab as Tab)) session.activeTab = activeTab as Tab;
  const marks = parseMarketMarks(market);
  if (marks) session.market = marks;
  return session;
}
function saveMilprepSession(s: MilprepSession) {
  try { localStorage.setItem(MILPREP_SESSION_KEY, JSON.stringify(s)); }
  catch { /* storage lleno o bloqueado */ }
}
function clearMilprepSession() {
  localStorage.removeItem(MILPREP_SESSION_KEY);
  localStorage.removeItem(MILPREP_CHAT_KEY);
}

// Redondeo a 2 decimales para no mostrar restos de coma flotante.
const formatAmount = (n: number) => String(Math.round(n * 100) / 100);

type GroceryTotal = { name: string; unit: string; category: MarketItem['category']; amount: number };

/**
 * Suma los ingredientes repetidos entre recetas. El id es nombre + unidad: no
 * depende de las porciones (las marcas sobreviven al cambiarlas) y no suma
 * "ud" con "g" del mismo ingrediente.
 */
function getGroceryList(recipes: Recipe[], people: number): MarketItem[] {
  const totals = recipes.flatMap(r => r.ingredients).reduce((acc, ing) => {
    const id = `${ing.name.trim().toLowerCase()}|${ing.unit.trim()}`;
    const prev = acc.get(id);
    return acc.set(id, {
      name: ing.name,
      unit: ing.unit.trim(),
      category: prev?.category ?? ing.category,
      amount: (prev?.amount ?? 0) + ing.baseAmount * people,
    });
  }, new Map<string, GroceryTotal>());

  return Array.from(totals, ([id, t]) => {
    const quantity = `${formatAmount(t.amount)} ${t.unit}`;
    return { id, name: t.name, category: t.category, quantity, label: `${quantity} de ${t.name}` };
  });
}

const TABS: { id: Tab; icon: typeof BookOpen; elementKey: string; label: string }[] = [
  { id: 'recetas', icon: BookOpen,      elementKey: 'milprep_tab_recetas', label: 'Recetas' },
  { id: 'mercado', icon: ShoppingCart,  elementKey: 'milprep_tab_mercado', label: 'Mercado' },
  { id: 'chat',    icon: MessageSquare, elementKey: 'milprep_tab_chat',    label: 'Cocinar' },
];

export const MilprepModule: React.FC = () => {
  // La sesión guardada se lee una sola vez al montar.
  const [savedSession] = useState(loadMilprepSession);

  const [activeTab, setActiveTab] = useState<Tab>(savedSession.activeTab ?? 'recetas');
  const [peopleCount, setPeopleCount] = useState(savedSession.peopleCount ?? MIN_SERVINGS);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(savedSession.selectedRecipeIds ?? []);
  const [showReadyBanner, setShowReadyBanner] = useState(false);

  const selectedRecipes = useMemo(
    () => MILPREP_RECIPES.filter(r => selectedRecipeIds.includes(r.id)),
    [selectedRecipeIds],
  );
  const groceryItems = useMemo(() => getGroceryList(selectedRecipes, peopleCount), [selectedRecipes, peopleCount]);
  const market = useMarketList(groceryItems, savedSession.market);

  // Los prompts se arman en cada render: así una sesión restaurada tras un F5 y
  // los cambios de ingredientes hechos después de empezar llegan al modelo.
  const promptContext: MilprepPromptContext = {
    recipes: selectedRecipes,
    people: peopleCount,
    ...marketChanges(market.summary),
  };
  const session = useCookingChatSession({
    analyticsMode: 'milprep',
    storageKey: MILPREP_CHAT_KEY,
    textPrompt: buildMilprepTextPrompt(promptContext),
    voicePrompt: buildMilprepVoicePrompt(promptContext),
  });

  // Se guarda en cada cambio; la escritura es síncrona, así que no hace falta
  // guardar otra vez al desmontar.
  const { marks } = market;
  useEffect(() => {
    saveMilprepSession({ selectedRecipeIds, peopleCount, activeTab, market: marks });
  }, [selectedRecipeIds, peopleCount, activeTab, marks]);

  const handleEndSession = () => {
    clearMilprepSession();
    setSelectedRecipeIds([]);
    setPeopleCount(MIN_SERVINGS);
    market.reset();
    setActiveTab('recetas');
  };

  const startChat = (extraQuestion?: string) => {
    session.start(buildMilprepFirstMessage(promptContext, extraQuestion));
    setActiveTab('chat');
  };

  // Desde la lista de compras: si el chat no ha empezado, la pregunta va
  // junto al mensaje inicial; si ya empezó, se envía directo.
  const askChef = (question: string) => {
    if (!session.started) {
      startChat(question);
      return;
    }
    if (session.isLoading) {
      showToast('Espera a que Sous termine de responder.', 'warning');
      return;
    }
    session.send(question);
    setActiveTab('chat');
  };

  // Franja naranja con las recetas de la semana: en el chat y antes de empezarlo.
  const weekStrip = selectedRecipes.length > 0 && (
    <div className="flex-shrink-0 px-3 py-2 bg-orange-50 border-b border-orange-100 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex gap-2 items-center">
        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wide whitespace-nowrap" aria-hidden>Esta semana:</span>
        <ul aria-label="Recetas de esta semana" className="flex gap-2 items-center">
          {selectedRecipes.map(r => (
            <li key={r.id} className="whitespace-nowrap text-[11px] font-semibold bg-white border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full shadow-sm flex-shrink-0">
              {r.title}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

  if ((activeTab === 'chat' && session.started) || session.voiceMode) {
    return (
      <ChatSessionScreen
        session={session}
        title="Mealprep"
        subtitle={`${plural(selectedRecipes.length, 'receta', 'recetas')} · ${plural(peopleCount, 'persona', 'personas')}`}
        onBack={() => setActiveTab('mercado')}
        backLabel="Volver a la lista de compras (se guarda la conversación)"
        endDescription="Se borran el chat, las recetas elegidas y la lista de esta semana."
        onEnd={handleEndSession}
        extraTop={weekStrip}
      />
    );
  }

  const toggleRecipe = (id: string) => {
    if (selectedRecipeIds.includes(id)) {
      setSelectedRecipeIds(prev => prev.filter(x => x !== id));
    } else if (selectedRecipeIds.length < MAX_RECIPES) {
      setSelectedRecipeIds(prev => [...prev, id]);
      // El aviso sale al completar la semana, no al restaurar una sesión con 7.
      if (selectedRecipeIds.length + 1 === MAX_RECIPES) setShowReadyBanner(true);
    } else {
      showToast(`Ya elegiste ${MAX_RECIPES} recetas. Quita una para agregar otra.`, 'warning');
    }
  };

  const floatingClass = 'fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-40';
  const count = selectedRecipeIds.length;

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans">
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold flex items-center gap-3 text-orange-600">
            <CalendarDays className="w-8 h-8 flex-shrink-0" aria-hidden />
            <EditableText elementKey="milprep_header_title" defaultText="Mealprep" />
          </h1>
          <p className="text-gray-500 mt-1">
            <EditableText elementKey="milprep_header_subtitle" defaultText="Eliges las recetas, Sous arma la lista de compras y te guía." as="span" />
          </p>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div role="tablist" aria-label="Pasos del mealprep" className="max-w-4xl mx-auto flex">
          {TABS.map(({ id, icon: Icon, elementKey, label }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`milprep-tab-${id}`}
                aria-selected={selected}
                aria-controls="milprep-panel"
                onClick={() => setActiveTab(id)}
                className={`flex-1 min-w-0 min-h-12 flex items-center justify-center gap-2 px-2 py-4 font-medium border-b-2 transition-colors ${
                  selected ? 'text-orange-600 border-orange-600' : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden />
                <span className="truncate">
                  <EditableText elementKey={elementKey} defaultText={label} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        id="milprep-panel"
        role="tabpanel"
        aria-labelledby={`milprep-tab-${activeTab}`}
        className="flex-1 min-h-0 overflow-y-auto p-6"
      >
        <div className="max-w-4xl mx-auto">
          {activeTab === 'recetas' && (
            <div className="pb-28 md:pb-24">
              <div className="flex items-center justify-between gap-3 mb-6">
                <h2 className="text-xl font-bold text-gray-800">Catálogo de recetas</h2>
                <p className="text-sm text-neutral-400">Elige hasta {MAX_RECIPES}</p>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MILPREP_RECIPES.map((recipe) => {
                  const isSelected = selectedRecipeIds.includes(recipe.id);
                  return (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleRecipe(recipe.id)}
                        className={`w-full text-left bg-white rounded-2xl shadow-sm border ${
                          isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-100'
                        } overflow-hidden hover:shadow-md transition-all cursor-pointer group relative`}
                      >
                        <span className="block h-40 overflow-hidden relative">
                          <img
                            src={recipe.img}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span
                            aria-hidden
                            className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                              isSelected ? 'bg-orange-500 text-white' : 'bg-white text-gray-300'
                            }`}
                          >
                            <CheckCircle2 className="w-5 h-5" />
                          </span>
                        </span>
                        <span className="block p-4">
                          <span className="block font-bold text-gray-800 line-clamp-2 min-h-[3rem]">
                            <EditableText elementKey={`milprep_rec_${recipe.id}_title`} defaultText={recipe.title} as="span" />
                          </span>
                          <span className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                            <Clock className="w-4 h-4" aria-hidden />
                            <span>{recipe.time}</span>
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {activeTab === 'mercado' && (
            <div className="mb-24 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <ShoppingCart className="text-orange-500 w-6 h-6 flex-shrink-0" aria-hidden />
                    Tu lista de compras
                  </h2>
                  {selectedRecipes.length > 0 && (
                    <button
                      type="button"
                      onClick={market.toggleAllChecked}
                      className="group min-h-11 -my-2 flex items-center outline-none"
                    >
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all group-focus-visible:ring-2 group-focus-visible:ring-orange-400 ${
                        market.allChecked
                          ? 'bg-green-100 text-green-700 border-green-300 group-hover:bg-green-200'
                          : 'bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-orange-100'
                      }`}>
                        {market.allChecked ? <><span aria-hidden>✓ </span>Desmarcar todo</> : 'Ya tengo todo'}
                      </span>
                    </button>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">Personas:</span>
                  <ServingsStepper variant="square" value={peopleCount} onChange={setPeopleCount} />
                </div>
              </div>

              {selectedRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                  <ShoppingCart className="w-12 h-12 mb-3 text-neutral-200" aria-hidden />
                  <p className="font-bold text-neutral-600 mb-1">La lista está vacía</p>
                  <p className="text-sm">Elige tus recetas y aquí aparecen los ingredientes sumados.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('recetas')}
                    className="mt-4 min-h-11 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-sm font-bold shadow-sm transition-all"
                  >
                    Elegir recetas
                  </button>
                </div>
              ) : (
                <MarketList variant="milprep" items={groceryItems} market={market} onAskChef={askChef} />
              )}
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="flex flex-col bg-neutral-50 rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
              {weekStrip}
              <div className="flex flex-col items-center justify-center px-8 py-12">
                <div className="text-6xl mb-5" aria-hidden>🍳</div>
                <h2 className="text-xl font-black text-neutral-800 text-center mb-2">¿Listo para cocinar?</h2>
                {selectedRecipes.length > 0 ? (
                  <>
                    <p className="text-sm text-neutral-500 text-center mb-8">
                      <span className="font-bold text-orange-500">{plural(selectedRecipes.length, 'receta', 'recetas')}</span> para {plural(peopleCount, 'persona', 'personas')}. Sous te guía paso a paso y te dice qué adelantar mientras algo se cocina.
                    </p>
                    <ul className="w-full max-w-xs space-y-1.5 mb-8">
                      {selectedRecipes.map(r => (
                        <li key={r.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-neutral-100 shadow-sm">
                          <CheckCircle2 size={14} className="text-orange-400 flex-shrink-0" aria-hidden />
                          <span className="text-sm text-neutral-700 font-medium truncate">{r.title}</span>
                          <span className="text-xs text-neutral-400 ml-auto flex-shrink-0">{r.time}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => startChat()}
                      className="min-h-12 px-8 py-4 rounded-2xl font-black text-white text-base transition-all bg-gradient-to-r from-orange-500 to-rose-500 shadow-xl shadow-orange-400/30 active:scale-95"
                    >
                      Empezar a cocinar <span aria-hidden>🚀</span>
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-400 text-center mb-8">Todavía no hay recetas para esta semana.</p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('recetas')}
                      className="min-h-12 px-8 py-4 rounded-2xl font-black text-white text-base transition-all bg-neutral-300 hover:bg-neutral-400 active:scale-95"
                    >
                      Elige al menos una receta <span aria-hidden>→</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'recetas' && (
        <div className={`${floatingClass} flex flex-col items-end gap-2`}>
          <p
            role="status"
            className={`min-h-11 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm transition-all duration-300 ${
              count === MAX_RECIPES
                ? 'bg-green-500 text-white shadow-green-400/40'
                : count > 0
                ? 'bg-orange-500 text-white shadow-orange-400/40'
                : 'bg-white text-neutral-500 border border-neutral-200 shadow-neutral-200/60'
            }`}
          >
            <ShoppingCart size={15} aria-hidden />
            <span>{count} / {MAX_RECIPES}<span className="sr-only"> recetas elegidas</span></span>
            {count === MAX_RECIPES && <span aria-hidden>✓</span>}
          </p>
          {count > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('mercado')}
              className="min-h-11 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all shadow-neutral-200/60"
            >
              Siguiente <span aria-hidden>→</span>
            </button>
          )}
        </div>
      )}

      {activeTab === 'mercado' && selectedRecipes.length > 0 && (
        <div className={floatingClass}>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="min-h-11 flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all shadow-orange-400/40"
          >
            Ir a cocinar <span aria-hidden>→</span>
          </button>
        </div>
      )}

      {showReadyBanner && (
        <Dialog
          title="Ya tienes tus 7 recetas"
          hideTitle
          onClose={() => setShowReadyBanner(false)}
          size="sm"
          footer={
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => { setShowReadyBanner(false); setActiveTab('mercado'); }}
                className="w-full min-h-11 py-3 rounded-xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 active:scale-95 transition-all"
              >
                Ver lista de compras <span aria-hidden>→</span>
              </button>
              <button
                type="button"
                onClick={() => setShowReadyBanner(false)}
                className="w-full min-h-11 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Seguir en recetas
              </button>
            </div>
          }
        >
          {/* Cabecera verde a sangre: compensa el padding del diálogo. */}
          <div className="-mx-5 -mt-5 mb-4 rounded-t-sheet bg-gradient-to-br from-green-400 to-emerald-600 p-6 text-center text-white">
            <div className="text-5xl mb-2" aria-hidden>🛒</div>
            <p className="text-2xl font-black" aria-hidden>Ya tienes tus 7 recetas</p>
            <p className="text-white/85 text-sm mt-1">
              Sous suma los ingredientes para {plural(peopleCount, 'persona', 'personas')} en la lista de compras.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
            {selectedRecipes.map(r => (
              <li key={r.id} className="flex items-center gap-1.5 bg-green-50 rounded-lg px-2.5 py-1.5 min-w-0">
                <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" aria-hidden />
                <span className="font-medium text-neutral-700 truncate">{r.title}</span>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </div>
  );
};
