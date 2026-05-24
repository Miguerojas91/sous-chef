/**
 * recipeFilters.ts
 *
 * Catálogo de filtros que el usuario puede activar antes de empezar a cocinar.
 * Cada filtro define un bloque de texto (`promptText`) que se inyecta al
 * system prompt del Chef IA, instruyéndole a respetar la restricción de manera
 * inviolable.
 *
 * Hay dos tipos:
 *  - `session` — filtros del momento (cambian cada vez): "sin horno hoy",
 *    "3 ingredientes", "económico", "para niños".
 *  - `dietary` — preferencias persistentes del usuario (se guardan en perfil
 *    y se pre-seleccionan en cada sesión): "diabético", "keto", "vegetariano",
 *    "sin gluten".
 *
 * Fundamento (informe de mercado):
 * - "Sin horno": muchos hogares latinoamericanos no tienen horno (falencia #4).
 * - "3 ingredientes": el video con más likes del dataset (6,389 likes).
 * - "Diabético / keto / sin gluten": personalización por dieta (virtud #4).
 * - "Para niños": segmento mamás + cocina para niños (114 menciones combinadas).
 * - "Económico": tema emergente, alto valor percibido.
 */

export type FilterKind = 'session' | 'dietary';

export interface RecipeFilter {
  id: string;
  label: string;
  emoji: string;
  kind: FilterKind;
  /** Texto que se inyecta al system prompt cuando el filtro está activo. */
  promptText: string;
}

export const RECIPE_FILTERS: RecipeFilter[] = [
  // ── Filtros de sesión ──────────────────────────────────────────────────────
  {
    id: 'sin-horno',
    label: 'Sin horno',
    emoji: '🔥',
    kind: 'session',
    promptText:
      'PROHIBIDO usar horno. Solo recetas en sartén, olla, microondas, parrilla, ' +
      'plancha o sin cocción. Si la receta tradicionalmente lleva horno, adáptala ' +
      'a sartén o microondas — no asumas que el usuario tiene horno.',
  },
  {
    id: 'tres-ingredientes',
    label: '3 ingredientes',
    emoji: '🥚',
    kind: 'session',
    promptText:
      'La receta debe usar MÁXIMO 3 ingredientes (sin contar agua, sal, pimienta ' +
      'ni aceite, que son básicos). Sé creativo con técnicas, no con cantidad de ' +
      'ingredientes. Si no es posible con 3, di honestamente que se necesita ' +
      'un cuarto y cuál.',
  },
  {
    id: 'economico',
    label: 'Económico',
    emoji: '💰',
    kind: 'session',
    promptText:
      'Prioriza ingredientes ECONÓMICOS y accesibles en cualquier mercado de barrio. ' +
      'Evita proteínas caras (langostinos, salmón, cortes premium de carne, quesos ' +
      'maduros, frutos secos importados), trufas, vinos especiales, especias raras. ' +
      'Prefiere huevo, legumbres, arroz, papa, verduras de temporada, pollo en lugar ' +
      'de pescado, cortes baratos. Sugiere porciones que rindan.',
  },
  {
    id: 'para-ninos',
    label: 'Para niños',
    emoji: '👶',
    kind: 'session',
    promptText:
      'Receta apta para niños pequeños (3-10 años). NO uses picante ni picaduras ' +
      'fuertes (ají, chile, jalapeño, rocoto, pimienta agresiva). Sabores suaves. ' +
      'Texturas masticables fáciles. Sin huesos pequeños ni espinas. Si el plato ' +
      'original lleva alcohol como ingrediente, omítelo. Visualmente atractivo y ' +
      'divertido si es posible (forma, color). Pequeñas porciones.',
  },

  // ── Preferencias dietéticas persistentes ───────────────────────────────────
  {
    id: 'diabetico',
    label: 'Diabético',
    emoji: '🩺',
    kind: 'dietary',
    promptText:
      'RESTRICCIÓN MÉDICA — DIABETES. NO uses azúcar ni endulzantes calóricos ' +
      '(miel, panela, papelón, jarabe de agave). Si hace falta dulzor, sugiere ' +
      'stevia o eritritol y sé explícito. EVITA carbohidratos refinados de alta ' +
      'carga glucémica: pan blanco, arroz blanco abundante, papa en grandes ' +
      'cantidades, harinas blancas. Prefiere proteína, verduras no almidonadas, ' +
      'cereales integrales en porciones moderadas, grasas saludables. Si el usuario ' +
      'pregunta el índice glucémico, dale un estimado simple.',
  },
  {
    id: 'keto',
    label: 'Keto',
    emoji: '🥑',
    kind: 'dietary',
    promptText:
      'DIETA KETO. La receta debe ser ALTA en grasas saludables, moderada en ' +
      'proteína, MUY BAJA en carbohidratos (≤10g netos por porción). PROHIBIDO: ' +
      'arroz, pasta, pan, papa, maíz, plátano, frutas dulces (excepto frutos ' +
      'rojos en pequeñas cantidades), azúcar, miel, legumbres. PERMITIDO: ' +
      'carne, pescado, huevo, queso, aguacate, frutos secos, aceite de oliva/coco, ' +
      'verduras de hoja, brócoli, coliflor, calabacín, espárragos. Si la receta ' +
      'tradicional incluye carbos, sustitúyelos (ej. "arroz" de coliflor, "fideos" ' +
      'de zucchini).',
  },
  {
    id: 'vegetariano',
    label: 'Vegetariano',
    emoji: '🥬',
    kind: 'dietary',
    promptText:
      'DIETA VEGETARIANA. NO uses carne (vaca, cerdo, cordero, ternera), pollo, ' +
      'pavo, pato, conejo ni ningún otro animal terrestre. NO pescado ni mariscos. ' +
      'SÍ se permite huevo y lácteos (a menos que el usuario aclare lo contrario). ' +
      'Si el usuario quiere un plato típicamente cárnico, propón sustituto plant-' +
      'based (legumbres, tofu, tempeh, seitán, champiñones, jaca).',
  },
  {
    id: 'sin-gluten',
    label: 'Sin gluten',
    emoji: '🌾',
    kind: 'dietary',
    promptText:
      'INTOLERANCIA AL GLUTEN. NO uses trigo, cebada, centeno, espelta, kamut ni ' +
      'sus derivados. PROHIBIDO: harina común, pan común, pasta, cuscús, cerveza, ' +
      'salsa de soya regular, seitán. PERMITIDO: arroz, maíz, papa, yuca, quinua, ' +
      'amaranto, trigo sarraceno, harina de almendra/coco/garbanzo, tamari (soya ' +
      'sin gluten). Verifica explícitamente que NO haya gluten oculto en salsas ' +
      'procesadas — si sugieres una salsa comercial, aclara "versión sin gluten".',
  },
];

/** Obtiene un filtro por su id. */
export function getFilter(id: string): RecipeFilter | undefined {
  return RECIPE_FILTERS.find(f => f.id === id);
}

/** Devuelve los filtros del tipo `session` (chips toggleables por sesión). */
export function getSessionFilters(): RecipeFilter[] {
  return RECIPE_FILTERS.filter(f => f.kind === 'session');
}

/** Devuelve los filtros del tipo `dietary` (preferencias persistentes). */
export function getDietaryFilters(): RecipeFilter[] {
  return RECIPE_FILTERS.filter(f => f.kind === 'dietary');
}

/**
 * Construye el bloque de texto que se inyecta al system prompt, dadas
 * las restricciones activas para la sesión actual. Si no hay nada activo
 * devuelve string vacío.
 */
export function buildFiltersPromptBlock(opts: {
  activeFilterIds?: string[];
  allergies?: string[];
  dislikes?: string[];
}): string {
  const lines: string[] = [];

  const active = (opts.activeFilterIds ?? [])
    .map(id => getFilter(id))
    .filter((f): f is RecipeFilter => Boolean(f));

  if (active.length === 0 && (opts.allergies ?? []).length === 0 && (opts.dislikes ?? []).length === 0) {
    return '';
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('🚨 RESTRICCIONES DE ESTA SESIÓN — RESPETAR SIEMPRE');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');

  if (opts.allergies && opts.allergies.length > 0) {
    lines.push(
      `⚠️ ALERGIAS DEL USUARIO (NO usar nunca, riesgo de salud): ${opts.allergies.join(', ')}. ` +
      `Si una receta lo lleva tradicionalmente, OMÍTELO o sustitúyelo y alerta al usuario.`
    );
    lines.push('');
  }

  if (opts.dislikes && opts.dislikes.length > 0) {
    lines.push(
      `🙅 NO LE GUSTAN: ${opts.dislikes.join(', ')}. ` +
      `Evita estos ingredientes salvo que el usuario los pida explícitamente.`
    );
    lines.push('');
  }

  for (const f of active) {
    lines.push(`${f.emoji} ${f.label.toUpperCase()}:`);
    lines.push(f.promptText);
    lines.push('');
  }

  lines.push('Estas restricciones son inviolables. Antes de proponer cualquier');
  lines.push('receta verifica que las cumple TODAS. Si no hay receta posible, dilo');
  lines.push('honestamente en lugar de ignorar una restricción.');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return lines.join('\n');
}
