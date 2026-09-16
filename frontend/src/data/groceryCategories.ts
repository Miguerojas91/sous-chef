/** Secciones de la lista de mercado, en el orden en que se recorre la tienda. */
import { matchLongestKeyword, prepareKeywordTable } from '../utils/keywordMatch';

export type GroceryCategory = 'Proteínas' | 'Lácteos y Refrigerados' | 'Verduras y Frutas' | 'Despensa';

export const CATEGORY_ORDER: GroceryCategory[] = ['Proteínas', 'Verduras y Frutas', 'Lácteos y Refrigerados', 'Despensa'];

// En empate de largo gana la fila de arriba. "Despensa" lleva las claves que
// corrigen a una más corta de otra sección: "caldo de res" no es carne.
const CATEGORY_KEYWORDS = prepareKeywordTable<GroceryCategory>([
  { value: 'Proteínas', keywords: ['pollo', 'res', 'cerdo', 'carne', 'chorizo', 'morcilla', 'bacalao', 'camarón', 'pato', 'tofu', 'huevo', 'panceta', 'chicharrón', 'cordero', 'pescado', 'salmón', 'atún', 'trucha', 'tocino', 'tira de asado', 'vacío'] },
  { value: 'Lácteos y Refrigerados', keywords: ['leche', 'crema', 'queso', 'mantequilla', 'yogur', 'yema'] },
  { value: 'Verduras y Frutas', keywords: ['papa', 'tomate', 'cebolla', 'cebollín', 'cebollitas', 'ajo', 'zanahoria', 'pimiento', 'pimentón rojo', 'pimentón verde', 'col', 'coliflor', 'brócoli', 'plátano', 'aguacate', 'mazorca', 'maíz tierno', 'naranjilla', 'naranja', 'champiñon', 'espinaca', 'berenjena', 'brotes', 'cilantro', 'perejil', 'albahaca fresca', 'jengibre', 'lima', 'limón', 'manzana', 'mango', 'pepino', 'yuca', 'lechuga', 'remolacha', 'apio', 'espárrago', 'arveja'] },
  { value: 'Despensa', keywords: ['caldo', 'caldo de res', 'caldo de pescado', 'leche de coco', 'vinagre de manzana', 'salsa de tomate', 'tomate en lata', 'tomate triturado', 'ajo en polvo'] },
]);

/** Para recetas que solo traen el nombre del ingrediente (Sabores del Mundo). */
export function categorizeIngredient(ingredient: string): GroceryCategory {
  return matchLongestKeyword(CATEGORY_KEYWORDS, ingredient) ?? 'Despensa';
}
