/**
 * "Sabores del Mundo": recetas de cocina internacional agrupadas por región
 * y país (`data/flavorsRecipes.ts`).
 *
 * Flujo de cada receta: resumen y porciones → lista de mercado (marcar,
 * "no lo consigo", sustitutos) → chat con Sous. El prompt incluye lo que el
 * usuario consiguió o reemplazó. El chat alterna texto (SSE) y voz manos
 * libres (WebSocket) sin perder la conversación, y queda guardado por receta:
 * al volver se puede continuar o empezar de nuevo.
 */

import { useState, useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ShoppingCart, Clock, ChefHat, Globe, MessageSquare, Users } from 'lucide-react';
import { ChatSessionScreen } from './ChatSessionScreen';
import { MarketList } from './MarketItemRow';
import { ServingsStepper } from './ServingsStepper';
import { ConfirmDialog } from './ui/Dialog';
import { useCookingChatSession } from '../hooks/useCookingChatSession';
import {
  describeMarketChanges, formatQuantity, marketChanges, useMarketList, type MarketItem, type MarketSummary,
} from '../hooks/useMarketList';
import { REGIONS, type Country, type Difficulty, type Recipe, type Region, type RegionName } from '../data/flavorsRecipes';
import { categorizeIngredient } from '../data/groceryCategories';
import { showToast } from '../utils/events';

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Básico: 'bg-emerald-100 text-emerald-700',
  Intermedio: 'bg-blue-100 text-blue-700',
  Difícil: 'bg-red-100 text-red-700',
};

const REGION_CLASS: Record<RegionName, string> = {
  América: 'border-orange-200 bg-orange-50 text-orange-600',
  Europa: 'border-blue-200 bg-blue-50 text-blue-600',
  Asia: 'border-red-200 bg-red-50 text-red-600',
};

type FlowStep = 'intro' | 'mercado' | 'chat';
const STEPS: FlowStep[] = ['intro', 'mercado', 'chat'];

const STEP_LABEL: Record<FlowStep, string> = {
  intro: 'Paso 1 de 3: receta',
  mercado: 'Paso 2 de 3: mercado',
  chat: 'Paso 3 de 3: cocinar',
};

/** Para el prompt: con cantidad, que es lo que Sous necesita para guiar. */
const names = (items: MarketItem[]) => items.map(i => i.label);

function buildTextPrompt(recipe: Recipe, countryName: string, personas: string, summary: MarketSummary): string {
  const list = (items: string[], empty: string) => (items.length > 0 ? items.join(', ') : empty);
  const swapped = summary.swapped.map(({ item, substitute }) => `${item.name} → ${substitute}`);

  return `Eres Sous, chef especializado en cocina ${countryName}. El usuario va a preparar "${recipe.name}" para ${personas}.

DESCRIPCIÓN: ${recipe.description}

ESTADO DE INGREDIENTES:
- Conseguidos: ${list(names(summary.obtained), 'ninguno marcado')}
- No conseguidos: ${list(names(summary.missing), 'ninguno')}
- Reemplazados: ${swapped.length > 0 ? swapped.join('; ') : 'ninguno'}
- Sin marcar (asumir disponibles): ${list(names(summary.notMarked), 'ninguno')}

Adapta la receta a los ingredientes disponibles y sus sustitutos. Guía paso a paso para ${personas}. Responde SOLO sobre esta receta. Máximo 60 palabras por respuesta.
No uses el carácter —. No abras con elogios ni cierres ofreciendo más ayuda.`;
}

/** Botón naranja que flota sobre el final del contenido, con un degradado blanco detrás. */
const FloatingCta = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-2xl mx-auto flex items-center justify-center gap-2 py-4 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-orange-300/50 pointer-events-auto"
    >
      {children}
    </button>
  </div>
);

const SummaryChips = ({ title, titleClass, chipClass, items }: {
  title: string; titleClass: string; chipClass: string; items: { key: string; text: string }[];
}) => items.length === 0 ? null : (
  <div>
    <p className={`text-[11px] font-bold uppercase mb-1 ${titleClass}`}>{title}</p>
    <ul className="flex flex-wrap gap-1.5">
      {items.map(i => <li key={i.key} className={`text-xs px-2.5 py-1 rounded-full ${chipClass}`}>{i.text}</li>)}
    </ul>
  </div>
);

interface RecipeFlowProps {
  recipe: Recipe;
  countryName: string;
  countryFlag: string;
  onBack: () => void;
}

const RecipeFlow = ({ recipe, countryName, countryFlag, onBack }: RecipeFlowProps) => {
  const [step, setStep] = useState<FlowStep>('intro');
  const [servings, setServings] = useState(2);
  // Pantalla de chat visible. Si hay conversación lo dice `session.started`.
  const [chatOpen, setChatOpen] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);

  // Las cantidades del catálogo son por porción: aquí se multiplican. El `id`
  // es solo el nombre, así que las marcas sobreviven al cambiar las porciones.
  const items = useMemo<MarketItem[]>(
    () => recipe.ingredients.map(ing => {
      const quantity = formatQuantity(ing.amount * servings, ing.unit);
      return {
        id: ing.name,
        name: ing.name,
        quantity,
        label: `${quantity} de ${ing.name}`,
        category: categorizeIngredient(ing.name),
      };
    }),
    [recipe, servings],
  );
  const market = useMarketList(items);
  const { summary } = market;
  const personas = `${servings} persona${servings !== 1 ? 's' : ''}`;

  const textPrompt = buildTextPrompt(recipe, countryName, personas, summary);
  const session = useCookingChatSession({
    storageKey: `sous_flavor_${recipe.name.replace(/\s+/g, '_').toLowerCase()}`,
    textPrompt,
    voicePrompt: `${textPrompt}\nMODO VOZ: Habla naturalmente, sin listas ni markdown. Frases cortas. No interrumpas el silencio del usuario.`,
    analyticsMode: 'flavors',
    keepAwake: chatOpen,
  });

  /** Conversación nueva con el resumen del mercado; `question` reemplaza el pedido de guía. */
  const startChat = (question?: string) => {
    const msg = [
      `Hola Sous, voy a preparar "${recipe.name}" para ${personas}.`,
      ...describeMarketChanges(marketChanges(summary)),
      question ?? 'Guíame paso a paso.',
    ].join(' ');
    session.start(msg);
    setStep('chat');
    setChatOpen(true);
  };

  const continueChat = () => {
    setStep('chat');
    setChatOpen(true);
  };

  // Desde la lista: sin conversación, la pregunta va en el primer mensaje;
  // con conversación guardada se suma a ella en vez de borrarla.
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
    continueChat();
  };

  const handleBack = () => {
    if (step === 'intro') { onBack(); return; }
    if (step === 'mercado') { setStep('intro'); return; }
    setStep('mercado');
  };

  if (chatOpen || session.voiceMode) {
    return (
      <ChatSessionScreen
        session={session}
        title={recipe.name}
        subtitle={`${countryFlag} ${countryName} · ${personas}`}
        onBack={() => setChatOpen(false)}
        backLabel="Volver al resumen de la receta"
        endDescription="Se borra el chat de esta receta."
        onEnd={() => { setChatOpen(false); setStep('intro'); }}
      />
    );
  }

  const stepIndex = STEPS.indexOf(step);
  const header = (
    <header className="flex items-center gap-2 pl-1 pr-4 min-h-12 border-b border-neutral-100 bg-neutral-50 flex-shrink-0">
      <button
        type="button"
        onClick={handleBack}
        aria-label={step === 'intro' ? 'Atrás: volver a Sabores del Mundo' : 'Atrás: volver al paso anterior'}
        className="min-h-11 px-2 flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-orange-600 transition-colors flex-shrink-0"
      >
        <ArrowLeft size={15} aria-hidden />
        Atrás
      </button>
      <span className="text-neutral-300 mx-1" aria-hidden>|</span>
      <span className="text-sm" aria-hidden>{countryFlag}</span>
      <h1 className="text-sm font-semibold text-neutral-600 truncate min-w-0">
        {recipe.name}
        <span className="sr-only"> ({countryName}), {STEP_LABEL[step]}</span>
      </h1>
      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0" aria-hidden>
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`w-2 h-2 rounded-full transition-colors ${
              step === s ? 'bg-orange-600' : i < stepIndex ? 'bg-orange-200' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>
    </header>
  );

  if (step === 'intro') return (
    <div className="flex flex-col h-full relative">
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-5 space-y-4 pb-28 max-w-2xl w-full mx-auto">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">{recipe.technique}</span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${DIFFICULTY_CLASS[recipe.difficulty]}`}>{recipe.difficulty}</span>
            <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200">
              <Clock size={11} aria-hidden />{recipe.time}
            </span>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed">{recipe.description}</p>

          {session.started && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 text-sm font-medium text-neutral-700">Tienes una conversación guardada de esta receta.</p>
              <button
                type="button"
                onClick={continueChat}
                className="min-h-11 px-4 flex items-center gap-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-sm font-bold flex-shrink-0 transition-all shadow-sm"
              >
                <MessageSquare size={16} aria-hidden />
                Continuar la conversación
              </button>
            </div>
          )}

          <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <Users size={16} className="text-orange-500 flex-shrink-0" aria-hidden />
                <span className="text-sm font-bold text-neutral-700">¿Para cuántas personas?</span>
              </div>
              <ServingsStepper value={servings} onChange={setServings} />
            </div>
          </div>

          <section className="bg-orange-50 rounded-xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Ingredientes</h2>
            <ul className="flex flex-wrap gap-1.5">
              {items.map(ing => (
                <li key={ing.id} className="text-xs bg-white border border-orange-100 text-neutral-600 px-2.5 py-1 rounded-full">
                  <span className="font-bold text-neutral-800">{ing.quantity}</span> de {ing.name}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <FloatingCta onClick={() => setStep('mercado')}>
        <ShoppingCart size={18} aria-hidden />
        Ir al mercado <span aria-hidden>→</span>
      </FloatingCta>
    </div>
  );

  if (step === 'mercado') {
    const unchecked = summary.notMarked.length + summary.missing.length;
    return (
      <div className="flex flex-col h-full relative">
        {header}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-5 pb-28 max-w-2xl w-full mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShoppingCart size={16} className="text-orange-500 flex-shrink-0" aria-hidden />
                <p role="status" className="min-w-0 text-sm font-bold text-neutral-700">
                  {unchecked > 0
                    ? `${unchecked} ingrediente${unchecked !== 1 ? 's' : ''} pendiente${unchecked !== 1 ? 's' : ''}`
                    : '¡Todo listo!'}
                </p>
              </div>
              <ServingsStepper variant="compact" value={servings} onChange={setServings} />
            </div>

            <MarketList items={items} market={market} onAskChef={askChef} />
          </div>
        </div>

        <FloatingCta onClick={() => setStep('chat')}>
          Manos a la obra <span aria-hidden>→</span>
        </FloatingCta>
      </div>
    );
  }

  const noneMarked = summary.obtained.length === 0 && summary.swapped.length === 0 && summary.missing.length === 0;
  const primaryCta = 'w-full max-w-md flex items-center justify-center gap-3 py-5 bg-orange-600 hover:from-orange-600 hover:to-rose-600 active:scale-95 text-white font-black text-lg rounded-2xl transition-all shadow-2xl shadow-orange-300/50';

  return (
    <div className="flex flex-col h-full">
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center justify-center p-6 gap-6">
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2" aria-hidden>{countryFlag}</div>
            <h2 className="text-2xl font-black text-neutral-800 [overflow-wrap:anywhere]">{recipe.name}</h2>
            <p className="text-sm text-neutral-500 font-medium">{countryName} · {personas} · {recipe.time}</p>
          </div>

          <section className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3 max-w-md">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500">Tu lista de mercado</h3>
            <SummaryChips
              title="Conseguidos"
              titleClass="text-green-600"
              chipClass="bg-green-100 text-green-700"
              items={summary.obtained.map(i => ({ key: i.id, text: i.name }))}
            />
            <SummaryChips
              title="Reemplazados"
              titleClass="text-blue-600"
              chipClass="bg-blue-100 text-blue-700"
              items={summary.swapped.map(({ item, substitute }) => ({ key: item.id, text: `${item.name} → ${substitute}` }))}
            />
            <SummaryChips
              title="No conseguidos"
              titleClass="text-red-500"
              chipClass="bg-red-100 text-red-600"
              items={summary.missing.map(i => ({ key: i.id, text: i.name }))}
            />
            {noneMarked && (
              <p className="text-sm text-neutral-400 italic">No marcaste ingredientes. Sous asume que tienes todos.</p>
            )}
          </section>

          {session.started ? (
            <div className="w-full max-w-md space-y-3">
              <button type="button" onClick={continueChat} className={primaryCta}>
                <MessageSquare size={24} aria-hidden />
                Continuar la conversación
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestart(true)}
                className="w-full min-h-12 flex items-center justify-center gap-2 px-4 border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-95 text-neutral-700 font-bold text-base rounded-2xl transition-all shadow-sm"
              >
                Empezar de nuevo
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => startChat()} className={primaryCta}>
              <ChefHat size={24} aria-hidden />
              Empezar a cocinar con Sous
            </button>
          )}
        </div>
      </div>

      {confirmRestart && (
        <ConfirmDialog
          title="¿Empezar de nuevo?"
          description="Se borra la conversación guardada de esta receta y Sous empieza con tu lista de mercado actual."
          confirmLabel="Empezar de nuevo"
          destructive
          onCancel={() => setConfirmRestart(false)}
          onConfirm={() => {
            setConfirmRestart(false);
            startChat();
          }}
        />
      )}
    </div>
  );
};

interface CountryRowProps {
  country: Country;
  onSelectRecipe: (recipe: Recipe, country: Country) => void;
}

const CountryRow = ({ country, onSelectRecipe }: CountryRowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const Chevron = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full min-h-14 flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
      >
        <span className="text-2xl" aria-hidden>{country.flag}</span>
        <span className="flex-1 min-w-0 text-left font-bold text-neutral-800 truncate">{country.name}</span>
        <span className="text-xs text-neutral-400 font-medium mr-2">{country.recipes.length} recetas</span>
        <Chevron size={18} aria-hidden className="text-neutral-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <div id={panelId} className="border-t border-neutral-100 px-3 py-3">
          <ul className="space-y-1.5">
            {country.recipes.map(recipe => (
              <li key={recipe.name}>
                <button
                  type="button"
                  onClick={() => onSelectRecipe(recipe, country)}
                  className="w-full min-h-11 flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-50 hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all text-left group"
                >
                  <span className="flex-1 min-w-0">
                    <span className="block font-semibold text-sm text-neutral-800 group-hover:text-orange-700 transition-colors truncate">
                      {recipe.name}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${DIFFICULTY_CLASS[recipe.difficulty]}`}>
                        {recipe.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <Clock size={10} aria-hidden />
                        {recipe.time}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">{recipe.technique}</span>
                    </span>
                  </span>
                  <ChevronDown size={14} aria-hidden className="text-neutral-300 group-hover:text-orange-400 flex-shrink-0 -rotate-90 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const RegionSection = ({ region, onSelectRecipe }: { region: Region } & Pick<CountryRowProps, 'onSelectRecipe'>) => (
  <section className="mb-8">
    <h2 className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-black mb-4 ${REGION_CLASS[region.name]}`}>
      {region.name}
    </h2>
    <div className="space-y-3">
      {region.countries.map(country => (
        <CountryRow key={country.name} country={country} onSelectRecipe={onSelectRecipe} />
      ))}
    </div>
  </section>
);

const COUNTRY_COUNT = REGIONS.flatMap(r => r.countries).length;
const RECIPE_COUNT = REGIONS.flatMap(r => r.countries).flatMap(c => c.recipes).length;

export const FlavorsModule = () => {
  const [activeRecipe, setActiveRecipe] = useState<{ recipe: Recipe; country: Country } | null>(null);

  if (activeRecipe) {
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <RecipeFlow
          recipe={activeRecipe.recipe}
          countryName={activeRecipe.country.name}
          countryFlag={activeRecipe.country.flag}
          onBack={() => setActiveRecipe(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-5 md:p-8 w-full max-w-3xl mx-auto">
          <header className="mb-8 pb-5 border-b border-neutral-200">
            <h1 className="text-3xl font-black text-neutral-800 flex items-center gap-3">
              <Globe className="text-orange-500 flex-shrink-0" size={30} aria-hidden />
              Sabores del Mundo
            </h1>
            <p className="text-neutral-500 mt-1 text-sm font-medium">
              {RECIPE_COUNT} recetas de {COUNTRY_COUNT} países, agrupadas por región.
            </p>
          </header>

          {REGIONS.map(region => (
            <RegionSection
              key={region.name}
              region={region}
              onSelectRecipe={(recipe, country) => setActiveRecipe({ recipe, country })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
