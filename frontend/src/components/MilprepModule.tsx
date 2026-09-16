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
import { ShoppingCart, BookOpen, MessageSquare, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
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
        extraTop={selectedRecipes.length > 0 && (
          <div className="flex-shrink-0 px-3 py-2 bg-white border-b border-neutral-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul aria-label="Recetas de esta semana" className="flex gap-2 items-center">
              {selectedRecipes.map(r => (
                <li key={r.id} className="whitespace-nowrap text-xs font-medium bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-full flex-shrink-0">
                  {r.title}
                </li>
              ))}
            </ul>
          </div>
        )}
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

  return (
    <div className="flex flex-col h-full bg-neutral-50 text-neutral-900">
      <div className="bg-white px-4 pt-4 pb-3 md:px-6">
        <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900">
          <EditableText elementKey="milprep_header_title" defaultText="Mealprep" />
        </h1>
        <p className="text-sm text-neutral-600 mt-0.5">
          <EditableText elementKey="milprep_header_subtitle" defaultText="Eliges las recetas, Sous arma la lista de compras y te guía." as="span" />
        </p>
      </div>

      <div role="tablist" aria-label="Pasos del mealprep" className="bg-white border-b border-neutral-200 flex flex-shrink-0">
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
              className={`flex-1 min-w-0 min-h-12 flex items-center justify-center gap-2 px-2 text-sm font-semibold border-b-2 transition-colors ${
                selected ? 'text-brand-700 border-brand-700' : 'text-neutral-600 border-transparent hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              <Icon size={18} aria-hidden className="flex-shrink-0" />
              <span className="truncate">
                <EditableText elementKey={elementKey} defaultText={label} />
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="milprep-panel"
        role="tabpanel"
        aria-labelledby={`milprep-tab-${activeTab}`}
        className="flex-1 min-h-0 overflow-y-auto"
      >
        {activeTab === 'recetas' && (
          <div className="max-w-2xl mx-auto p-4 md:p-6 pb-28 md:pb-24">
            <div className="flex items-baseline justify-between gap-3 mb-3">
              <h2 className="text-lg font-bold text-neutral-900">Catálogo de recetas</h2>
              <p className="text-sm text-neutral-600">Elige hasta {MAX_RECIPES}</p>
            </div>
            <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
              {MILPREP_RECIPES.map((recipe) => {
                const isSelected = selectedRecipeIds.includes(recipe.id);
                return (
                  <li key={recipe.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleRecipe(recipe.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        isSelected ? 'bg-brand-50' : 'hover:bg-neutral-50'
                      }`}
                    >
                      <img
                        src={recipe.img}
                        alt=""
                        loading="lazy"
                        className="w-16 h-16 rounded-control object-cover flex-shrink-0 bg-neutral-100"
                      />
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold text-neutral-900 leading-snug line-clamp-2">
                          <EditableText elementKey={`milprep_rec_${recipe.id}_title`} defaultText={recipe.title} as="span" />
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-neutral-600 mt-1">
                          <Clock size={14} aria-hidden />
                          {recipe.time}
                        </span>
                      </span>
                      <span
                        aria-hidden
                        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-brand-700 text-white' : 'border-2 border-neutral-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 size={18} />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === 'mercado' && (
          <div className="max-w-2xl mx-auto p-4 md:p-6 pb-28 md:pb-24 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-neutral-900">Tu lista de compras</h2>
              <div className="flex items-center gap-1">
                <span className="text-sm font-semibold text-neutral-700">Personas</span>
                <ServingsStepper value={peopleCount} onChange={setPeopleCount} />
              </div>
            </div>

            {selectedRecipes.length === 0 ? (
              <div className="bg-white rounded-card border border-neutral-200 p-4 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-neutral-500" aria-hidden />
                <p className="font-semibold text-neutral-900">La lista está vacía</p>
                <p className="text-sm text-neutral-600 mt-1">Elige tus recetas y aquí aparecen los ingredientes sumados.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('recetas')}
                  className="mt-3 min-h-11 px-4 rounded-control bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold"
                >
                  Elegir recetas
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={market.toggleAllChecked}
                  className={`min-h-11 px-4 rounded-full border text-sm font-semibold transition-colors ${
                    market.allChecked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {market.allChecked ? 'Desmarcar todo' : 'Ya tengo todo'}
                </button>

                <MarketList items={groceryItems} market={market} onAskChef={askChef} />
              </>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="max-w-md mx-auto p-4 md:p-6">
            <h2 className="text-xl font-extrabold text-neutral-900">¿Listo para cocinar?</h2>
            {selectedRecipes.length > 0 ? (
              <>
                <p className="text-sm text-neutral-600 mt-1">
                  {plural(selectedRecipes.length, 'receta', 'recetas')} para {plural(peopleCount, 'persona', 'personas')}. Sous te guía paso a paso y te dice qué adelantar mientras algo se cocina.
                </p>
                <ul className="mt-4 bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100">
                  {selectedRecipes.map(r => (
                    <li key={r.id} className="flex items-center gap-3 min-h-12 px-4 py-2">
                      <span className="flex-1 min-w-0 text-sm font-medium text-neutral-900 truncate">{r.title}</span>
                      <span className="text-sm text-neutral-600 flex-shrink-0">{r.time}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => startChat()}
                  className="mt-4 w-full min-h-12 rounded-control bg-brand-700 hover:bg-brand-800 text-white font-semibold transition-colors"
                >
                  Empezar a cocinar
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-600 mt-1">Todavía no hay recetas para esta semana.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('recetas')}
                  className="mt-4 w-full min-h-12 rounded-control border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 font-semibold transition-colors"
                >
                  Elige al menos una receta
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {activeTab === 'recetas' && (
        <div className={`${floatingClass} flex items-center gap-2`}>
          <p
            role="status"
            className="min-h-11 px-4 flex items-center gap-2 rounded-full bg-white border border-neutral-200 shadow-overlay text-sm font-semibold text-neutral-800"
          >
            <ShoppingCart size={16} aria-hidden />
            {selectedRecipeIds.length} de {MAX_RECIPES}
          </p>
          {selectedRecipeIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('mercado')}
              className="min-h-11 pl-4 pr-3 flex items-center gap-1 rounded-full bg-brand-700 hover:bg-brand-800 text-white shadow-overlay text-sm font-semibold transition-colors"
            >
              Siguiente
              <ChevronRight size={18} aria-hidden />
            </button>
          )}
        </div>
      )}

      {activeTab === 'mercado' && selectedRecipes.length > 0 && (
        <div className={floatingClass}>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className="min-h-11 pl-4 pr-3 flex items-center gap-1 rounded-full bg-brand-700 hover:bg-brand-800 text-white shadow-overlay text-sm font-semibold transition-colors"
          >
            Ir a cocinar
            <ChevronRight size={18} aria-hidden />
          </button>
        </div>
      )}

      {showReadyBanner && (
        <Dialog
          title="Ya tienes tus 7 recetas"
          description={`Sous suma los ingredientes para ${plural(peopleCount, 'persona', 'personas')} en la lista de compras.`}
          onClose={() => setShowReadyBanner(false)}
          size="sm"
          footer={
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { setShowReadyBanner(false); setActiveTab('mercado'); }}
                className="w-full min-h-11 rounded-control bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm transition-colors"
              >
                Ver lista de compras
              </button>
              <button
                type="button"
                onClick={() => setShowReadyBanner(false)}
                className="w-full min-h-11 rounded-control border border-neutral-300 text-neutral-800 hover:bg-neutral-50 font-semibold text-sm transition-colors"
              >
                Seguir en recetas
              </button>
            </div>
          }
        >
          <ul className="mt-3 space-y-1.5">
            {selectedRecipes.map(r => (
              <li key={r.id} className="flex items-center gap-2 text-sm text-neutral-800">
                <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0" aria-hidden />
                <span className="min-w-0 truncate">{r.title}</span>
              </li>
            ))}
          </ul>
        </Dialog>
      )}
    </div>
  );
};
