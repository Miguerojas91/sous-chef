/**
 * Mealprep: el usuario elige hasta 7 recetas, revisa la lista de compras
 * consolidada y cocina con Sous.
 *
 * Pestañas:
 * - Recetas: selección del catálogo (`data/milprepRecipes.ts`).
 * - Mercado: ingredientes sumados y escalados por número de personas, con
 *   marca de "ya lo tengo", "no lo consigo" y sustitutos sugeridos.
 * - Cocinar: chat de texto (`useGeminiChat`) y voz (`useGeminiLive`). El
 *   system prompt se arma con las recetas, personas y cambios de ingredientes.
 *
 * Recetas, personas, pestaña y estado del chat se guardan en localStorage para
 * sobrevivir a un F5 o a salir y volver al módulo.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, ShoppingCart, BookOpen, MessageSquare, CheckCircle2, Clock, XCircle, RefreshCw, ChevronRight, Minus, Plus } from 'lucide-react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { EditableText } from './cms/EditableText';
import { MILPREP_RECIPES, type Recipe } from '../data/milprepRecipes';
import { QuickReplies } from './QuickReplies';
import { ChatMessage, ChatBubble } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { VoiceSessionView } from './VoiceSessionView';
import { ScreenHeader } from './ui/ScreenHeader';
import { Dialog, ConfirmDialog } from './ui/Dialog';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  getVoiceUsageSummary, hasReachedCap as voiceCapReached, FREE_CAP_SECONDS, PRO_CAP_SECONDS,
} from '../utils/voiceUsage';
import { isPremiumUser } from '../utils/membership';
import { track, Events } from '../utils/analytics';

const MILPREP_SESSION_KEY = 'sous_milprep_session';
const MILPREP_CHAT_KEY    = 'sous_chat_milprep';
const MAX_RECIPES = 7;
const MAX_PEOPLE = 20;

type Tab = 'mercado' | 'recetas' | 'chat';

interface MilprepSession {
  selectedRecipeIds: string[];
  peopleCount: number;
  chatStarted: boolean;
  activeTab: Tab;
}

function loadMilprepSession(): MilprepSession | null {
  try { return JSON.parse(localStorage.getItem(MILPREP_SESSION_KEY) ?? 'null'); }
  catch { return null; }
}
function saveMilprepSession(s: MilprepSession) {
  localStorage.setItem(MILPREP_SESSION_KEY, JSON.stringify(s));
}
function clearMilprepSession() {
  localStorage.removeItem(MILPREP_SESSION_KEY);
  localStorage.removeItem(MILPREP_CHAT_KEY);
}

function toast(msg: string, type: 'info' | 'warning' = 'info') {
  window.dispatchEvent(new CustomEvent('sous:toast', { detail: { msg, type } }));
}

const SUBSTITUTES_MAP: { keywords: string[]; options: string[] }[] = [
  { keywords: ['pechuga de pollo', 'muslo de pollo', 'pollo'], options: ['Pavo en trozos', 'Tofu firme', 'Cerdo magro'] },
  { keywords: ['carne molida', 'res', 'bistec', 'lomo de res'], options: ['Cerdo molido', 'Cordero', 'Pollo desmenuzado'] },
  { keywords: ['salmón', 'salmon'], options: ['Atún fresco', 'Tilapia', 'Pechuga de pollo'] },
  { keywords: ['atún', 'atun'], options: ['Salmón', 'Sardinas', 'Pollo desmenuzado'] },
  { keywords: ['camarón', 'camaron', 'camarones'], options: ['Calamar', 'Pollo', 'Tofu firme'] },
  { keywords: ['tocino', 'bacon'], options: ['Jamón serrano', 'Pavo ahumado', 'Champiñones salteados'] },
  { keywords: ['leche de vaca', 'leche'], options: ['Leche de almendras', 'Leche de avena', 'Leche de coco'] },
  { keywords: ['mantequilla'], options: ['Aceite de oliva', 'Margarina vegetal', 'Aceite de coco'] },
  { keywords: ['queso parmesano', 'queso mozzarella', 'queso'], options: ['Queso de cabra', 'Levadura nutricional', 'Tofu desmenuzado'] },
  { keywords: ['huevo', 'huevos'], options: ['Linaza molida + agua', 'Tofu sedoso', 'Aquafaba'] },
  { keywords: ['crema', 'nata'], options: ['Leche de coco', 'Yogur griego', 'Leche evaporada'] },
  { keywords: ['arroz blanco', 'arroz integral', 'arroz'], options: ['Quinoa', 'Cuscús', 'Pasta integral'] },
  { keywords: ['papa', 'papas', 'patata'], options: ['Batata', 'Coliflor', 'Yuca'] },
  { keywords: ['pasta', 'fideos', 'espagueti'], options: ['Zucchini en espirales', 'Arroz', 'Quinoa'] },
  { keywords: ['lentejas'], options: ['Garbanzos', 'Frijoles negros', 'Quinoa'] },
  { keywords: ['garbanzos'], options: ['Lentejas', 'Frijoles blancos', 'Edamame'] },
  { keywords: ['espinaca', 'espinacas'], options: ['Acelga', 'Kale', 'Rúgula'] },
  { keywords: ['zanahoria', 'zanahorias'], options: ['Batata', 'Calabaza', 'Nabo'] },
  { keywords: ['brócoli', 'brocoli'], options: ['Coliflor', 'Espárragos', 'Judías verdes'] },
  { keywords: ['tomate', 'tomates'], options: ['Tomate enlatado', 'Pimiento rojo', 'Calabacín'] },
  { keywords: ['cebolla'], options: ['Cebollín', 'Puerro', 'Chalota'] },
  { keywords: ['ajo'], options: ['Ajo en polvo (¼ cdta)', 'Chalota', 'Cebollín'] },
  { keywords: ['champiñon', 'champiñones', 'hongos'], options: ['Berenjena', 'Zucchini', 'Tofu'] },
  { keywords: ['limón', 'limon'], options: ['Lima', 'Vinagre blanco', 'Naranja agria'] },
  { keywords: ['aceite de oliva'], options: ['Aceite de girasol', 'Aceite de coco', 'Mantequilla'] },
];

function getSuggestedSubstitutes(itemStr: string): string[] {
  const lower = itemStr.toLowerCase();
  // La palabra clave más larga gana: "aceite de oliva" antes que "oliva".
  const sorted = [...SUBSTITUTES_MAP].sort(
    (a, b) => Math.max(...b.keywords.map(k => k.length)) - Math.max(...a.keywords.map(k => k.length))
  );
  for (const entry of sorted) {
    if (entry.keywords.some(kw => lower.includes(kw.toLowerCase()))) {
      return entry.options;
    }
  }
  return [];
}

const getGroceryList = (selectedRecipes: Recipe[], people: number) => {
  const list: Record<string, string[]> = {
    'Verduras y Frutas': [],
    'Proteínas': [],
    'Lácteos y Refrigerados': [],
    'Despensa': [],
  };

  const aggregated: Record<string, Record<string, { amount: number; unit: string }>> = {
    'Verduras y Frutas': {},
    'Proteínas': {},
    'Lácteos y Refrigerados': {},
    'Despensa': {},
  };

  selectedRecipes.forEach(recipe => {
    recipe.ingredients.forEach(ing => {
      const cat = ing.category;
      if (!aggregated[cat]) aggregated[cat] = {};
      if (!aggregated[cat][ing.name]) {
        aggregated[cat][ing.name] = { amount: 0, unit: ing.unit };
      }
      aggregated[cat][ing.name].amount += ing.baseAmount * people;
    });
  });

  Object.keys(aggregated).forEach(cat => {
    list[cat] = Object.entries(aggregated[cat]).map(
      ([name, data]) => `${data.amount}${data.unit} de ${name}`
    );
  });

  return list;
};

const MILPREP_VOICE_PROMPT = `Eres Sous, un sous chef que guía el mealprep semanal. Siempre hablas en español latino neutro y tuteas. Eres práctico y claro.
Modo voz: habla natural, sin listas ni markdown. Frases cortas. No abras con elogios ni cierres ofreciendo más ayuda. No interrumpas el silencio del usuario: espera a que te hable.`;

const TABS: { id: Tab; icon: typeof BookOpen; elementKey: string; label: string }[] = [
  { id: 'recetas', icon: BookOpen,      elementKey: 'milprep_tab_recetas', label: 'Recetas' },
  { id: 'mercado', icon: ShoppingCart,  elementKey: 'milprep_tab_mercado', label: 'Mercado' },
  { id: 'chat',    icon: MessageSquare, elementKey: 'milprep_tab_chat',    label: 'Cocinar' },
];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const MilprepModule: React.FC = () => {
  // La sesión guardada se lee una sola vez al montar.
  const [_savedSession] = useState<MilprepSession | null>(loadMilprepSession);

  const [activeTab, setActiveTab] = useState<Tab>(_savedSession?.activeTab ?? 'recetas');
  const [peopleCount, setPeopleCount] = useState(_savedSession?.peopleCount ?? 1);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>(_savedSession?.selectedRecipeIds ?? []);
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [unavailableIngredients, setUnavailableIngredients] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  // Ingrediente original → sustituto elegido.
  const [swappedIngredients, setSwappedIngredients] = useState<Record<string, string>>({});

  const selectedRecipes = MILPREP_RECIPES.filter(r => selectedRecipeIds.includes(r.id));

  // El aviso sale solo al pasar de 6 a 7, no al restaurar una sesión con 7.
  const prevRecipeCount = useRef(selectedRecipeIds.length);
  useEffect(() => {
    if (selectedRecipeIds.length === MAX_RECIPES && prevRecipeCount.current < MAX_RECIPES) {
      setShowReadyBanner(true);
    }
    prevRecipeCount.current = selectedRecipeIds.length;
  }, [selectedRecipeIds.length]);

  const buildMilprepSystemPrompt = () => {
    const recetasList = selectedRecipes.map(r => `  • ${r.title} (${r.time})`).join('\n') || '  • Sin recetas seleccionadas';
    const swaps = Object.entries(swappedIngredients).map(([o, s]) => `  • ${o}: usar en su lugar ${s}`).join('\n');
    const pending = unavailableIngredients.filter(i => !(i in swappedIngredients));

    return `Eres Sous, un sous chef personal que acompaña al usuario durante su mealprep semanal. Siempre hablas en español latino neutro y tuteas. Eres paciente y claro.

Sesión de mealprep para ${plural(peopleCount, 'persona', 'personas')}.
Recetas de esta semana:
${recetasList}
${swaps ? `\nCambios de ingredientes confirmados:\n${swaps}` : ''}
${pending.length > 0 ? `\nIngredientes sin sustituto (el usuario no los consiguió): ${pending.join(', ')}` : ''}

Reglas de comunicación:
1. Explica todo como si le hablaras a alguien que nunca ha cocinado. No asumas conocimiento previo.
2. No uses términos técnicos sin explicarlos en la misma frase. Ejemplos:
   - Mal: "Sofríe la cebolla". Bien: "Calienta un poco de aceite en la sartén y pon la cebolla picada. Revuelve cada 30 segundos con una cuchara de madera hasta que se vea transparente y suave (unos 5 minutos)."
   - Mal: "Corta en brunoise". Bien: "Corta en cubos muy pequeños de unos 5 mm, como granos de arroz grandes."
   - Mal: "Estofar la carne". Bien: "Cocina la carne tapada a fuego bajo con un poco de líquido (agua, caldo o salsa) durante mucho tiempo, para que quede muy suave y jugosa."
3. Organiza cada respuesta con saltos de línea:
   - Listas numeradas (1. 2. 3.) para los pasos en orden.
   - Viñetas (•) para ingredientes o consejos.
   - Una línea en blanco entre secciones.
   - Nunca escribas todo en un solo párrafo.
4. Divide cada preparación en 3 etapas, con estos títulos en negrita y sin emojis:
   **Antes de prender el fuego:** lo que se alista antes de cocinar (picar, medir, marinar).
   **Preparación:** los pasos de cocción en orden.
   **Para servir o guardar:** cómo servir o guardar el resultado.
5. Aprovecha los tiempos de cocción para preparar otras cosas en paralelo, así el usuario termina antes.
6. Máximo 120 palabras por respuesta. Si hay más pasos, divídelos en partes y pregunta si está listo para continuar.
7. Responde solo temas de cocina relacionados con esta sesión.
8. No uses emojis en los títulos. No uses el carácter —. No abras con elogios ni cierres ofreciendo más ayuda.`;
  };

  const buildInitialMessage = () => {
    const recetasList = selectedRecipes.length > 0
      ? selectedRecipes.map(r => `  • ${r.title} (${r.time})`).join('\n')
      : '  • Sin recetas seleccionadas aún';
    const swapsList = Object.entries(swappedIngredients)
      .map(([o, s]) => `  • ${o}: ${s}`)
      .join('\n');
    const pending = unavailableIngredients.filter(i => !(i in swappedIngredients));

    let msg = `Hola Sous, quiero empezar mi mealprep de esta semana.\n\n`;
    msg += `Voy a cocinar para ${plural(peopleCount, 'persona', 'personas')}.\n\n`;
    msg += `Mis recetas de esta semana:\n${recetasList}`;
    if (swapsList) {
      msg += `\n\nCambié estos ingredientes:\n${swapsList}`;
    }
    if (pending.length > 0) {
      msg += `\n\nNo conseguí estos ingredientes: ${pending.join(', ')}`;
    }
    msg += `\n\n¿Por dónde empezamos?`;
    return msg;
  };

  const [chatStarted, setChatStarted] = useState(_savedSession?.chatStarted ?? false);
  // Con el chat activo el prompt se arma en cada render: así una sesión
  // restaurada tras un F5 y los cambios de ingredientes hechos después de
  // empezar llegan al modelo (el hook guarda el último valor en un ref).
  const systemPrompt = chatStarted ? buildMilprepSystemPrompt() : '';
  const { isLoading, messages, sendMessage, clearMessages } = useGeminiChat({ analyticsMode: 'milprep', systemPrompt, storageKey: MILPREP_CHAT_KEY });
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pendingMsgRef = useRef('');

  // Se actualiza en cada render para que el guardado al desmontar vea lo último.
  const latestSession = useRef<MilprepSession>({ selectedRecipeIds, peopleCount, chatStarted, activeTab });
  latestSession.current = { selectedRecipeIds, peopleCount, chatStarted, activeTab };

  const [voiceMode, setVoiceMode] = useState(false);
  useWakeLock(chatStarted || voiceMode);
  const voice = useGeminiLive(MILPREP_VOICE_PROMPT);

  useEffect(() => {
    if (voice.voiceState === 'cap-reached') {
      track(Events.VoiceCapReached, {
        is_premium: isPremiumUser(),
        used_min: Math.round(getVoiceUsageSummary().used / 60),
      });
    }
  }, [voice.voiceState]);

  const handleStartVoice = async () => {
    const premium = isPremiumUser();
    if (voiceCapReached()) {
      track(Events.VoiceCapBlocked, { is_premium: premium });
      toast(
        premium
          ? `Ya usaste tus ${PRO_CAP_SECONDS / 60} minutos de voz de este mes. Se renuevan el día 1.`
          : `Ya usaste tus ${FREE_CAP_SECONDS / 60} minutos de voz gratis. Con Premium tienes ${PRO_CAP_SECONDS / 60} al mes.`,
        'warning',
      );
      return;
    }
    track(Events.VoiceStarted, { is_premium: premium });
    if (!localStorage.getItem('sous_voice_onboarding_seen')) {
      localStorage.setItem('sous_voice_onboarding_seen', '1');
      const { minutesLeft } = getVoiceUsageSummary();
      toast(
        minutesLeft > 0
          ? `Modo manos libres: habla cuando quieras. Te quedan ${minutesLeft} minutos de voz este mes.`
          : 'Modo manos libres: habla cuando quieras.',
      );
    }
    setVoiceMode(true);
    await voice.startListening();
  };

  const handleExitVoice = () => {
    voice.disconnect();
    setVoiceMode(false);
  };

  const handleEndSession = () => {
    voice.disconnect();
    setVoiceMode(false);
    clearMilprepSession();
    clearMessages();
    setChatStarted(false);
    setSelectedRecipeIds([]);
    setPeopleCount(1);
    setCheckedIngredients([]);
    setUnavailableIngredients([]);
    setSwappedIngredients({});
    setExpandedItem(null);
    setActiveTab('recetas');
  };

  useEffect(() => {
    saveMilprepSession(latestSession.current);
  }, [selectedRecipeIds, peopleCount, chatStarted, activeTab]);

  useEffect(() => {
    return () => { saveMilprepSession(latestSession.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // Primer mensaje automático al arrancar el chat.
  useEffect(() => {
    if (!chatStarted) return;
    const msg = pendingMsgRef.current;
    if (!msg) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      pendingMsgRef.current = '';
      sendMessage(msg);
    }, 50);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatStarted]);

  const startChat = (extraQuestion?: string) => {
    pendingMsgRef.current = extraQuestion
      ? `${buildInitialMessage()}\n\n${extraQuestion}`
      : buildInitialMessage();
    setChatStarted(true);
    setActiveTab('chat');
  };

  // Desde la lista de compras: si el chat no ha empezado, la pregunta va
  // junto al mensaje inicial; si ya empezó, se envía directo.
  const askChef = (question: string) => {
    if (!chatStarted) {
      startChat(question);
      return;
    }
    if (isLoading) {
      toast('Espera a que Sous termine de responder.', 'warning');
      return;
    }
    sendMessage(question);
    setActiveTab('chat');
  };

  if (voiceMode) {
    return (
      <VoiceSessionView
        title="Mealprep"
        voiceState={voice.voiceState}
        transcript={voice.transcript}
        currentChefText={voice.currentChefText}
        voiceError={voice.voiceError}
        silenceSeconds={voice.silenceSeconds}
        onRetry={handleStartVoice}
        onWakeUp={voice.wakeUp}
        onTest={() => voice.sendTextToVoice('Hola Sous, ¿me escuchas?')}
        onExitVoice={handleExitVoice}
        onEndSession={handleEndSession}
      />
    );
  }

  if (activeTab === 'chat' && chatStarted) {
    // En móvil el chat ocupa toda la pantalla, igual que en Cocinemos.
    return (
      <div className="fixed inset-0 z-[60] h-dvh md:static md:z-auto md:h-full flex flex-col bg-neutral-50">
        <ScreenHeader
          title="Mealprep"
          subtitle={`${plural(selectedRecipes.length, 'receta', 'recetas')} · ${plural(peopleCount, 'persona', 'personas')}`}
          onBack={() => setActiveTab('mercado')}
          backLabel="Volver a la lista de compras (se guarda la conversación)"
          className="pt-[env(safe-area-inset-top)]"
          actions={
            <button
              type="button"
              onClick={() => setShowConfirmEnd(true)}
              className="min-h-11 px-3 rounded-control text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Terminar
            </button>
          }
        />

        {selectedRecipes.length > 0 && (
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

        <div
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversación con Sous"
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
        >
          {messages.length === 0 && !isLoading && (
            <p className="text-center mt-10 px-4 text-sm text-neutral-600">
              Escríbele a Sous o toca el micrófono para hablar con las manos libres.
            </p>
          )}
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} isChef={msg.agent === 'chef'}>
              <ChatMessage text={msg.text} isChef={msg.agent === 'chef'} />
            </ChatBubble>
          ))}
          <div ref={chatBottomRef} />
        </div>

        <QuickReplies onSend={sendMessage} loading={isLoading} />
        <ChatInputBar onSend={sendMessage} isLoading={isLoading} onStartVoice={handleStartVoice} />

        {showConfirmEnd && (
          <ConfirmDialog
            title="¿Terminar la sesión?"
            description="Se borran el chat, las recetas elegidas y la lista de esta semana."
            confirmLabel="Terminar"
            destructive
            onCancel={() => setShowConfirmEnd(false)}
            onConfirm={() => { setShowConfirmEnd(false); handleEndSession(); }}
          />
        )}
      </div>
    );
  }

  const groceryList = getGroceryList(selectedRecipes, peopleCount);
  const groceryCategories = Object.entries(groceryList).filter(([, items]) => items.length > 0);
  const allItems = Object.values(groceryList).flat();
  const allChecked = allItems.length > 0 && allItems.every(i => checkedIngredients.includes(i));
  const pendingUnavailable = unavailableIngredients.filter(i => !(i in swappedIngredients));
  const swappedCount = Object.keys(swappedIngredients).length;

  const toggleRecipe = (id: string) => {
    if (selectedRecipeIds.includes(id)) {
      setSelectedRecipeIds(prev => prev.filter(x => x !== id));
    } else if (selectedRecipeIds.length < MAX_RECIPES) {
      setSelectedRecipeIds(prev => [...prev, id]);
    } else {
      toast(`Ya elegiste ${MAX_RECIPES} recetas. Quita una para agregar otra.`, 'warning');
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
              <div className="flex items-center gap-1 bg-white rounded-control border border-neutral-200 pl-3">
                <span className="text-sm font-semibold text-neutral-700 mr-1">Personas</span>
                <button
                  type="button"
                  onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))}
                  disabled={peopleCount <= 1}
                  aria-label="Quitar una persona"
                  className="w-11 h-11 flex items-center justify-center rounded-control text-neutral-800 hover:bg-neutral-100 disabled:text-neutral-400"
                >
                  <Minus size={18} aria-hidden />
                </button>
                <span aria-live="polite" className="font-bold w-6 text-center tabular-nums">{peopleCount}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (peopleCount >= MAX_PEOPLE) {
                      toast(`El máximo es ${MAX_PEOPLE} personas.`, 'warning');
                    } else {
                      setPeopleCount(peopleCount + 1);
                    }
                  }}
                  aria-label="Agregar una persona"
                  className="w-11 h-11 flex items-center justify-center rounded-control text-neutral-800 hover:bg-neutral-100"
                >
                  <Plus size={18} aria-hidden />
                </button>
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
                  onClick={() => setCheckedIngredients(allChecked ? [] : allItems)}
                  className={`min-h-11 px-4 rounded-full border text-sm font-semibold transition-colors ${
                    allChecked
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {allChecked ? 'Desmarcar todo' : 'Ya tengo todo'}
                </button>

                {swappedCount > 0 && (
                  <p role="status" className="flex items-center gap-2 bg-white border border-neutral-200 rounded-card px-4 py-3 text-sm font-medium text-neutral-800">
                    <RefreshCw size={16} className="text-brand-700 flex-shrink-0" aria-hidden />
                    {swappedCount === 1 ? '1 ingrediente cambiado por un sustituto.' : `${swappedCount} ingredientes cambiados por sustitutos.`}
                  </p>
                )}

                {pendingUnavailable.length > 0 && (
                  <div role="status" className="bg-amber-50 border border-amber-200 rounded-card p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-amber-900 text-sm">
                        {plural(pendingUnavailable.length, 'ingrediente', 'ingredientes')} sin sustituto
                      </p>
                      <p className="text-sm text-amber-800">Sous puede sugerirte más opciones.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => askChef(`No consigo estos ingredientes: ${pendingUnavailable.join(', ')}. ¿Qué puedo usar como sustituto?`)}
                      className="min-h-11 px-4 rounded-control bg-brand-700 hover:bg-brand-800 text-white text-sm font-semibold flex-shrink-0"
                    >
                      Pedir sustitutos
                    </button>
                  </div>
                )}

                {groceryCategories.map(([category, items]) => (
                  <section key={category} aria-labelledby={`cat-${category}`}>
                    <h3 id={`cat-${category}`} className="text-sm font-semibold text-neutral-600 mb-2">{category}</h3>
                    <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                      {items.map((item) => {
                        const isChecked = checkedIngredients.includes(item);
                        const isUnavailable = unavailableIngredients.includes(item);
                        const isSwapped = item in swappedIngredients;
                        const swapName = swappedIngredients[item];
                        const isExpanded = expandedItem === item;
                        const suggestions = getSuggestedSubstitutes(item);
                        const panelId = `sust-${category}-${item}`.replace(/\s+/g, '-');

                        const toggleChecked = () => {
                          if (isUnavailable || isSwapped) return;
                          setCheckedIngredients(prev =>
                            isChecked ? prev.filter(i => i !== item) : [...prev, item]
                          );
                        };

                        const handleNoConsigo = () => {
                          if (isUnavailable) {
                            setUnavailableIngredients(prev => prev.filter(i => i !== item));
                            setExpandedItem(null);
                          } else {
                            setCheckedIngredients(prev => prev.filter(i => i !== item));
                            setUnavailableIngredients(prev => [...prev, item]);
                            setExpandedItem(item);
                          }
                        };

                        const handleSwap = (substitute: string) => {
                          setUnavailableIngredients(prev => prev.filter(i => i !== item));
                          setSwappedIngredients(prev => ({ ...prev, [item]: substitute }));
                          setExpandedItem(null);
                        };

                        const handleUndoSwap = () => {
                          setSwappedIngredients(prev => {
                            const next = { ...prev };
                            delete next[item];
                            return next;
                          });
                        };

                        return (
                          <li key={item} className={isUnavailable ? 'bg-red-50' : ''}>
                            <div className="flex items-center gap-2 pl-1 pr-3 py-1">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked}
                                aria-label={`Ya lo tengo: ${item}`}
                                disabled={isUnavailable || isSwapped}
                                onClick={toggleChecked}
                                className="w-11 h-11 flex items-center justify-center flex-shrink-0 rounded-control disabled:cursor-not-allowed"
                              >
                                <span
                                  aria-hidden
                                  className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                    isChecked ? 'bg-emerald-700 border-emerald-700 text-white' :
                                    isUnavailable || isSwapped ? 'border-neutral-200 bg-neutral-100' :
                                    'border-neutral-400'
                                  }`}
                                >
                                  {isChecked && <CheckCircle2 size={14} />}
                                </span>
                              </button>

                              <div className="flex-1 min-w-0 py-1.5">
                                <span className={`block text-sm [overflow-wrap:anywhere] ${
                                  isSwapped || isChecked ? 'line-through text-neutral-600' :
                                  isUnavailable ? 'line-through text-red-800' :
                                  'text-neutral-900'
                                }`}>{item}</span>
                                {isSwapped && (
                                  <span className="flex items-center gap-1.5 mt-0.5 text-sm font-semibold text-neutral-900 [overflow-wrap:anywhere]">
                                    <RefreshCw size={14} className="text-brand-700 flex-shrink-0" aria-hidden />
                                    <span className="sr-only">Sustituto:</span>
                                    {swapName}
                                  </span>
                                )}
                              </div>

                              {isSwapped ? (
                                <button
                                  type="button"
                                  onClick={handleUndoSwap}
                                  aria-label={`Deshacer el cambio de ${item}`}
                                  className="min-h-11 px-3 rounded-control text-xs font-semibold text-brand-700 hover:bg-brand-50 flex-shrink-0"
                                >
                                  Deshacer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleNoConsigo}
                                  aria-expanded={isUnavailable ? isExpanded : undefined}
                                  aria-controls={isUnavailable && isExpanded ? panelId : undefined}
                                  className={`min-h-11 px-3 flex items-center gap-1 rounded-control text-xs font-semibold transition-colors flex-shrink-0 ${
                                    isUnavailable
                                      ? 'bg-red-700 text-white hover:bg-red-800'
                                      : 'text-neutral-700 hover:bg-neutral-100'
                                  }`}
                                >
                                  <XCircle size={14} aria-hidden />
                                  {isUnavailable ? 'No disponible' : 'No lo consigo'}
                                </button>
                              )}
                            </div>

                            {isExpanded && (
                              <div id={panelId} className="px-4 pb-3 pt-1">
                                <p className="text-sm font-semibold text-neutral-700 mb-2">Sustitutos sugeridos</p>
                                {suggestions.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {suggestions.map((sub) => (
                                      <button
                                        key={sub}
                                        type="button"
                                        onClick={() => handleSwap(sub)}
                                        className="min-h-11 px-4 bg-white border border-neutral-300 rounded-full text-sm font-medium text-neutral-800 hover:bg-brand-50 hover:border-brand-200 transition-colors"
                                      >
                                        {sub}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-neutral-700 mb-2">No hay sustitutos sugeridos para este ingrediente.</p>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpandedItem(null);
                                    askChef(`No consigo "${item}". ¿Qué puedo usar como sustituto?`);
                                  }}
                                  className="min-h-11 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800"
                                >
                                  <ChefHat size={16} aria-hidden />
                                  Preguntar a Sous por más opciones
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))}
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
