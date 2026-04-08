import { useState, useRef, useCallback, useEffect } from 'react';
import NoSleep from 'nosleep.js';
import { API_URL, CHEF_SYSTEM_PROMPT } from '../services/gemini';

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

function pcm16Base64ToFloat32(b64: string): Float32Array {
  const bin   = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pcm = new Int16Array(bytes.buffer);
  const f32 = new Float32Array(pcm.length);
  for (let i = 0; i < pcm.length; i++) f32[i] = pcm[i] / 0x8000;
  return f32;
}

function calcRMS(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

// ── Types ─────────────────────────────────────────────────────────────────────

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

// Interfaz interna de la sesión de proxy (misma forma que antes para no cambiar onaudioprocess)
interface ProxySession {
  sendRealtimeInput(input: { audio?: { data: string; mimeType: string } }): void;
  sendClientContent(params: { turns: Array<{ role: string; parts: Array<{ text: string }> }>; turnComplete: boolean }): void;
  close(): void;
}

// Mensajes que llegan del proxy al navegador
type ProxyMsg =
  | { type: 'open' }
  | { type: 'audio'; data: string }
  | { type: 'modelText'; text: string }
  | { type: 'turnComplete' }
  | { type: 'inputTranscription'; text: string }
  | { type: 'close' }
  | { type: 'error'; message: string };

// ── VAD Constants ─────────────────────────────────────────────────────────────

const VOICE_RMS_THRESHOLD = 0.05;
const SILENCE_TIMEOUT_MS  = 30_000;
const WAKE_RMS_THRESHOLD  = 0.06;
const WAKE_FRAMES_NEEDED  = 6;

// ── Other constants ───────────────────────────────────────────────────────────

const INPUT_SAMPLE_RATE       = 16000;
const OUTPUT_SAMPLE_RATE      = 24000;
const BUFFER_SIZE             = 4096;
const RECONNECT_CONTEXT_TURNS = 8;

// ── URL del proxy WebSocket ───────────────────────────────────────────────────

function getProxyWsUrl(): string {
  if (API_URL) {
    return API_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:') + '/api/live';
  }
  // Dev: Vite proxy en el mismo host
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${location.host}/api/live`;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGeminiLive(customSystemPrompt?: string) {
  const [voiceState, setVoiceState]           = useState<VoiceState>('idle');
  const [transcript, setTranscript]           = useState<VoiceTranscriptEntry[]>([]);
  const [currentChefText, setCurrentChefText] = useState('');
  const [voiceError, setVoiceError]           = useState<string | null>(null);
  const [silenceSeconds, setSilenceSeconds]   = useState(0);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const voiceStateRef       = useRef<VoiceState>('idle');
  const sessionRef          = useRef<ProxySession | null>(null);
  const streamRef           = useRef<MediaStream | null>(null);
  const inputAudioCtxRef    = useRef<AudioContext | null>(null);
  const outputAudioCtxRef   = useRef<AudioContext | null>(null);
  const processorRef        = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef       = useRef<MediaStreamAudioSourceNode | null>(null);
  const silentSourceRef     = useRef<AudioBufferSourceNode | null>(null);
  const playbackQueueRef    = useRef<AudioBufferSourceNode[]>([]);
  const nextPlayTimeRef     = useRef(0);
  const currentModelTextRef = useRef('');
  const isSpeakingRef       = useRef(false);
  const wantsVoiceRef       = useRef(false);
  const customPromptRef     = useRef(customSystemPrompt);
  const noSleepRef          = useRef<InstanceType<typeof NoSleep> | null>(null);
  const wakeLockRef         = useRef<WakeLockSentinel | null>(null);
  const isReconnectingRef   = useRef(false);
  const transcriptRef       = useRef<VoiceTranscriptEntry[]>([]);
  // VAD refs
  const lastVoiceTimeRef    = useRef<number>(Date.now());
  const wakeFrameCountRef   = useRef(0);
  const nativeRateRef       = useRef(44100);
  const silenceIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  // Refs para romper dependencias circulares
  const reconnectSessionRef = useRef<() => void>(() => {});

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
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as unknown as { wakeLock: { request(t: string): Promise<WakeLockSentinel> } }).wakeLock.request('screen');
      } catch { /* fallback */ }
    }
    try {
      if (!noSleepRef.current) noSleepRef.current = new NoSleep();
      await noSleepRef.current.enable();
    } catch { /* no fatal */ }
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
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    noSleepRef.current?.disable();
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = 'none'; } catch { /* ok */ }
    }
  }, []);

  // ── Silent audio loop (iOS) ────────────────────────────────────────────────
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
    if (processorRef.current)   { processorRef.current.disconnect();  processorRef.current = null; }
    if (sourceNodeRef.current)  { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
    if (streamRef.current)      { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    playbackQueueRef.current.forEach(n => { try { n.stop(); } catch { /* ok */ } });
    playbackQueueRef.current = []; nextPlayTimeRef.current = 0;
    if (inputAudioCtxRef.current?.state  !== 'closed') { inputAudioCtxRef.current?.close().catch(() => {});  inputAudioCtxRef.current = null; }
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

  // Ref para que handleProxyMsg sea accesible en closures sin capturar versión vieja
  const handleProxyMsgRef = useRef(handleProxyMsg);
  useEffect(() => { handleProxyMsgRef.current = handleProxyMsg; }, [handleProxyMsg]);

  // ── Contexto FIFO para reconexión ────────────────────────────────────────
  const buildReconnectHistory = useCallback((): Array<{ role: string; parts: [{ text: string }] }> => {
    const recent = transcriptRef.current.slice(-(RECONNECT_CONTEXT_TURNS * 2));
    if (recent.length === 0) return [];
    return recent.map(e => ({ role: e.agent === 'user' ? 'user' : 'model', parts: [{ text: e.text }] as [{ text: string }] }));
  }, []);

  // ── Crear sesión proxy (WebSocket al proxy) ───────────────────────────────
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
      } catch { /* skip */ }
    };

    ws.onclose = () => {
      // Disparar el handler de cierre
      handleProxyMsgRef.current({ type: 'close' });
    };

    ws.onerror = () => {
      // El close handler se dispara automáticamente después
      console.error('[Proxy] WebSocket error');
    };

    // Envolver WebSocket con la misma interfaz que antes para no tocar onaudioprocess
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

  // ── Reconectar WebSocket (mic sigue activo) ───────────────────────────────
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
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
      );
      sessionRef.current = session;
    } catch (err) {
      console.error('[Proxy] reconnect failed:', err);
      isReconnectingRef.current = false;
      if (wantsVoiceRef.current) setTimeout(() => reconnectSessionRef.current(), 2000);
    }
  }, [buildReconnectHistory, createProxySession, setVoiceStateSync, stopSilenceCountdown, startSilenceCountdown]);

  // Mantener el ref actualizado para romper la circularidad
  useEffect(() => { reconnectSessionRef.current = reconnectSession; }, [reconnectSession]);

  // ── Recuperación al volver la pantalla ────────────────────────────────────
  useEffect(() => {
    const onVisibilityChange = async () => {
      if (!wantsVoiceRef.current) return;

      if (document.visibilityState === 'hidden') {
        if ('mediaSession' in navigator) {
          try { navigator.mediaSession.playbackState = 'playing'; } catch { /* ok */ }
        }
        return;
      }

      await inputAudioCtxRef.current?.resume().catch(() => {});
      await outputAudioCtxRef.current?.resume().catch(() => {});
      requestWakeLock();

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

  // ── Iniciar sesión completa (requiere gesto del usuario) ──────────────────
  const startListening = useCallback(async () => {
    if (voiceStateRef.current !== 'idle' && voiceStateRef.current !== 'needs-tap' && voiceStateRef.current !== 'sleeping') return;

    const resumingFromSleep = voiceStateRef.current === 'sleeping';

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

      // Conectar al proxy (sin pasar la clave de IA ni el proveedor al navegador)
      const session = createProxySession(
        customSystemPrompt ?? CHEF_SYSTEM_PROMPT,
        [],
        () => {
          setVoiceStateSync('listening');
          startSilenceCountdown();
        },
      );
      sessionRef.current = session;

      // Pipeline de audio con VAD
      const source    = inputCtx.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      const processor = inputCtx.createScriptProcessor(BUFFER_SIZE, 1, 1);
      processorRef.current  = processor;

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const raw = e.inputBuffer.getChannelData(0);
        const rms = calcRMS(raw);

        // Modo sleeping: solo escuchar energía para despertar
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

        // Modo activo: VAD silencio → dormir
        if (rms > VOICE_RMS_THRESHOLD) {
          lastVoiceTimeRef.current  = Date.now();
          wakeFrameCountRef.current = 0;
        } else if (Date.now() - lastVoiceTimeRef.current > SILENCE_TIMEOUT_MS) {
          goToSleep();
          return;
        }

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
  }, [customSystemPrompt, cleanup, stopSilentLoop, createProxySession, setVoiceStateSync,
      requestWakeLock, startSilentLoop, startSilenceCountdown, goToSleep]);

  const wakeUp = useCallback(() => {
    if (voiceStateRef.current === 'sleeping') reconnectSessionRef.current();
  }, []);

  const sendTextToVoice = useCallback((text: string) => {
    if (!sessionRef.current) return;
    try { sessionRef.current.sendClientContent({ turns: [{ role: 'user', parts: [{ text }] }], turnComplete: true }); }
    catch (e) { console.error('[Proxy] sendText error:', e); }
  }, []);

  return { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp };
}
