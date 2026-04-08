import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import NoSleep from 'nosleep.js';
import { CHEF_SYSTEM_PROMPT, VOICE_MODEL } from '../services/gemini';

// ── Audio helpers ─────────────────────────────────────────────────────────────

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

function downsample(buf: Float32Array, from: number, to: number): Float32Array {
  if (from === to) return buf;
  const ratio = from / to;
  const len = Math.round(buf.length / ratio);
  const out = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.floor(i * ratio);
    const e = Math.min(Math.floor((i + 1) * ratio), buf.length);
    let sum = 0;
    for (let j = s; j < e; j++) sum += buf[j];
    out[i] = sum / (e - s);
  }
  return out;
}

function pcm16Base64ToFloat32(b64: string): Float32Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
  return f32;
}

/** RMS (energía media) de un buffer de audio. */
function calcRMS(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * idle        — sin sesión activa
 * connecting  — conectando con Gemini
 * listening   — sesión activa, enviando audio, esperando que el usuario hable
 * speaking    — Gemini está respondiendo con voz
 * sleeping    — VAD detectó 30s de silencio, WebSocket cerrado, mic sigue abierto
 * reconnecting— reconectando WebSocket (tras sleep o pantalla bloqueada)
 * needs-tap   — iOS cerró el micrófono, necesita gesto del usuario
 */
export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'speaking'
  | 'sleeping'
  | 'reconnecting'
  | 'needs-tap';

export interface VoiceTranscriptEntry {
  agent: 'chef' | 'user';
  text: string;
}

interface LiveSession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string }; media?: { data: string; mimeType: string } }): void;
  sendClientContent(params: { turns: Array<{ role: string; parts: Array<{ text: string }> }>; turnComplete: boolean }): void;
  close(): void;
}

type MsgType = {
  serverContent?: {
    modelTurn?: { parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }> };
    turnComplete?: boolean;
    inputTranscription?: { text?: string };
  };
};

// ── VAD Constants ─────────────────────────────────────────────────────────────

/** RMS mínimo para considerar que hay voz humana (no silencio ni ruido de fondo). */
const VOICE_RMS_THRESHOLD  = 0.05;
/** Segundos de silencio antes de dormir. */
const SILENCE_TIMEOUT_MS   = 30_000;
/** RMS mínimo para despertar desde modo sleeping. */
const WAKE_RMS_THRESHOLD   = 0.06;
/** Frames consecutivos con energía de voz para confirmar wake (evita despertar por ruido puntual). */
const WAKE_FRAMES_NEEDED   = 6; // ~550 ms a 4096/44100 ≈ 93 ms/frame

// ── Other constants ───────────────────────────────────────────────────────────

const INPUT_SAMPLE_RATE  = 16000;
const OUTPUT_SAMPLE_RATE = 24000;
const BUFFER_SIZE        = 4096;
/** Últimos N pares usuario+chef del transcript que se inyectan al reconectar (contexto FIFO). */
const RECONNECT_CONTEXT_TURNS = 8;

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGeminiLive(customSystemPrompt?: string) {
  const [voiceState, setVoiceState]       = useState<VoiceState>('idle');
  const [transcript, setTranscript]       = useState<VoiceTranscriptEntry[]>([]);
  const [currentChefText, setCurrentChefText] = useState('');
  const [voiceError, setVoiceError]       = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds] = useState(0); // cuenta atrás visible en UI

  // ── Refs ───────────────────────────────────────────────────────────────────
  const voiceStateRef      = useRef<VoiceState>('idle');
  const sessionRef         = useRef<LiveSession | null>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const inputAudioCtxRef   = useRef<AudioContext | null>(null);
  const outputAudioCtxRef  = useRef<AudioContext | null>(null);
  const processorRef       = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef      = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentSourceRef    = useRef<AudioBufferSourceNode | null>(null);
  const playbackQueueRef   = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef    = useRef(0);
  const currentModelTextRef = useRef('');
  const isSpeakingRef      = useRef(false);
  const wantsVoiceRef      = useRef(false);
  const customPromptRef    = useRef(customSystemPrompt);
  const noSleepRef         = useRef<InstanceType<typeof NoSleep> | null>(null);
  const wakeLockRef        = useRef<WakeLockSentinel | null>(null);
  const isReconnectingRef  = useRef(false);
  const transcriptRef      = useRef<VoiceTranscriptEntry[]>([]); // espejo del state para closures
  // VAD refs
  const lastVoiceTimeRef   = useRef<number>(Date.now());
  const wakeFrameCountRef  = useRef(0);
  const nativeRateRef      = useRef(44100);
  const silenceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Mantener transcriptRef sincronizado
  const updateTranscript = useCallback((updater: (prev: VoiceTranscriptEntry[]) => VoiceTranscriptEntry[]) => {
    setTranscript(prev => {
      const next = updater(prev);
      transcriptRef.current = next;
      return next;
    });
  }, []);

  const setVoiceStateSync = useCallback((s: VoiceState | ((prev: VoiceState) => VoiceState)) => {
    setVoiceState(prev => {
      const next = typeof s === 'function' ? s(prev) : s;
      voiceStateRef.current = next;
      return next;
    });
  }, []);

  // ── Wake Lock + MediaSession ───────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    // 1. Screen Wake Lock API nativa (Chrome Android, Safari 16.4+)
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request(t: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
      } catch { /* sin permisos o no soportado, usar fallback */ }
    }
    // 2. NoSleep.js como fallback (truco de video para iOS Safari antiguo)
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep();
      await noSleepRef.current.enable();
    } catch { /* no fatal */ }
    // 3. MediaSession: le dice al OS que hay audio activo (muestra controles en pantalla bloqueada)
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

  const releaseWakeLock = useCallback(() => {
    // Liberar Screen Wake Lock nativa
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    noSleepRef.current?.disable();
    // Limpiar MediaSession
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'none'; } catch { /* ok */ }
    }
  }, []);

  // ── Silent audio loop (iOS) ────────────────────────────────────────────────
  const startSilentLoop = useCallback((ctx: AudioContext) => {
    if (silentSourceRef.current) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const gain = ctx.createGain(); gain.gain.value = 0.001;
    src.connect(gain); gain.connect(ctx.destination); src.start();
    silentSourceRef.current = src;
  }, []);

  const stopSilentLoop = useCallback(() => {
    try { silentSourceRef.current?.stop(); } catch { /* ok */ }
    silentSourceRef.current = null;
  }, []);

  // ── Silence countdown UI ───────────────────────────────────────────────────
  const startSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) return;
    lastVoiceTimeRef.current = Date.now();
    silenceIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - lastVoiceTimeRef.current) / 1000;
      setSilenceSeconds(Math.floor(elapsed));
    }, 1000);
  }, []);

  const stopSilenceCountdown = useCallback(() => {
    if (silenceIntervalRef.current) { clearInterval(silenceIntervalRef.current); silenceIntervalRef.current = null; }
    setSilenceSeconds(0);
  }, []);

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = useCallback(() => {
    releaseWakeLock();
    stopSilentLoop();
    stopSilenceCountdown();
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    playbackQueueRef.current.forEach(n => { try { n.stop(); } catch { /* ok */ } });
    playbackQueueRef.current = []; nextPlayTimeRef.current = 0;
    if (inputAudioCtxRef.current?.state !== 'closed') { inputAudioCtxRef.current?.close().catch(() => {}); inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current?.state !== 'closed') { outputAudioCtxRef.current?.close().catch(() => {}); outputAudioCtxRef.current = null; }
    if (sessionRef.current) { try { sessionRef.current.close(); } catch { /* ok */ } sessionRef.current = null; }
  }, [releaseWakeLock, stopSilentLoop, stopSilenceCountdown]);

  const disconnect = useCallback(() => {
    wantsVoiceRef.current = false; isReconnectingRef.current = false;
    cleanup();
    setVoiceStateSync('idle'); setCurrentChefText(''); setVoiceError(null);
  }, [cleanup, setVoiceStateSync]);

  // ── VAD: dormir la sesión (cerrar WS, mantener mic) ───────────────────────
  const goToSleep = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') return;
    stopSilenceCountdown();
    wakeFrameCountRef.current = 0;
    if (sessionRef.current) { try { sessionRef.current.close(); } catch { /* ok */ } sessionRef.current = null; }
    isReconnectingRef.current = false;
    setVoiceStateSync('sleeping');
  }, [setVoiceStateSync, stopSilenceCountdown]);

  // ── Audio playback ─────────────────────────────────────────────────────────
  const playAudioChunk = useCallback((b64: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;
    const f32 = pcm16Base64ToFloat32(b64);
    const ab = ctx.createBuffer(1, f32.length, OUTPUT_SAMPLE_RATE);
    ab.getChannelData(0).set(f32);
    const src = ctx.createBufferSource();
    src.buffer = ab; src.connect(ctx.destination);
    const now = ctx.currentTime;
    const t = Math.max(now, nextPlayTimeRef.current);
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

  // ── Callbacks de mensajes (reutilizado en initial + reconnect) ────────────
  const makeMessageHandler = useCallback(() => (message: MsgType) => {
    const sc = message.serverContent; if (!sc) return;
    if (sc.modelTurn?.parts) {
      for (const p of sc.modelTurn.parts) {
        if (p.inlineData?.data) { isSpeakingRef.current = true; setVoiceStateSync('speaking'); playAudioChunk(p.inlineData.data); }
        if (p.text) { currentModelTextRef.current += p.text; setCurrentChefText(currentModelTextRef.current); }
      }
    }
    if (sc.turnComplete) {
      isSpeakingRef.current = false;
      if (currentModelTextRef.current.trim()) updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]);
      currentModelTextRef.current = '';
      if (playbackQueueRef.current.length === 0) { setVoiceStateSync('listening'); setCurrentChefText(''); }
    }
    if (sc.inputTranscription?.text?.trim()) {
      const t = sc.inputTranscription.text;
      updateTranscript(prev => { const last = prev[prev.length - 1]; return last?.agent === 'user' ? [...prev.slice(0, -1), { agent: 'user', text: t }] : [...prev, { agent: 'user', text: t }]; });
    }
  }, [playAudioChunk, setVoiceStateSync, updateTranscript]);

  // ── Contexto FIFO para reconexión (B) ────────────────────────────────────
  // Toma los últimos RECONNECT_CONTEXT_TURNS pares del transcript y los devuelve
  // como turns iniciales para que la IA recuerde en qué punto estaban.
  const buildReconnectHistory = useCallback((): Array<{ role: string; parts: [{ text: string }] }> => {
    const recent = transcriptRef.current.slice(-(RECONNECT_CONTEXT_TURNS * 2));
    if (recent.length === 0) return [];
    return recent.map(e => ({ role: e.agent === 'user' ? 'user' : 'model', parts: [{ text: e.text }] }));
  }, []);

  // ── Reconectar WebSocket (mic sigue activo) ───────────────────────────────
  const reconnectSession = useCallback(() => {
    if (!wantsVoiceRef.current) return;
    if (isReconnectingRef.current) return;
    isReconnectingRef.current = true;
    // Reiniciar VAD al reconectar para no dormir inmediatamente
    lastVoiceTimeRef.current = Date.now();
    wakeFrameCountRef.current = 0;
    setVoiceStateSync('reconnecting');
    stopSilenceCountdown();

    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
    const onMsg = makeMessageHandler();
    const reconnectHistory = buildReconnectHistory();

    ai.live.connect({
      model: VOICE_MODEL,
      config: {
        systemInstruction: customPromptRef.current ?? CHEF_SYSTEM_PROMPT,
        responseModalities: ['AUDIO'],
        inputAudioTranscription: {},
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
      },
      callbacks: {
        onopen: () => {
          isReconnectingRef.current = false;
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
        onmessage: onMsg,
        onerror: (e: ErrorEvent) => { console.error('[Live] error:', e); sessionRef.current = null; isReconnectingRef.current = false; },
        onclose: () => {
          sessionRef.current = null; isSpeakingRef.current = false; isReconnectingRef.current = false;
          if (currentModelTextRef.current.trim()) { updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]); currentModelTextRef.current = ''; }
          setCurrentChefText('');
          if (wantsVoiceRef.current && voiceStateRef.current !== 'sleeping') setTimeout(() => reconnectSession(), 500);
        },
      },
    }).then(s => {
      sessionRef.current = s as unknown as LiveSession;
      // Inyectar contexto FIFO: los últimos turnos del transcript para que la IA
      // recuerde en qué punto está la receta sin necesitar el historial completo.
      if (reconnectHistory.length > 0) {
        try {
          const liveSession = s as unknown as LiveSession;
          // 1. Inyectar el historial de la conversación
          liveSession.sendClientContent({ turns: reconnectHistory, turnComplete: false });
          // 2. Indicarle que es una reconexión y que continúe naturalmente
          liveSession.sendClientContent({
            turns: [{ role: 'user', parts: [{ text: '(reconexión — estamos cocinando, continúa desde donde estábamos sin repetir lo ya dicho)' }] }],
            turnComplete: true,
          });
        } catch { /* no crítico */ }
      }
    }).catch(e => {
      console.error('[Live] reconnect failed:', e);
      isReconnectingRef.current = false;
      if (wantsVoiceRef.current) setTimeout(() => reconnectSession(), 2000);
    });
  }, [makeMessageHandler, buildReconnectHistory, setVoiceStateSync, stopSilenceCountdown, startSilenceCountdown, updateTranscript]);

  // ── Recuperación al volver la pantalla ────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (!wantsVoiceRef.current) return;

      if (document.visibilityState === 'hidden') {
        // Pantalla bloqueada: actualizar MediaSession para que el OS no detenga el audio
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'playing'; } catch { /* ok */ }
        }
        return;
      }

      // Pantalla desbloqueada: reanudar todo
      await inputAudioCtxRef.current?.resume().catch(() => {});
      await outputAudioCtxRef.current?.resume().catch(() => {});
      // Re-adquirir wake lock (la API nativa lo libera automáticamente al bloquear)
      requestWakeLock();
      const micTracks = streamRef.current?.getAudioTracks() ?? [];
      const micAlive = micTracks.length > 0 && micTracks[0].readyState === 'live';
      if (!micAlive) { setVoiceStateSync('needs-tap'); return; }
      if (!sessionRef.current && !isReconnectingRef.current && voiceStateRef.current !== 'sleeping') {
        reconnectSession();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [requestWakeLock, reconnectSession, setVoiceStateSync]);

  useEffect(() => { return () => { cleanup(); }; }, []); // eslint-disable-line

  // ── Iniciar sesión completa (requiere gesto del usuario) ──────────────────
  const startListening = useCallback(async () => {
    if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'needs-tap' && voiceStateRef.current !== 'sleeping') return;

    const resumingFromSleep = voiceStateRef.current === 'sleeping';

    // Si ya tenemos mic vivo (venimos de sleeping), solo reconectar WS
    if (resumingFromSleep && streamRef.current?.active) {
      reconnectSession();
      return;
    }

    wantsVoiceRef.current = true;
    customPromptRef.current = customSystemPrompt;
    isReconnectingRef.current = false;
    setVoiceStateSync('connecting');
    setCurrentChefText(''); setVoiceError(null);
    currentModelTextRef.current = '';

    // Limpiar AudioContexts anteriores (sin borrar transcript)
    if (inputAudioCtxRef.current) { inputAudioCtxRef.current.close().catch(() => {}); inputAudioCtxRef.current = null; }
    if (outputAudioCtxRef.current) { outputAudioCtxRef.current.close().catch(() => {}); outputAudioCtxRef.current = null; }
    if (processorRef.current) { processorRef.current.disconnect(); processorRef.current = null; }
    if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    stopSilentLoop();

    try {
      // PASO 1: micrófono dentro del gesto del usuario
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;

      const inputCtx = new AudioContext();
      inputAudioCtxRef.current = inputCtx;
      outputAudioCtxRef.current = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      nativeRateRef.current = inputCtx.sampleRate;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputAudioCtxRef.current.state === 'suspended') await outputAudioCtxRef.current.resume();

      requestWakeLock();
      startSilentLoop(outputAudioCtxRef.current);

      // PASO 2: conectar Gemini Live
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY as string });
      const onMsg = makeMessageHandler();

      const session = await ai.live.connect({
        model: VOICE_MODEL,
        config: {
          systemInstruction: customSystemPrompt ?? CHEF_SYSTEM_PROMPT,
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
        },
        callbacks: {
          onopen: () => { setVoiceStateSync('listening'); startSilenceCountdown(); },
          onmessage: onMsg,
          onerror: (e: ErrorEvent) => { console.error('[Live] error:', e); sessionRef.current = null; },
          onclose: () => {
            sessionRef.current = null; isSpeakingRef.current = false; isReconnectingRef.current = false;
            if (currentModelTextRef.current.trim()) { updateTranscript(prev => [...prev, { agent: 'chef', text: currentModelTextRef.current.trim() }]); currentModelTextRef.current = ''; }
            setCurrentChefText('');
            if (wantsVoiceRef.current && voiceStateRef.current !== 'sleeping') setTimeout(() => reconnectSession(), 500);
          },
        },
      }) as unknown as LiveSession;
      sessionRef.current = session;

      // PASO 3: pipeline de audio con VAD
      const source = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const raw = e.inputBuffer.getChannelData(0);
        const rms = calcRMS(raw);

        // ── Modo sleeping: solo escuchar energía para despertar ────────────
        if (voiceStateRef.current === 'sleeping') {
          if (rms > WAKE_RMS_THRESHOLD) {
            wakeFrameCountRef.current++;
            if (wakeFrameCountRef.current >= WAKE_FRAMES_NEEDED) {
              wakeFrameCountRef.current = 0;
              reconnectSession(); // voz sostenida detectada → despertar
            }
          } else {
            wakeFrameCountRef.current = 0;
          }
          return; // no enviar audio a Gemini mientras duerme
        }

        // ── Modo activo: VAD silencio → dormir ─────────────────────────────
        if (rms > VOICE_RMS_THRESHOLD) {
          // Voz detectada: reiniciar temporizador
          lastVoiceTimeRef.current = Date.now();
          wakeFrameCountRef.current = 0;
        } else if (Date.now() - lastVoiceTimeRef.current > SILENCE_TIMEOUT_MS) {
          // 30 segundos sin voz → dormir
          goToSleep();
          return;
        }

        // Enviar audio a Gemini (solo si hay sesión activa)
        if (!sessionRef.current) return;
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
  }, [customSystemPrompt, cleanup, stopSilentLoop, makeMessageHandler, setVoiceStateSync,
      requestWakeLock, startSilentLoop, startSilenceCountdown, reconnectSession, goToSleep, updateTranscript]);

  /** Despertar manual (toque en pantalla) */
  const wakeUp = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') reconnectSession();
  }, [reconnectSession]);

  const sendTextToVoice = useCallback((text: string) => {
    if (!sessionRef.current) return;
    try { sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch (e) { console.error('[Live] sendText error:', e); }
  }, []);

  return { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp };
}
