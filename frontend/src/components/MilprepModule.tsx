import React, { useState, useEffect, useRef } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { ChefHat, ShoppingCart, BookOpen, MessageSquare, Send, Mic, CalendarDays, CheckCircle2, Clock, XCircle, HelpCircle, RefreshCw, X } from 'lucide-react';
import { EditableText } from './cms/EditableText';
import { useGeminiLive } from '../hooks/useGeminiLive';

import { MILPREP_RECIPES, type Recipe } from '../data/milprepRecipes';
import { QuickReplies } from './QuickReplies';

// ── Mapa de sustitutos por palabras clave ──────────────────────────────────
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
  // busca la coincidencia más específica (keyword más largo primero)
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

export const MilprepModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mercado' | 'recetas' | 'chat'>('recetas');
  const [peopleCount, setPeopleCount] = useState(1);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<string[]>([]);
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [checkedIngredients, setCheckedIngredients] = useState<string[]>([]);
  const [unavailableIngredients, setUnavailableIngredients] = useState<string[]>([]);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  // original item string → substitute chosen
  const [swappedIngredients, setSwappedIngredients] = useState<Record<string, string>>({});
  
  const selectedRecipes = MILPREP_RECIPES.filter(r => selectedRecipeIds.includes(r.id));

  useEffect(() => {
    if (selectedRecipeIds.length === 7) {
      setShowReadyBanner(true);
    }
  }, [selectedRecipeIds.length]);

  // Construye el system prompt con contexto real de la sesión
  const buildMilprepSystemPrompt = () => {
    const recetasList = selectedRecipes.map(r => `- ${r.title} (${r.time})`).join('\n') || '- Sin recetas seleccionadas';
    const swaps = Object.entries(swappedIngredients).map(([o, s]) => `- ${o} → ${s}`).join('\n');
    const pending = unavailableIngredients.filter(i => !(i in swappedIngredients));

    return `Eres Sous, sous chef experto en meal prep semanal. Siempre hablas en español. Eres práctico, motivador y organizado.

SESIÓN DE MEALPREP — ${peopleCount} persona${peopleCount !== 1 ? 's' : ''}:
${recetasList}
${swaps ? `\nSUSTITUTOS DE INGREDIENTES:\n${swaps}` : ''}
${pending.length > 0 ? `\nINGREDIENTES NO DISPONIBLES: ${pending.join(', ')}` : ''}

Tu rol: guiar en orden de preparación eficiente (batch cooking), dar tips de conservación y almacenamiento, motivar al usuario. Adapta la guía a los ingredientes disponibles y sus sustitutos. Responde solo temas de cocina. Máximo 60 palabras por respuesta.`;
  };

  // Chat state
  const [systemPrompt, setSystemPrompt] = useState<string | undefined>(undefined);
  const { isConnected, isLoading, messages, sendMessage } = useGeminiChat({ mode: 'milprep', systemPrompt });
  const [inputText, setInputText] = useState("");
  const [chatStarted, setChatStarted] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const pendingMsgRef = useRef('');

  // ── Modo voz (Gemini Live) ───────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(false);
  const MILPREP_VOICE_PROMPT = `Eres Sous, chef experto en meal prep semanal. Siempre hablas en español. Eres práctico y motivador.\nMODO VOZ: Habla naturalmente, sin listas ni markdown. Frases cortas. No interrumpas el silencio del usuario. Espera que te hable.`;
  const { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp } = useGeminiLive(MILPREP_VOICE_PROMPT);

  const handleStartVoice = async () => {
    setVoiceMode(true);
    await startListening();
  };

  // Auto-scroll en chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensaje inicial automático cuando arranca el chat
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

  const handleSend = () => {
      if (inputText.trim() && !isLoading) {
          sendMessage(inputText.trim());
          setInputText("");
      }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <div className="bg-white p-6 border-b border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3 text-orange-600">
            <CalendarDays className="w-8 h-8" />
            <EditableText elementKey="milprep_header_title" defaultText="Mealprep" />
          </h1>
          <p className="text-gray-500 mt-1">
             <EditableText elementKey="milprep_header_subtitle" defaultText="Tu menú de la semana, de forma inteligente y guiada." as="span" />
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {isConnected ? 'Chef Conectado' : 'Offline'}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto flex">
          <button 
            onClick={() => setActiveTab('recetas')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'recetas' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <BookOpen className="w-5 h-5" />
            <EditableText elementKey="milprep_tab_recetas" defaultText="Recetas de la Semana" />
          </button>
          <button 
            onClick={() => setActiveTab('mercado')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'mercado' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <ShoppingCart className="w-5 h-5" />
            <EditableText elementKey="milprep_tab_mercado" defaultText="Lista de Mercado" />
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium transition-colors ${activeTab === 'chat' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <EditableText elementKey="milprep_tab_chat" defaultText="Manos a la Obra" />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto h-full">
          
          {/* TAB: RECETAS */}
          {activeTab === 'recetas' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Catálogo de Recetas</h2>
                <p className="text-sm text-neutral-400">Elige 7 recetas</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MILPREP_RECIPES.map((recipe) => {
                  const isSelected = selectedRecipeIds.includes(recipe.id);
                  const toggleSelection = () => {
                    if (isSelected) {
                        setSelectedRecipeIds(prev => prev.filter(id => id !== recipe.id));
                    } else if (selectedRecipeIds.length < 7) {
                        setSelectedRecipeIds(prev => [...prev, recipe.id]);
                    }
                  };

                  return (
                  <div key={recipe.id} onClick={toggleSelection} className={`bg-white rounded-2xl shadow-sm border ${isSelected ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-100'} overflow-hidden hover:shadow-md transition-all cursor-pointer group relative`}>
                    <div className="h-40 overflow-hidden relative">
                      <img src={recipe.img} alt={recipe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${isSelected ? 'bg-orange-500 text-white' : 'bg-white text-gray-300'}`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-gray-800 line-clamp-2 min-h-[3rem]">
                          <EditableText elementKey={`milprep_rec_${recipe.id}_title`} defaultText={recipe.title} as="span" />
                      </h3>
                      <div className="flex items-center gap-2 text-gray-500 text-sm mt-3">
                        <Clock className="w-4 h-4" />
                        <span>{recipe.time}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: MERCADO */}
          {activeTab === 'mercado' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart className="text-orange-500 w-6 h-6" />
                  Tu lista para esta semana
                </h2>
                <div className="flex items-center justify-between sm:justify-end gap-4 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <span className="text-sm font-semibold text-gray-600">Porciones/Personas:</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setPeopleCount(Math.max(1, peopleCount - 1))} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300 transition-colors">-</button>
                    <span className="font-bold w-4 text-center">{peopleCount}</span>
                    <button onClick={() => setPeopleCount(peopleCount + 1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-200 text-gray-600 hover:text-orange-600 hover:border-orange-300 transition-colors">+</button>
                  </div>
                </div>
              </div>
              
              {/* Banner ingredientes no disponibles (excluye los ya cambiados) */}
              {(() => {
                const pending = unavailableIngredients.filter(i => !(i in swappedIngredients));
                const swappedCount = Object.keys(swappedIngredients).length;
                if (pending.length === 0 && swappedCount === 0) return null;
                return (
                  <div className="mb-6 space-y-2">
                    {swappedCount > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-center gap-2">
                        <RefreshCw size={15} className="text-blue-500 flex-shrink-0" />
                        <p className="text-sm font-semibold text-blue-700">
                          {swappedCount} ingrediente{swappedCount > 1 ? 's cambiados' : ' cambiado'} por sustituto ✓
                        </p>
                      </div>
                    )}
                    {pending.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-red-500 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-red-700 text-sm">
                              {pending.length} ingrediente{pending.length > 1 ? 's' : ''} sin sustituto
                            </p>
                            <p className="text-xs text-red-500">El chef puede ayudarte con más opciones</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const lista = pending.join(', ');
                            setInputText(`No consigo estos ingredientes: ${lista}. ¿Qué puedo usar como sustituto?`);
                            setChatStarted(true);
                            setActiveTab('chat');
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all flex-shrink-0"
                        >
                          <HelpCircle size={13} />
                          Pedir sustitutos
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {Object.entries(getGroceryList(selectedRecipes, peopleCount)).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-bold text-gray-700 bg-orange-50 px-3 py-1 rounded-md mb-3 inline-block shadow-sm text-sm uppercase tracking-wider">{category}</h3>
                    <ul className="space-y-2">
                      {items.map((item, idx) => {
                        const isChecked = checkedIngredients.includes(item);
                        const isUnavailable = unavailableIngredients.includes(item);
                        const isSwapped = item in swappedIngredients;
                        const swapName = swappedIngredients[item];
                        const isExpanded = expandedItem === item;
                        const suggestions = getSuggestedSubstitutes(item);

                        const toggleChecked = () => {
                          if (isUnavailable || isSwapped) return;
                          setCheckedIngredients(prev =>
                            isChecked ? prev.filter(i => i !== item) : [...prev, item]
                          );
                        };

                        const handleNoConsigo = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          if (isUnavailable) {
                            // desmarcar → vuelve a normal y cierra panel
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

                        const handleUndoSwap = (e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSwappedIngredients(prev => {
                            const next = { ...prev };
                            delete next[item];
                            return next;
                          });
                        };

                        return (
                          <li key={idx} className="rounded-xl overflow-hidden transition-all">
                            {/* Fila principal */}
                            <div className={`flex items-center gap-3 px-3 py-2.5 transition-all border ${
                              isSwapped    ? 'bg-blue-50 border-blue-100' :
                              isChecked    ? 'bg-green-50 border-green-100' :
                              isUnavailable ? 'bg-red-50 border-red-200' :
                              'border-transparent hover:bg-gray-50'
                            }`}>

                              {/* Checkbox conseguido */}
                              <button onClick={toggleChecked}
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all border-2 ${
                                  isSwapped    ? 'border-blue-300 bg-blue-50 cursor-not-allowed' :
                                  isChecked    ? 'bg-green-500 border-green-500' :
                                  isUnavailable ? 'border-red-300 bg-red-50 cursor-not-allowed' :
                                  'border-gray-300 hover:border-green-400'
                                }`}>
                                {isChecked && <CheckCircle2 size={13} className="text-white" />}
                              </button>

                              {/* Nombre del ingrediente */}
                              <div className="flex-1">
                                <span className={`text-sm transition-all break-words ${
                                  isSwapped    ? 'line-through text-gray-400' :
                                  isChecked    ? 'line-through text-gray-400' :
                                  isUnavailable ? 'line-through text-red-400' :
                                  'text-gray-700'
                                }`}>{item}</span>
                                {/* Badge del sustituto elegido */}
                                {isSwapped && (
                                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                    <RefreshCw size={11} className="text-blue-500 flex-shrink-0" />
                                    <span className="text-xs font-semibold text-blue-600 break-words">{swapName}</span>
                                    <button onClick={handleUndoSwap} className="text-xs font-semibold text-blue-400 hover:text-blue-700 underline underline-offset-2 flex-shrink-0">deshacer</button>
                                  </div>
                                )}
                              </div>

                              {/* Botón "No lo consigo" / estado swapped */}
                              {isSwapped ? (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-600 flex-shrink-0">
                                  <RefreshCw size={11} />
                                  Cambiado
                                </span>
                              ) : (
                                <button onClick={handleNoConsigo}
                                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                                    isUnavailable
                                      ? 'bg-red-400 text-white'
                                      : 'bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500'
                                  }`}>
                                  <XCircle size={12} />
                                  {isUnavailable ? 'No disponible' : 'No lo consigo'}
                                </button>
                              )}
                            </div>

                            {/* Panel de sustitutos — aparece cuando está expandido */}
                            {isExpanded && (
                              <div className="bg-red-50 border border-red-200 border-t-0 rounded-b-xl px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-2">
                                  Sustitutos sugeridos
                                </p>
                                {suggestions.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {suggestions.map((sub) => (
                                      <button
                                        key={sub}
                                        onClick={() => handleSwap(sub)}
                                        className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all shadow-sm"
                                      >
                                        {sub}
                                      </button>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-red-400 italic mb-3">No hay sustitutos predefinidos para este ingrediente.</p>
                                )}
                                <button
                                  onClick={() => {
                                    setInputText(`No consigo "${item}". ¿Qué puedo usar como sustituto?`);
                                    setChatStarted(true);
                                    setActiveTab('chat');
                                    setExpandedItem(null);
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors"
                                >
                                  <ChefHat size={13} />
                                  Preguntar al chef por más opciones →
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón Siguiente — tab mercado */}
          {activeTab === 'mercado' && (
            <div className="fixed bottom-20 right-4 z-40">
              <button
                onClick={() => setActiveTab('chat')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm bg-orange-500 text-white hover:bg-orange-600 active:scale-95 transition-all shadow-orange-400/40"
              >
                Manos a la obra →
              </button>
            </div>
          )}

          {/* TAB: CHAT (Manos a la obra) */}
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 bg-neutral-50 rounded-2xl border border-neutral-100 shadow-sm overflow-hidden relative">

              {/* ── Overlay de modo voz ── */}
              {voiceMode && (() => {
                const isConnecting   = voiceState === 'connecting';
                const isSpeaking     = voiceState === 'speaking';
                const isVoiceListening = voiceState === 'listening';
                const isReconnecting = voiceState === 'reconnecting';
                const needsTap       = voiceState === 'needs-tap';
                const isSleeping     = voiceState === 'sleeping';
                const silenceLeft    = Math.max(0, 30 - silenceSeconds);
                return (
                  <div className="absolute inset-0 z-10 flex flex-col bg-neutral-950 overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
                      <div className="relative mb-6">
                        {isSpeaking && (
                          <>
                            <span className="absolute inset-[-16px] rounded-full border-2 border-orange-500/30 animate-ping" />
                            <span className="absolute inset-[-8px] rounded-full border-2 border-orange-500/50 animate-pulse" />
                          </>
                        )}
                        {isVoiceListening && <span className="absolute inset-[-8px] rounded-full border-2 border-green-500/40 animate-pulse" />}
                        {isReconnecting && <span className="absolute inset-[-8px] rounded-full border-2 border-yellow-500/40 animate-ping" />}
                        {isVoiceListening && silenceSeconds > 10 && <span className="absolute inset-[-12px] rounded-full border-2 border-neutral-600/60 animate-pulse" />}
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-colors duration-500 ${
                          isSpeaking       ? 'bg-orange-500/20 ring-2 ring-orange-500/50' :
                          isVoiceListening ? 'bg-green-500/10 ring-2 ring-green-500/30' :
                          isReconnecting   ? 'bg-yellow-500/10 ring-2 ring-yellow-500/30' :
                          needsTap         ? 'bg-blue-500/10 ring-2 ring-blue-500/30' :
                          isSleeping       ? 'bg-neutral-800/50 ring-2 ring-neutral-700/30' : 'bg-neutral-800'
                        }`}>
                          {isSleeping ? '😴' : '👨‍🍳'}
                        </div>
                      </div>

                      {voiceError && (
                        <div className="mb-3 px-4 py-2.5 bg-red-500/20 border border-red-500/40 rounded-2xl max-w-xs text-center">
                          <p className="text-red-300 text-sm font-medium">{voiceError}</p>
                          <button onClick={handleStartVoice} className="mt-2 text-xs text-red-400 underline">Intentar de nuevo</button>
                        </div>
                      )}

                      {!voiceError && (
                        <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors duration-300 ${
                          isSpeaking       ? 'text-orange-400' :
                          isVoiceListening ? (silenceSeconds > 10 ? 'text-neutral-500' : 'text-green-400') :
                          isReconnecting   ? 'text-yellow-400 animate-pulse' :
                          needsTap         ? 'text-blue-400 animate-pulse' :
                          isSleeping       ? 'text-neutral-600' :
                          isConnecting     ? 'text-yellow-400 animate-pulse' : 'text-neutral-500'
                        }`}>
                          {isConnecting    && 'Conectando con Sous…'}
                          {isVoiceListening && (silenceSeconds > 10 ? `Sous descansará en ${silenceLeft}s sin voz` : 'Escuchando · habla cuando quieras')}
                          {isSpeaking      && 'Sous está hablando'}
                          {isReconnecting  && 'Reconectando…'}
                          {needsTap        && 'Toca para continuar la conversación'}
                          {isSleeping      && 'Sous está descansando · di algo para despertar'}
                        </p>
                      )}

                      <div className="w-full max-w-sm min-h-[80px] flex items-center justify-center">
                        {(currentChefText || (transcript.length > 0 && !isSpeaking)) && (
                          <p className={`text-center text-base leading-relaxed transition-all duration-300 ${isSpeaking ? 'text-white' : 'text-neutral-400'}`}>
                            {isSpeaking ? currentChefText : transcript[transcript.length - 1]?.agent === 'chef' ? transcript[transcript.length - 1].text : ''}
                          </p>
                        )}
                        {!currentChefText && transcript.length === 0 && isVoiceListening && (
                          <p className="text-neutral-600 text-sm text-center">Puedes hablar, hacer preguntas o simplemente cocinar en silencio. Sous está contigo.</p>
                        )}
                        {needsTap && (
                          <button onClick={handleStartVoice} className="mt-2 flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-2xl px-8 py-4 transition-colors">
                            <span className="text-3xl">🎙️</span>
                            <span className="text-blue-300 text-sm font-semibold">Continuar conversación</span>
                            <span className="text-blue-400/70 text-xs">La pantalla se bloqueó y el micrófono se detuvo</span>
                          </button>
                        )}
                        {isSleeping && (
                          <button onClick={wakeUp} className="mt-2 flex flex-col items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl px-8 py-4 transition-colors">
                            <span className="text-3xl">👆</span>
                            <span className="text-neutral-300 text-sm font-semibold">Despertar a Sous</span>
                            <span className="text-neutral-500 text-xs">O simplemente habla, te estoy escuchando</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4">
                      <div className="flex items-end justify-center gap-1 h-6 mb-4">
                        {[2, 4, 7, 5, 8, 4, 3, 6, 4, 2].map((h, i) => (
                          <div key={i} className={`w-1 rounded-full transition-all duration-200 ${
                            isSpeaking       ? 'bg-orange-400' :
                            isVoiceListening ? 'bg-green-500' :
                            isReconnecting   ? 'bg-yellow-500' :
                            isSleeping       ? 'bg-neutral-800' : 'bg-neutral-700'
                          }`} style={{ height: (isSpeaking || isVoiceListening || isReconnecting) ? `${h * 2}px` : '3px', transition: `height ${150 + i * 20}ms ease-in-out` }} />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <button onClick={() => { disconnect(); setVoiceMode(false); }} className="text-xs text-neutral-500 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-neutral-800">
                          Terminar sesión de voz
                        </button>
                        <div className="flex items-center gap-2">
                          {isVoiceListening && (
                            <button onClick={() => sendTextToVoice('Hola Sous, ¿me escuchas?')} className="text-xs text-yellow-400 border border-yellow-400/30 px-3 py-2 rounded-full hover:bg-yellow-400/10 transition-colors">
                              Probar
                            </button>
                          )}
                          <button onClick={() => { disconnect(); setVoiceMode(false); }} className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold px-4 py-2.5 rounded-full transition-colors">
                            <X className="w-4 h-4" />
                            Salir
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ── Header del chat ── */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <ChefHat className="text-orange-500 w-4 h-4" />
                  <div>
                    <span className="text-sm font-bold text-neutral-700 block leading-tight">Chef Sous</span>
                    <span className="text-[10px] text-neutral-400 leading-tight">Mealprep · {selectedRecipes.length} recetas · {peopleCount} persona{peopleCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <button
                  onClick={() => setChatStarted(false)}
                  className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 rounded-full hover:bg-red-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  Terminar sesión
                </button>
              </div>

              {/* ── Pantalla de inicio antes del chat ── */}
              {!chatStarted ? (
                <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
                  <div className="text-6xl mb-5">🍳</div>
                  <h3 className="text-xl font-black text-neutral-800 text-center mb-2">¿Listo para cocinar?</h3>
                  <p className="text-sm text-neutral-500 text-center mb-2">
                    Tienes <span className="font-bold text-orange-500">{selectedRecipes.length} recetas</span> seleccionadas para esta semana.
                  </p>
                  <p className="text-sm text-neutral-400 text-center mb-8">Tu sous chef te guiará paso a paso durante la preparación.</p>

                  {selectedRecipes.length > 0 && (
                    <div className="w-full max-w-xs space-y-1.5 mb-8">
                      {selectedRecipes.map(r => (
                        <div key={r.id} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-neutral-100 shadow-sm">
                          <CheckCircle2 size={14} className="text-orange-400 flex-shrink-0" />
                          <span className="text-sm text-neutral-700 font-medium truncate">{r.title}</span>
                          <span className="text-xs text-neutral-400 ml-auto flex-shrink-0">{r.time}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setSystemPrompt(buildMilprepSystemPrompt());
                      const recetasList = selectedRecipes.length > 0
                        ? selectedRecipes.map(r => r.title).join(', ')
                        : 'mis recetas de la semana';
                      const swaps = Object.entries(swappedIngredients).map(([o, s]) => `${o} → ${s}`);
                      const pending = unavailableIngredients.filter(i => !(i in swappedIngredients));
                      let msg = `¡Hola Sous! Estoy listo para mealprep. Esta semana: ${recetasList}. Somos ${peopleCount} persona${peopleCount !== 1 ? 's' : ''}.`;
                      if (swaps.length > 0) msg += ` Cambié ingredientes: ${swaps.join(', ')}.`;
                      if (pending.length > 0) msg += ` No conseguí: ${pending.join(', ')}.`;
                      msg += ` ¿Por dónde empezamos?`;
                      pendingMsgRef.current = msg;
                      setChatStarted(true);
                    }}
                    className="px-8 py-4 rounded-2xl font-black text-white text-base bg-gradient-to-r from-orange-500 to-rose-500 shadow-xl shadow-orange-400/30 active:scale-95 transition-all"
                  >
                    ¡Estoy listo! 🚀
                  </button>
                </div>
              ) : (
                <>
                  {/* ── Mensajes ── */}
                  <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
                    {messages.length === 0 && !isLoading && (
                      <div className="text-center mt-10 px-4">
                        <div className="text-4xl mb-3">👨‍🍳</div>
                        <p className="text-sm font-medium text-neutral-600">Sous está listo para acompañarte.</p>
                        <p className="text-xs mt-1 text-neutral-400">Escríbele o activa la conversación de voz para tener las manos libres.</p>
                      </div>
                    )}
                    {messages.map((msg: {agent: string; text: string}, idx: number) => (
                      <div key={idx} className={`flex ${msg.agent === 'chef' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          msg.agent === 'chef'
                            ? 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-none'
                            : 'bg-orange-500 text-white rounded-tr-none'
                        }`}>
                          {msg.text || (
                            <span className="flex gap-1 items-center h-4">
                              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
                              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
                              <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* ── Quick replies ── */}
                  <QuickReplies
                    onSend={(msg) => { sendMessage(msg); }}
                    disabled={isLoading || messages.length === 0}
                  />

                  {/* ── Input ── */}
                  <div className="flex-shrink-0 px-3 py-2.5 bg-white border-t border-neutral-100">
                    <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl px-2 py-1.5">
                      <button
                        onClick={handleStartVoice}
                        title="Hablar con Sous (manos libres)"
                        className="p-1.5 bg-red-500 hover:bg-red-600 transition-colors rounded-full text-white flex-shrink-0"
                      >
                        <Mic className="w-4 h-4" />
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder={isLoading ? 'Sous está respondiendo…' : 'Escribe tu pregunta…'}
                        disabled={isLoading}
                        className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-400 min-w-0 disabled:opacity-60"
                      />
                      <button onClick={handleSend} disabled={isLoading || !inputText.trim()} className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-white flex-shrink-0 transition-colors disabled:opacity-40">
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>
      </div>
      {/* ── Contador flotante (solo en tab recetas) ── */}
      {activeTab === 'recetas' && (
        <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2">
          {/* Contador */}
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm transition-all duration-300 ${
            selectedRecipeIds.length === 7
              ? 'bg-green-500 text-white shadow-green-400/40'
              : selectedRecipeIds.length > 0
              ? 'bg-orange-500 text-white shadow-orange-400/40'
              : 'bg-white text-neutral-500 border border-neutral-200 shadow-neutral-200/60'
          }`}>
            <ShoppingCart size={15} />
            <span>{selectedRecipeIds.length} / 7</span>
            {selectedRecipeIds.length === 7 && <span>✓</span>}
          </div>

          {/* Botón Siguiente — aparece en cuanto hay al menos 1 receta */}
          {selectedRecipeIds.length > 0 && (
            <button
              onClick={() => setActiveTab('mercado')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl shadow-xl font-bold text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all shadow-neutral-200/60"
            >
              Siguiente →
            </button>
          )}
        </div>
      )}

      {/* ── Popup "¡Listo!" al completar 7 ── */}
      {showReadyBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" onClick={() => setShowReadyBanner(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-br from-green-400 to-emerald-600 p-6 text-center text-white">
              <div className="text-5xl mb-2">🛒</div>
              <h3 className="text-2xl font-black">¡Menú completo!</h3>
              <p className="text-white/85 text-sm mt-1">Has elegido tus 7 recetas de la semana</p>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
                {selectedRecipes.map(r => (
                  <div key={r.id} className="flex items-center gap-1.5 bg-green-50 rounded-lg px-2.5 py-1.5">
                    <CheckCircle2 size={12} className="text-green-500 flex-shrink-0" />
                    <span className="font-medium text-neutral-700 truncate">{r.title}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowReadyBanner(false); setActiveTab('mercado'); }}
                className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/30 active:scale-95 transition-all"
              >
                Ver Lista de Mercado →
              </button>
              <button
                onClick={() => setShowReadyBanner(false)}
                className="w-full py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                Seguir explorando recetas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
