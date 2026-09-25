/**
 * Voz en tiempo real con Gemini Live a través del proxy (el navegador nunca
 * habla directo con Google).
 *
 *   micrófono → ScriptProcessor → 16 kHz PCM16 base64 → WebSocket → proxy → Gemini Live
 *   Gemini Live → proxy → WebSocket → AudioContext 24 kHz → altavoz
 *
 * - VAD por RMS: solo se envía audio cuando hay voz, porque el audio se factura.
 * - Tras SILENCE_TIMEOUT_MS de silencio pasa a `sleeping`: cierra el WebSocket
 *   pero deja el micrófono abierto y se despierta al detectar voz.
 * - Si el WebSocket se cierra, reconecta reinyectando los últimos turnos.
 * - La pantalla encendida y MediaSession los maneja `useWakeLock` desde
 *   `useCookingChatSession`, no este hook.
 * - Máximo 20 min de sesión activa; luego pasa a `sleeping`.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { API_URL } from '../services/gemini';
import {
  addUsedSeconds as addVoiceSeconds,
  hasReachedCap as voiceCapReached,
  getRemainingSeconds as voiceRemainingSeconds,
  getMonthKey,
} from '../utils/voiceUsage';

/**
 * Float32 (-1..1) a PCM16 little-endian en base64, el formato que pide Gemini Live.
 * Reutiliza un Int16Array entre llamadas para no presionar al GC en el hot path.
 */
let _pcm16Scratch: Int16Array | null = null;
function float32ToPCM16Base64(float32: Float32Array): string {
  if (!_pcm16Scratch || _pcm16Scratch.length !== float32.length) {
    _pcm16Scratch = new Int16Array(float32.length);
  }
  const pcm16 = _pcm16Scratch;
  for (let i = 0; i < float32.length; i++) {
    const s = float32[i] < -1 ? -1 : float32[i] > 1 ? 1 : float32[i];
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer, 0, pcm16.byteLength);
  // Por bloques: concatenar byte a byte es O(n²) en strings grandes.
  let bin = '';
  const CHUNK = 8192;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(bin);
}

/**
 * Baja la tasa nativa del navegador (44.1/48 kHz) a 16 kHz promediando ventanas.
 * Reutiliza el buffer de salida entre frames: quien llama debe consumirlo antes
 * del siguiente frame.
 */
let _downsampleScratch: Float32Array | null = null;
function downsample(buf: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return buf;
  const ratio = from / to;
  const len   = Math.round(buf.length / ratio);
  if (!_downsampleScratch || _downsampleScratch.length !== len) {
    _downsampleScratch = new Float32Array(len);
  }
  const out = _downsampleScratch;
  for (let i = 0; i < len; i++) {
    const s = Math.floor(i * ratio);
    const e = Math.min(Math.floor((i + 1) * ratio), buf.length);
    let sum = 0;
    for (let j = s; j < e; j++) sum += buf[j];
    out[i] = sum / (e - s);
  }
  return out;
}

/** Audio del modelo (PCM16 base64, 24 kHz) a Float32 para el AudioContext. */
function pcm16Base64ToFloat32(b64: string): Float32Array {
  const bin   = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
  return f32;
}

/** Energía del frame (0..1), usada por el VAD. */
function calcRMS(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/**
 * - `sleeping`: silencio prolongado; WebSocket cerrado, micrófono abierto.
 * - `needs-tap`: iOS cortó el micrófono y hace falta un gesto del usuario.
 * - `cap-reached`: se agotaron los minutos de voz del mes.
 */
export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'sleeping'
  | 'reconnecting'
  | 'needs-tap'
  | 'cap-reached';

export interface VoiceTranscriptEntry {
  agent: 'chef' | 'user';
  text: string;
}

/** Envuelve el WebSocket con la forma de la sesión del SDK de Gemini. */
/** Turnos previos que se le entregan a Gemini al abrir una sesión de voz. */
export type VoiceHistory = Array<{ role: string; parts: [{ text: string }] }>;

interface ProxySession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
  /** Marca el principio y el fin de una intervención hablada. */
  sendActivity(edge: 'start' | 'end'): void;
  sendClientContent(params: { turns: Array<{ role: string; parts: Array<{ text: string }> }>; turnComplete: boolean }): void;
  close(): void;
}

/** Mensajes que el proxy envía por el WebSocket. */
type ProxyMsg =
  | { type: 'open' }                             // sesión de Gemini Live lista
  | { type: 'audio'; data: string }              // PCM16 base64
  | { type: 'modelText'; text: string }
  | { type: 'turnComplete' }
  | { type: 'inputTranscription'; text: string } // llega en fragmentos
  | { type: 'close'; reason?: string }            // `reason` solo si Gemini la dio
  | { type: 'error'; message: string };

const VOICE_RMS_THRESHOLD = 0.05;
/** Silencio antes de dormir la sesión. La UI muestra esta misma cuenta atrás. */
export const SILENCE_TIMEOUT_MS = 15_000;
// Umbral y frames algo más exigentes que el VAD para que un ruido suelto no despierte la sesión.
const WAKE_RMS_THRESHOLD  = 0.06;
const WAKE_FRAMES_NEEDED  = 6;

const INPUT_SAMPLE_RATE       = 16000;
const OUTPUT_SAMPLE_RATE      = 24000;
const BUFFER_SIZE             = 4096;
const RECONNECT_CONTEXT_TURNS = 8;

/**
 * Una sesión que muere apenas abre no es un corte de red: es Gemini
 * rechazándola (modelo retirado, cuota, clave sin permisos). Reintentar sin
 * fin deja la voz en un bucle mudo, así que tras varios intentos se avisa.
 */
const SESSION_TOO_SHORT_MS   = 3_000;
/**
 * Margen tras la última palabra de Sous antes de volver a escuchar. Sin él, el
 * micrófono capta la cola de su propia voz por el altavoz y Gemini la toma por
 * una interrupción: corta la frase a medias y vuelve a empezar.
 */
const ECHO_GUARD_MS          = 350;

/**
 * Interrumpir a Sous hablando encima. El problema es separar la voz del usuario
 * del eco del propio altavoz, que llega por el micrófono y suena igual de
 * "voz". En lugar de un umbral fijo —que depende del volumen y del teléfono— se
 * mide cuánto eco vuelve al empezar cada respuesta y se exige bastante más que
 * eso, sostenido. Con auriculares el eco es casi nulo y basta hablar normal.
 */
const ECHO_SAMPLE_MS         = 600;   // se escucha el eco antes de permitir cortar
const BARGE_ECHO_FACTOR      = 1.8;   // cuánto más fuerte que el eco medido
const BARGE_RMS_FLOOR        = 0.09;  // mínimo absoluto, por si no hay eco
// Techo: con el altavoz a tope el eco es alto y sin este límite haría falta
// gritar para cortarlo. Prefiero que alguna vez se corte solo a que no se pueda.
const BARGE_RMS_CEILING      = 0.18;
const BARGE_FRAMES_NEEDED    = 3;     // ~0,3 s seguidos: un golpe suelto no cuenta
/** Tras cortarle, el turno es del usuario: el audio que venía en camino se tira. */
const USER_FLOOR_MS          = 1_500;
const MAX_FAILED_RECONNECTS  = 3;

const MAX_SESSION_MS = 20 * 60_000;
/** Se sigue enviando audio un poco después de que baja el RMS para no cortar las últimas sílabas. */
const VOICE_TAIL_MS  = 400;

/** Con `API_URL` usa su host (https → wss); en desarrollo, el mismo host vía el proxy de Vite. */
function getProxyWsUrl(): string {
  if (API_URL) {
    return API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/api/live';
  }
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/api/live`;
}

/** `systemPrompt` se fija al abrir la sesión y se reutiliza en las reconexiones. */
export function useGeminiLive(systemPrompt: string) {
  const [voiceState, setVoiceState]           = useState<VoiceState>('idle');
  const [transcript, setTranscript]           = useState<VoiceTranscriptEntry[]>([]);
  const [currentChefText, setCurrentChefText] = useState('');
  const [voiceError, setVoiceError]           = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds]   = useState(0);

  const voiceStateRef       = useRef<VoiceState>('idle');
  const sessionRef          = useRef<ProxySession | null>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const inputAudioCtxRef    = useRef<AudioContext | null>(null);
  const outputAudioCtxRef   = useRef<AudioContext | null>(null);
  const processorRef        = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  /** Loop silencioso que evita que iOS suspenda el AudioContext. */
  const silentSourceRef     = useRef<AudioBufferSourceNode | null>(null);
  const playbackQueueRef    = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef     = useRef(0);
  /** Se limpia en turnComplete. */
  const currentModelTextRef = useRef('');
  const isSpeakingRef       = useRef(false);
  /** Intención del usuario; si es `false` no se reconecta. */
  const wantsVoiceRef       = useRef(false);
  const promptRef           = useRef(systemPrompt);
  const isReconnectingRef   = useRef(false);
  /** Copia para leer el transcript desde closures. */
  const transcriptRef       = useRef<VoiceTranscriptEntry[]>([]);
  /** Lo hablado antes de esta sesión de voz (viene del chat escrito). */
  const baseHistoryRef      = useRef<VoiceHistory>([]);
  const lastVoiceTimeRef    = useRef(0);
  const wakeFrameCountRef   = useRef(0);
  const nativeRateRef       = useRef(44100);
  const silenceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceTailUntilRef   = useRef(0);
  const sessionStartRef     = useRef(0);
  /** Momento del último `open`, para saber cuánto vivió la sesión que se cerró. */
  const sessionOpenedAtRef  = useRef(0);
  /** Hay una intervención hablada abierta ante Gemini (activityStart sin su end). */
  const isTalkingRef        = useRef(false);
  /** Hasta cuándo se ignora el micrófono por ser eco del altavoz. */
  const echoGuardUntilRef   = useRef(0);
  /** Cuándo empezó a hablar Sous (0 = callado), para medir su eco. */
  const speakStartedAtRef   = useRef(0);
  /** Nivel de eco medido en este teléfono mientras Sous habla. */
  const echoFloorRef        = useRef(0);
  /** Frames seguidos por encima del umbral de interrupción. */
  const bargeFrameCountRef  = useRef(0);
  /** Esos mismos frames, guardados: son el principio de la frase del usuario. */
  const bargePrerollRef     = useRef<string[]>([]);
  /** Hasta cuándo manda el usuario: se descarta el audio de Sous que llegue tarde. */
  const userFloorUntilRef   = useRef(0);
  /** La sesión llegó a recibir algo de Gemini: no fue un fallo de conexión. */
  const sessionGotDataRef   = useRef(false);
  /** Sesiones seguidas que murieron nada más abrir. */
  const failedReconnectsRef = useRef(0);
  /** Rompe la dependencia circular entre reconnectSession y handleProxyMsg. */
  const reconnectSessionRef = useRef<() => void>(() => {});
  /** Último reporte de uso a utils/voiceUsage.ts. 0 = sin sesión activa (sleeping no cuenta). */
  const lastUsageReportRef  = useRef(0);
  /** Mes en que arrancó la sesión; si cambia a mitad de sesión se duerme para no gastar dos topes. */
  const sessionMonthKeyRef  = useRef<string>('');

  // Estado y ref a la vez: los closures del ScriptProcessor leen la ref.
  const updateTranscript = useCallback((updater: (prev: VoiceTranscriptEntry[]) => VoiceTranscriptEntry[]) => {
    setTranscript(prev => {
      const next = updater(prev);
      transcriptRef.current = next;
      return next;
    });
  }, []);

  // Igual que arriba: onaudioprocess necesita ver el estado más reciente.
  const setVoiceStateSync = useCallback((s: VoiceState | ((prev: VoiceState) => VoiceState)) => {
    setVoiceState(prev => {
      const next = typeof s === 'function' ? s(prev) : s;
      voiceStateRef.current = next;
      return next;
    });
  }, []);

  // Ganancia 0.001 y no 0: iOS suspende el contexto si no suena nada mientras la IA calla.
  const startSilentLoop = useCallback((ctx: AudioContext) => {
    if (silentSourceRef.current) return;
    const buf  = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const src  = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.001;
    src.connect(gain); gain.connect(ctx.destination); src.start();
    silentSourceRef.current = src;
  }, []);

  const stopSilentLoop = useCallback(() => {
    try { silentSourceRef.current?.stop(); } catch { /* ok */ }
    silentSourceRef.current = null;
  }, []);

  /** Alimenta `silenceSeconds` para la cuenta atrás de la UI. */
  const startSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) return;
    lastVoiceTimeRef.current = Date.now();
    let lastEmitted = -1;
    silenceIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastVoiceTimeRef.current) / 1000);
      // Evita re-renders si el intervalo dispara dos veces en el mismo segundo.
      if (elapsed !== lastEmitted) {
        lastEmitted = elapsed;
        setSilenceSeconds(elapsed);
      }
    }, 1000);
  }, []);

  const stopSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) { clearInterval(silenceIntervalRef.current); silenceIntervalRef.current = null; }
    setSilenceSeconds(0);
  }, []);

  /** Libera micrófono, audio y WebSocket. Idempotente. */
  const cleanup = useCallback(() => {
    stopSilentLoop();
    stopSilenceCountdown();
    if (processorRef.current)   { processorRef.current.disconnect();  processorRef.current = null; }
    if (sourceNodeRef.current)  { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current)      { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    playbackQueueRef.current.forEach(n => { try { n.stop(); } catch { /* ok */ } });
    playbackQueueRef.current = []; nextPlayTimeRef.current = 0;
    if (inputAudioCtxRef.current?.state  !== 'closed') { inputAudioCtxRef.current?.close().catch(() => {});  inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current?.state !== 'closed') { outputAudioCtxRef.current?.close().catch(() => {}); outputAudioCtxRef.current = null; }
    if (sessionRef.current) { try { sessionRef.current.close(); } catch { /* ok */ } sessionRef.current = null; }
  }, [stopSilentLoop, stopSilenceCountdown]);

  /** Fin de sesión pedido por el usuario: sin reconexiones. */
  const disconnect = useCallback(() => {
    wantsVoiceRef.current = false; isReconnectingRef.current = false;
    cleanup();
    setVoiceStateSync('idle'); setCurrentChefText(''); setVoiceError(null);
  }, [cleanup, setVoiceStateSync]);

  /** Cierra el WebSocket pero deja el micrófono abierto para despertar con la voz. */
  const goToSleep = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') return;
    stopSilenceCountdown();
    wakeFrameCountRef.current = 0;
    // El tiempo dormido no cuenta como uso.
    lastUsageReportRef.current = 0;
    sessionMonthKeyRef.current = ''; // se rehidrata al reanudar
    if (sessionRef.current) { try { sessionRef.current.close(); } catch { /* ok */ } sessionRef.current = null; }
    isReconnectingRef.current = false;
    setVoiceStateSync('sleeping');
  }, [setVoiceStateSync, stopSilenceCountdown]);

  /** Calla a Sous en el acto: descarta lo que ya estaba programado para sonar. */
  const stopPlayback = useCallback(() => {
    playbackQueueRef.current.forEach(n => { try { n.stop(); } catch { /* ya terminó */ } });
    playbackQueueRef.current = [];
    nextPlayTimeRef.current  = 0;
    isSpeakingRef.current    = false;
    currentModelTextRef.current = '';
    setCurrentChefText('');
    setVoiceStateSync(prev => prev === 'speaking' ? 'listening' : prev);
  }, [setVoiceStateSync]);

  /** Encadena los chunks con `nextPlayTimeRef` para que suenen sin huecos. */
  const playAudioChunk = useCallback((b64: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    const f32 = pcm16Base64ToFloat32(b64);
    const ab  = ctx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
    ab.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = ab; src.connect(ctx.destination);
    const now = ctx.currentTime;
    const t   = Math.max(now, nextPlayTimeRef.current);
    src.start(t); nextPlayTimeRef.current = t + ab.duration;
    playbackQueueRef.current.push(src);
    src.onended = () => {
      playbackQueueRef.current = playbackQueueRef.current.filter(n => n !== src);
      if (playbackQueueRef.current.length === 0 && !isSpeakingRef.current) {
        setVoiceStateSync(prev => prev === 'speaking' ? 'listening' : prev);
        setCurrentChefText('');
      }
    };
  }, [setVoiceStateSync]);

  const handleProxyMsg = useCallback((msg: ProxyMsg) => {
    if (msg.type !== 'close' && msg.type !== 'open') sessionGotDataRef.current = true;

    // Audio que Gemini ya había enviado cuando el usuario lo cortó: si sonara,
    // volvería a hablar encima y el eco reabriría el problema.
    if (msg.type === 'audio' && Date.now() < userFloorUntilRef.current) return;

    if (msg.type === 'audio') {
      isSpeakingRef.current = true;
      setVoiceStateSync('speaking');
      playAudioChunk(msg.data);

    } else if (msg.type === 'modelText') {
      currentModelTextRef.current += msg.text;
      setCurrentChefText(currentModelTextRef.current);

    } else if (msg.type === 'turnComplete') {
      isSpeakingRef.current = false;
      if (currentModelTextRef.current.trim()) {
        updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]);
      }
      currentModelTextRef.current = '';
      if (playbackQueueRef.current.length === 0) { setVoiceStateSync('listening'); setCurrentChefText(''); }

    } else if (msg.type === 'inputTranscription' && msg.text?.trim()) {
      // La transcripción llega en fragmentos: reemplaza el último turno del usuario.
      const t = msg.text;
      updateTranscript(prev => {
        const last = prev[prev.length - 1];
        return last?.agent === 'user'
          ? [...prev.slice(0, -1), { agent: 'user', text: t }]
          : [...prev, { agent: 'user', text: t }];
      });

    } else if (msg.type === 'close') {
      sessionRef.current    = null;
      isSpeakingRef.current = false;
      isReconnectingRef.current = false;
      isTalkingRef.current  = false;
      if (currentModelTextRef.current.trim()) {
        updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]);
        currentModelTextRef.current = '';
      }
      setCurrentChefText('');

      // Solo cuenta como fallo la sesión que murió enseguida SIN haber dicho
      // nada. Dormirse es un cierre buscado, y una sesión que alcanzó a
      // responder funcionaba: ninguna de las dos debe gastar intentos.
      const dormida = voiceStateRef.current === 'sleeping';
      const lived   = sessionOpenedAtRef.current ? Date.now() - sessionOpenedAtRef.current : 0;
      const falló   = !dormida && !sessionGotDataRef.current && lived > 0 && lived < SESSION_TOO_SHORT_MS;
      failedReconnectsRef.current = falló ? failedReconnectsRef.current + 1 : 0;
      sessionOpenedAtRef.current = 0;
      sessionGotDataRef.current  = false;

      if (wantsVoiceRef.current && voiceStateRef.current !== 'sleeping') {
        if (failedReconnectsRef.current >= MAX_FAILED_RECONNECTS) {
          if (msg.reason) console.error('[Proxy] Gemini cerró la voz:', msg.reason);
          wantsVoiceRef.current = false;
          setVoiceError('No pudimos conectar la voz. Sigue por escrito y vuelve a intentarlo en un rato.');
          setVoiceStateSync('idle');
        } else {
          setTimeout(() => reconnectSessionRef.current(), 500);
        }
      }

    } else if (msg.type === 'error') {
      console.error('[Proxy] error de voz:', msg.message);
      setVoiceError('No pudimos conectar la voz. Sigue por escrito y vuelve a intentarlo en un rato.');
    }
  }, [playAudioChunk, setVoiceStateSync, updateTranscript]);

  // Los handlers del WebSocket leen siempre la versión más reciente.
  const handleProxyMsgRef = useRef(handleProxyMsg);
  useEffect(() => { handleProxyMsgRef.current = handleProxyMsg; }, [handleProxyMsg]);

  /** Últimos turnos para reinyectar como contexto al reconectar. */
  const buildReconnectHistory = useCallback((): VoiceHistory => {
    // Lo de antes de la voz y lo hablado en ella son la misma conversación.
    const hablado: VoiceHistory = transcriptRef.current.map(e => ({
      role: e.agent === 'user' ? 'user' : 'model',
      parts: [{ text: e.text }] as [{ text: string }],
    }));
    return [...baseHistoryRef.current, ...hablado].slice(-(RECONNECT_CONTEXT_TURNS * 2));
  }, []);

  /** `onOpen` se llama cuando Gemini Live confirma la sesión, no al abrir el socket. */
  const createProxySession = useCallback((
    systemPrompt: string,
    history: Array<{ role: string; parts: [{ text: string }] }>,
    onOpen: () => void,
  ): ProxySession => {
    const ws = new WebSocket(getProxyWsUrl());

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'start', systemPrompt, history }));
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const msg = JSON.parse(e.data as string) as ProxyMsg;
        if (msg.type === 'open') {
          onOpen();
        } else {
          handleProxyMsgRef.current(msg);
        }
      } catch { /* saltar mensaje mal formado */ }
    };

    ws.onclose = () => {
      handleProxyMsgRef.current({ type: 'close' });
    };

    ws.onerror = () => {
      // onclose se dispara después y se encarga de reconectar.
      console.error('[Proxy] WebSocket error');
    };

    return {
      sendRealtimeInput({ audio }) {
        if (audio && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'audio', data: audio.data, mimeType: audio.mimeType }));
        }
      },
      sendActivity(edge) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: edge === 'start' ? 'activityStart' : 'activityEnd' }));
        }
      },
      sendClientContent({ turns, turnComplete }) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'clientContent', turns, turnComplete }));
        }
      },
      close() {
        ws.close();
      },
    };
  }, []);

  /** Reabre el WebSocket sin tocar el micrófono. */
  const reconnectSession = useCallback(() => {
    if (!wantsVoiceRef.current)     return;
    if (isReconnectingRef.current)  return;
    isReconnectingRef.current = true;
    lastVoiceTimeRef.current  = Date.now();
    wakeFrameCountRef.current = 0;
    setVoiceStateSync('reconnecting');
    stopSilenceCountdown();

    const history = buildReconnectHistory();

    try {
      const session = createProxySession(
        promptRef.current,
        history,
        () => {
          isReconnectingRef.current = false;
          voiceTailUntilRef.current = 0;
          isTalkingRef.current = false;
          sessionOpenedAtRef.current = Date.now();
          sessionMonthKeyRef.current = getMonthKey();
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
      );
      sessionRef.current = session;
    } catch (err) {
      console.error('[Proxy] reconexión fallida:', err);
      isReconnectingRef.current = false;
      if (wantsVoiceRef.current) setTimeout(() => reconnectSessionRef.current(), 2000);
    }
  }, [buildReconnectHistory, createProxySession, setVoiceStateSync, stopSilenceCountdown, startSilenceCountdown]);

  useEffect(() => { reconnectSessionRef.current = reconnectSession; }, [reconnectSession]);

  // Al volver a primer plano: reanudar audio y reconectar si hace falta.
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (!wantsVoiceRef.current) return;

      if (document.visibilityState === 'hidden') return;

      await inputAudioCtxRef.current?.resume().catch(() => {});
      await outputAudioCtxRef.current?.resume().catch(() => {});

      // iOS puede cortar el micrófono en segundo plano.
      const micTracks = streamRef.current?.getAudioTracks() ?? [];
      const micAlive  = micTracks.length > 0 && micTracks[0].readyState === 'live';
      if (!micAlive) { setVoiceStateSync('needs-tap'); return; }

      if (!sessionRef.current && !isReconnectingRef.current && voiceStateRef.current !== 'sleeping') {
        reconnectSessionRef.current();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [setVoiceStateSync]);

  useEffect(() => { return () => { cleanup(); }; }, []); // eslint-disable-line

  /**
   * Debe llamarse desde un gesto del usuario (getUserMedia y AudioContext lo exigen).
   * Desde `sleeping` con el micrófono vivo solo reconecta el WebSocket.
   */
  /**
   * `initialHistory` es la conversación que ya existe (normalmente la del chat
   * escrito). Sin ella la voz arranca en blanco: sabe la receta, que viene en
   * el prompt, pero no por qué paso iba la cocción.
   */
  /** Vacía lo hablado. Solo al terminar la sesión: si no, reaparece de contexto. */
  const resetTranscript = useCallback(() => {
    transcriptRef.current  = [];
    baseHistoryRef.current = [];
    setTranscript([]);
  }, []);

  const startListening = useCallback(async (initialHistory: VoiceHistory = []) => {
    if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'needs-tap' && voiceStateRef.current !== 'sleeping') return;

    // Sin minutos de voz no se abre sesión. Ver utils/voiceUsage.ts.
    if (voiceCapReached()) {
      setVoiceStateSync('cap-reached');
      return;
    }

    const resumingFromSleep = voiceStateRef.current === 'sleeping';

    if (resumingFromSleep && streamRef.current?.active) {
      reconnectSessionRef.current();
      return;
    }

    wantsVoiceRef.current   = true;
    promptRef.current = systemPrompt;
    isReconnectingRef.current = false;
    // Los frames llegan antes de que abra la sesión: sin reiniciar estos relojes,
    // un chat abierto hace más de 15 s (o una sesión vieja) dormía la voz al instante.
    lastVoiceTimeRef.current = Date.now();
    sessionStartRef.current = 0;
    // Intento nuevo del usuario: la cuenta de fallos vuelve a cero.
    failedReconnectsRef.current = 0;
    baseHistoryRef.current = initialHistory;
    setVoiceStateSync('connecting');
    setCurrentChefText(''); setVoiceError(null);
    currentModelTextRef.current = '';

    if (inputAudioCtxRef.current)  { inputAudioCtxRef.current.close().catch(() => {});   inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current) { outputAudioCtxRef.current.close().catch(() => {}); outputAudioCtxRef.current = null; }
    if (processorRef.current)      { processorRef.current.disconnect();  processorRef.current = null; }
    if (sourceNodeRef.current)     { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current)         { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    stopSilentLoop();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext();
      inputAudioCtxRef.current  = inputCtx;
      outputAudioCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      nativeRateRef.current     = inputCtx.sampleRate;

      if (inputCtx.state === 'suspended')                await inputCtx.resume();
      if (outputAudioCtxRef.current.state === 'suspended') await outputAudioCtxRef.current.resume();

      startSilentLoop(outputAudioCtxRef.current);

      const session = createProxySession(
        systemPrompt,
        initialHistory,
        () => {
          sessionStartRef.current   = Date.now();
          sessionOpenedAtRef.current = Date.now();
          isTalkingRef.current = false;
          sessionMonthKeyRef.current = getMonthKey();
          voiceTailUntilRef.current = 0;
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
      );
      sessionRef.current = session;

      const source    = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current  = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const raw = e.inputBuffer.getChannelData(0);
        const rms = calcRMS(raw);

        if (voiceStateRef.current === 'sleeping') {
          if (rms > WAKE_RMS_THRESHOLD) {
            wakeFrameCountRef.current++;
            if (wakeFrameCountRef.current >= WAKE_FRAMES_NEEDED) {
              wakeFrameCountRef.current = 0;
              reconnectSessionRef.current();
            }
          } else {
            wakeFrameCountRef.current = 0;
          }
          return;
        }

        const now = Date.now();
        if (rms > VOICE_RMS_THRESHOLD) {
          lastVoiceTimeRef.current  = now;
          wakeFrameCountRef.current = 0;
          voiceTailUntilRef.current = now + VOICE_TAIL_MS;
        } else if (now - lastVoiceTimeRef.current > SILENCE_TIMEOUT_MS) {
          goToSleep();
          return;
        }

        if (sessionStartRef.current > 0 && now - sessionStartRef.current > MAX_SESSION_MS) {
          goToSleep();
          return;
        }

        if (!sessionRef.current) return;

        // Uso del tope mensual: solo cuenta tiempo con WebSocket activo.
        if (lastUsageReportRef.current === 0) {
          lastUsageReportRef.current = now;
        } else if (now - lastUsageReportRef.current >= 1000) {
          // Tope de 5 s: en segundo plano el navegador puede entregar minutos de
          // golpe, y con un buffer cada ~85 ms no hay saltos legítimos mayores.
          const rawElapsedSec = Math.floor((now - lastUsageReportRef.current) / 1000);
          const elapsedSec = Math.min(rawElapsedSec, 5);
          if (elapsedSec > 0) {
            addVoiceSeconds(elapsedSec);
            lastUsageReportRef.current += elapsedSec * 1000;

            // Si la sesión cruza de mes, los segundos siguientes irían contra un tope nuevo.
            if (sessionMonthKeyRef.current !== getMonthKey()) {
              goToSleep();
              return;
            }

            // cleanup completo: cerrar solo el WebSocket dejaría el micrófono gastando batería.
            if (voiceRemainingSeconds() <= 0) {
              wantsVoiceRef.current = false;
              cleanup();
              setVoiceStateSync('cap-reached');
              return;
            }
          }
        }

        const sousHablando = isSpeakingRef.current || playbackQueueRef.current.length > 0;

        if (sousHablando) {
          if (speakStartedAtRef.current === 0) {
            speakStartedAtRef.current = now;
            echoFloorRef.current      = 0;
            bargeFrameCountRef.current = 0;
          }

          const cortarPermitido = now - speakStartedAtRef.current >= ECHO_SAMPLE_MS;
          if (!cortarPermitido) {
            // Primeros milisegundos: lo que entra es su eco. Se mide.
            echoFloorRef.current = Math.max(echoFloorRef.current, rms);
          } else {
            const umbral = Math.min(
              BARGE_RMS_CEILING,
              Math.max(BARGE_RMS_FLOOR, echoFloorRef.current * BARGE_ECHO_FACTOR),
            );
            if (rms > umbral) {
              bargeFrameCountRef.current++;
              // Se guardan: si resulta ser una interrupción, son las primeras
              // sílabas y sin ellas Gemini oiría la frase empezada a medias.
              bargePrerollRef.current.push(float32ToPCM16Base64(downsample(raw, nativeRateRef.current, INPUT_SAMPLE_RATE)));
              if (bargePrerollRef.current.length > BARGE_FRAMES_NEEDED) bargePrerollRef.current.shift();
            } else {
              bargeFrameCountRef.current = 0;
              bargePrerollRef.current    = [];
            }
          }

          if (bargeFrameCountRef.current < BARGE_FRAMES_NEEDED) {
            // Todavía no es una interrupción: el micrófono no se le pasa a Gemini.
            echoGuardUntilRef.current = now + ECHO_GUARD_MS;
            if (isTalkingRef.current) {
              isTalkingRef.current = false;
              sessionRef.current.sendActivity('end');
            }
            voiceTailUntilRef.current = 0;
            return;
          }

          // Interrupción de verdad: se calla a Sous y se le cede el turno.
          stopPlayback();
          userFloorUntilRef.current  = now + USER_FLOOR_MS;
          bargeFrameCountRef.current = 0;
          speakStartedAtRef.current  = 0;
          echoGuardUntilRef.current  = 0;
          voiceTailUntilRef.current  = now + VOICE_TAIL_MS;
        } else {
          speakStartedAtRef.current  = 0;
          bargeFrameCountRef.current = 0;
          bargePrerollRef.current    = [];

          if (now < echoGuardUntilRef.current) {
            if (isTalkingRef.current) {
              isTalkingRef.current = false;
              sessionRef.current.sendActivity('end');
            }
            voiceTailUntilRef.current = 0;
            return;
          }
        }

        // Solo se envía audio con voz o en la cola posterior: el silencio también se factura.
        if (now > voiceTailUntilRef.current) {
          // Fin de la intervención: sin este aviso el modelo se queda esperando
          // un silencio que nunca le llega y no contesta nada.
          if (isTalkingRef.current) {
            isTalkingRef.current = false;
            sessionRef.current.sendActivity('end');
          }
          return;
        }

        if (!isTalkingRef.current) {
          isTalkingRef.current = true;
          sessionRef.current.sendActivity('start');
        }

        if (bargePrerollRef.current.length > 0) {
          for (const frame of bargePrerollRef.current) {
            sessionRef.current.sendRealtimeInput({ audio: { data: frame, mimeType: 'audio/pcm;rate=16000' } });
          }
          bargePrerollRef.current = [];
        }

        // downsample no muta `raw`.
        const resampled = downsample(raw, nativeRateRef.current, INPUT_SAMPLE_RATE);
        sessionRef.current.sendRealtimeInput({ audio: { data: float32ToPCM16Base64(resampled), mimeType: 'audio/pcm;rate=16000' } });
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setVoiceError(`Error: ${msg}`);
      cleanup();
      setVoiceStateSync('idle');
    }
  }, [systemPrompt, cleanup, stopSilentLoop, createProxySession, setVoiceStateSync,
      startSilentLoop, startSilenceCountdown, goToSleep, stopPlayback]);

  /** Despertar con botón en vez de con la voz. */
  const wakeUp = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') reconnectSessionRef.current();
  }, []);

  /** Inyecta un turno de texto en la sesión de voz (p. ej. cambio de receta). */
  const sendTextToVoice = useCallback((text: string) => {
    if (!sessionRef.current) return;
    try { sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch (e) { console.error('[Proxy] sendText error:', e); }
  }, []);

  return { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp, resetTranscript };
}
