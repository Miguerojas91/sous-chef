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

  const prompt = `Eres un chef evaluador experto. Analiza esta imagen de la técnica culinaria: "${levelName}".

Criterios de evaluación:
${criteriaText}

Responde ÚNICAMENTE con este JSON (sin markdown, sin texto extra):
{"stars": <1, 2 o 3>, "feedback": "<frase motivadora en español, máximo 2 oraciones>"}`;

  try {
    const ai = getAI();
    const mimeType = (imageBase64.split(';')[0].split(':')[1] || 'image/jpeg') as string;
    const base64Data = imageBase64.split(',')[1];

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
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      res.json({
        stars: Math.min(3, Math.max(1, Number(parsed.stars) || 2)),
        feedback: parsed.feedback || '¡Buen trabajo! Sigue practicando la técnica.',
      });
    } else {
      throw new Error('No JSON en respuesta');
    }
  } catch {
    res.json({ stars: 2, feedback: '¡Buena técnica! Con más práctica llegarás a la perfección.' });
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
