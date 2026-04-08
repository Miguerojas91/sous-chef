import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, ChevronUp, ArrowLeft, ShoppingCart, MessageSquare, Check, Send, Clock, ChefHat, XCircle, RefreshCw, HelpCircle, Mic, X, Users, Minus, Plus } from 'lucide-react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useGeminiLive } from '../hooks/useGeminiLive';

// ─────────────────────────────────────────────
// SUBSTITUTES (igual que MilprepModule)
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────

type Difficulty = 'Básico' | 'Intermedio' | 'Difícil';
type RegionName = 'América' | 'Europa' | 'Asia';

interface Ingredient {
  name: string;
  qty: string; // cantidad para 2 personas
}

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

// ─────────────────────────────────────────────
// RECIPE DATA
// ─────────────────────────────────────────────

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
            ingredients: ['frijoles rojos', 'chicharrón', 'carne molida', 'chorizo', 'morcilla', 'arroz', 'huevo', 'aguacate', 'plátano maduro', 'hogao', 'arepa'],
            description: 'El plato emblema de Antioquia. Una bandeja monumental que combina los sabores más representativos de la cocina colombiana.',
          },
          {
            name: 'Ajiaco Bogotano',
            technique: 'Caldo', difficulty: 'Intermedio', time: '2h',
            ingredients: ['papa criolla', 'papa pastusa', 'papa sabanera', 'pollo', 'mazorca', 'guascas', 'crema de leche', 'alcaparras', 'cilantro'],
            description: 'La sopa reina de Bogotá. Tres tipos de papa y guascas crean una textura y sabor únicos que no se encuentran en ningún otro lugar.',
          },
          {
            name: 'Arepa con Hogao',
            technique: 'Plancha', difficulty: 'Básico', time: '30m',
            ingredients: ['masa de maíz precocida', 'sal', 'agua', 'tomate', 'cebolla larga', 'aceite', 'comino'],
            description: 'La base de la cocina colombiana. Arepa de maíz dorada en plancha con hogao casero de tomate y cebolla.',
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
            description: 'El guiso nacional de Ecuador. Pollo cocinado lentamente en cerveza y naranjilla con achiote que le da ese color dorado característico.',
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
            description: 'El plato festivo por excelencia. Bolas de plátano verde rellenas de carne que se cocinan en un caldo aromático.',
          },
        ],
      },
      {
        name: 'Argentina', flag: '🇦🇷',
        recipes: [
          {
            name: 'Asado Argentino',
            technique: 'Parrilla', difficulty: 'Intermedio', time: '3h',
            ingredients: ['tira de asado', 'vacío', 'chorizo', 'morcilla', 'sal gruesa', 'chimichurri', 'perejil', 'ajo', 'orégano', 'vinagre', 'aceite de oliva'],
            description: 'El ritual nacional. La parrilla argentina con sus cortes clásicos y el chimichurri casero que los acompaña.',
          },
          {
            name: 'Empanadas Criollas',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'manteca', 'carne molida', 'cebolla', 'pimiento rojo', 'huevo duro', 'aceitunas', 'pasas', 'comino', 'pimentón dulce'],
            description: 'Empanadas de carne rellenas con el repulgue tradicional. Jugosas por dentro, doradas por fuera.',
          },
          {
            name: 'Dulce de Leche Casero',
            technique: 'Reducción', difficulty: 'Básico', time: '2h',
            ingredients: ['leche entera', 'azúcar', 'bicarbonato', 'esencia de vainilla'],
            description: 'El alma de la repostería argentina. Leche y azúcar reducidos durante horas hasta ese color y sabor inconfundibles.',
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
            description: 'El clásico de Julia Child. Res braseada en vino tinto de Borgoña con tocino, champiñones y cebollitas perladas.',
          },
          {
            name: 'Crème Brûlée',
            technique: 'Baño María', difficulty: 'Intermedio', time: '1h 30m',
            ingredients: ['crema para batir', 'yemas de huevo', 'azúcar', 'vaina de vainilla'],
            description: 'Crema de vainilla cocida al baño maría y caramelizada con soplete. La capa crujiente es la firma del postre.',
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
            description: 'El bacalao más famoso de Portugal. Desmigado con papas paja crujientes ligadas con huevo revuelto.',
          },
          {
            name: 'Pastel de Nata',
            technique: 'Horneado', difficulty: 'Difícil', time: '2h',
            ingredients: ['masa hojaldre', 'leche', 'azúcar', 'yemas de huevo', 'harina', 'limón', 'canela', 'vainilla'],
            description: 'La joya de la pastelería portuguesa. Tartaleta de hojaldre crujiente con crema de huevo caramelizada.',
          },
          {
            name: 'Caldo Verde',
            technique: 'Caldo', difficulty: 'Básico', time: '45m',
            ingredients: ['papa', 'col rizada', 'chorizo português', 'cebolla', 'ajo', 'aceite de oliva', 'sal'],
            description: 'La sopa del alma portuguesa. Papa cremosa con tiras de col y chorizo ahumado. Simple y profundamente reconfortante.',
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
            description: 'El empanado perfecto. Chuleta finamente batida, empanada en tres capas y frita en mantequilla hasta dorado perfecto.',
          },
          {
            name: 'Sauerbraten',
            technique: 'Marinado-Braseado', difficulty: 'Difícil', time: '72h',
            ingredients: ['lomo de res', 'vinagre de vino tinto', 'vino tinto', 'cebolla', 'zanahoria', 'apio', 'laurel', 'clavo', 'bayas de enebro', 'azúcar'],
            description: 'El asado más complejo de Alemania. Res marinada 3 días en vinagre especiado y braseada hasta tierna con salsa dulce-ácida.',
          },
          {
            name: 'Pretzels Caseros',
            technique: 'Horneado', difficulty: 'Intermedio', time: '2h',
            ingredients: ['harina', 'levadura', 'agua', 'sal', 'bicarbonato de sodio', 'mantequilla', 'sal gruesa'],
            description: 'Pretzels auténticos con la corteza oscura y el interior tierno que solo da el baño en bicarbonato.',
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
            description: 'Muslos de pollo lacados en glaze de salsa de soya, mirin y sake reducidos. La piel crujiente es imprescindible.',
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
            description: 'El plato más picante de Sichuan. Tofu sedoso en salsa de doubanjiang con pimienta de Sichuan que provoca el característico entumecimiento.',
          },
          {
            name: 'Pato Pekín',
            technique: 'Horneado', difficulty: 'Difícil', time: '24h',
            ingredients: ['pato entero', 'maltosa', 'vinagre de arroz', 'cinco especias', 'jengibre', 'cebollín', 'pepino', 'salsa hoisin', 'crepes de trigo'],
            description: 'El plato imperial de China. Piel crujiente y brillante lograda con maltosa y secado 24 horas. Servido con crepes y salsa hoisin.',
          },
          {
            name: 'Dim Sum de Cerdo (Har Gow)',
            technique: 'Vapor', difficulty: 'Difícil', time: '2h',
            ingredients: ['camarón', 'cerdo picado', 'bambú en tiras', 'aceite de sésamo', 'salsa de soya', 'jengibre', 'harina de trigo', 'fécula de tapioca'],
            description: 'Las empanadillas al vapor más delicadas de la cocina cantonesa. Masa translúcida y relleno jugoso de camarón y cerdo.',
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
            description: 'Fideos de arroz salteados en wok caliente con camarón, tofu, brotes de soya y la salsa tamarindo-fish sauce perfecta.',
          },
          {
            name: 'Tom Kha Gai',
            technique: 'Caldo Aromático', difficulty: 'Intermedio', time: '45m',
            ingredients: ['pollo', 'leche de coco', 'galangal', 'hierba de limón', 'hojas kaffir lime', 'champiñones', 'fish sauce', 'lima', 'chile', 'cilantro'],
            description: 'Sopa de pollo en leche de coco con galangal y hierba de limón. Balance perfecto de ácido, salado y cremoso.',
          },
          {
            name: 'Green Curry',
            technique: 'Curry', difficulty: 'Intermedio', time: '1h',
            ingredients: ['pasta de curry verde', 'leche de coco', 'pollo', 'berenjena tailandesa', 'pimiento', 'albahaca sagrada', 'fish sauce', 'azúcar de palma', 'arroz jazmín'],
            description: 'Curry verde con leche de coco, berenjena tailandesa y albahaca sagrada. La pasta verde es el corazón aromático.',
          },
        ],
      },
    ],
  },
];

// ─────────────────────────────────────────────
// INGREDIENT CATEGORIZATION
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────

const difficultyColors: Record<Difficulty, string> = {
  Básico: 'bg-emerald-100 text-emerald-700',
  Intermedio: 'bg-blue-100 text-blue-700',
  Difícil: 'bg-red-100 text-red-700',
};

const regionColors: Record<RegionName, string> = {
  América: 'text-orange-600',
  Europa: 'text-blue-600',
  Asia: 'text-red-600',
};

const regionBorderColors: Record<RegionName, string> = {
  América: 'border-orange-200 bg-orange-50',
  Europa: 'border-blue-200 bg-blue-50',
  Asia: 'border-red-200 bg-red-50',
};

// ─────────────────────────────────────────────
// RECIPE FLOW — flujo lineal
// Paso 0: intro  →  Paso 1: mercado  →  Paso 2: chat
// ─────────────────────────────────────────────

type FlowStep = 'intro' | 'mercado' | 'chat';

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

  // ── Modo voz (Gemini Live) ───────────────────────────────────────────────
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceSystemPrompt, setVoiceSystemPrompt] = useState('');
  const { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp } = useGeminiLive(voiceSystemPrompt);

  const handleStartVoice = async () => {
    setVoiceMode(true);
    await startListening();
  };

  const grouped = groupIngredients(recipe.ingredients);
  const categoryOrder: GroceryCategory[] = ['Proteínas', 'Verduras y Frutas', 'Lácteos y Refrigerados', 'Despensa'];

  // ── Prompt enriquecido con estado del mercado ────────────────────────────
  const buildSystemPrompt = () => {
    const obtained  = checkedIngredients;
    const missing   = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swapped   = Object.entries(swappedIngredients).map(([o, s]) => `${o} → ${s}`);
    const notMarked = recipe.ingredients.filter(
      i => !obtained.includes(i) && !unavailableIngredients.includes(i) && !(i in swappedIngredients)
    );

    return `Eres Sous, chef especializado en cocina ${countryName}. El usuario va a preparar "${recipe.name}" para ${servings} persona${servings !== 1 ? 's' : ''}.

DESCRIPCIÓN: ${recipe.description}

ESTADO DE INGREDIENTES:
- Conseguidos: ${obtained.length > 0 ? obtained.join(', ') : 'ninguno marcado'}
- No conseguidos: ${missing.length > 0 ? missing.join(', ') : 'ninguno'}
- Reemplazados: ${swapped.length > 0 ? swapped.join('; ') : 'ninguno'}
- Sin marcar (asumir disponibles): ${notMarked.length > 0 ? notMarked.join(', ') : 'ninguno'}

Adapta la receta a los ingredientes disponibles y sus sustitutos. Guía paso a paso para ${servings} persona${servings !== 1 ? 's' : ''}. Responde SOLO sobre esta receta. Máximo 60 palabras por respuesta.`;
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const storageKey = `sous_flavor_${recipe.name.replace(/\s+/g, '_').toLowerCase()}`;
  // El prompt se construye cuando el usuario presiona "¡Estoy listo!" para incluir el estado real del mercado
  const [systemPrompt, setSystemPrompt] = useState('');
  const { messages, isLoading, sendMessage, clearMessages } = useGeminiChat({ storageKey, systemPrompt });
  const [inputText, setInputText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cuando chatStarted cambia a true, envía el mensaje guardado en el ref
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

  // Dispara prefill cuando se va al chat desde el mercado (sustitutos, etc.)
  useEffect(() => {
    if (step !== 'chat' || chatStarted) return;
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
  }, [step]);

  const goToChat = (prefill = '') => {
    pendingMsgRef.current = prefill;
    setStep('chat');
  };

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  // ── Breadcrumb header ────────────────────────────────────────────────────
  const Header = () => (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100 bg-neutral-50 flex-shrink-0">
      <button
        onClick={() => {
          if (step === 'intro') { onBack(); return; }
          if (step === 'mercado') { setStep('intro'); return; }
          if (step === 'chat' && chatStarted) { setChatStarted(false); return; }
          setStep('mercado');
        }}
        className="flex items-center gap-1 text-sm font-bold text-neutral-500 hover:text-orange-600 transition-colors">
        <ArrowLeft size={15} />
        Atrás
      </button>
      <span className="text-neutral-300 mx-1">|</span>
      <span className="text-sm">{countryFlag}</span>
      <span className="text-sm font-semibold text-neutral-600 truncate">{recipe.name}</span>
      <div className="ml-auto flex items-center gap-1.5">
        {(['intro','mercado','chat'] as FlowStep[]).map((s, i) => (
          <div key={s} className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-orange-500' : i < (['intro','mercado','chat'] as FlowStep[]).indexOf(step) ? 'bg-orange-200' : 'bg-neutral-200'}`} />
        ))}
      </div>
    </div>
  );

  // ── PASO 0: Intro ─────────────────────────────────────────────────────────
  if (step === 'intro') return (
    <div className="flex flex-col h-full">
      <Header />
      <div className="flex-1 overflow-y-auto p-5 space-y-4 pb-28">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold bg-neutral-100 text-neutral-600 px-3 py-1 rounded-full">{recipe.technique}</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${difficultyColors[recipe.difficulty]}`}>{recipe.difficulty}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-50 px-3 py-1 rounded-full border border-neutral-200">
            <Clock size={11} />{recipe.time}
          </span>
        </div>

        {/* Descripción */}
        <p className="text-sm text-neutral-700 leading-relaxed">{recipe.description}</p>

        {/* Cantidad de personas */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-neutral-700">¿Para cuántas personas?</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}
                className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-orange-400 hover:text-orange-500 transition-all active:scale-90">
                <Minus size={14} />
              </button>
              <span className="text-xl font-black text-neutral-800 w-6 text-center">{servings}</span>
              <button onClick={() => setServings(s => Math.min(20, s + 1))}
                className="w-8 h-8 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-orange-400 hover:text-orange-500 transition-all active:scale-90">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Ingredientes resumidos */}
        <div className="bg-orange-50 rounded-xl p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Ingredientes principales</p>
          <div className="flex flex-wrap gap-1.5">
            {recipe.ingredients.map(ing => (
              <span key={ing} className="text-xs bg-white border border-orange-100 text-neutral-600 px-2.5 py-1 rounded-full">{ing}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Botón flotante */}
      <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
        <button
          onClick={() => setStep('mercado')}
          className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-orange-300/50 pointer-events-auto"
        >
          <ShoppingCart size={18} />
          Ir al mercado →
        </button>
      </div>
    </div>
  );

  // ── PASO 1: Lista de Mercado ──────────────────────────────────────────────
  if (step === 'mercado') {
    const pending      = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swappedCount = Object.keys(swappedIngredients).length;

    return (
      <div className="flex flex-col h-full relative">
        <Header />

        <div className="flex-1 overflow-y-auto p-5 pb-28">
          {/* Personas + contador */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-orange-500" />
              <span className="text-sm font-bold text-neutral-700">
                {(() => {
                  const unchecked = recipe.ingredients.filter(i => !checkedIngredients.includes(i) && !(i in swappedIngredients)).length;
                  return unchecked > 0 ? `${unchecked} ingrediente${unchecked !== 1 ? 's' : ''} pendiente${unchecked !== 1 ? 's' : ''}` : '¡Todo listo!';
                })()}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5">
              <button onClick={() => setServings(s => Math.max(1, s - 1))}
                className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-orange-400 transition-all active:scale-90">
                <Minus size={11} />
              </button>
              <span className="flex items-center gap-1 text-sm font-bold text-orange-700">
                <Users size={12} />{servings}
              </span>
              <button onClick={() => setServings(s => Math.min(20, s + 1))}
                className="w-6 h-6 rounded-full bg-white border border-neutral-200 flex items-center justify-center hover:border-orange-400 transition-all active:scale-90">
                <Plus size={11} />
              </button>
            </div>
          </div>

          {/* Banners de estado */}
          {(pending.length > 0 || swappedCount > 0) && (
            <div className="mb-4 space-y-2">
              {swappedCount > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
                  <RefreshCw size={14} className="text-blue-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-blue-700">{swappedCount} ingrediente{swappedCount > 1 ? 's cambiados' : ' cambiado'} por sustituto ✓</p>
                </div>
              )}
              {pending.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-red-700 text-sm">{pending.length} ingrediente{pending.length > 1 ? 's' : ''} sin sustituto</p>
                      <p className="text-xs text-red-500">El chef puede ayudarte con más opciones</p>
                    </div>
                  </div>
                  <button
                    onClick={() => goToChat(`No consigo estos ingredientes: ${pending.join(', ')}. ¿Qué puedo usar como sustituto?`)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-xl text-xs font-bold active:scale-95 transition-all flex-shrink-0"
                  >
                    <HelpCircle size={12} />Pedir sustitutos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Lista por categoría */}
          <div className="space-y-5">
            {categoryOrder.map(cat => {
              const items = grouped[cat];
              if (!items || items.length === 0) return null;
              return (
                <div key={cat}>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 bg-orange-50 px-3 py-1 rounded-md inline-block mb-2">{cat}</h4>
                  <ul className="space-y-1.5">
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
                      const handleNoConsigo = (e: React.MouseEvent) => {
                        e.stopPropagation();
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
                      const handleUndoSwap = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setSwappedIngredients(prev => { const n = { ...prev }; delete n[item]; return n; });
                      };

                      return (
                        <li key={item} className="rounded-xl overflow-hidden">
                          <div className={`flex items-center gap-3 px-3 py-2.5 border transition-all ${
                            isSwapped     ? 'bg-blue-50 border-blue-100' :
                            isChecked     ? 'bg-green-50 border-green-100' :
                            isUnavailable ? 'bg-red-50 border-red-200' :
                            'border-transparent hover:bg-neutral-50'
                          }`}>
                            <button onClick={toggleChecked}
                              className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                                isSwapped     ? 'border-blue-300 bg-blue-50 cursor-not-allowed' :
                                isChecked     ? 'bg-green-500 border-green-500' :
                                isUnavailable ? 'border-red-300 bg-red-50 cursor-not-allowed' :
                                'border-neutral-300 hover:border-green-400'
                              }`}>
                              {isChecked && <Check size={12} className="text-white" strokeWidth={3} />}
                            </button>
                            <div className="flex-1">
                              <span className={`text-sm break-words ${
                                isSwapped ? 'line-through text-neutral-400' :
                                isChecked ? 'line-through text-neutral-400' :
                                isUnavailable ? 'line-through text-red-400' : 'text-neutral-700'
                              }`}>{item}</span>
                              {isSwapped && (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <RefreshCw size={10} className="text-blue-500" />
                                  <span className="text-xs font-semibold text-blue-600">{swappedIngredients[item]}</span>
                                  <button onClick={handleUndoSwap} className="text-xs text-blue-400 hover:text-blue-700 underline">deshacer</button>
                                </div>
                              )}
                            </div>
                            {isSwapped ? (
                              <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-100 text-blue-600 flex-shrink-0">
                                <RefreshCw size={10} />Cambiado
                              </span>
                            ) : (
                              <button onClick={handleNoConsigo}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex-shrink-0 ${
                                  isUnavailable ? 'bg-red-400 text-white' : 'bg-neutral-100 text-neutral-400 hover:bg-red-100 hover:text-red-500'
                                }`}>
                                <XCircle size={11} />
                                {isUnavailable ? 'No disponible' : 'No lo consigo'}
                              </button>
                            )}
                          </div>
                          {isExpanded && (
                            <div className="bg-red-50 border border-red-200 border-t-0 rounded-b-xl px-4 py-3">
                              <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mb-2">Sustitutos sugeridos</p>
                              {suggestions.length > 0 ? (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {suggestions.map(sub => (
                                    <button key={sub} onClick={() => handleSwap(sub)}
                                      className="px-3 py-1.5 bg-white border border-red-200 rounded-full text-xs font-semibold text-neutral-700 hover:bg-orange-500 hover:text-white hover:border-orange-500 active:scale-95 transition-all shadow-sm">
                                      {sub}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-xs text-red-400 italic mb-3">No hay sustitutos predefinidos.</p>
                              )}
                              <button
                                onClick={() => { goToChat(`No consigo "${item}". ¿Qué puedo usar como sustituto?`); setExpandedItem(null); }}
                                className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors">
                                <ChefHat size={12} />Preguntar al chef por más opciones →
                              </button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Botón flotante */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-5 pt-10 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none">
          <button
            onClick={() => setStep('chat')}
            className="w-full flex items-center justify-center gap-2 py-4 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-bold text-base rounded-2xl transition-all shadow-xl shadow-orange-300/50 pointer-events-auto"
          >
            Manos a la obra →
          </button>
        </div>
      </div>
    );
  }

  // ── PASO 2: Chat — pantalla de inicio ────────────────────────────────────
  if (!chatStarted) {
    const obtained  = checkedIngredients;
    const missing   = unavailableIngredients.filter(i => !(i in swappedIngredients));
    const swapped   = Object.entries(swappedIngredients);

    return (
      <div className="flex flex-col h-full">
        <Header />
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-6 gap-6">

          {/* Ícono + título */}
          <div className="text-center space-y-2">
            <div className="text-5xl mb-2">{countryFlag}</div>
            <h2 className="text-2xl font-black text-neutral-800">{recipe.name}</h2>
            <p className="text-sm text-neutral-500 font-medium">{countryName} · {servings} persona{servings !== 1 ? 's' : ''} · {recipe.time}</p>
          </div>

          {/* Resumen de ingredientes */}
          <div className="w-full bg-neutral-50 border border-neutral-200 rounded-2xl p-5 space-y-3 max-w-md">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Tu lista de mercado</p>
            {obtained.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-green-600 uppercase mb-1">Conseguidos</p>
                <div className="flex flex-wrap gap-1.5">
                  {obtained.map(i => <span key={i} className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{i}</span>)}
                </div>
              </div>
            )}
            {swapped.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-blue-600 uppercase mb-1">Reemplazados</p>
                <div className="flex flex-wrap gap-1.5">
                  {swapped.map(([o, s]) => (
                    <span key={o} className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{o} → {s}</span>
                  ))}
                </div>
              </div>
            )}
            {missing.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-red-500 uppercase mb-1">No conseguidos</p>
                <div className="flex flex-wrap gap-1.5">
                  {missing.map(i => <span key={i} className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full">{i}</span>)}
                </div>
              </div>
            )}
            {obtained.length === 0 && swapped.length === 0 && missing.length === 0 && (
              <p className="text-sm text-neutral-400 italic">Todos los ingredientes están disponibles</p>
            )}
          </div>

          {/* Botón de inicio — grande */}
          <button
            onClick={() => {
              const textPr = buildSystemPrompt();
              setSystemPrompt(textPr);
              setVoiceSystemPrompt(textPr + '\nMODO VOZ: Habla naturalmente, sin listas ni markdown. Frases cortas. No interrumpas el silencio del usuario.');
              clearMessages();
              // Construir mensaje inicial con resumen de ingredientes
              const swaps = Object.entries(swappedIngredients).map(([o, s]) => `${o} → ${s}`);
              const missing = unavailableIngredients.filter(i => !(i in swappedIngredients));
              let msg = `Hola Sous, voy a preparar "${recipe.name}" para ${servings} persona${servings !== 1 ? 's' : ''}.`;
              if (swaps.length > 0) msg += ` Cambié estos ingredientes: ${swaps.join(', ')}.`;
              if (missing.length > 0) msg += ` No pude conseguir: ${missing.join(', ')}.`;
              msg += ` ¡Guíame paso a paso!`;
              pendingMsgRef.current = msg;
              setChatStarted(true);
              setStep('chat');
            }}
            className="w-full max-w-md flex items-center justify-center gap-3 py-5 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 active:scale-95 text-white font-black text-lg rounded-2xl transition-all shadow-2xl shadow-orange-300/50"
          >
            <ChefHat size={24} />
            ¡Estoy listo! Iniciar con Sous
          </button>
        </div>
      </div>
    );
  }

  // ── Modo voz: pantalla manos libres ─────────────────────────────────────
  if (voiceMode) {
    const isConnecting   = voiceState === 'connecting';
    const isSpeaking     = voiceState === 'speaking';
    const isVoiceListening = voiceState === 'listening';
    const isReconnecting = voiceState === 'reconnecting';
    const needsTap       = voiceState === 'needs-tap';
    const isSleeping     = voiceState === 'sleeping';
    const silenceLeft    = Math.max(0, 30 - silenceSeconds);

    return (
      <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">
          <div className="relative mb-6">
            {isSpeaking && (
              <>
                <span className="absolute inset-[-16px] rounded-full border-2 border-orange-500/30 animate-ping" />
                <span className="absolute inset-[-8px] rounded-full border-2 border-orange-500/50 animate-pulse" />
              </>
            )}
            {isVoiceListening && (
              <span className="absolute inset-[-8px] rounded-full border-2 border-green-500/40 animate-pulse" />
            )}
            {isReconnecting && (
              <span className="absolute inset-[-8px] rounded-full border-2 border-yellow-500/40 animate-ping" />
            )}
            {isVoiceListening && silenceSeconds > 10 && (
              <span className="absolute inset-[-12px] rounded-full border-2 border-neutral-600/60 animate-pulse" />
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-colors duration-500 ${
              isSpeaking       ? 'bg-orange-500/20 ring-2 ring-orange-500/50' :
              isVoiceListening ? 'bg-green-500/10 ring-2 ring-green-500/30' :
              isReconnecting   ? 'bg-yellow-500/10 ring-2 ring-yellow-500/30' :
              needsTap         ? 'bg-blue-500/10 ring-2 ring-blue-500/30' :
              isSleeping       ? 'bg-neutral-800/50 ring-2 ring-neutral-700/30' :
              'bg-neutral-800'
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
                {isSpeaking
                  ? currentChefText
                  : transcript[transcript.length - 1]?.agent === 'chef'
                    ? transcript[transcript.length - 1].text
                    : ''}
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
  }

  // ── PASO 2: Chat (modo texto) ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-neutral-50">
      <Header />

      {/* Info del chat */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="text-orange-500 w-4 h-4" />
          <div>
            <span className="text-sm font-bold text-neutral-700 block leading-tight">Chef Sous</span>
            <span className="text-[10px] text-neutral-400 leading-tight">{countryFlag} {recipe.name} · {servings} persona{servings !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <button
          onClick={() => { clearMessages(); setChatStarted(false); setStep('intro'); }}
          className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 rounded-full hover:bg-red-50"
        >
          <RefreshCw className="w-3 h-3" />
          Terminar sesión
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center mt-10 px-4">
            <div className="text-4xl mb-3">👨‍🍳</div>
            <p className="text-sm font-medium text-neutral-600">Sous está listo para acompañarte.</p>
            <p className="text-xs mt-1 text-neutral-400">Escríbele o activa la conversación de voz para tener las manos libres.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
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
        <div ref={bottomRef} />
      </div>

      {/* Input */}
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
            onChange={e => setInputText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder={isLoading ? 'Sous está respondiendo…' : 'Escribe tu pregunta…'}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-400 min-w-0 disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputText.trim()}
            className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-white flex-shrink-0 transition-colors disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// COUNTRY ACCORDION ROW
// ─────────────────────────────────────────────

interface CountryRowProps {
  country: Country;
  regionName: RegionName;
  onSelectRecipe: (recipe: Recipe, country: Country) => void;
}

const CountryRow = ({ country, onSelectRecipe }: CountryRowProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Country header — always visible, toggles accordion */}
      <button
        onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 transition-colors"
      >
        <span className="text-2xl">{country.flag}</span>
        <span className="flex-1 text-left font-bold text-neutral-800">{country.name}</span>
        <span className="text-xs text-neutral-400 font-medium mr-2">{country.recipes.length} recetas</span>
        {isOpen ? <ChevronUp size={18} className="text-neutral-400" /> : <ChevronDown size={18} className="text-neutral-400" />}
      </button>

      {/* Accordion content */}
      {isOpen && (
        <div className="border-t border-neutral-100 px-3 py-3">
          <ul className="space-y-1.5">
            {country.recipes.map(recipe => (
              <li key={recipe.name}>
                <button
                  onClick={() => onSelectRecipe(recipe, country)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-neutral-50 hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-neutral-800 group-hover:text-orange-700 transition-colors truncate">
                      {recipe.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${difficultyColors[recipe.difficulty]}`}>
                        {recipe.difficulty}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <Clock size={10} />
                        {recipe.time}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-medium">{recipe.technique}</span>
                    </div>
                  </div>
                  <ChevronDown size={14} className="text-neutral-300 group-hover:text-orange-400 flex-shrink-0 -rotate-90 transition-colors" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// REGION SECTION
// ─────────────────────────────────────────────

interface RegionSectionProps {
  region: Region;
  onSelectRecipe: (recipe: Recipe, country: Country) => void;
}

const RegionSection = ({ region, onSelectRecipe }: RegionSectionProps) => (
  <div className="mb-8">
    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-black mb-4 ${regionBorderColors[region.name]} ${regionColors[region.name]}`}>
      {region.name}
    </div>
    <div className="space-y-3">
      {region.countries.map(country => (
        <CountryRow
          key={country.name}
          country={country}
          regionName={region.name}
          onSelectRecipe={onSelectRecipe}
        />
      ))}
    </div>
  </div>
);

// ─────────────────────────────────────────────
// MAIN MODULE
// ─────────────────────────────────────────────

export const FlavorsModule = () => {
  const totalRecipes = REGIONS.flatMap(r => r.countries).flatMap(c => c.recipes).length;

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
    <div className="p-5 md:p-8 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-5 border-b border-neutral-200">
        <h2 className="text-3xl font-black text-neutral-800 flex items-center gap-3">
          <Globe className="text-orange-500" size={30} />
          Sabores del Mundo
        </h2>
        <p className="text-neutral-500 mt-1 text-sm font-medium">
          {totalRecipes} recetas de 9 países. Explora por región y país.
        </p>
      </div>

      {/* Region sections */}
      {REGIONS.map(region => (
        <RegionSection
          key={region.name}
          region={region}
          onSelectRecipe={(recipe, country) => setActiveRecipe({ recipe, country })}
        />
      ))}
    </div>
  );
};
