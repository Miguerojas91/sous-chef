/** Secciones de la lista de mercado, en el orden en que se recorre la tienda. */

export type GroceryCategory = 'Proteínas' | 'Lácteos y Refrigerados' | 'Verduras y Frutas' | 'Despensa';

export const CATEGORY_ORDER: GroceryCategory[] = ['Proteínas', 'Verduras y Frutas', 'Lácteos y Refrigerados', 'Despensa'];

const PROTEIN_KEYWORDS = ['pollo', 'res', 'cerdo', 'carne', 'chorizo', 'morcilla', 'bacalao', 'camarón', 'pato', 'tofu', 'huevo', 'panceta', 'chicharrón', 'cordero', 'pescado', 'salmón', 'atún'];
const DAIRY_KEYWORDS = ['leche', 'crema', 'queso', 'mantequilla', 'yogur', 'yema'];
const VEGGIE_KEYWORDS = ['papa', 'tomate', 'cebolla', 'ajo', 'zanahoria', 'pimiento', 'col', 'plátano', 'aguacate', 'mazorca', 'naranjilla', 'champiñon', 'espinaca', 'berenjena', 'brotes', 'cilantro', 'perejil', 'jengibre', 'lima', 'limón', 'manzana', 'pepino', 'yuca'];

/** Para recetas que solo traen el nombre del ingrediente (Sabores del Mundo). */
export function categorizeIngredient(ingredient: string): GroceryCategory {
  const lower = ingredient.toLowerCase();
  if (PROTEIN_KEYWORDS.some(k => lower.includes(k))) return 'Proteínas';
  if (DAIRY_KEYWORDS.some(k => lower.includes(k))) return 'Lácteos y Refrigerados';
  if (VEGGIE_KEYWORDS.some(k => lower.includes(k))) return 'Verduras y Frutas';
  return 'Despensa';
}
