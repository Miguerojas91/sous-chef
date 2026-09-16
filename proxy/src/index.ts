/**
 * Servidor proxy Express + WebSocket para Sous Chef.
 * Actúa como intermediario entre el navegador y la API de Gemini,
 * manteniendo las claves de API exclusivamente en el servidor.
 *
 * Endpoints HTTP:
 * GET  /health                    Health check para Railway/Vercel.
 * GET  /api/membership/check      Verifica si un email tiene premium.
 * POST /api/hotmart/webhook       Recibe eventos de compra de Hotmart.
 * POST /api/membership/grant      Admin: otorgar/revocar premium manualmente.
 * POST /api/chat                  Chat de texto con streaming SSE (Gemini 2.5 Flash).
 * POST /api/evaluate              Evaluación de imagen culinaria con Gemini Vision.
 *
 * WebSocket:
 * WS   /api/live                  Proxy de voz en tiempo real (Gemini Live).
 *
 * Variables de entorno:
 * - `GEMINI_API_KEY`: clave de API de Google Generative AI (requerida).
 * - `ADMIN_SECRET`: secret para endpoints de administración manual (requerida en producción).
 * - `PORT`: puerto del servidor (default: 3001).
 * - `ALLOWED_ORIGIN`: origen(es) CORS permitido(s), CSV. Default '*' solo en desarrollo.
 * - `HOTMART_TOKEN`: token de verificación de webhooks Hotmart.
 * - `HOTMART_HMAC_SECRET`: (opcional) secret HMAC para validar la firma del body Hotmart.
 * - `PREMIUM_EMAILS`: lista CSV de emails premium (semilla inicial).
 * - `NODE_ENV`: 'production' habilita validación estricta de env.
 *
 * Seguridad:
 * - La clave de Gemini nunca se envía al navegador.
 * - El WebSocket proxy simplifica el protocolo Gemini Live a un subset
 *   sin revelar el proveedor de IA al cliente.
 */

import express, { Request, Response, NextFunction } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage } from 'http';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import { membershipStore } from './membershipStore.js';

dotenv.config();

const NODE_ENV        = process.env.NODE_ENV ?? 'development';
const IS_PROD         = NODE_ENV === 'production';
const GEMINI_API_KEY  = process.env.GEMINI_API_KEY ?? '';
const ALLOWED_ORIGIN  = process.env.ALLOWED_ORIGIN ?? (IS_PROD ? '' : '*');
const PORT            = Number(process.env.PORT) || 3001;
const HOTMART_TOKEN   = process.env.HOTMART_TOKEN ?? '';
const HOTMART_HMAC_SECRET = process.env.HOTMART_HMAC_SECRET ?? '';
const ADMIN_SECRET    = process.env.ADMIN_SECRET ?? '';

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

const TEXT_MODEL  = 'gemini-2.5-flash';
// Modelo de Gemini Live (audio bidireccional).
const VOICE_MODEL = process.env.VOICE_MODEL ?? 'gemini-2.0-flash-live-preview-04-09';

function getAI(): GoogleGenAI {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY no configurada en el servidor.');
  return new GoogleGenAI({ apiKey: GEMINI_API_KEY });
}

/**
 * Comparación de strings en tiempo constante, segura ante:
 * - longitudes distintas (en bytes, no chars: así no falla con multibyte)
 * - excepciones de timingSafeEqual
 */
function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/** True si el origin está en la allowlist (o si allowlist es '*'). */
function isAllowedOrigin(origin: string | undefined): boolean {
  if (allowedOrigins === '*') return true;
  if (!origin) return false;
  return (allowedOrigins as string[]).includes(origin);
}

const app = express();
app.set('trust proxy', 1); // Railway está detrás de un proxy: necesario para rate-limit por IP
app.disable('x-powered-by');

// Headers de seguridad (CSP no aplica: servimos solo JSON/SSE; desactivamos
// la CSP por defecto de helmet para no romper el stream SSE).
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS: lista blanca por CSV.
const allowedOrigins = ALLOWED_ORIGIN === '*'
  ? '*'
  : ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (allowedOrigins === '*') return cb(null, true);
    // Permitir requests sin origin (curl, server-to-server): útiles para webhooks
    if (!origin) return cb(null, true);
    if ((allowedOrigins as string[]).includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado: origen ${origin} no permitido`));
  },
}));

// CORS no impide gastar cuota: se rechazan en servidor los Origin fuera de la allowlist.
function originGuard(req: Request, res: Response, next: NextFunction): void {
  if (allowedOrigins === '*') return next();
  const origin = req.header('origin');
  if (isAllowedOrigin(origin)) return next();
  res.status(403).json({ error: 'Origen no autorizado' });
}

// Webhook Hotmart necesita el body crudo para validar HMAC: se captura antes del parser JSON.
app.use('/api/hotmart/webhook', express.json({
  limit: '256kb',
  verify: (req: Request & { rawBody?: Buffer }, _res, buf) => { req.rawBody = Buffer.from(buf); },
}));
// Solo el endpoint de imagen necesita payloads grandes.
app.use('/api/evaluate', express.json({ limit: '15mb' }));
app.use(express.json({ limit: '256kb' }));

// Endpoints caros (Gemini): límite estricto.
const aiLimiter = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Espera un momento e intenta de nuevo.' },
});

const generalLimiter = rateLimit({
  windowMs: 60_000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', generalLimiter);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// GET /api/membership/check: verifica si un email tiene membresía premium
app.get('/api/membership/check', (req, res) => {
  const email = (req.query.email as string ?? '').trim().toLowerCase();
  if (!email) return void res.json({ isPremium: false });
  res.json({ isPremium: membershipStore.has(email) });
});

// POST /api/hotmart/webhook: recibe eventos de compra de Hotmart
app.post('/api/hotmart/webhook', (req: Request & { rawBody?: Buffer }, res) => {
  // Fail-closed: sin HMAC ni token configurados, se rechaza siempre.
  if (!HOTMART_HMAC_SECRET && !HOTMART_TOKEN) {
    console.error('❌ Webhook llamado pero NO hay HOTMART_HMAC_SECRET ni HOTMART_TOKEN configurados. Rechazando.');
    return void res.status(503).json({ error: 'Webhook no configurado' });
  }

  // Validación HMAC (preferida si está configurada).
  if (HOTMART_HMAC_SECRET) {
    const signature = (req.header('x-hotmart-hottok') ?? req.header('x-hotmart-signature') ?? '').toString();
    if (!signature || !req.rawBody) {
      console.warn('⚠️  Webhook sin firma o body crudo');
      return void res.status(401).json({ error: 'Firma faltante' });
    }
    const computed = crypto.createHmac('sha256', HOTMART_HMAC_SECRET).update(req.rawBody).digest('hex');
    if (!safeEqual(signature, computed)) {
      console.warn('⚠️  Webhook con firma HMAC inválida');
      return void res.status(401).json({ error: 'Firma inválida' });
    }
  } else {
    // Fallback: hottok por query (legacy), comparación timing-safe.
    const hottok = (req.query.hottok as string | undefined) ?? '';
    if (!safeEqual(hottok, HOTMART_TOKEN)) {
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

// Limiter estricto para endpoints sensibles (anti fuerza-bruta del ADMIN_SECRET).
const adminLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera un minuto.' },
});

// POST /api/membership/grant: admin otorga o revoca premium manualmente
app.post('/api/membership/grant', adminLimiter, (req, res) => {
  const { email, secret, revoke } = req.body as { email?: string; secret?: string; revoke?: boolean };

  // Comparación timing-safe del secret (byte-safe + a prueba de excepciones).
  if (!secret || !ADMIN_SECRET || !safeEqual(secret, ADMIN_SECRET)) {
    console.warn('⚠️  Intento fallido de /api/membership/grant');
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

// POST /api/chat: chat de texto con streaming SSE
app.post('/api/chat', originGuard, aiLimiter, async (req, res) => {
  const { contents, systemInstruction } = req.body as {
    contents: Array<{ role: string; parts: [{ text: string }] }>;
    systemInstruction: string;
  };

  if (!Array.isArray(contents) || contents.length === 0) {
    return void res.status(400).json({ error: 'contents inválido' });
  }

  const startedAt = Date.now();
  const reqId = Math.random().toString(36).slice(2, 8);
  console.log(`[chat ${reqId}] start turns=${contents.length} sys=${(systemInstruction ?? '').length}c`);

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no'); // anti-buffering en proxies (nginx-style)
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Heartbeat: comentario SSE cada 15s para que la conexión no la mate ningún proxy intermedio.
  const heartbeat = setInterval(() => {
    try { res.write(': ping\n\n'); } catch { /* connection cerrada */ }
  }, 15_000);

  let bytesSent = 0;
  try {
    const ai = getAI();
    const stream = await ai.models.generateContentStream({
      model: TEXT_MODEL,
      config: { systemInstruction },
      contents,
    });

    for await (const chunk of stream) {
      const text = chunk.text ?? '';
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
        bytesSent += text.length;
      }
    }
    res.write('data: [DONE]\n\n');
    console.log(`[chat ${reqId}] done bytes=${bytesSent} ms=${Date.now() - startedAt}`);
  } catch (err) {
    // Log con detalle interno; al cliente solo mensaje genérico (no filtrar
    // detalles del SDK/modelo).
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[chat ${reqId}] error: ${msg}`);
    res.write(`data: ${JSON.stringify({ error: 'No pudimos generar la respuesta. Intenta de nuevo.' })}\n\n`);
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
});

// POST /api/evaluate: evaluación de imagen con Gemini Vision
app.post('/api/evaluate', originGuard, aiLimiter, async (req, res) => {
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

    // Si el modelo dice que no es imagen culinaria, forzar 0 sin importar 'stars'
    const isCulinaryImage = parsed.isCulinaryImage === true;
    let stars = isCulinaryImage
      ? Math.min(3, Math.max(1, Math.round(Number(parsed.stars) || 1)))
      : 0;
    const feedback = (parsed.feedback || '').toString().slice(0, 500);

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

// WebSocket /api/live: proxy de voz en tiempo real
const server = createServer(app);

// Límites del WS para evitar abuso de Gemini Live (lo más caro).
const WS_MAX_CONNECTIONS_PER_IP = 3;     // sockets concurrentes por IP
const WS_MAX_SESSION_MS         = 25 * 60_000; // duración máxima por socket (25 min)
const wsConnectionsPerIp = new Map<string, number>();

function clientIpFromReq(req: IncomingMessage): string {
  const xff = (req.headers['x-forwarded-for'] as string | undefined) ?? '';
  if (xff) return xff.split(',')[0].trim();
  return req.socket.remoteAddress ?? 'unknown';
}

const wss = new WebSocketServer({
  server,
  path: '/api/live',
  maxPayload: 2 * 1024 * 1024, // 2 MB por mensaje (chunks de audio son pequeños)
  // Handshake guard: valida Origin y cap de conexiones por IP antes de aceptar.
  verifyClient: (info, cb) => {
    // Origin allowlist (en dev '*' deja pasar todo).
    if (allowedOrigins !== '*') {
      const origin = info.origin;
      if (!isAllowedOrigin(origin)) {
        return cb(false, 403, 'Origen no autorizado');
      }
    }
    const ip = clientIpFromReq(info.req);
    const current = wsConnectionsPerIp.get(ip) ?? 0;
    if (current >= WS_MAX_CONNECTIONS_PER_IP) {
      return cb(false, 429, 'Demasiadas conexiones');
    }
    cb(true);
  },
});

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

wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
  let geminiSession: GeminiLiveSession | null = null;

  const ip = clientIpFromReq(req);
  wsConnectionsPerIp.set(ip, (wsConnectionsPerIp.get(ip) ?? 0) + 1);

  // Cierre forzado tras la duración máxima para no consumir Gemini Live sin fin.
  // El cap por minutos del frontend es client-side; este es el límite real.
  const maxDurationTimer = setTimeout(() => {
    try { ws.close(1000, 'Sesión máxima alcanzada'); } catch { /* ok */ }
  }, WS_MAX_SESSION_MS);

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
              console.error('[live] Gemini error:', (e as Error)?.message ?? e);
              safeSend({ type: 'error', message: 'Error de conexión de voz' });
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
    clearTimeout(maxDurationTimer);
    const n = (wsConnectionsPerIp.get(ip) ?? 1) - 1;
    if (n <= 0) wsConnectionsPerIp.delete(ip);
    else wsConnectionsPerIp.set(ip, n);
    if (geminiSession) {
      try { geminiSession.close(); } catch { /* ok */ }
      geminiSession = null;
    }
  };

  ws.on('close', cleanup);
  ws.on('error', cleanup);
});

server.listen(PORT, () => {
  console.log(`🍳 Sous Chef proxy corriendo en puerto ${PORT} (env=${NODE_ENV})`);
  console.log(`   CORS: ${allowedOrigins === '*' ? '*' : (allowedOrigins as string[]).join(', ')}`);
  console.log(`   VOICE_MODEL: ${VOICE_MODEL}`);
});
