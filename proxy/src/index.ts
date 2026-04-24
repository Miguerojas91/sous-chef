/**
 * proxy/src/index.ts
 *
 * Servidor proxy Express + WebSocket para Sous Chef.
 * Actúa como intermediario entre el navegador y la API de Gemini,
 * manteniendo las claves de API exclusivamente en el servidor.
 *
 * ── Endpoints HTTP ──────────────────────────────────────────────
 * GET  /health                    — Health check para Railway/Vercel.
 * GET  /api/membership/check      — Verifica si un email tiene premium.
 * POST /api/hotmart/webhook       — Recibe eventos de compra de Hotmart.
 * POST /api/membership/grant      — Admin: otorgar/revocar premium manualmente.
 * POST /api/chat                  — Chat de texto con streaming SSE (Gemini 2.5 Flash).
 * POST /api/evaluate              — Evaluación de imagen culinaria con Gemini Vision.
 *
 * ── WebSocket ───────────────────────────────────────────────────
 * WS   /api/live                  — Proxy de voz en tiempo real (Gemini Live).
 *
 * Variables de entorno requeridas:
 * - `GEMINI_API_KEY`  — Clave de API de Google Generative AI.
 * - `PORT`            — Puerto del servidor (default: 3001).
 * - `ALLOWED_ORIGIN`  — Origen CORS permitido (default: '*').
 * - `HOTMART_TOKEN`   — Token de verificación de webhooks Hotmart.
 * - `ADMIN_SECRET`    — Secret para endpoints de administración manual.
 * - `PREMIUM_EMAILS`  — Lista CSV de emails premium persistidos (env var Railway).
 *
 * Seguridad:
 * - La clave de Gemini NUNCA se envía al navegador.
 * - El WebSocket proxy simplifica el protocolo Gemini Live a un subset
 *   sin revelar el proveedor de IA al cliente.
 */

import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';

dotenv.config();

// ── Config ─────────────────────────────────────────────────────────────────────
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY ?? '';
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN ?? '*';
const PORT            = Number(process.env.PORT) || 3001;
const HOTMART_TOKEN   = process.env.HOTMART_TOKEN ?? '';          // Hottok de Hotmart
const ADMIN_SECRET    = process.env.ADMIN_SECRET ?? 'sous-admin'; // Para gestión manual

// ── Membership Store (in-memory + seed desde env var) ──────────────────────────
// PREMIUM_EMAILS = "email1@x.com,email2@x.com"  (Railway env var para persistir)
const premiumEmails = new Set<string>(
  (process.env.PREMIUM_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
);

// Modelos (solo en el servidor)
const TEXT_MODEL  = 'gemini-2.5-flash';
const VOICE_MODEL = 'gemini-3.1-flash-live-preview';

function getAI(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada en el servidor.');
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ── Express ────────────────────────────────────────────────────────────────────
const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── GET /api/membership/check ── Verifica si un email tiene membresía premium ──
app.get('/api/membership/check', (req, res) => {
  const email = (req.query.email as string ?? '').trim().toLowerCase();
  if (!email) return void res.json({ isPremium: false });
  res.json({ isPremium: premiumEmails.has(email) });
});

// ── POST /api/hotmart/webhook ── Recibe eventos de compra de Hotmart ───────────
app.post('/api/hotmart/webhook', (req, res) => {
  // Validar hottok si está configurado
  const hottok = req.query.hottok as string | undefined;
  if (HOTMART_TOKEN && hottok !== HOTMART_TOKEN) {
    console.warn('⚠️  Webhook recibido con hottok inválido');
    return void res.status(401).json({ error: 'Token inválido' });
  }

  try {
    const body = req.body as Record<string, unknown>;

    // Hotmart v2.0 format
    const event  = (body.event as string | undefined) ?? '';
    const data   = (body.data as Record<string, unknown> | undefined) ?? {};
    const buyer  = (data.buyer as Record<string, unknown> | undefined) ?? {};
    const purchase = (data.purchase as Record<string, unknown> | undefined) ?? {};
    const email  = ((buyer.email as string | undefined) ?? '').trim().toLowerCase();
    const status = ((purchase.status as string | undefined) ?? '').toUpperCase();

    if (!email) {
      return void res.json({ received: true, note: 'Sin email, ignorado' });
    }

    const APPROVED_EVENTS = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'SUBSCRIPTION_REACTIVATED'];
    const CANCELLED_EVENTS = ['PURCHASE_CANCELLED', 'PURCHASE_REFUNDED', 'SUBSCRIPTION_CANCELLATION'];
    const APPROVED_STATUS  = ['APPROVED', 'COMPLETE'];

    if (APPROVED_EVENTS.includes(event) || APPROVED_STATUS.includes(status)) {
      premiumEmails.add(email);
      console.log(`✅ Premium activado: ${email} (event: ${event || status})`);
    } else if (CANCELLED_EVENTS.includes(event)) {
      premiumEmails.delete(email);
      console.log(`❌ Premium cancelado: ${email} (event: ${event})`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    res.status(400).json({ error: 'Webhook inválido' });
  }
});

// ── POST /api/membership/grant ── Admin: otorgar/revocar premium manualmente ──
app.post('/api/membership/grant', (req, res) => {
  const { email, secret, revoke } = req.body as {
    email: string;
    secret: string;
    revoke?: boolean;
  };
  if (secret !== ADMIN_SECRET) return void res.status(403).json({ error: 'Acceso denegado' });
  const key = email.trim().toLowerCase();
  if (revoke) {
    premiumEmails.delete(key);
    console.log(`❌ Premium revocado manualmente: ${key}`);
  } else {
    premiumEmails.add(key);
    console.log(`✅ Premium otorgado manualmente: ${key}`);
  }
  res.json({ ok: true, email: key, isPremium: !revoke });
});

// ── POST /api/chat ── Chat de texto con streaming SSE ──────────────────────────
app.post('/api/chat', async (req, res) => {
  const { contents, systemInstruction } = req.body as {
    contents: Array<{ role: string; parts: [{ text: string }] }>;
    systemInstruction: string;
  };

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    const ai = getAI();
    const stream = await ai.models.generateContentStream({
      model: TEXT_MODEL,
      config: { systemInstruction },
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
  } finally {
    res.end();
  }
});

// ── POST /api/evaluate ── Evaluación de imagen con Gemini Vision ───────────────
app.post('/api/evaluate', async (req, res) => {
  const { imageBase64, levelName, criteria } = req.body as {
    imageBase64: string;
    levelName: string;
    criteria: { stars: string; label: string }[];
  };

  const criteriaText = criteria?.length > 0
    ? criteria.map(c => `${c.stars}: ${c.label}`).join('\n')
    : '⭐⭐⭐: Técnica impecable\n⭐⭐: Buena ejecución\n⭐: Primer intento válido';

  const prompt = `Eres un juez culinario con tolerancia cero al fraude. Evaluarás una imagen enviada como evidencia de haber completado una tarea de cocina.

TAREA REQUERIDA: "${levelName}"

━━━ REGLA ABSOLUTA (NUNCA VIOLAR) ━━━
Si la imagen NO muestra claramente el resultado de la tarea culinaria "${levelName}", debes devolver stars=0 SIN EXCEPCIÓN.
Imágenes inválidas incluyen (pero no se limitan a): teclados, teléfonos, habitaciones, escritorios, personas, animales, bebidas, utensilios solos, empaques, cualquier objeto que no sea el resultado culinario solicitado.
NO hay "primer intento válido" si no hay comida relevante en la imagen. stars=1, 2 o 3 son EXCLUSIVOS para imágenes que SÍ muestran la tarea culinaria.

━━━ PROCESO DE EVALUACIÓN ━━━
PRIMERO responde internamente: ¿La imagen muestra "${levelName}"? SI o NO.
- Si NO → stars=0 obligatoriamente.
- Si SI → evalúa con estos criterios:
${criteriaText}

━━━ FORMATO DE RESPUESTA (JSON puro, sin markdown) ━━━
{"stars": <número entre 0 y 3>, "feedback": "<1-2 oraciones en español, sé específico sobre lo que ves o no ves>"}

EJEMPLOS DE RESPUESTA CORRECTA:
- Imagen de teclado → {"stars": 0, "feedback": "La imagen muestra un teclado, no una preparación culinaria. Fotografía tu resultado de ${levelName} y vuelve a intentarlo."}
- Imagen de plato mal ejecutado → {"stars": 1, "feedback": "Se observa el intento pero la técnica necesita mejora..."}
- Imagen de plato bien ejecutado → {"stars": 3, "feedback": "Excelente ejecución de ${levelName}..."}`;

  // Palabras clave que indican que la IA detectó imagen inválida pero por error dio stars>0
  const INVALID_KEYWORDS = [
    'no se observa', 'no muestra', 'no es una', 'no contiene', 'no hay',
    'no corresponde', 'no es el resultado', 'no es comida', 'no es un plato',
    'no es una preparación', 'teclado', 'teléfono', 'escritorio', 'objeto',
    'no evidencia', 'no presenta', 'imagen no muestra',
  ];

  try {
    if (!imageBase64) throw new Error('imageBase64 vacío');
    const ai = getAI();
    const mimeType = (imageBase64.split(';')[0].split(':')[1] || 'image/jpeg') as string;
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
    console.log(`[evaluate] levelName="${levelName}" mimeType="${mimeType}" base64Len=${base64Data?.length ?? 0}`);

    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      }],
    });

    const text = (response.text ?? '').trim();
    console.log(`[evaluate] raw response: ${text.slice(0, 200)}`);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      let stars = Math.min(3, Math.max(0, Math.round(Number(parsed.stars) || 0)));
      const feedback: string = parsed.feedback || '';

      // Post-procesamiento: si el feedback indica imagen inválida pero stars>0, forzar 0
      const feedbackLower = feedback.toLowerCase();
      if (stars > 0 && INVALID_KEYWORDS.some(kw => feedbackLower.includes(kw))) {
        console.log(`[evaluate] Override stars ${stars}→0: feedback indica imagen inválida`);
        stars = 0;
      }

      res.json({
        stars,
        feedback: feedback || (stars === 0
          ? 'La imagen no muestra la tarea requerida. Fotografía tu resultado y vuelve a intentarlo.'
          : '¡Buen trabajo! Sigue practicando la técnica.'),
      });
    } else {
      throw new Error('No JSON en respuesta');
    }
  } catch (err) {
    console.error('[evaluate] Error:', err);
    res.json({ stars: 0, feedback: 'No pudimos analizar la imagen. Asegúrate de que muestre claramente tu resultado culinario.' });
  }
});

// ── WebSocket /api/live ── Proxy de voz en tiempo real ────────────────────────
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

// Tipo interno de la sesión Gemini Live (no se expone al cliente)
interface GeminiLiveSession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
  sendClientContent(params: {
    turns: Array<{ role: string; parts: [{ text: string }] }>;
    turnComplete: boolean;
  }): void;
  close(): void;
}

// Protocolo simplificado con el navegador (sin revelar proveedor de IA)
type BrowserMessage =
  | { type: 'start'; systemPrompt: string; history?: Array<{ role: string; parts: [{ text: string }] }> }
  | { type: 'audio'; data: string; mimeType?: string }
  | { type: 'clientContent'; turns: Array<{ role: string; parts: [{ text: string }] }>; turnComplete: boolean };

wss.on('connection', (ws: WebSocket) => {
  let geminiSession: GeminiLiveSession | null = null;

  const safeSend = (data: object) => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
  };

  ws.on('message', async (rawData: Buffer) => {
    let msg: BrowserMessage;
    try { msg = JSON.parse(rawData.toString()) as BrowserMessage; }
    catch { return; }

    // ── Iniciar sesión de voz ──────────────────────────────────────────────
    if (msg.type === 'start') {
      if (geminiSession) { try { geminiSession.close(); } catch { /* ok */ } geminiSession = null; }

      const { systemPrompt, history = [] } = msg;

      try {
        const ai = getAI();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const session: any = await ai.live.connect({
          model: VOICE_MODEL,
          config: {
            systemInstruction: systemPrompt,
            responseModalities: ['AUDIO' as unknown as import('@google/genai').Modality],
            inputAudioTranscription: {},
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
          callbacks: {
            onopen: () => {
              // Inyectar historial de reconexión antes de notificar al cliente
              if (history.length > 0) {
                try {
                  geminiSession!.sendClientContent({ turns: history, turnComplete: false });
                  geminiSession!.sendClientContent({
                    turns: [{ role: 'user', parts: [{ text: '(reconexión — estamos cocinando, continúa desde donde estábamos sin repetir lo ya dicho)' }] }],
                    turnComplete: true,
                  });
                } catch { /* no crítico */ }
              }
              safeSend({ type: 'open' });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onmessage: (message: any) => {
              const sc = message?.serverContent;
              if (!sc) return;

              if (sc.modelTurn?.parts) {
                for (const p of sc.modelTurn.parts) {
                  if (p.inlineData?.data) safeSend({ type: 'audio', data: p.inlineData.data });
                  if (p.text)            safeSend({ type: 'modelText', text: p.text });
                }
              }
              if (sc.turnComplete)               safeSend({ type: 'turnComplete' });
              if (sc.inputTranscription?.text)   safeSend({ type: 'inputTranscription', text: sc.inputTranscription.text });
            },
            onerror: (e: unknown) => {
              safeSend({ type: 'error', message: (e as Error)?.message ?? 'Error de conexión' });
            },
            onclose: () => {
              geminiSession = null;
              safeSend({ type: 'close' });
            },
          },
        });

        geminiSession = session as GeminiLiveSession;

      } catch (err) {
        safeSend({ type: 'error', message: err instanceof Error ? err.message : String(err) });
      }

    // ── Enviar chunk de audio al modelo ───────────────────────────────────
    } else if (msg.type === 'audio' && geminiSession) {
      geminiSession.sendRealtimeInput({
        audio: { data: msg.data, mimeType: msg.mimeType ?? 'audio/pcm;rate=16000' },
      });

    // ── Enviar texto / historial al modelo ────────────────────────────────
    } else if (msg.type === 'clientContent' && geminiSession) {
      geminiSession.sendClientContent({
        turns: msg.turns,
        turnComplete: msg.turnComplete ?? true,
      });
    }
  });

  const cleanup = () => {
    if (geminiSession) {
      try { geminiSession.close(); } catch { /* ok */ }
      geminiSession = null;
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

// ── Arranque ───────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🍳 Sous Chef proxy corriendo en puerto ${PORT}`);
  if (!GEMINI_API_KEY) console.warn('⚠️  GEMINI_API_KEY no configurada — las llamadas a la IA fallarán.');
});
