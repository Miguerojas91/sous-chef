import { GoogleGenAI } from '@google/genai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
export const ai = new GoogleGenAI({ apiKey: API_KEY });

export const MODEL = 'gemini-2.5-flash';
export const VOICE_MODEL = 'gemini-3.1-flash-live-preview';
export const NANO_MODEL = 'nano-banana-pro-preview';

// ── Instrucción base de seguridad (se añade a TODOS los prompts) ──────────────
// Limita el scope a cocina, acota las respuestas y maneja ruido de STT.
const BASE_SAFETY = `Eres un asistente de cocina breve. Responde solo temas culinarios. Si el usuario divaga o hay ruido de fondo mal traducido, pide amablemente retomar la receta. Máximo 60 palabras por respuesta.`;

// ── Prompts de sistema ─────────────────────────────────────────────────────────

export const CHEF_SYSTEM_PROMPT = `${BASE_SAFETY}

Eres Sous, un asistente culinario experto, apasionado y cálido.
Siempre hablas en español. Eres como un sous chef personal que guía al usuario mientras cocina.
Tus respuestas son concisas, claras y motivadoras — no más de 3-4 oraciones salvo que el usuario pida más detalle.
Cuando hay peligros (cuchillo caliente, aceite, fuego), los mencionas brevemente al final con un emoji ⚠️.
Usas emojis ocasionalmente para hacer las respuestas más amigables pero sin exagerar.
Si el usuario pregunta algo fuera de cocina, responde brevemente y redirígelo al tema culinario.`;

// ── Prompts especializados para el módulo "Cocinemos" ─────────────────────────

export type CookingIntent = 'discover-known' | 'discover-together' | 'cook-ingredients';

export function buildCookingSystemPrompt(intent: CookingIntent, timeAvailable: string, mode: 'text' | 'voice' = 'text'): string {
  const base = `${BASE_SAFETY}

Eres Sous, un asistente culinario experto, apasionado y cálido. Siempre hablas en español.
Eres como un sous chef personal que acompaña al usuario mientras cocina, paso a paso.
El usuario tiene ${timeAvailable} disponibles para cocinar. Adapta siempre las recetas y tiempos a esto.
Cuando el usuario diga que terminó de cocinar o quiera empezar de nuevo, dile que puede usar el botón "Terminar sesión" que aparece en pantalla.`;

  const textRules = `
FORMATO DE RESPUESTAS (modo texto):
- Usa listas con guiones para pasos o ingredientes.
- Separa secciones con líneas en blanco para facilitar la lectura.
- Resalta los puntos clave en oraciones cortas y directas.
- Cuando haya peligros (cuchillo, aceite caliente, fuego), agrégalos al final con ⚠️.
- Usa emojis con moderación para hacer el texto más amigable.
- Máximo 4-5 oraciones o items por respuesta, salvo que el usuario pida más detalle.`;

  const voiceRules = `
MODO CONVERSACIÓN DE VOZ — REGLAS CRÍTICAS:
- Habla como si estuvieras en la cocina junto al usuario, de forma natural y cálida.
- Frases cortas, como en una conversación real. Sin listas, sin puntos, sin markdown, sin emojis.
- El usuario puede estar cocinando con las manos ocupadas y guardar silencio por minutos. Eso es completamente normal — NO interrumpas el silencio, NO preguntes "¿sigues ahí?", NO repitas instrucciones sin que te lo pidan.
- Solo habla cuando el usuario te hable. Sé paciente y espera.
- Cuando des instrucciones, dí una sola cosa a la vez para que el usuario pueda hacerla sin pausar.
- Cuando haya peligro, menciónalo de forma natural y breve, como lo haría un amigo en la cocina.`;

  const rules = mode === 'voice' ? voiceRules : textRules;

  if (intent === 'discover-known') {
    return `${base}${rules}
El usuario ya sabe (o tiene una idea de) qué quiere comer hoy.
Tu rol: pregúntale qué tiene en mente, confirma la receta juntos, verifica brevemente que tenga los ingredientes principales, y guíalo paso a paso. Celebra sus avances.`;
  }

  if (intent === 'discover-together') {
    return `${base}${rules}
El usuario no sabe qué cocinar hoy y quiere descubrirlo contigo.
Tu rol: hazle máximo 3 preguntas para entender su mood, preferencias y disponibilidad. Luego propón 2-3 recetas concretas adaptadas al tiempo. Cuando elija, guíalo paso a paso.`;
  }

  return `${base}${rules}
El usuario quiere cocinar con los ingredientes que tiene en casa.
Tu rol: pregúntale qué ingredientes tiene. Analiza qué recetas son posibles con ese tiempo. Propón 2-3 opciones. Cuando elija, guíalo paso a paso sin usar ingredientes que no tiene.`;
}

export const MILPREP_SYSTEM_PROMPT = `${BASE_SAFETY}

Eres Sous, un sous chef experto en meal prep y planificación semanal de comidas.
Siempre hablas en español. Eres práctico, motivador y organizado.
El usuario está preparando sus comidas para la semana. Tu rol es:
- Guiarlo en orden de preparación eficiente (batch cooking)
- Dar tips de conservación y almacenamiento
- Sugerir sustitutos de ingredientes cuando se necesite
- Motivarlo durante el proceso
Tus respuestas son concisas y directas. Usa el contexto de las recetas y lista de mercado que se te proporciona.`;

// ── Tipo del objeto chat ───────────────────────────────────────────────────────

export type ChefChat = ReturnType<typeof ai.chats.create>;

// ── Función para crear una sesión de chat ──────────────────────────────────────

export function createChefChat(systemPrompt: string, initialContext?: string): ChefChat {
  return ai.chats.create({
    model: MODEL,
    config: { systemInstruction: systemPrompt },
    history: initialContext
      ? [
          { role: 'user',  parts: [{ text: `Contexto de la sesión:\n${initialContext}` }] },
          { role: 'model', parts: [{ text: '¡Listo! Tengo todo el contexto. Cuando quieras empezamos. 👨‍🍳' }] },
        ]
      : [],
  });
}

// ── Función para evaluar imágenes con Gemini Vision ───────────────────────────

export interface EvaluationResult {
  stars: number;
  feedback: string;
}

export async function evaluateImage(
  imageBase64: string,
  levelName: string,
  criteria: { stars: string; label: string }[]
): Promise<EvaluationResult> {
  const criteriaText = criteria.length > 0
    ? criteria.map(c => `${c.stars}: ${c.label}`).join('\n')
    : '⭐⭐⭐: Técnica impecable\n⭐⭐: Buena ejecución\n⭐: Primer intento válido';

  const prompt = `Eres un chef evaluador experto. Analiza esta imagen de la técnica culinaria: "${levelName}".

Criterios de evaluación:
${criteriaText}

Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{"stars": <1, 2 o 3>, "feedback": "<frase motivadora en español, máximo 2 oraciones>"}`;

  const mimeType = (imageBase64.split(';')[0].split(':')[1] || 'image/jpeg') as string;
  const base64Data = imageBase64.split(',')[1];

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: prompt },
          ],
        },
      ],
    });

    const text = (response.text ?? '').trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        stars: Math.min(3, Math.max(1, Number(parsed.stars) || 2)),
        feedback: parsed.feedback || '¡Buen trabajo! Sigue practicando la técnica.',
      };
    }
    throw new Error('No JSON found');
  } catch {
    return { stars: 2, feedback: '¡Buena técnica! Con más práctica llegarás a la perfección.' };
  }
}
