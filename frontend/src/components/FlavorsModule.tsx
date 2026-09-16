/**
 * "Sabores del Mundo": recetas de cocina internacional agrupadas por región
 * y país (`data/flavorsRecipes.ts`).
 *
 * Flujo de cada receta: resumen y porciones → lista de mercado (marcar,
 * "no lo consigo", sustitutos) → chat con Sous. El prompt incluye lo que el
 * usuario consiguió o reemplazó. El chat alterna texto (SSE) y voz manos
 * libres (WebSocket) sin perder la conversación.
 */

import { useState, useId, useMemo } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Clock, ChefHat, Minus, Plus } from 'lucide-react';
import { ChatSessionScreen } from './ChatSessionScreen';
import { MarketList, MarketSummaryBanner } from './MarketItemRow';
import { ScreenHeader } from './ui/ScreenHeader';
import { useCookingChatSession } from '../hooks/useCookingChatSession';
import { useMarketList, type MarketItem, type MarketSummary } from '../hooks/useMarketList';
import { REGIONS, type Country, type Difficulty, type Recipe, type Region } from '../data/flavorsRecipes';
import { categorizeIngredient } from '../data/groceryCategories';

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Básico: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Intermedio: 'bg-amber-50 border-amber-200 text-amber-800',
  Difícil: 'bg-red-50 border-red-200 text-red-800',
};

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

type FlowStep = 'intro' | 'mercado' | 'chat';

const STEP_LABEL: Record<FlowStep, string> = {
  intro: 'Paso 1 de 3: receta',
  mercado: 'Paso 2 de 3: mercado',
  chat: 'Paso 3 de 3: cocinar',
};

const names = (items: MarketItem[]) => items.map(i => i.name);

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

const ServingsStepper = ({ servings, onChange }: { servings: number; onChange: (n: number) => void }) => (
  <div className="flex items-center gap-1 flex-shrink-0">
    <button
      type="button"
      onClick={() => onChange(Math.max(MIN_SERVINGS, servings - 1))}
      disabled={servings <= MIN_SERVINGS}
      aria-label="Una persona menos"
      className="w-11 h-11 rounded-full border border-neutral-300 bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-500 focus-visible:ring-2 focus-visible:ring-brand-700"
    >
      <Minus size={16} aria-hidden />
    </button>
    <span aria-live="polite" className="w-8 text-center text-lg font-extrabold text-neutral-900 tabular-nums">
      <span className="sr-only">Personas: </span>{servings}
    </span>
    <button
      type="button"
      onClick={() => onChange(Math.min(MAX_SERVINGS, servings + 1))}
      disabled={servings >= MAX_SERVINGS}
      aria-label="Una persona más"
      className="w-11 h-11 rounded-full border border-neutral-300 bg-white text-neutral-800 flex items-center justify-center hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-500 focus-visible:ring-2 focus-visible:ring-brand-700"
    >
      <Plus size={16} aria-hidden />
    </button>
  </div>
);

const PrimaryFooterButton = ({ onClick, children }: { onClick: () => void; children: ReactNode }) => (
  <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-neutral-200">
    <button
      type="button"
      onClick={onClick}
      className="w-full max-w-2xl mx-auto min-h-12 flex items-center justify-center gap-2 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base rounded-control transition-colors"
    >
      {children}
    </button>
  </div>
);

const SummaryChips = ({ title, titleClass, chipClass, items }: {
  title: string; titleClass: string; chipClass: string; items: { key: string; text: string }[];
}) => items.length === 0 ? null : (
  <div>
    <p className={`text-sm font-semibold mb-1 ${titleClass}`}>{title}</p>
    <ul className="flex flex-wrap gap-1.5">
      {items.map(i => <li key={i.key} className={`text-sm border px-2.5 py-1 rounded-full ${chipClass}`}>{i.text}</li>)}
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
  const [chatStarted, setChatStarted] = useState(false);

  const items = useMemo<MarketItem[]>(
    () => recipe.ingredients.map(name => ({ id: name, name, label: name, category: categorizeIngredient(name) })),
    [recipe],
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
    keepAwake: chatStarted,
  });

  /** Arranca el chat con el resumen del mercado; `question` reemplaza el pedido de guía. */
  const startChat = (question?: string) => {
    const swaps = summary.swapped.map(({ item, substitute }) => `${item.name} por ${substitute}`);
    let msg = `Hola Sous, voy a preparar "${recipe.name}" para ${personas}.`;
    if (swaps.length > 0) msg += ` Cambié estos ingredientes: ${swaps.join(', ')}.`;
    if (summary.missing.length > 0) msg += ` No pude conseguir: ${names(summary.missing).join(', ')}.`;
    msg += question ? ` ${question}` : ' Guíame paso a paso.';
    session.start(msg);
    setChatStarted(true);
    setStep('chat');
  };

  const handleBack = () => {
    if (step === 'intro') { onBack(); return; }
    if (step === 'mercado') { setStep('intro'); return; }
    setStep('mercado');
  };

  if (step === 'chat' && chatStarted) {
    return (
      <ChatSessionScreen
        session={session}
        title={recipe.name}
        subtitle={`${countryFlag} ${countryName} · ${personas}`}
        onBack={() => setChatStarted(false)}
        backLabel="Volver al resumen de la receta"
        endDescription="Se borra el chat de esta receta."
        onEnd={() => { setChatStarted(false); setStep('intro'); }}
      />
    );
  }

  const header = (
    <ScreenHeader
      title={recipe.name}
      subtitle={`${countryFlag} ${countryName} · ${STEP_LABEL[step]}`}
      onBack={handleBack}
      backLabel={step === 'intro' ? 'Volver a Sabores del Mundo' : 'Volver al paso anterior'}
    />
  );

  if (step === 'intro') return (
    <div className="flex flex-col h-full bg-neutral-50">
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6 space-y-4 max-w-2xl w-full mx-auto">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-semibold bg-white border border-neutral-200 text-neutral-700 px-3 py-1 rounded-full">{recipe.technique}</span>
            <span className={`text-xs font-semibold border px-3 py-1 rounded-full ${DIFFICULTY_CLASS[recipe.difficulty]}`}>{recipe.difficulty}</span>
            <span className="flex items-center gap-1 text-xs font-semibold text-neutral-700 bg-white px-3 py-1 rounded-full border border-neutral-200">
              <Clock size={12} aria-hidden />{recipe.time}
            </span>
          </div>

          <p className="text-base text-neutral-800 leading-relaxed">{recipe.description}</p>

          <div className="bg-white border border-neutral-200 rounded-card pl-4 pr-2 py-2 flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-neutral-900">¿Para cuántas personas?</span>
            <ServingsStepper servings={servings} onChange={setServings} />
          </div>

          <section className="bg-white border border-neutral-200 rounded-card p-4">
            <h2 className="text-sm font-semibold text-neutral-600 mb-2">Ingredientes</h2>
            <ul className="flex flex-wrap gap-1.5">
              {recipe.ingredients.map(ing => (
                <li key={ing} className="text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 px-2.5 py-1 rounded-full">{ing}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <PrimaryFooterButton onClick={() => setStep('mercado')}>
        <ShoppingCart size={18} aria-hidden />
        Ir al mercado
      </PrimaryFooterButton>
    </div>
  );

  if (step === 'mercado') {
    const unchecked = market.uncheckedCount;
    return (
      <div className="flex flex-col h-full bg-neutral-50">
        {header}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-2xl w-full mx-auto space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p role="status" className="min-w-0 text-sm font-semibold text-neutral-900">
                {unchecked > 0
                  ? `${unchecked} ingrediente${unchecked !== 1 ? 's' : ''} pendiente${unchecked !== 1 ? 's' : ''}`
                  : '¡Todo listo!'}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm text-neutral-600">Personas</span>
                <ServingsStepper servings={servings} onChange={setServings} />
              </div>
            </div>

            <MarketSummaryBanner market={market} onAskChef={startChat} />
            <MarketList items={items} market={market} onAskChef={startChat} />
          </div>
        </div>

        <PrimaryFooterButton onClick={() => setStep('chat')}>Manos a la obra</PrimaryFooterButton>
      </div>
    );
  }

  const noneMarked = summary.obtained.length === 0 && summary.swapped.length === 0 && summary.missing.length === 0;

  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {header}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6 max-w-md w-full mx-auto space-y-5">
          <div className="text-center">
            <div className="text-4xl mb-2" aria-hidden>{countryFlag}</div>
            <h2 className="text-xl md:text-2xl font-extrabold text-neutral-900 [overflow-wrap:anywhere]">{recipe.name}</h2>
            <p className="text-sm text-neutral-600 mt-1">{countryName} · {personas} · {recipe.time}</p>
          </div>

          <section className="bg-white border border-neutral-200 rounded-card p-4 space-y-3">
            <h3 className="text-sm font-semibold text-neutral-600">Tu lista de mercado</h3>
            <SummaryChips
              title="Conseguidos"
              titleClass="text-emerald-800"
              chipClass="bg-emerald-50 border-emerald-200 text-emerald-800"
              items={summary.obtained.map(i => ({ key: i.id, text: i.name }))}
            />
            <SummaryChips
              title="Reemplazados"
              titleClass="text-neutral-800"
              chipClass="bg-neutral-50 border-neutral-200 text-neutral-800"
              items={summary.swapped.map(({ item, substitute }) => ({ key: item.id, text: `${item.name} por ${substitute}` }))}
            />
            <SummaryChips
              title="No conseguidos"
              titleClass="text-red-800"
              chipClass="bg-red-50 border-red-200 text-red-800"
              items={summary.missing.map(i => ({ key: i.id, text: i.name }))}
            />
            {noneMarked && (
              <p className="text-sm text-neutral-600">No marcaste ingredientes. Sous asume que tienes todos.</p>
            )}
          </section>

          <button
            type="button"
            onClick={() => startChat()}
            className="w-full min-h-12 flex items-center justify-center gap-2 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base rounded-control transition-colors"
          >
            <ChefHat size={20} aria-hidden />
            Empezar a cocinar con Sous
          </button>
        </div>
      </div>
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

  return (
    <div className="bg-white rounded-card border border-neutral-200 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="w-full min-h-14 flex items-center gap-3 px-4 text-left hover:bg-neutral-50 transition-colors"
      >
        <span className="text-2xl" aria-hidden>{country.flag}</span>
        <span className="flex-1 min-w-0 font-bold text-neutral-900 truncate">{country.name}</span>
        <span className="text-sm text-neutral-600">{country.recipes.length} recetas</span>
        <ChevronDown
          size={20}
          aria-hidden
          className={`text-neutral-500 flex-shrink-0 transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <ul id={panelId} className="border-t border-neutral-200 divide-y divide-neutral-100">
          {country.recipes.map(recipe => (
            <li key={recipe.name}>
              <button
                type="button"
                onClick={() => onSelectRecipe(recipe, country)}
                className="w-full min-h-14 flex items-center gap-3 px-4 py-2.5 text-left hover:bg-neutral-50 transition-colors"
              >
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-sm text-neutral-900 [overflow-wrap:anywhere]">{recipe.name}</span>
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-neutral-600">
                    <span className={`font-semibold px-2 py-0.5 rounded-full border ${DIFFICULTY_CLASS[recipe.difficulty]}`}>
                      {recipe.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} aria-hidden />
                      {recipe.time}
                    </span>
                    <span>{recipe.technique}</span>
                  </span>
                </span>
                <ChevronRight size={20} aria-hidden className="text-neutral-500 flex-shrink-0" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const RegionSection = ({ region, onSelectRecipe }: { region: Region } & Pick<CountryRowProps, 'onSelectRecipe'>) => (
  <section>
    <h2 className="text-sm font-semibold text-neutral-600 mb-2">{region.name}</h2>
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
      <div className="flex flex-col h-full">
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
    <div className="flex flex-col h-full bg-neutral-50">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 md:p-6 w-full max-w-3xl mx-auto">
          <header className="mb-5">
            <h1 className="text-xl md:text-2xl font-extrabold text-neutral-900">Sabores del Mundo</h1>
            <p className="text-sm text-neutral-600 mt-1">
              {RECIPE_COUNT} recetas de {COUNTRY_COUNT} países, agrupadas por región.
            </p>
          </header>

          <div className="space-y-6">
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
    </div>
  );
};
