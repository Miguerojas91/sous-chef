/**
 * Sustitutos sugeridos cuando el usuario no consigue un ingrediente. Una sola
 * tabla para Sabores del Mundo y Mealprep.
 */
import { matchLongestKeyword, prepareKeywordTable } from '../utils/keywordMatch';

const SUBSTITUTES: { keywords: string[]; options: string[] }[] = [
  { keywords: ['pollo', 'pechuga', 'muslo', 'pechuga de pollo', 'muslo de pollo'], options: ['Pavo en trozos', 'Tofu firme', 'Cerdo magro'] },
  { keywords: ['carne molida', 'res', 'bistec', 'lomo de res', 'tira de asado', 'vacío', 'carne de res'], options: ['Cerdo molido', 'Cordero', 'Pollo desmenuzado'] },
  { keywords: ['chorizo', 'morcilla', 'chicharrón', 'cerdo', 'panceta', 'carne molida de cerdo'], options: ['Pavo ahumado', 'Tofu ahumado', 'Champiñones salteados'] },
  { keywords: ['tocino', 'bacon'], options: ['Jamón serrano', 'Pavo ahumado', 'Champiñones salteados'] },
  { keywords: ['salmón', 'salmon'], options: ['Atún fresco', 'Tilapia', 'Pechuga de pollo'] },
  { keywords: ['atún', 'atun'], options: ['Salmón', 'Sardinas', 'Pollo desmenuzado'] },
  { keywords: ['camarón', 'camaron', 'camarones'], options: ['Calamar', 'Pollo', 'Tofu firme'] },
  { keywords: ['bacalao'], options: ['Merluza', 'Tilapia', 'Atún fresco'] },
  { keywords: ['leche de coco'], options: ['Crema de leche', 'Leche de almendras', 'Leche evaporada'] },
  { keywords: ['leche', 'leche de vaca'], options: ['Leche de almendras', 'Leche de avena', 'Leche de coco'] },
  { keywords: ['mantequilla', 'manteca'], options: ['Aceite de oliva', 'Margarina vegetal', 'Aceite de coco'] },
  { keywords: ['queso', 'queso parmesano', 'queso mozzarella'], options: ['Queso de cabra', 'Levadura nutricional', 'Tofu desmenuzado'] },
  { keywords: ['crema de leche', 'crema', 'nata'], options: ['Leche de coco', 'Yogur griego', 'Leche evaporada'] },
  { keywords: ['huevo', 'huevos'], options: ['Linaza molida + agua', 'Tofu sedoso', 'Aquafaba'] },
  { keywords: ['arroz', 'arroz blanco', 'arroz integral'], options: ['Quinoa', 'Cuscús', 'Pasta integral'] },
  { keywords: ['papa', 'papas', 'patata'], options: ['Batata', 'Coliflor', 'Yuca'] },
  { keywords: ['plátano'], options: ['Batata', 'Yuca', 'Papa'] },
  { keywords: ['pasta', 'fideos', 'espagueti'], options: ['Zucchini en espirales', 'Arroz', 'Quinoa'] },
  { keywords: ['lentejas'], options: ['Garbanzos', 'Frijoles negros', 'Quinoa'] },
  { keywords: ['garbanzos'], options: ['Lentejas', 'Frijoles blancos', 'Edamame'] },
  { keywords: ['tofu'], options: ['Tempeh', 'Pechuga de pollo', 'Setas'] },
  { keywords: ['fish sauce', 'salsa de soya', 'soya'], options: ['Salsa tamari', 'Aminos de coco', 'Salsa Worcester'] },
  { keywords: ['mirin', 'sake'], options: ['Vino blanco seco + azúcar', 'Vinagre de arroz', 'Jerez seco'] },
  { keywords: ['tamarindo'], options: ['Limón + azúcar morena', 'Vinagre de arroz', 'Pasta de ciruela'] },
  { keywords: ['galangal'], options: ['Jengibre fresco (doble cantidad)', 'Jengibre en polvo'] },
  { keywords: ['hierba de limón', 'kaffir'], options: ['Ralladura de limón', 'Hojas de laurel + limón'] },
  { keywords: ['pasta de curry verde', 'pasta de curry', 'doubanjiang'], options: ['Curry en polvo + chile', 'Harissa', 'Sambal oelek'] },
  { keywords: ['azúcar de palma'], options: ['Azúcar morena', 'Miel', 'Piloncillo'] },
  { keywords: ['espinaca', 'espinacas'], options: ['Acelga', 'Kale', 'Rúgula'] },
  { keywords: ['zanahoria', 'zanahorias'], options: ['Batata', 'Calabaza', 'Nabo'] },
  { keywords: ['brócoli', 'brocoli'], options: ['Coliflor', 'Espárragos', 'Judías verdes'] },
  { keywords: ['tomate', 'tomates'], options: ['Tomate enlatado', 'Pimiento rojo', 'Puré de tomate', 'Calabacín'] },
  { keywords: ['cebolla'], options: ['Cebollín', 'Puerro', 'Chalota'] },
  { keywords: ['ajo'], options: ['Ajo en polvo (¼ cdta)', 'Chalota', 'Cebollín'] },
  { keywords: ['aceite de oliva', 'aceite de sésamo'], options: ['Aceite de girasol', 'Aceite de maíz', 'Aceite de aguacate', 'Aceite de coco', 'Mantequilla'] },
  { keywords: ['vino tinto', 'vino blanco', 'cerveza'], options: ['Caldo concentrado + vinagre', 'Jugo de uva', 'Agua + laurel'] },
  { keywords: ['champiñon', 'champiñones', 'hongos'], options: ['Berenjena', 'Zucchini', 'Tofu'] },
  { keywords: ['limón', 'limon', 'lima', 'naranjilla'], options: ['Lima', 'Vinagre blanco', 'Naranja agria'] },
  { keywords: ['maní', 'almendras', 'nueces'], options: ['Semillas de girasol', 'Pepitas de calabaza', 'Tahini'] },
  // Nombres donde una clave más corta daría un sustituto sin sentido
  // ("vinagre de arroz" → quinoa): mejor ninguna sugerencia y preguntar a Sous.
  { keywords: ['vinagre de arroz', 'vinagre de vino tinto', 'caldo de res', 'brotes de soya', 'pasta miso'], options: [] },
];

const SUBSTITUTE_KEYWORDS = prepareKeywordTable(
  SUBSTITUTES.map(({ keywords, options }) => ({ keywords, value: options })),
);

export function getSuggestedSubstitutes(ingredientName: string): string[] {
  return matchLongestKeyword(SUBSTITUTE_KEYWORDS, ingredientName) ?? [];
}
