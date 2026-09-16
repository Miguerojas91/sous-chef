/**
 * "Sabores del Mundo": recetas de cocina internacional agrupadas por región
 * y país.
 *
 * Flujo de cada receta: resumen y porciones → lista de mercado (marcar,
 * "no lo consigo", sustitutos) → chat con Sous. El prompt se arma al empezar
 * el chat para incluir lo que el usuario consiguió o reemplazó. El chat
 * alterna texto (SSE) y voz manos libres (WebSocket) sin perder la conversación.
 */

import { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, ChevronRight, ShoppingCart, Check, Clock, ChefHat, XCircle, Minus, Plus } from 'lucide-react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { ChatMessage, ChatBubble } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { QuickReplies } from './QuickReplies';
import { VoiceSessionView } from './VoiceSessionView';
import { ScreenHeader } from './ui/ScreenHeader';
import { ConfirmDialog } from './ui/Dialog';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  getVoiceUsageSummary, hasReachedCap as voiceCapReached, FREE_CAP_SECONDS, PRO_CAP_SECONDS,
} from '../utils/voiceUsage';
import { isPremiumUser } from '../utils/membership';
import { track, Events } from '../utils/analytics';

function toast(msg: string, type: 'info' | 'warning' = 'info') {
  window.dispatchEvent(new CustomEvent('sous:toast', { detail: { msg, type } }));
}

// Misma tabla de sustitutos que MilprepModule.

const SUBSTITUTES_MAP: { keywords: string[]; options: string[] }[] = [
  { keywords: ['pollo', 'pechuga', 'muslo'], options: ['Pavo en trozos', 'Tofu firme', 'Cerdo magro'] },
  { keywords: ['carne molida', 'res', 'bistec', 'lomo de res', 'tira de asado', 'vacío', 'carne de res'], options: ['Cerdo molido', 'Cordero', 'Pollo desmenuzado'] },
  { keywords: ['chorizo', 'morcilla', 'chicharrón', 'cerdo', 'panceta'], options: ['Pavo ahumado', 'Tofu ahumado', 'Champiñones salteados'] },
  { keywords: ['camarón', 'camaron'], options: ['Calamar', 'Pollo', 'Tofu firme'] },
  { keywords: ['bacalao'], options: ['Merluza', 'Tilapia', 'Atún fresco'] },
  { keywords: ['leche de coco'], options: ['Crema de leche', 'Leche de almendras', 'Leche evaporada'] },
  { keywords: ['leche'], options: ['Leche de almendras', 'Leche de avena', 'Leche de coco'] },
  { keywords: ['mantequilla', 'manteca'], options: ['Aceite de oliva', 'Margarina vegetal', 'Aceite de coco'] },
  { keywords: ['queso'], options: ['Queso de cabra', 'Levadura nutricional', 'Tofu desmenuzado'] },
  { keywords: ['crema de leche', 'crema'], options: ['Leche de coco', 'Yogur griego', 'Leche evaporada'] },
  { keywords: ['huevo'], options: ['Linaza molida + agua', 'Tofu sedoso', 'Aquafaba'] },
  { keywords: ['arroz'], options: ['Quinoa', 'Cuscús', 'Pasta integral'] },
  { keywords: ['papa', 'papas', 'patata'], options: ['Batata', 'Coliflor', 'Yuca'] },
  { keywords: ['plátano'], options: ['Batata', 'Yuca', 'Papa'] },
  { keywords: ['pasta', 'fideos'], options: ['Zucchini en espirales', 'Arroz', 'Quinoa'] },
  { keywords: ['tofu'], options: ['Tempeh', 'Pechuga de pollo', 'Setas'] },
  { keywords: ['fish sauce', 'salsa de soya', 'soya'], options: ['Salsa tamari', 'Aminos de coco', 'Salsa Worcester'] },
  { keywords: ['mirin', 'sake'], options: ['Vino blanco seco + azúcar', 'Vinagre de arroz', 'Jerez seco'] },
  { keywords: ['tamarindo'], options: ['Limón + azúcar morena', 'Vinagre de arroz', 'Pasta de ciruela'] },
  { keywords: ['galangal'], options: ['Jengibre fresco (doble cantidad)', 'Jengibre en polvo'] },
  { keywords: ['hierba de limón', 'kaffir'], options: ['Ralladura de limón', 'Hojas de laurel + limón'] },
  { keywords: ['pasta de curry verde', 'pasta de curry', 'doubanjiang'], options: ['Curry en polvo + chile', 'Harissa', 'Sambal oelek'] },
  { keywords: ['azúcar de palma'], options: ['Azúcar morena', 'Miel', 'Piloncillo'] },
  { keywords: ['tomate'], options: ['Tomate enlatado', 'Pimiento rojo', 'Puré de tomate'] },
  { keywords: ['cebolla'], options: ['Cebollín', 'Puerro', 'Chalota'] },
  { keywords: ['ajo'], options: ['Ajo en polvo (¼ cdta)', 'Chalota', 'Cebollín'] },
  { keywords: ['aceite de oliva', 'aceite de sésamo'], options: ['Aceite de girasol', 'Aceite de maíz', 'Aceite de aguacate'] },
  { keywords: ['vino tinto', 'vino blanco', 'cerveza'], options: ['Caldo concentrado + vinagre', 'Jugo de uva', 'Agua + laurel'] },
  { keywords: ['champiñon', 'champiñones', 'hongos'], options: ['Berenjena', 'Zucchini', 'Tofu'] },
  { keywords: ['limón', 'lima', 'naranjilla'], options: ['Lima', 'Vinagre blanco', 'Naranja agria'] },
  { keywords: ['maní', 'almendras', 'nueces'], options: ['Semillas de girasol', 'Pepitas de calabaza', 'Tahini'] },
];

function getSuggestedSubstitutes(item: string): string[] {
  const lower = item.toLowerCase();
  const sorted = [...SUBSTITUTES_MAP].sort(
    (a, b) => Math.max(...b.keywords.map(k => k.length)) - Math.max(...a.keywords.map(k => k.length))
  );
  for (const entry of sorted) {
    if (entry.keywords.some(kw => lower.includes(kw))) return entry.options;
  }
  return [];
}

type Difficulty = 'Básico' | 'Intermedio' | 'Difícil';
type RegionName = 'América' | 'Europa' | 'Asia';

type Ingredient = string;

interface Recipe {
  name: string;
  technique: string;
  difficulty: Difficulty;
  time: string;
  ingredients: Ingredient[];
  description: string;
}

interface Country {
  name: string;
  flag: string;
  recipes: Recipe[];
}

interface Region {
  name: RegionName;
  countries: Country[];
}

const REGIONS: Region[] = [
  {
    name: 'América',
    countries: [
      {
        name: 'Colombia', flag: '🇨🇴',
        recipes: [
          {
            name: 'Bandeja Paisa',
            technique: 'Mixto', difficulty: 'Difícil', time: '3h',
            ingredients: ['frijoles rojos', 'chicharrón', 'carne molida', 'chorizo', 'morcilla', 'arroz', 'huevo', 'aguacate', 'plátano maduro', 'harina de maíz precocida', 'tomate chonto', 'cebolla larga'],
            description: 'Plato típico de Antioquia. Frijoles, arroz, carne molida, chicharrón, chorizo, morcilla, huevo, plátano maduro, aguacate y arepa servidos en una sola bandeja.',
          },
          {
            name: 'Ajiaco Bogotano',
            technique: 'Caldo', difficulty: 'Intermedio', time: '2h',
            ingredients: ['papa criolla', 'papa pastusa', 'papa sabanera', 'pollo', 'mazorca', 'guascas', 'crema de leche', 'alcaparras', 'cilantro'],
            description: 'Sopa bogotana de pollo con tres tipos de papa: la criolla se deshace y espesa el caldo. Las guascas le dan su sabor herbal. Se sirve con crema, alcaparras y mazorca.',
          },
          {
            name: 'Arepa con Hogao',
            technique: 'Plancha', difficulty: 'Básico', time: '30m',
            ingredients: ['masa de maíz precocida', 'sal', 'agua', 'tomate', 'cebolla larga', 'aceite', 'comino'],
            description: 'Arepa de maíz dorada en plancha, servida con hogao casero de tomate y cebolla larga.',
          },
        ],
      },
      {
        name: 'Ecuador', flag: '🇪🇨',
        recipes: [
          {
            name: 'Seco de Pollo Ecuatoriano',
            technique: 'Estofado', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['pollo', 'cerveza', 'cebolla', 'tomate', 'pimiento', 'ajo', 'naranjilla', 'cilantro', 'comino', 'achiote', 'arroz'],
            description: 'Guiso ecuatoriano de pollo cocinado lentamente en cerveza y naranjilla. El achiote le da el color dorado.',
          },
          {
            name: 'Llapingachos',
            technique: 'Sartén', difficulty: 'Básico', time: '45m',
            ingredients: ['papa', 'queso fresco', 'cebolla larga', 'mantequilla', 'achiote', 'maní', 'leche', 'ajo'],
            description: 'Tortillas de papa rellenas de queso, doradas en mantequilla con achiote. Acompañadas de salsa de maní y chorizo.',
          },
          {
            name: 'Caldo de Bolas de Verde',
            technique: 'Caldo', difficulty: 'Difícil', time: '2h',
            ingredients: ['plátano verde', 'carne de res', 'cerdo', 'maíz', 'yuca', 'zanahoria', 'cebolla', 'ajo', 'comino', 'cilantro', 'maní'],
            description: 'Caldo ecuatoriano de res con maíz y yuca, en el que se cocinan bolas de plátano verde rellenas de carne.',
          },
        ],
      },
      {
        name: 'Argentina', flag: '🇦🇷',
        recipes: [
          {
            name: 'Asado Argentino',
            technique: 'Parrilla', difficulty: 'Intermedio', time: '3h',
            ingredients: ['tira de asado', 'vacío', 'chorizo', 'morcilla', 'sal gruesa', 'perejil', 'ajo', 'orégano', 'vinagre', 'aceite de oliva'],
            description: 'Tira de asado y vacío a la parrilla, con chorizo, morcilla y chimichurri casero de perejil, ajo y orégano.',
          },
          {
            name: 'Empanadas Criollas',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'manteca', 'carne molida', 'cebolla', 'pimiento rojo', 'huevo duro', 'aceitunas', 'pasas', 'comino', 'pimentón dulce'],
            description: 'Empanadas horneadas de carne con cebolla, huevo duro y aceitunas, cerradas con el repulgue tradicional.',
          },
          {
            name: 'Dulce de Leche Casero',
            technique: 'Reducción', difficulty: 'Básico', time: '2h',
            ingredients: ['leche entera', 'azúcar', 'bicarbonato', 'esencia de vainilla'],
            description: 'Leche y azúcar reducidos a fuego lento hasta tomar color caramelo y textura untable. En Argentina es la base de alfajores y muchos postres.',
          },
        ],
      },
    ],
  },
  {
    name: 'Europa',
    countries: [
      {
        name: 'Francia', flag: '🇫🇷',
        recipes: [
          {
            name: 'Boeuf Bourguignon',
            technique: 'Braseado', difficulty: 'Difícil', time: '4h',
            ingredients: ['res chuck', 'vino tinto Borgoña', 'tocino', 'champiñones', 'cebollitas perladas', 'zanahoria', 'tomillo', 'laurel', 'caldo de res'],
            description: 'Estofado de Borgoña: res braseada en vino tinto con tocino, champiñones y cebollitas perladas. Julia Child lo popularizó fuera de Francia.',
          },
          {
            name: 'Crème Brûlée',
            technique: 'Baño María', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['crema para batir', 'yemas de huevo', 'azúcar', 'vaina de vainilla'],
            description: 'Crema de vainilla cocida al baño maría y caramelizada con soplete. La capa de azúcar debe crujir al romperla con la cuchara.',
          },
          {
            name: "Soupe à l'Oignon Gratinée",
            technique: 'Caramelización', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['cebolla amarilla', 'mantequilla', 'vino blanco seco', 'caldo de res', 'pan baguette', 'queso gruyère', 'tomillo'],
            description: 'Sopa de cebolla caramelizada lentamente con caldo de res y gratinada con gruyère fundido.',
          },
        ],
      },
      {
        name: 'Portugal', flag: '🇵🇹',
        recipes: [
          {
            name: 'Bacalhau à Brás',
            technique: 'Salteado', difficulty: 'Intermedio', time: '45m',
            ingredients: ['bacalao desalado', 'papas paja', 'cebolla', 'ajo', 'huevo', 'aceitunas negras', 'perejil', 'aceite de oliva'],
            description: 'Receta lisboeta de bacalao desmigado con papas paja, ligado con huevo revuelto y terminado con aceitunas negras y perejil.',
          },
          {
            name: 'Pastel de Nata',
            technique: 'Horneado', difficulty: 'Difícil', time: '2h',
            ingredients: ['masa hojaldre', 'leche', 'azúcar', 'yemas de huevo', 'harina', 'limón', 'canela', 'vainilla'],
            description: 'Tartaleta portuguesa de hojaldre crujiente rellena de crema de yemas, con la superficie caramelizada en manchas.',
          },
          {
            name: 'Caldo Verde',
            technique: 'Caldo', difficulty: 'Básico', time: '45m',
            ingredients: ['papa', 'col rizada', 'chorizo português', 'cebolla', 'ajo', 'aceite de oliva', 'sal'],
            description: 'Sopa del norte de Portugal: crema de papa con tiras finas de col rizada y rodajas de chorizo ahumado.',
          },
        ],
      },
      {
        name: 'Alemania', flag: '🇩🇪',
        recipes: [
          {
            name: 'Schnitzel Wiener Art',
            technique: 'Frito', difficulty: 'Básico', time: '30m',
            ingredients: ['chuleta de cerdo', 'harina', 'huevo', 'pan rallado', 'mantequilla clarificada', 'limón', 'sal', 'pimienta'],
            description: 'Chuleta de cerdo batida hasta quedar delgada, pasada por harina, huevo y pan rallado, y frita en mantequilla clarificada hasta dorar.',
          },
          {
            name: 'Sauerbraten',
            technique: 'Marinado-Braseado', difficulty: 'Difícil', time: '72h',
            ingredients: ['lomo de res', 'vinagre de vino tinto', 'vino tinto', 'cebolla', 'zanahoria', 'apio', 'laurel', 'clavo', 'bayas de enebro', 'azúcar'],
            description: 'Asado alemán de res marinada 3 días en vinagre especiado y braseada hasta quedar tierna, con salsa agridulce.',
          },
          {
            name: 'Pretzels Caseros',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'levadura', 'agua', 'sal', 'bicarbonato de sodio', 'mantequilla', 'sal gruesa'],
            description: 'Pretzels de corteza oscura e interior tierno. El color sale del baño en bicarbonato antes de hornear.',
          },
        ],
      },
    ],
  },
  {
    name: 'Asia',
    countries: [
      {
        name: 'Japón', flag: '🇯🇵',
        recipes: [
          {
            name: 'Ramen Tonkotsu Casero',
            technique: 'Caldo', difficulty: 'Difícil', time: '12h',
            ingredients: ['huesos de cerdo', 'panceta', 'fideos ramen', 'huevo', 'cebollín', 'jengibre', 'algas nori', 'pasta miso', 'salsa de soya'],
            description: 'Caldo de cerdo turbio cocinado 12 horas a hervor intenso. Con panceta chashu, huevo ajitsuke y fideos alkali.',
          },
          {
            name: 'Pollo Teriyaki',
            technique: 'Salteado', difficulty: 'Básico', time: '45m',
            ingredients: ['muslos de pollo', 'salsa de soya', 'mirin', 'sake', 'azúcar', 'jengibre', 'ajo', 'arroz japonés', 'sésamo'],
            description: 'Muslos de pollo con la piel crujiente, lacados en una reducción de salsa de soya, mirin y sake.',
          },
          {
            name: 'Gyoza Caseras',
            technique: 'Frito-Vapor', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['cerdo picado', 'col china', 'cebollín', 'jengibre', 'ajo', 'aceite de sésamo', 'masa gyoza', 'salsa de soya', 'vinagre de arroz'],
            description: 'Empanadillas de cerdo y col con técnica yaki+mushi. Crujientes abajo, tiernas arriba.',
          },
        ],
      },
      {
        name: 'China', flag: '🇨🇳',
        recipes: [
          {
            name: 'Mapo Tofu',
            technique: 'Wok', difficulty: 'Intermedio', time: '30m',
            ingredients: ['tofu sedoso', 'carne molida de cerdo', 'pasta doubanjiang', 'aceite de chile', 'pimienta de Sichuan', 'ajo', 'jengibre', 'caldo', 'cebollín', 'fécula de maíz'],
            description: 'Plato de Sichuan: tofu sedoso y cerdo en salsa de doubanjiang, con pimienta de Sichuan que adormece un poco la lengua.',
          },
          {
            name: 'Pato Pekín',
            technique: 'Horneado', difficulty: 'Difícil', time: '24h',
            ingredients: ['pato entero', 'maltosa', 'vinagre de arroz', 'cinco especias', 'jengibre', 'cebollín', 'pepino', 'salsa hoisin', 'crepes de trigo'],
            description: 'Pato de piel crujiente y brillante: se laca con maltosa y se seca 24 horas antes de hornear. Se sirve con crepes, pepino, cebollín y salsa hoisin.',
          },
          {
            name: 'Dim Sum de Cerdo (Har Gow)',
            technique: 'Vapor', difficulty: 'Difícil', time: '2h',
            ingredients: ['camarón', 'cerdo picado', 'bambú en tiras', 'aceite de sésamo', 'salsa de soya', 'jengibre', 'harina de trigo', 'fécula de tapioca'],
            description: 'Empanadillas cantonesas al vapor, de masa translúcida de trigo y tapioca, rellenas de camarón y cerdo.',
          },
        ],
      },
      {
        name: 'Tailandia', flag: '🇹🇭',
        recipes: [
          {
            name: 'Pad Thai Clásico',
            technique: 'Wok', difficulty: 'Básico', time: '30m',
            ingredients: ['fideos de arroz', 'camarón', 'tofu firme', 'huevo', 'brotes de soya', 'cebollín', 'maní tostado', 'tamarindo', 'fish sauce', 'azúcar de palma', 'lima'],
            description: 'Fideos de arroz salteados en wok caliente con camarón, tofu y brotes de soya, en salsa de tamarindo, fish sauce y azúcar de palma.',
          },
          {
            name: 'Tom Kha Gai',
            technique: 'Caldo Aromático', difficulty: 'Intermedio', time: '45m',
            ingredients: ['pollo', 'leche de coco', 'galangal', 'hierba de limón', 'hojas kaffir lime', 'champiñones', 'fish sauce', 'lima', 'chile', 'cilantro'],
            description: 'Sopa de pollo en leche de coco con galangal y hierba de limón. La lima aporta la acidez y la fish sauce, la sal.',
          },
          {
            name: 'Green Curry',
            technique: 'Curry', difficulty: 'Intermedio', time: '1h',
            ingredients: ['pasta de curry verde', 'leche de coco', 'pollo', 'berenjena tailandesa', 'pimiento', 'albahaca sagrada', 'fish sauce', 'azúcar de palma', 'arroz jazmín'],
            description: 'Curry de pollo en leche de coco con berenjena tailandesa y albahaca sagrada. El sabor base viene de la pasta de curry verde.',
          },
        ],
      },
    ],
  },
];

type GroceryCategory = 'Proteínas' | 'Lácteos y Refrigerados' | 'Verduras y Frutas' | 'Despensa';

const PROTEIN_KEYWORDS = ['pollo', 'res', 'cerdo', 'carne', 'chorizo', 'morcilla', 'bacalao', 'camarón', 'pato', 'tofu', 'huevo', 'panceta', 'chicharrón', 'cordero', 'pescado', 'salmón', 'atún'];
const DAIRY_KEYWORDS = ['leche', 'crema', 'queso', 'mantequilla', 'yogur', 'yema'];
const VEGGIE_KEYWORDS = ['papa', 'tomate', 'cebolla', 'ajo', 'zanahoria', 'pimiento', 'col', 'plátano', 'aguacate', 'mazorca', 'naranjilla', 'champiñon', 'espinaca', 'berenjena', 'brotes', 'cilantro', 'perejil', 'jengibre', 'lima', 'limón', 'manzana', 'pepino', 'yuca'];

function categorizeIngredient(ingredient: string): GroceryCategory {
  const lower = ingredient.toLowerCase();
  if (PROTEIN_KEYWORDS.some(k => lower.includes(k))) return 'Proteínas';
  if (DAIRY_KEYWORDS.some(k => lower.includes(k))) return 'Lácteos y Refrigerados';
  if (VEGGIE_KEYWORDS.some(k => lower.includes(k))) return 'Verduras y Frutas';
  return 'Despensa';
}

function groupIngredients(ingredients: string[]): Record<GroceryCategory, string[]> {
  const groups: Record<GroceryCategory, string[]> = {
    'Proteínas': [],
    'Lácteos y Refrigerados': [],
    'Verduras y Frutas': [],
    'Despensa': [],
  };
  for (const ing of ingredients) {
    groups[categorizeIngredient(ing)].push(ing);
  }
  return groups;
}

const DIFFICULTY_CLASS: Record<Difficulty, string> = {
  Básico: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  Intermedio: 'bg-amber-50 border-amber-200 text-amber-800',
  Difícil: 'bg-red-50 border-red-200 text-red-800',
};

const CATEGORY_ORDER: GroceryCategory[] = ['Proteínas', 'Verduras y Frutas', 'Lácteos y Refrigerados', 'Despensa'];

const MIN_SERVINGS = 1;
const MAX_SERVINGS = 20;

type FlowStep = 'intro' | 'mercado' | 'chat';

const STEP_LABEL: Record<FlowStep, string> = {
  intro: 'Paso 1 de 3: receta',
  mercado: 'Paso 2 de 3: mercado',
  chat: 'Paso 3 de 3: cocinar',
};

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

interface RecipeFlowProps {
  recipe: Recipe;
  countryName: string;
  countryFlag: string;
  onBack: () => void;
}

const RecipeFlow = ({ recipe, countryName, countryFlag, onBack }: RecipeFlowProps) => {
  const [step, setStep] = useState<FlowStep>('intro');
  const [servings, setServings] = useState(2);
  const [checkedIngredients, setCheckedIngredients]         = useState<string[]>([]);
  const [unavailableIngredients, setUnavailableIngredients] = useState<string[]>([]);
  const [swappedIngredients, setSwappedIngredients]         = useState<Record<string, string>>({});
  const [expandedItem, setExpandedItem]                     = useState<string | null>(null);
  const [chatStarted, setChatStarted]                       = useState(false);
  const pendingMsgRef = useRef('');

  const [voiceMode, setVoiceMode] = useState(false);
  const [showConfirmEnd, setShowConfirmEnd] = useState(false);
  useWakeLock(chatStarted || voiceMode);
  const [voiceSystemPrompt, setVoiceSystemPrompt] = useState('');
  const { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp } = useGeminiLive(voiceSystemPrompt);

  useEffect(() => {
    if (voiceState === 'cap-reached') {
      track(Events.VoiceCapReached, {
        is_premium: isPremiumUser(),
        used_min: Math.round(getVoiceUsageSummary().used / 60),
      });
    }
  }, [voiceState]);

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
    await startListening();
  };

  const handleExitVoice = () => {
    disconnect();
    setVoiceMode(false);
  };

  const grouped = groupIngredients(recipe.ingredients);
  const personas = `${servings} persona${servings !== 1 ? 's' : ''}`;

  // Incluye el estado del mercado para que Sous adapte la receta.
  const buildSystemPrompt = () => {
    const obtained  = checkedIngredients;
    const missing   = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swapped   = Object.entries(swappedIngredients).map(([o, s]) => `${o} → ${s}`);
    const notMarked = recipe.ingredients.filter(
      i => !obtained.includes(i) && !unavailableIngredients.includes(i) && !(i in swappedIngredients)
    );

    return `Eres Sous, chef especializado en cocina ${countryName}. El usuario va a preparar "${recipe.name}" para ${personas}.

DESCRIPCIÓN: ${recipe.description}

ESTADO DE INGREDIENTES:
- Conseguidos: ${obtained.length > 0 ? obtained.join(', ') : 'ninguno marcado'}
- No conseguidos: ${missing.length > 0 ? missing.join(', ') : 'ninguno'}
- Reemplazados: ${swapped.length > 0 ? swapped.join('; ') : 'ninguno'}
- Sin marcar (asumir disponibles): ${notMarked.length > 0 ? notMarked.join(', ') : 'ninguno'}

Adapta la receta a los ingredientes disponibles y sus sustitutos. Guía paso a paso para ${personas}. Responde SOLO sobre esta receta. Máximo 60 palabras por respuesta.
No uses el carácter —. No abras con elogios ni cierres ofreciendo más ayuda.`;
  };

  const storageKey = `sous_flavor_${recipe.name.replace(/\s+/g, '_').toLowerCase()}`;
  // Vacío hasta que empieza el chat: ahí ya se conoce el estado real del mercado.
  const [systemPrompt, setSystemPrompt] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useGeminiChat({ storageKey, systemPrompt });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  // El primer mensaje sale después de un render para que useGeminiChat ya
  // tenga el system prompt nuevo.
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

  /** Arranca el chat con el resumen del mercado; `question` reemplaza el pedido de guía. */
  const startChat = (question?: string) => {
    const textPr = buildSystemPrompt();
    setSystemPrompt(textPr);
    setVoiceSystemPrompt(textPr + '\nMODO VOZ: Habla naturalmente, sin listas ni markdown. Frases cortas. No interrumpas el silencio del usuario.');
    clearMessages();
    const swaps = Object.entries(swappedIngredients).map(([o, s]) => `${o} por ${s}`);
    const missing = unavailableIngredients.filter(i => !(i in swappedIngredients));
    let msg = `Hola Sous, voy a preparar "${recipe.name}" para ${personas}.`;
    if (swaps.length > 0) msg += ` Cambié estos ingredientes: ${swaps.join(', ')}.`;
    if (missing.length > 0) msg += ` No pude conseguir: ${missing.join(', ')}.`;
    msg += question ? ` ${question}` : ' Guíame paso a paso.';
    pendingMsgRef.current = msg;
    setChatStarted(true);
    setStep('chat');
  };

  const endSession = () => {
    disconnect();
    clearMessages();
    setVoiceMode(false);
    setChatStarted(false);
    setStep('intro');
  };

  const handleBack = () => {
    if (step === 'intro') { onBack(); return; }
    if (step === 'mercado') { setStep('intro'); return; }
    setStep('mercado');
  };

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

      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-neutral-200">
        <button
          type="button"
          onClick={() => setStep('mercado')}
          className="w-full max-w-2xl mx-auto min-h-12 flex items-center justify-center gap-2 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base rounded-control transition-colors"
        >
          <ShoppingCart size={18} aria-hidden />
          Ir al mercado
        </button>
      </div>
    </div>
  );

  if (step === 'mercado') {
    const pending      = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swappedCount = Object.keys(swappedIngredients).length;
    const unchecked    = recipe.ingredients.filter(i => !checkedIngredients.includes(i) && !(i in swappedIngredients)).length;

    return (
      <div className="flex flex-col h-full bg-neutral-50">
        {header}

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="p-4 md:p-6 max-w-2xl w-full mx-auto">
            <div className="flex items-center justify-between gap-3 mb-4">
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

            {(pending.length > 0 || swappedCount > 0) && (
              <div className="mb-4 space-y-2">
                {swappedCount > 0 && (
                  <p role="status" className="bg-emerald-50 border border-emerald-200 rounded-card px-4 py-2.5 text-sm font-semibold text-emerald-800">
                    {swappedCount} ingrediente{swappedCount > 1 ? 's cambiados' : ' cambiado'} por sustituto
                  </p>
                )}
                {pending.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <XCircle size={18} className="text-red-700 flex-shrink-0 mt-0.5" aria-hidden />
                      <div className="min-w-0">
                        <p className="font-semibold text-red-800 text-sm">{pending.length} ingrediente{pending.length > 1 ? 's' : ''} sin sustituto</p>
                        <p className="text-sm text-red-800">Sous puede sugerirte otras opciones.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => startChat(`¿Qué puedo usar como sustituto de ${pending.join(', ')}?`)}
                      className="min-h-11 px-4 flex items-center justify-center gap-1.5 bg-white border border-red-300 text-red-800 hover:bg-red-100 rounded-control text-sm font-semibold flex-shrink-0 transition-colors"
                    >
                      <ChefHat size={16} aria-hidden />Pedir sustitutos
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-5">
              {CATEGORY_ORDER.map(cat => {
                const items = grouped[cat];
                if (!items || items.length === 0) return null;
                return (
                  <section key={cat}>
                    <h2 className="text-sm font-semibold text-neutral-600 mb-2">{cat}</h2>
                    <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
                      {items.map(item => {
                        const isChecked     = checkedIngredients.includes(item);
                        const isUnavailable = unavailableIngredients.includes(item);
                        const isSwapped     = item in swappedIngredients;
                        const isExpanded    = expandedItem === item;
                        const suggestions   = getSuggestedSubstitutes(item);

                        const toggleChecked = () => {
                          if (isUnavailable || isSwapped) return;
                          setCheckedIngredients(prev => isChecked ? prev.filter(i => i !== item) : [...prev, item]);
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
                        const handleSwap = (sub: string) => {
                          setUnavailableIngredients(prev => prev.filter(i => i !== item));
                          setSwappedIngredients(prev => ({ ...prev, [item]: sub }));
                          setExpandedItem(null);
                        };
                        const handleUndoSwap = () => {
                          setSwappedIngredients(prev => { const n = { ...prev }; delete n[item]; return n; });
                        };

                        return (
                          <li key={item} className={isUnavailable ? 'bg-red-50' : ''}>
                            <div className="flex items-center gap-1 px-2 py-1">
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked}
                                disabled={isUnavailable || isSwapped}
                                onClick={toggleChecked}
                                className="flex-1 min-w-0 min-h-11 flex items-center gap-3 px-2 rounded-control text-left disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-brand-700"
                              >
                                <span
                                  aria-hidden
                                  className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
                                    isChecked     ? 'bg-emerald-700 border-emerald-700' :
                                    isUnavailable ? 'border-red-300 bg-white' :
                                    isSwapped     ? 'border-neutral-300 bg-neutral-100' :
                                    'border-neutral-400 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check size={14} className="text-white" strokeWidth={3} />}
                                </span>
                                <span className={`min-w-0 text-sm [overflow-wrap:anywhere] ${
                                  isChecked || isSwapped ? 'line-through text-neutral-600' :
                                  isUnavailable ? 'line-through text-red-800' : 'text-neutral-900'
                                }`}>{item}</span>
                              </button>
                              {isSwapped ? (
                                <button
                                  type="button"
                                  onClick={handleUndoSwap}
                                  aria-label={`Deshacer el cambio de ${item}`}
                                  className="min-h-11 px-3 rounded-control text-sm font-semibold text-neutral-700 hover:bg-neutral-100 flex-shrink-0 transition-colors"
                                >
                                  Deshacer
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={handleNoConsigo}
                                  aria-pressed={isUnavailable}
                                  className={`min-h-11 px-3 flex items-center gap-1.5 rounded-control text-sm font-semibold flex-shrink-0 transition-colors ${
                                    isUnavailable ? 'bg-red-700 text-white hover:bg-red-800' : 'text-neutral-700 hover:bg-neutral-100'
                                  }`}
                                >
                                  <XCircle size={16} aria-hidden />
                                  {isUnavailable ? 'No disponible' : 'No lo consigo'}
                                </button>
                              )}
                            </div>
                            {isSwapped && (
                              <p className="px-4 pb-2.5 -mt-1 text-sm font-semibold text-emerald-800 [overflow-wrap:anywhere]">
                                Cambiado por {swappedIngredients[item]}
                              </p>
                            )}
                            {isExpanded && (
                              <div className="border-t border-red-200 px-4 py-3">
                                <p className="text-sm font-semibold text-red-800 mb-2">Sustitutos sugeridos</p>
                                {suggestions.length > 0 ? (
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {suggestions.map(sub => (
                                      <button
                                        key={sub}
                                        type="button"
                                        onClick={() => handleSwap(sub)}
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
                                  onClick={() => { setExpandedItem(null); startChat(`¿Qué puedo usar en lugar de ${item}?`); }}
                                  className="min-h-11 flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 transition-colors"
                                >
                                  <ChefHat size={16} aria-hidden />Preguntar a Sous por más opciones
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-neutral-200">
          <button
            type="button"
            onClick={() => setStep('chat')}
            className="w-full max-w-2xl mx-auto min-h-12 flex items-center justify-center gap-2 px-4 bg-brand-700 hover:bg-brand-800 text-white font-bold text-base rounded-control transition-colors"
          >
            Manos a la obra
          </button>
        </div>
      </div>
    );
  }

  if (!chatStarted) {
    const obtained = checkedIngredients;
    const missing  = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swapped  = Object.entries(swappedIngredients);

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
              {obtained.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-emerald-800 mb-1">Conseguidos</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {obtained.map(i => <li key={i} className="text-sm bg-emerald-50 border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full">{i}</li>)}
                  </ul>
                </div>
              )}
              {swapped.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neutral-800 mb-1">Reemplazados</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {swapped.map(([o, s]) => (
                      <li key={o} className="text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 px-2.5 py-1 rounded-full">{o} por {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {missing.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">No conseguidos</p>
                  <ul className="flex flex-wrap gap-1.5">
                    {missing.map(i => <li key={i} className="text-sm bg-red-50 border border-red-200 text-red-800 px-2.5 py-1 rounded-full">{i}</li>)}
                  </ul>
                </div>
              )}
              {obtained.length === 0 && swapped.length === 0 && missing.length === 0 && (
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
  }

  if (voiceMode) {
    return (
      <VoiceSessionView
        title={recipe.name}
        voiceState={voiceState}
        transcript={transcript}
        currentChefText={currentChefText}
        voiceError={voiceError}
        silenceSeconds={silenceSeconds}
        onRetry={handleStartVoice}
        onWakeUp={wakeUp}
        onTest={() => sendTextToVoice('Hola Sous, ¿me escuchas?')}
        onExitVoice={handleExitVoice}
        onEndSession={endSession}
      />
    );
  }

  // En móvil el chat ocupa toda la pantalla para dejar altura con el teclado abierto.
  return (
    <div className="fixed inset-0 z-[60] h-dvh md:static md:z-auto md:h-full flex flex-col bg-neutral-50">
      <ScreenHeader
        title={recipe.name}
        subtitle={`${countryFlag} ${countryName} · ${personas}`}
        onBack={() => setChatStarted(false)}
        backLabel="Volver al resumen de la receta"
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
        <div ref={bottomRef} />
      </div>

      <QuickReplies onSend={sendMessage} loading={isLoading} />
      <ChatInputBar onSend={sendMessage} isLoading={isLoading} onStartVoice={handleStartVoice} />

      {showConfirmEnd && (
        <ConfirmDialog
          title="¿Terminar la sesión?"
          description="Se borra el chat de esta receta."
          confirmLabel="Terminar"
          destructive
          onCancel={() => setShowConfirmEnd(false)}
          onConfirm={() => { setShowConfirmEnd(false); endSession(); }}
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

interface RegionSectionProps {
  region: Region;
  onSelectRecipe: (recipe: Recipe, country: Country) => void;
}

const RegionSection = ({ region, onSelectRecipe }: RegionSectionProps) => (
  <section>
    <h2 className="text-sm font-semibold text-neutral-600 mb-2">{region.name}</h2>
    <div className="space-y-3">
      {region.countries.map(country => (
        <CountryRow
          key={country.name}
          country={country}
          onSelectRecipe={onSelectRecipe}
        />
      ))}
    </div>
  </section>
);

export const FlavorsModule = () => {
  const countries = REGIONS.flatMap(r => r.countries);
  const totalRecipes = countries.flatMap(c => c.recipes).length;

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
              {totalRecipes} recetas de {countries.length} países, agrupadas por región.
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
