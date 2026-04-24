/**
 * gemini.ts
 *
 * Capa de servicios para comunicarse con los modelos de IA a través del
 * proxy propio (nunca directamente desde el navegador). Exporta:
 *
 * - `API_URL`                — URL base del proxy (Railway en prod, vacío en dev).
 * - `CHEF_SYSTEM_PROMPT`     — Prompt de sistema para el chef genérico (modo texto).
 * - `MILPREP_SYSTEM_PROMPT`  — Prompt de sistema para el módulo de meal prep.
 * - `buildCookingSystemPrompt` — Genera el prompt dinámico del módulo "Cocinemos".
 * - `evaluateImage`          — Evalúa una foto de plato con la IA y devuelve estrellas.
 *
 * Arquitectura de seguridad:
 * - Las claves de API de Gemini NUNCA salen al navegador.
 * - Todas las llamadas pasan por `/api/*` del proxy Express.
 * - En desarrollo, Vite proxea `/api` a `localhost:3001`.
 * - En producción, `VITE_API_URL` apunta al proxy Railway.
 */

// ── URL base del proxy (nunca la IA directamente) ─────────────────────────────
// En desarrollo: vacío → Vite proxea /api → localhost:3001
// En producción: VITE_API_URL=https://tu-proxy.railway.app
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

// ── Instrucción base de seguridad (se añade a TODOS los prompts) ──────────────
/** Guarda de tópico: la IA solo responde sobre cocina. */
const BASE_SAFETY = `Eres un asistente de cocina. Responde solo temas culinarios. Si el usuario divaga, pide amablemente retomar la receta.`;

// ── Reglas de comunicación compartidas (modo texto) ───────────────────────────
/**
 * Bloque de reglas que se inyecta en todos los prompts de modo texto.
 * Define formato, nivel de lenguaje, estructura de pasos y límite de palabras.
 */
const TEXT_COMMUNICATION_RULES = `
REGLAS OBLIGATORIAS DE COMUNICACIÓN (modo texto):
1. Explica TODO como si le hablaras a alguien que NUNCA ha cocinado. No asumas conocimiento previo.
2. NUNCA uses términos técnicos sin explicarlos de inmediato. Ejemplos:
   - MAL: "Sofríe la cebolla"  →  BIEN: "Pon aceite en la sartén a fuego medio y agrega la cebolla picada. Revuelve cada 30 segundos hasta que se vea transparente (unos 4-5 minutos)."
   - MAL: "Corta en brunoise"  →  BIEN: "Corta en cubos muy pequeños de aprox. 5 mm, como granitos de arroz grandes."
   - MAL: "Estofar la carne"   →  BIEN: "Cocinar la carne tapada a fuego bajo con un poco de líquido durante mucho tiempo, para que quede muy suave."
   - MAL: "Sellar la carne"    →  BIEN: "Poner la carne en la sartén muy caliente sin moverla por 2-3 minutos por lado, hasta que se forme una costra dorada."
3. FORMATO OBLIGATORIO — NUNCA escribas todo en un solo párrafo:
   - Usa listas numeradas (1. 2. 3.) para pasos en orden.
   - Usa viñetas (•) para ingredientes, tips o notas adicionales.
   - Deja líneas en blanco entre secciones.
   - Máximo 2 oraciones seguidas sin un salto de línea.
4. SIEMPRE divide las preparaciones en 3 etapas con estos títulos exactos:
   🔪 **MISE EN PLACE** — Todo lo que se alista antes de cocinar (picar, medir, marinar).
   🍳 **PREPARACIÓN** — Los pasos de cocción en orden.
   🍽️ **MONTAJE** — Cómo servir, emplatar o guardar.
5. Cuando haya peligros (cuchillo, aceite caliente, fuego) agrégalos con ⚠️ al final del paso.
6. Máximo 120 palabras por respuesta. Si hay más pasos, divide en partes y pregunta si está listo para continuar.`;

// ── Prompts de sistema ─────────────────────────────────────────────────────────

/** Prompt base para el chat de texto genérico del chef Sous. */
export const CHEF_SYSTEM_PROMPT = `${BASE_SAFETY}

Eres Sous, un sous chef personal, experto, apasionado y muy paciente. Siempre hablas en español.
${TEXT_COMMUNICATION_RULES}`;

// ── Prompts especializados para el módulo "Cocinemos" ─────────────────────────

/**
 * Intención del usuario al iniciar una sesión de cocina.
 * - `'discover-known'`    — Sabe qué quiere cocinar.
 * - `'discover-together'` — No sabe qué cocinar; la IA ayuda a decidir.
 * - `'cook-ingredients'`  — Quiere cocinar con lo que tiene en casa.
 */
export type CookingIntent = 'discover-known' | 'discover-together' | 'cook-ingredients';

/**
 * Genera el system prompt dinámico para el módulo "Cocinemos".
 * Adapta el tono (texto vs voz) y el flujo según la intención del usuario.
 *
 * @param intent        - Qué quiere hacer el usuario (ver `CookingIntent`).
 * @param timeAvailable - Tiempo disponible para cocinar (ej. "45 minutos").
 * @param mode          - Modo de interacción: `'text'` (SSE) o `'voice'` (WebSocket).
 * @returns System prompt completo listo para enviarse al modelo.
 */
export function buildCookingSystemPrompt(intent: CookingIntent, timeAvailable: string, mode: 'text' | 'voice' = 'text'): string {
  const base = `${BASE_SAFETY}

Eres Sous, un sous chef personal, experto y muy paciente. Siempre hablas en español.
El usuario tiene ${timeAvailable} disponibles para cocinar. Adapta siempre las recetas y tiempos a esto.
Cuando el usuario diga que terminó de cocinar o quiera empezar de nuevo, dile que puede usar el botón "Terminar sesión" que aparece en pantalla.`;

  const voiceRules = `
MODO CONVERSACIÓN DE VOZ — REGLAS CRÍTICAS:
- Habla de forma natural y cálida, como un amigo cocinero al lado del usuario.
- Frases cortas. Sin listas, sin markdown, sin emojis.
- Aun en voz, explica los términos técnicos de forma simple y natural.
- El usuario puede estar con las manos ocupadas y guardar silencio. Es normal — NO interrumpas, NO preguntes "¿sigues ahí?".
- Solo habla cuando el usuario te hable. Una instrucción a la vez.
- Cuando haya peligro, menciónalo brevemente como lo haría un amigo en la cocina.`;

  const rules = mode === 'voice' ? voiceRules : TEXT_COMMUNICATION_RULES;

  if (intent === 'discover-known') {
    return `${base}${rules}

El usuario ya sabe qué quiere comer. Pregúntale qué tiene en mente, confirma la receta, verifica que tenga los ingredientes principales y guíalo paso a paso.`;
  }

  if (intent === 'discover-together') {
    return `${base}${rules}

El usuario no sabe qué cocinar. Hazle máximo 3 preguntas para entender su mood, preferencias y disponibilidad. Propón 2-3 recetas adaptadas al tiempo. Cuando elija, guíalo paso a paso.`;
  }

  // intent === 'cook-ingredients'
  return `${base}${rules}

El usuario quiere cocinar con lo que tiene en casa. Pregúntale qué ingredientes tiene. Propón 2-3 opciones posibles. Cuando elija, guíalo paso a paso sin usar ingredientes que no tiene.`;
}

/** Prompt de sistema para el módulo de meal prep semanal. */
export const MILPREP_SYSTEM_PROMPT = `${BASE_SAFETY}

Eres Sous, un sous chef experto en meal prep semanal. Siempre hablas en español.
${TEXT_COMMUNICATION_RULES}

Contexto: el usuario está preparando sus comidas para la semana. Guíalo en orden eficiente (batch cooking), da tips de conservación y motívalo.`;

// ── Evaluación de imágenes (via proxy — la IA nunca se llama directamente) ─────

/** Resultado de la evaluación de un plato fotografiado. */
export interface EvaluationResult {
  /** Número de estrellas obtenidas (0–3). */
  stars: number;
  /** Retroalimentación cualitativa generada por la IA. */
  feedback: string;
}

/**
 * Envía una imagen en base64 al proxy para que la IA la evalúe según los
 * criterios de un nivel determinado.
 *
 * @param imageBase64 - Imagen codificada en base64 (sin prefijo `data:`).
 * @param levelName   - Nombre del nivel/desafío culinario evaluado.
 * @param criteria    - Lista de criterios con umbral de estrellas y descripción.
 * @returns Resultado con estrellas y retroalimentación. Devuelve 2 estrellas
 *          con mensaje genérico si la llamada falla (nunca lanza excepción).
 */
/** Comprime una imagen dataURL a máximo 1280px y calidad 0.82 para reducir el payload. */
async function compressImage(dataUrl: string, maxPx = 1280, quality = 0.82): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl); // si falla, usar original
    img.src = dataUrl;
  });
}

export async function evaluateImage(
  imageBase64: string,
  levelName: string,
  criteria: { stars: string; label: string }[]
): Promise<EvaluationResult> {
  try {
    const compressed = await compressImage(imageBase64);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000); // 30s timeout
    try {
      const res = await fetch(`${API_URL}/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: compressed, levelName, criteria }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json() as EvaluationResult;
    } finally {
      clearTimeout(timeout);
    }
  } catch (err) {
    console.error('[evaluateImage] Error al contactar el evaluador:', err);
    return { stars: 0, feedback: 'No pudimos conectar con el evaluador. Revisa tu conexión e intenta de nuevo.' };
  }
}
