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
 * - `GEMINI_API_KEY`  — Clave de API de Google Generative AI. (REQUERIDA)
 * - `ADMIN_SECRET`    — Secret para endpoints de administración manual. (REQUERIDA en producción)
 * - `PORT`            — Puerto del servidor (default: 3001).
 * - `ALLOWED_ORIGIN`  — Origen(es) CORS permitido(s). CSV. Default: '*' SOLO en desarrollo.
 * - `HOTMART_TOKEN`   — Token de verificación de webhooks Hotmart.
 * - `HOTMART_HMAC_SECRET` — (Opcional) Secret HMAC para validar firma del body Hotmart.
 * - `PREMIUM_EMAILS`  — Lista CSV de emails premium (semilla inicial).
 * - `NODE_ENV`        — 'production' habilita validación estricta de env.
 *
 * Seguridad:
 * - La clave de Gemini NUNCA se envía al navegador.
 * - El WebSocket proxy simplifica el protocolo Gemini Live a un subset
 *   sin revelar el proveedor de IA al cliente.
 */

import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { membershipStore } from './membershipStore.js';

dotenv.config();

// ── Config ─────────────────────────────────────────────────────────────────────
const NODE_ENV        = process.env.NODE_ENV ?? 'development';
const IS_PROD         = NODE_ENV === 'production';
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY ?? '';
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN ?? (IS_PROD ? '' : '*');
const PORT            = Number(process.env.PORT) || 3001;
const HOTMART_TOKEN   = process.env.HOTMART_TOKEN ?? '';
const HOTMART_HMAC_SECRET = process.env.HOTMART_HMAC_SECRET ?? '';
const ADMIN_SECRET    = process.env.ADMIN_SECRET ?? '';

// ── Validación de entorno (fail-fast) ─────────────────────────────────────────
function validateEnv(): void {
  const missing: string[] = [];
  if (!GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (IS_PROD && !ADMIN_SECRET) missing.push('ADMIN_SECRET');
  if (IS_PROD && (!ALLOWED_ORIGIN || ALLOWED_ORIGIN === '*')) {
    missing.push('ALLOWED_ORIGIN (no debe ser "*" en producción)');
  }
  if (missing.length) {
    console.error(`❌ Variables de entorno faltantes/insegura: ${missing.join(', ')}`);
    process.exit(1);
  }
}
validateEnv();

// Membership store (persistente en disco — ver membershipStore.ts)

// Modelos (solo en el servidor)
const TEXT_MODEL  = 'gemini-2.5-flash';
// Modelo válido para Gemini Live (audio bidireccional). El anterior "3.1" no existe.
const VOICE_MODEL = process.env.VOICE_MODEL ?? 'gemini-2.0-flash-live-preview-04-09';

function getAI(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada en el servidor.');
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

// ── Express ────────────────────────────────────────────────────────────────────
const app = express();
app.set('trust proxy', 1); // Railway está detrás de un proxy → necesario para rate-limit por IP

// CORS: lista blanca por CSV.
const allowedOrigins = ALLOWED_ORIGIN === '*'
  ? '*'
  : ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (allowedOrigins === '*') return cb(null, true);
    // Permitir requests sin origin (curl, server-to-server) — útiles para webhooks
    if (!origin) return cb(null, true);
    if ((allowedOrigins as string[]).includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado: origen ${origin} no permitido`));
  },
}));

// Webhook Hotmart necesita el body crudo para validar HMAC → captura el raw antes del parser JSON.
app.use('/api/hotmart/webhook', express.json({
  limit: '256kb',
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => { req.rawBody = Buffer.from(buf); },
}));
app.use(express.json({ limit: '20mb' }));

// ── Rate limiting ──────────────────────────────────────────────────────────────
// Endpoints caros (Gemini): límite estricto.
const aiLimiter = rateLimit({
  windowMs: 60_000, // 1 min
  max: 20,          // 20 requests/min/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
});

// Endpoints generales
const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── GET /api/membership/check ── Verifica si un email tiene membresía premium ──
app.get('/api/membership/check', (req, res) => {
  const email = (req.query.email as string ?? '').trim().toLowerCase();
  if (!email) return void res.json({ isPremium: false });
  res.json({ isPremium: membershipStore.has(email) });
});

// ── POST /api/hotmart/webhook ── Recibe eventos de compra de Hotmart ───────────
app.post('/api/hotmart/webhook', (req: Request & { rawBody?: Buffer }, res) => {
  // 1. Validación HMAC (preferida, si está configurada)
  if (HOTMART_HMAC_SECRET) {
    const signature = (req.header('x-hotmart-hottok') ?? req.header('x-hotmart-signature') ?? '').toString();
    if (!signature || !req.rawBody) {
      console.warn('⚠️  Webhook sin firma o body crudo');
      return void res.status(401).json({ error: 'Firma faltante' });
    }
    const computed = crypto.createHmac('sha256', HOTMART_HMAC_SECRET).update(req.rawBody).digest('hex');
    const ok = signature.length === computed.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
    if (!ok) {
      console.warn('⚠️  Webhook con firma HMAC inválida');
      return void res.status(401).json({ error: 'Firma inválida' });
    }
  } else {
    // 2. Fallback: hottok por query (legacy)
    const hottok = req.query.hottok as string | undefined;
    if (HOTMART_TOKEN && hottok !== HOTMART_TOKEN) {
      console.warn('⚠️  Webhook recibido con hottok inválido');
      return void res.status(401).json({ error: 'Token inválido' });
    }
  }

  try {
    const body = req.body as Record<string, unknown>;
    const event  = (body.event as string | undefined) ?? '';
    const data   = (body.data as Record<string, unknown> | undefined) ?? {};
    const buyer  = (data.buyer as Record<string, unknown> | undefined) ?? {};
    const purchase = (data.purchase as Record<string, unknown> | undefined) ?? {};
    const email  = ((buyer.email as string | undefined) ?? '').trim().toLowerCase();
    const status = ((purchase.status as string | undefined) ?? '').toUpperCase();

    if (!email) return void res.json({ received: true, note: 'Sin email, ignorado' });

    const APPROVED_EVENTS = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'SUBSCRIPTION_REACTIVATED'];
    const CANCELLED_EVENTS = ['PURCHASE_CANCELLED', 'PURCHASE_REFUNDED', 'SUBSCRIPTION_CANCELLATION'];
    const APPROVED_STATUS  = ['APPROVED', 'COMPLETE'];

    if (APPROVED_EVENTS.includes(event) || APPROVED_STATUS.includes(status)) {
      membershipStore.add(email);
      console.log(`✅ Premium activado: ${email} (event: ${event || status})`);
    } else if (CANCELLED_EVENTS.includes(event)) {
      membershipStore.remove(email);
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
  const { email, secret, revoke } = req.body as { email?: string; secret?: string; revoke?: boolean };

  // Comparación timing-safe del secret
  if (!secret || !ADMIN_SECRET || secret.length !== ADMIN_SECRET.length ||
      !crypto.timingSafeEqual(Buffer.from(secret), Buffer.from(ADMIN_SECRET))) {
    return void res.status(403).json({ error: 'Acceso denegado' });
  }

  if (!email || typeof email !== 'string') return void res.status(400).json({ error: 'email requerido' });
  const key = email.trim().toLowerCase();
  if (revoke) {
    membershipStore.remove(key);
    console.log(`❌ Premium revocado manualmente: ${key}`);
  } else {
    membershipStore.add(key);
    console.log(`✅ Premium otorgado manualmente: ${key}`);
  }
  res.json({ ok: true, email: key, isPremium: !revoke });
});

// ── POST /api/chat ── Chat de texto con streaming SSE ──────────────────────────
app.post('/api/chat', aiLimiter, async (req, res) => {
  const { contents, systemInstruction } = req.body as {
    contents: Array<{ role: string; parts: [{ text: string }] }>;
    systemInstruction: string;
  };

  if (!Array.isArray(contents) || contents.length === 0) {
    return void res.status(400).json({ error: 'contents inválido' });
  }

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
app.post('/api/evaluate', aiLimiter, async (req, res) => {
  const { imageBase64, levelName, criteria } = req.body as {
    imageBase64: string;
    levelName: string;
    criteria: { stars: string; label: string }[];
  };

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return void res.status(400).json({ stars: 0, feedback: 'Imagen no recibida.' });
  }
  if (!levelName || typeof levelName !== 'string') {
    return void res.status(400).json({ stars: 0, feedback: 'Nivel no especificado.' });
  }

  // Tamaño máximo razonable de imagen base64 (~10 MB → 13.4 MB en base64)
  if (imageBase64.length > 14_000_000) {
    return void res.status(413).json({ stars: 0, feedback: 'Imagen demasiado grande.' });
  }

  const criteriaText = criteria?.length > 0
    ? criteria.map(c => `${c.stars}: ${c.label}`).join('\n')
    : '⭐⭐⭐: Técnica impecable\n⭐⭐: Buena ejecución\n⭐: Primer intento válido';

  const prompt = `Eres un juez culinario con tolerancia cero al fraude. Evaluarás una imagen enviada como evidencia de haber completado una tarea de cocina.

TAREA REQUERIDA: "${levelName}"

━━━ REGLA ABSOLUTA ━━━
PRIMERO determina si la imagen muestra claramente el resultado culinario "${levelName}".
Imágenes inválidas: teclados, teléfonos, habitaciones, escritorios, personas, animales, bebidas solas, utensilios solos, empaques, capturas de pantalla, cualquier objeto que no sea el resultado culinario solicitado.

━━━ FORMATO DE RESPUESTA (JSON puro, sin markdown) ━━━
{
  "isCulinaryImage": <true|false>,
  "stars": <0 si isCulinaryImage=false; 1, 2 o 3 si es válida>,
  "feedback": "<1-2 oraciones en español>"
}

CRITERIOS (si isCulinaryImage=true):
${criteriaText}

EJEMPLOS:
- Teclado → {"isCulinaryImage": false, "stars": 0, "feedback": "La imagen muestra un teclado, no una preparación culinaria. Fotografía tu resultado de ${levelName}."}
- Plato regular → {"isCulinaryImage": true, "stars": 1, "feedback": "Se observa el intento pero la técnica necesita mejora..."}
- Plato excelente → {"isCulinaryImage": true, "stars": 3, "feedback": "Excelente ejecución de ${levelName}..."}`;

  try {
    const ai = getAI();
    const mimeType = (imageBase64.split(';')[0].split(':')[1] || 'image/jpeg') as string;
    const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    if (IS_PROD) {
      console.log(`[evaluate] level="${levelName}"`);
    } else {
      console.log(`[evaluate] level="${levelName}" mime="${mimeType}" base64Len=${base64Data?.length ?? 0}`);
    }

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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON en respuesta');

    const parsed = JSON.parse(jsonMatch[0]) as {
      isCulinaryImage?: boolean;
      stars?: number;
      feedback?: string;
    };

    // Si el modelo dice que NO es imagen culinaria, forzar 0 sin importar 'stars'
    const isCulinaryImage = parsed.isCulinaryImage === true;
    let stars = isCulinaryImage
      ? Math.min(3, Math.max(1, Math.round(Number(parsed.stars) || 1)))
      : 0;
    const feedback = (parsed.feedback || '').toString().slice(0, 500);

    // Si stars=0 (no culinaria) pero el modelo no devolvió feedback, usar default
    if (!isCulinaryImage) stars = 0;

    res.json({
      stars,
      feedback: feedback || (stars === 0
        ? 'La imagen no muestra la tarea requerida. Fotografía tu resultado y vuelve a intentarlo.'
        : '¡Buen trabajo! Sigue practicando la técnica.'),
    });
  } catch (err) {
    console.error('[evaluate] Error:', err instanceof Error ? err.message : err);
    res.json({
      stars: 0,
      feedback: 'No pudimos analizar la imagen. Asegúrate de que muestre claramente tu resultado culinario.',
    });
  }
});

// Manejador de error CORS (último, captura los errores del middleware cors)
app.use((err: Error, _req: Request, res: Response, next: NextFunction) => {
  if (err.message?.startsWith('CORS bloqueado')) {
    return void res.status(403).json({ error: err.message });
  }
  next(err);
});

// ── WebSocket /api/live ── Proxy de voz en tiempo real ────────────────────────
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/api/live' });

interface GeminiLiveSession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
  sendClientContent(params: {
    turns: Array<{ role: string; parts: [{ text: string }] }>;
    turnComplete: boolean;
  }): void;
  close(): void;
}

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

    } else if (msg.type === 'audio' && geminiSession) {
      geminiSession.sendRealtimeInput({
        audio: { data: msg.data, mimeType: msg.mimeType ?? 'audio/pcm;rate=16000' },
      });

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
  console.log(`🍳 Sous Chef proxy corriendo en puerto ${PORT} (env=${NODE_ENV})`);
  console.log(`   CORS: ${allowedOrigins === '*' ? '*' : (allowedOrigins as string[]).join(', ')}`);
  console.log(`   VOICE_MODEL: ${VOICE_MODEL}`);
});
