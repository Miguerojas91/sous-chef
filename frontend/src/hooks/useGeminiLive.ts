/**
 * useGeminiLive.ts
 *
 * Hook de React para conversaciones de voz en tiempo real con Gemini Live,
 * a través del proxy propio (nunca conecta directamente a Google desde el navegador).
 *
 * Arquitectura:
 *   Browser (microfono) → ScriptProcessor → downsample a 16kHz → PCM16 base64
 *     → WebSocket → Proxy Express → Gemini Live API
 *     → Proxy → WebSocket → Browser → AudioContext 24kHz → altavoz
 *
 * Características principales:
 * - VAD (Voice Activity Detection) por RMS: solo envía audio cuando hay voz,
 *   ahorrando hasta un 70% del audio facturado en sesiones con silencios.
 * - Modo "sleeping": cuando hay 15 s de silencio, cierra el WebSocket pero
 *   mantiene el micrófono activo. Se despierta automáticamente al detectar voz.
 * - Reconexión automática: si el WebSocket se cierra (límite de sesión, red,
 *   etc.), reconecta con el historial de los últimos N turnos como contexto.
 * - Wake Lock dual: Screen Wake Lock API + NoSleep.js + MediaSession API
 *   para evitar que la pantalla/AudioContext se suspenda en iOS/Android.
 * - Recuperación al volver la pestaña: re-activa AudioContexts y reconecta
 *   el WebSocket si es necesario.
 * - Duración máxima de sesión: 20 minutos activos, luego pasa a sleeping.
 *
 * @param customSystemPrompt - Sobreescribe el system prompt por defecto del chef.
 * @returns Estado de voz, transcripción, texto actual del chef y controles.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import NoSleep from 'nosleep.js';
import { API_URL, CHEF_SYSTEM_PROMPT } from '../services/gemini';

// ── Helpers de audio ──────────────────────────────────────────────────────────

/**
 * Convierte un buffer de audio Float32 (rango -1..1) a PCM16 codificado en base64.
 * Formato requerido por la API Gemini Live (audio/pcm;rate=16000).
 *
 * @param float32 - Buffer de muestras de audio en punto flotante.
 * @returns Cadena base64 del audio en formato PCM 16-bit little-endian.
 */
function float32ToPCM16Base64(float32: Float32Array): string {
  const pcm16 = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(pcm16.buffer);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Reduce la frecuencia de muestreo de un buffer de audio por promedio de ventana.
 * Necesario para convertir la tasa nativa del navegador (44.1/48 kHz) a 16 kHz.
 *
 * @param buf  - Buffer de entrada en la tasa `from`.
 * @param from - Frecuencia de muestreo original (Hz).
 * @param to   - Frecuencia de muestreo objetivo (Hz).
 * @returns Nuevo buffer a la tasa `to`. Devuelve el original si `from === to`.
 */
function downsample(buf: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return buf;
  const ratio = from / to;
  const len   = Math.round(buf.length / ratio);
  const out   = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.floor(i * ratio);
    const e = Math.min(Math.floor((i + 1) * ratio), buf.length);
    let sum = 0;
    for (let j = s; j < e; j++) sum += buf[j];
    out[i] = sum / (e - s);
  }
  return out;
}

/**
 * Convierte audio PCM16 codificado en base64 a Float32 (rango -1..1).
 * Utilizado para reproducir el audio que devuelve la IA (24 kHz PCM).
 *
 * @param b64 - Cadena base64 del audio PCM 16-bit.
 * @returns Buffer Float32 listo para usar con AudioContext.
 */
function pcm16Base64ToFloat32(b64: string): Float32Array {
  const bin   = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
  return f32;
}

/**
 * Calcula el RMS (Root Mean Square) de un buffer de audio.
 * Se usa como medida de energía sonora para la detección de voz (VAD).
 *
 * @param buf - Buffer de muestras de audio.
 * @returns Valor RMS entre 0 y 1.
 */
function calcRMS(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// ── Tipos exportados ──────────────────────────────────────────────────────────

/**
 * Estado actual de la sesión de voz.
 * - `'idle'`         — Sin sesión activa.
 * - `'connecting'`   — Adquiriendo micrófono y abriendo WebSocket.
 * - `'listening'`    — Escuchando al usuario.
 * - `'speaking'`     — La IA está reproduciendo audio.
 * - `'sleeping'`     — Silencio prolongado; WebSocket cerrado pero mic activo.
 * - `'reconnecting'` — Reconectando WebSocket tras cierre o timeout.
 * - `'needs-tap'`    — iOS requiere gesto del usuario para reactivar AudioContext.
 */
export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'sleeping'
  | 'reconnecting'
  | 'needs-tap';

/** Entrada en la transcripción de la conversación de voz. */
export interface VoiceTranscriptEntry {
  /** Quién habló: 'chef' para la IA, 'user' para el usuario. */
  agent: 'chef' | 'user';
  /** Texto transcripto del turno. */
  text: string;
}

// ── Tipos internos ────────────────────────────────────────────────────────────

/**
 * Interfaz del adaptador de sesión proxy (envuelve el WebSocket).
 * Mantiene la misma forma que la sesión nativa de Gemini SDK para
 * que `onaudioprocess` no necesite saber el transporte subyacente.
 */
interface ProxySession {
  /** Envía un chunk de audio al proxy en tiempo real. */
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
  /** Envía contenido de texto al modelo como turno de usuario. */
  sendClientContent(params: { turns: Array<{ role: string; parts: Array<{ text: string }> }>; turnComplete: boolean }): void;
  /** Cierra el WebSocket. */
  close(): void;
}

/**
 * Mensajes que el proxy envía al navegador vía WebSocket.
 * Cada tipo representa un evento distinto de la sesión de voz.
 */
type ProxyMsg =
  | { type: 'open' }                           // Sesión Gemini Live lista
  | { type: 'audio'; data: string }            // Chunk de audio PCM16 base64 del chef
  | { type: 'modelText'; text: string }        // Fragmento de texto del modelo
  | { type: 'turnComplete' }                   // El chef terminó de hablar
  | { type: 'inputTranscription'; text: string } // Transcripción del usuario
  | { type: 'close' }                          // WebSocket cerrado
  | { type: 'error'; message: string };        // Error en el proxy

// ── Constantes de VAD (Voice Activity Detection) ──────────────────────────────

/** Umbral de RMS por encima del cual se considera que hay voz. */
const VOICE_RMS_THRESHOLD = 0.05;
/** Segundos de silencio antes de dormir la sesión. */
const SILENCE_TIMEOUT_MS  = 15_000;
/** Umbral de RMS para despertar desde modo sleeping. */
const WAKE_RMS_THRESHOLD  = 0.06;
/** Frames consecutivos con energía suficiente para activar el despertar. */
const WAKE_FRAMES_NEEDED  = 6;

// ── Otras constantes de audio ─────────────────────────────────────────────────

/** Frecuencia de muestreo del micrófono enviada al proxy (Hz). */
const INPUT_SAMPLE_RATE       = 16000;
/** Frecuencia de muestreo del audio recibido del chef (Hz). */
const OUTPUT_SAMPLE_RATE      = 24000;
/** Tamaño del buffer del ScriptProcessorNode (muestras). */
const BUFFER_SIZE             = 4096;
/** Turnos del historial enviados al proxy al reconectar. */
const RECONNECT_CONTEXT_TURNS = 8;

/** Duración máxima de una sesión de voz activa antes de pasar a sleeping (20 min). */
const MAX_SESSION_MS = 20 * 60_000;
/**
 * Tiempo adicional de envío de audio después de que el RMS baja del umbral.
 * Evita cortar las últimas sílabas de cada palabra.
 */
const VOICE_TAIL_MS  = 400;

// ── URL del proxy WebSocket ───────────────────────────────────────────────────

/**
 * Determina la URL del WebSocket del proxy según el entorno.
 * - Producción: convierte `API_URL` (https/http) a wss/ws.
 * - Desarrollo: usa el mismo host con el protocolo correcto (Vite proxy).
 */
function getProxyWsUrl(): string {
  if (API_URL) {
    return API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/api/live';
  }
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/api/live`;
}

// ── Hook principal ────────────────────────────────────────────────────────────

/**
 * Hook para conversaciones de voz en tiempo real con el chef IA.
 *
 * @param customSystemPrompt - System prompt opcional que sobreescribe el prompt
 *                             del chef genérico (útil para MilprepModule, FlavorsModule).
 * @returns Objeto con estado de voz, transcripción y funciones de control.
 */
export function useGeminiLive(customSystemPrompt?: string) {
  const [voiceState, setVoiceState]           = useState<VoiceState>('idle');
  const [transcript, setTranscript]           = useState<VoiceTranscriptEntry[]>([]);
  const [currentChefText, setCurrentChefText] = useState('');
  const [voiceError, setVoiceError]           = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds]   = useState(0);

  // ── Refs de sesión y audio ─────────────────────────────────────────────────
  const voiceStateRef       = useRef<VoiceState>('idle');
  const sessionRef          = useRef<ProxySession | null>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const inputAudioCtxRef    = useRef<AudioContext | null>(null);
  const outputAudioCtxRef   = useRef<AudioContext | null>(null);
  const processorRef        = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  /** Fuente de silencio para mantener el AudioContext de iOS activo. */
  const silentSourceRef     = useRef<AudioBufferSourceNode | null>(null);
  /** Cola de nodos de reproducción de audio del chef (reproducción secuencial). */
  const playbackQueueRef    = useRef<AudioBufferSourceNode[]>([]);
  /** Próximo tiempo de inicio disponible en el AudioContext de salida. */
  const nextPlayTimeRef     = useRef(0);
  /** Texto del modelo acumulado en el turno actual (se limpia en turnComplete). */
  const currentModelTextRef = useRef('');
  /** `true` mientras el proxy está enviando chunks de audio del chef. */
  const isSpeakingRef       = useRef(false);
  /** `true` mientras el usuario quiere que la sesión de voz esté activa. */
  const wantsVoiceRef       = useRef(false);
  const customPromptRef     = useRef(customSystemPrompt);
  /** Instancia de NoSleep.js (fallback para dispositivos sin Wake Lock API). */
  const noSleepRef          = useRef<InstanceType<typeof NoSleep> | null>(null);
  const wakeLockRef         = useRef<WakeLockSentinel | null>(null);
  /** Evita que dos reconexiones ocurran simultáneamente. */
  const isReconnectingRef   = useRef(false);
  /** Copia ref del transcript para acceso en closures sin causar re-renders. */
  const transcriptRef       = useRef<VoiceTranscriptEntry[]>([]);
  // ── Refs de VAD ────────────────────────────────────────────────────────────
  /** Timestamp de la última vez que se detectó actividad de voz. */
  const lastVoiceTimeRef    = useRef<number>(Date.now());
  /** Contador de frames consecutivos con energía > WAKE_RMS_THRESHOLD. */
  const wakeFrameCountRef   = useRef(0);
  /** Frecuencia de muestreo nativa del AudioContext de entrada. */
  const nativeRateRef       = useRef(44100);
  /** ID del intervalo del contador de silencio (UI). */
  const silenceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Timestamp hasta el que se debe seguir enviando audio (post-voz). */
  const voiceTailUntilRef   = useRef(0);
  /** Timestamp del inicio de la sesión activa (para MAX_SESSION_MS). */
  const sessionStartRef     = useRef(0);
  /** Ref de `reconnectSession` para romper dependencias circulares en closures. */
  const reconnectSessionRef = useRef<() => void>(() => {});

  // ── Utilidades de estado ───────────────────────────────────────────────────

  /**
   * Actualiza el transcript en estado Y en ref simultáneamente,
   * para que los closures del ScriptProcessor tengan acceso al valor actual.
   */
  const updateTranscript = useCallback((updater: (prev: VoiceTranscriptEntry[]) => VoiceTranscriptEntry[]) => {
    setTranscript(prev => {
      const next = updater(prev);
      transcriptRef.current = next;
      return next;
    });
  }, []);

  /**
   * Actualiza `voiceState` en estado Y en ref simultáneamente,
   * garantizando que `onaudioprocess` (closure) vea el estado más reciente.
   */
  const setVoiceStateSync = useCallback((s: VoiceState | ((prev: VoiceState) => VoiceState)) => {
    setVoiceState(prev => {
      const next = typeof s === 'function' ? s(prev) : s;
      voiceStateRef.current = next;
      return next;
    });
  }, []);

  // ── Wake Lock + MediaSession ───────────────────────────────────────────────

  /**
   * Adquiere todos los mecanismos disponibles para mantener la pantalla encendida:
   * 1. Screen Wake Lock API (Chrome/Edge/Safari iOS 17+).
   * 2. NoSleep.js (fallback vía video invisible para navegadores sin Wake Lock).
   * 3. MediaSession API (indica al SO que hay reproducción activa).
   */
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request(t: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
      } catch { /* fallback a NoSleep */ }
    }
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep();
      await noSleepRef.current.enable();
    } catch { /* no es fatal */ }
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: 'Chef Sous escuchando',
          artist: 'Sous · Asistente de cocina',
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch { /* no fatal */ }
    }
  }, []);

  /** Libera el Wake Lock, desactiva NoSleep y limpia MediaSession. */
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

  // ── Bucle de silencio para iOS ─────────────────────────────────────────────

  /**
   * Inicia un loop de audio silencioso (ganancia 0.001) en el AudioContext
   * de salida. Imprescindible en iOS para que el contexto no se suspenda
   * cuando la IA no está hablando.
   *
   * @param ctx - AudioContext de reproducción.
   */
  const startSilentLoop = useCallback((ctx: AudioContext) => {
    if (silentSourceRef.current) return;
    const buf  = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const src  = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.001;
    src.connect(gain); gain.connect(ctx.destination); src.start();
    silentSourceRef.current = src;
  }, []);

  /** Detiene el bucle de silencio. */
  const stopSilentLoop = useCallback(() => {
    try { silentSourceRef.current?.stop(); } catch { /* ok */ }
    silentSourceRef.current = null;
  }, []);

  // ── Contador de silencio (UI) ──────────────────────────────────────────────

  /**
   * Inicia el intervalo que actualiza `silenceSeconds` en la UI cada segundo.
   * Se muestra al usuario para indicar cuánto tiempo lleva sin hablar.
   */
  const startSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) return;
    lastVoiceTimeRef.current = Date.now();
    silenceIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastVoiceTimeRef.current) / 1000;
      setSilenceSeconds(Math.floor(elapsed));
    }, 1000);
  }, []);

  /** Detiene el intervalo del contador de silencio y reinicia el contador a 0. */
  const stopSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) { clearInterval(silenceIntervalRef.current); silenceIntervalRef.current = null; }
    setSilenceSeconds(0);
  }, []);

  // ── Limpieza de recursos ───────────────────────────────────────────────────

  /**
   * Libera todos los recursos de audio y cierra el WebSocket.
   * Llama a releaseWakeLock, stopSilentLoop y stopSilenceCountdown.
   * Seguro de llamar múltiples veces (idempotente).
   */
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

  /**
   * Detiene la sesión completamente y vuelve al estado `idle`.
   * Llama a cleanup y marca `wantsVoiceRef = false` para impedir reconexiones.
   */
  const disconnect = useCallback(() => {
    wantsVoiceRef.current = false; isReconnectingRef.current = false;
    cleanup();
    setVoiceStateSync('idle'); setCurrentChefText(''); setVoiceError(null);
  }, [cleanup, setVoiceStateSync]);

  // ── VAD: modo sleeping ─────────────────────────────────────────────────────

  /**
   * Pone la sesión en modo sleeping: cierra el WebSocket pero mantiene el
   * micrófono activo para detectar cuando el usuario vuelve a hablar.
   * Se activa automáticamente tras SILENCE_TIMEOUT_MS de silencio.
   */
  const goToSleep = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') return;
    stopSilenceCountdown();
    wakeFrameCountRef.current = 0;
    if (sessionRef.current) { try { sessionRef.current.close(); } catch { /* ok */ } sessionRef.current = null; }
    isReconnectingRef.current = false;
    setVoiceStateSync('sleeping');
  }, [setVoiceStateSync, stopSilenceCountdown]);

  // ── Reproducción de audio del chef ────────────────────────────────────────

  /**
   * Encola y reproduce un chunk de audio PCM16 base64 recibido del proxy.
   * Usa `nextPlayTimeRef` para reproducir chunks en secuencia sin gaps.
   * Al terminar el último chunk, vuelve al estado `listening`.
   *
   * @param b64 - Audio PCM16 codificado en base64.
   */
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

  // ── Manejador de mensajes del proxy ───────────────────────────────────────

  /**
   * Procesa cada mensaje entrante del proxy vía WebSocket.
   * Despacha el estado de voz y actualiza el transcript según el tipo de evento.
   *
   * @param msg - Mensaje tipado recibido del proxy.
   */
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
      // Actualizar o agregar el último turno del usuario (puede llegar en fragmentos)
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
      // Si el usuario sigue queriendo voz y no está en sleeping → reconectar
      if (wantsVoiceRef.current && voiceStateRef.current !== 'sleeping') {
        setTimeout(() => reconnectSessionRef.current(), 500);
      }

    } else if (msg.type === 'error') {
      console.error('[Proxy] error de voz:', msg.message);
    }
  }, [playAudioChunk, setVoiceStateSync, updateTranscript]);

  // Mantener ref actualizada para que los closures accedan a la versión más reciente
  const handleProxyMsgRef = useRef(handleProxyMsg);
  useEffect(() => { handleProxyMsgRef.current = handleProxyMsg; }, [handleProxyMsg]);

  // ── Contexto FIFO para reconexión ─────────────────────────────────────────

  /**
   * Construye el historial de los últimos RECONNECT_CONTEXT_TURNS turnos
   * en el formato que espera el proxy para reinyectarlo como contexto al reconectar.
   */
  const buildReconnectHistory = useCallback((): Array<{ role: string; parts: [{ text: string }] }> => {
    const recent = transcriptRef.current.slice(-(RECONNECT_CONTEXT_TURNS * 2));
    if (recent.length === 0) return [];
    return recent.map(e => ({ role: e.agent === 'user' ? 'user' : 'model', parts: [{ text: e.text }] as [{ text: string }] }));
  }, []);

  // ── Creación del WebSocket proxy ──────────────────────────────────────────

  /**
   * Abre un WebSocket al proxy, envía el mensaje `start` con el system prompt
   * e historial, y devuelve un adaptador `ProxySession`.
   *
   * @param systemPrompt - Instrucciones de sistema para el modelo.
   * @param history      - Historial de turnos previos para contextualizar.
   * @param onOpen       - Callback que se dispara cuando Gemini Live responde `open`.
   * @returns Adaptador ProxySession que envuelve el WebSocket.
   */
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
      // El handler onclose se dispara automáticamente después del error
      console.error('[Proxy] WebSocket error');
    };

    // Adaptador que mantiene la misma interfaz que la sesión nativa de Gemini SDK
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

  // ── Reconexión del WebSocket (micrófono sigue activo) ─────────────────────

  /**
   * Reconecta el WebSocket al proxy manteniendo el micrófono activo e
   * inyectando el historial reciente como contexto.
   * Usa `isReconnectingRef` para evitar reconexiones simultáneas.
   */
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

  // Mantener ref actualizado para romper la circularidad con handleProxyMsg
  useEffect(() => { reconnectSessionRef.current = reconnectSession; }, [reconnectSession]);

  // ── Recuperación al volver la pestaña ─────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (!wantsVoiceRef.current) return;

      if (document.visibilityState === 'hidden') {
        // Mantener MediaSession activa para que iOS no suspenda el AudioContext
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'playing'; } catch { /* ok */ }
        }
        return;
      }

      // Al volver: reanudar AudioContexts y solicitar Wake Lock nuevamente
      await inputAudioCtxRef.current?.resume().catch(() => {});
      await outputAudioCtxRef.current?.resume().catch(() => {});
      requestWakeLock();

      // Verificar si el micrófono sigue activo (iOS lo puede cortar)
      const micTracks = streamRef.current?.getAudioTracks() ?? [];
      const micAlive  = micTracks.length > 0 && micTracks[0].readyState === 'live';
      if (!micAlive) { setVoiceStateSync('needs-tap'); return; }

      // Reconectar WebSocket si es necesario
      if (!sessionRef.current && !isReconnectingRef.current && voiceStateRef.current !== 'sleeping') {
        reconnectSessionRef.current();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [requestWakeLock, setVoiceStateSync]);

  // Limpieza total al desmontar el componente
  useEffect(() => { return () => { cleanup(); }; }, []); // eslint-disable-line

  // ── Iniciar sesión de voz completa ────────────────────────────────────────

  /**
   * Inicia una nueva sesión de voz desde cero. Requiere gesto del usuario
   * (para que el navegador permita getUserMedia y AudioContext).
   *
   * Flujo:
   * 1. Solicita permisos de micrófono.
   * 2. Crea AudioContexts de entrada (16kHz) y salida (24kHz).
   * 3. Conecta al proxy vía WebSocket.
   * 4. Configura el pipeline: mic → ScriptProcessor → VAD → WebSocket.
   *
   * Si el estado es `sleeping` y el stream sigue activo, solo reconecta el WS.
   */
  const startListening = useCallback(async () => {
    if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'needs-tap' && voiceStateRef.current !== 'sleeping') return;

    const resumingFromSleep = voiceStateRef.current === 'sleeping';

    // Reanudar desde sleeping sin reiniciar el micrófono
    if (resumingFromSleep && streamRef.current?.active) {
      reconnectSessionRef.current();
      return;
    }

    wantsVoiceRef.current   = true;
    customPromptRef.current = customSystemPrompt;
    isReconnectingRef.current = false;
    setVoiceStateSync('connecting');
    setCurrentChefText(''); setVoiceError(null);
    currentModelTextRef.current = '';

    // Limpiar recursos de sesión anterior
    if (inputAudioCtxRef.current)  { inputAudioCtxRef.current.close().catch(() => {});   inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current) { outputAudioCtxRef.current.close().catch(() => {}); outputAudioCtxRef.current = null; }
    if (processorRef.current)      { processorRef.current.disconnect();  processorRef.current = null; }
    if (sourceNodeRef.current)     { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current)         { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    stopSilentLoop();

    try {
      // 1. Solicitar micrófono con configuraciones óptimas para reconocimiento de voz
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      // 2. Crear AudioContexts
      const inputCtx = new AudioContext();
      inputAudioCtxRef.current  = inputCtx;
      outputAudioCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      nativeRateRef.current     = inputCtx.sampleRate;

      if (inputCtx.state === 'suspended')                await inputCtx.resume();
      if (outputAudioCtxRef.current.state === 'suspended') await outputAudioCtxRef.current.resume();

      requestWakeLock();
      startSilentLoop(outputAudioCtxRef.current);

      // 3. Conectar al proxy (la clave de API de Gemini permanece en el servidor)
      const session = createProxySession(
        customSystemPrompt ?? CHEF_SYSTEM_PROMPT,
        [],
        () => {
          sessionStartRef.current   = Date.now();
          voiceTailUntilRef.current = 0;
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
      );
      sessionRef.current = session;

      // 4. Pipeline: mic → ScriptProcessor → VAD → proxy
      const source    = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current  = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const raw = e.inputBuffer.getChannelData(0);
        const rms = calcRMS(raw);

        // ── Modo sleeping: detectar energía para despertar ──────────────────
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

        // ── Modo activo: VAD silencio → dormir ──────────────────────────────
        const now = Date.now();
        if (rms > VOICE_RMS_THRESHOLD) {
          lastVoiceTimeRef.current  = now;
          wakeFrameCountRef.current = 0;
          voiceTailUntilRef.current = now + VOICE_TAIL_MS;
        } else if (now - lastVoiceTimeRef.current > SILENCE_TIMEOUT_MS) {
          goToSleep();
          return;
        }

        // ── Límite de sesión: dormir automáticamente a los 20 min ───────────
        if (sessionStartRef.current > 0 && now - sessionStartRef.current > MAX_SESSION_MS) {
          goToSleep();
          return;
        }

        if (!sessionRef.current) return;

        // ── Gate de costo: solo enviar audio cuando hay voz o cola post-voz ──
        // Ahorra ~70% del audio facturado en sesiones con silencios largos.
        if (now > voiceTailUntilRef.current) return;

        const resampled = downsample(new Float32Array(raw), nativeRateRef.current, INPUT_SAMPLE_RATE);
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

  /**
   * Despierta la sesión manualmente desde el estado `sleeping`.
   * Equivalente a hablarle al micrófono pero activado por botón.
   */
  const wakeUp = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') reconnectSessionRef.current();
  }, []);

  /**
   * Envía un mensaje de texto al modelo en la sesión de voz activa.
   * Útil para inyectar contexto programáticamente (ej. cambio de receta).
   *
   * @param text - Texto a enviar como turno de usuario.
   */
  const sendTextToVoice = useCallback((text: string) => {
    if (!sessionRef.current) return;
    try { sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch (e) { console.error('[Proxy] sendText error:', e); }
  }, []);

  return { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp };
}
