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
 * - Wake Lock + NoSleep.js + MediaSession para que iOS/Android no suspendan
 *   la pantalla ni el AudioContext.
 * - Máximo 20 min de sesión activa; luego pasa a `sleeping`.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import NoSleep from 'nosleep.js';
import { API_URL, CHEF_SYSTEM_PROMPT } from '../services/gemini';
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
interface ProxySession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
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
  | { type: 'close' }
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

/** `customSystemPrompt` reemplaza el prompt genérico del chef (Mealprep, Sabores, Cocinemos). */
export function useGeminiLive(customSystemPrompt?: string) {
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
  const customPromptRef     = useRef(customSystemPrompt);
  /** Respaldo para dispositivos sin Wake Lock API. */
  const noSleepRef          = useRef<InstanceType<typeof NoSleep> | null>(null);
  const wakeLockRef         = useRef<WakeLockSentinel | null>(null);
  const isReconnectingRef   = useRef(false);
  /** Copia para leer el transcript desde closures. */
  const transcriptRef       = useRef<VoiceTranscriptEntry[]>([]);
  const lastVoiceTimeRef    = useRef(0);
  const wakeFrameCountRef   = useRef(0);
  const nativeRateRef       = useRef(44100);
  const silenceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceTailUntilRef   = useRef(0);
  const sessionStartRef     = useRef(0);
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

  /**
   * Usa todo lo disponible para mantener la pantalla encendida: Wake Lock API,
   * NoSleep.js (video invisible) como respaldo, y MediaSession para que el SO
   * vea reproducción activa.
   */
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      } catch { /* fallback a NoSleep */ }
    }
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep();
      await noSleepRef.current.enable();
    } catch { /* no es fatal */ }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Sous está escuchando',
          artist: 'Sous, asistente de cocina',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch { /* no fatal */ }
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    noSleepRef.current?.disable();
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'none'; } catch { /* ok */ }
    }
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

  /** Libera micrófono, audio, wake lock y WebSocket. Idempotente. */
  const cleanup = useCallback(() => {
    releaseWakeLock();
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
  }, [releaseWakeLock, stopSilentLoop, stopSilenceCountdown]);

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
      if (currentModelTextRef.current.trim()) {
        updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]);
        currentModelTextRef.current = '';
      }
      setCurrentChefText('');
      if (wantsVoiceRef.current && voiceStateRef.current !== 'sleeping') {
        setTimeout(() => reconnectSessionRef.current(), 500);
      }

    } else if (msg.type === 'error') {
      console.error('[Proxy] error de voz:', msg.message);
    }
  }, [playAudioChunk, setVoiceStateSync, updateTranscript]);

  // Los handlers del WebSocket leen siempre la versión más reciente.
  const handleProxyMsgRef = useRef(handleProxyMsg);
  useEffect(() => { handleProxyMsgRef.current = handleProxyMsg; }, [handleProxyMsg]);

  /** Últimos turnos para reinyectar como contexto al reconectar. */
  const buildReconnectHistory = useCallback((): Array<{ role: string; parts: [{ text: string }] }> => {
    const recent = transcriptRef.current.slice(-(RECONNECT_CONTEXT_TURNS * 2));
    if (recent.length === 0) return [];
    return recent.map(e => ({ role: e.agent === 'user' ? 'user' : 'model', parts: [{ text: e.text }] as [{ text: string }] }));
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
        customPromptRef.current ?? CHEF_SYSTEM_PROMPT,
        history,
        () => {
          isReconnectingRef.current = false;
          voiceTailUntilRef.current = 0;
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

      if (document.visibilityState === 'hidden') {
        // MediaSession en 'playing' para que iOS no suspenda el AudioContext.
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'playing'; } catch { /* ok */ }
        }
        return;
      }

      await inputAudioCtxRef.current?.resume().catch(() => {});
      await outputAudioCtxRef.current?.resume().catch(() => {});
      requestWakeLock();

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
  }, [requestWakeLock, setVoiceStateSync]);

  useEffect(() => { return () => { cleanup(); }; }, []); // eslint-disable-line

  /**
   * Debe llamarse desde un gesto del usuario (getUserMedia y AudioContext lo exigen).
   * Desde `sleeping` con el micrófono vivo solo reconecta el WebSocket.
   */
  const startListening = useCallback(async () => {
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
    customPromptRef.current = customSystemPrompt;
    isReconnectingRef.current = false;
    // Los frames llegan antes de que abra la sesión: sin reiniciar estos relojes,
    // un chat abierto hace más de 15 s (o una sesión vieja) dormía la voz al instante.
    lastVoiceTimeRef.current = Date.now();
    sessionStartRef.current = 0;
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

      requestWakeLock();
      startSilentLoop(outputAudioCtxRef.current);

      const session = createProxySession(
        customSystemPrompt ?? CHEF_SYSTEM_PROMPT,
        [],
        () => {
          sessionStartRef.current   = Date.now();
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

        // Solo se envía audio con voz o en la cola posterior: el silencio también se factura.
        if (now > voiceTailUntilRef.current) return;

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
  }, [customSystemPrompt, cleanup, stopSilentLoop, createProxySession, setVoiceStateSync,
      requestWakeLock, startSilentLoop, startSilenceCountdown, goToSleep]);

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

  return { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp };
}
