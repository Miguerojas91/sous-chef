/**
 * Sesión de cocina con Sous que alterna texto (SSE) y voz manos libres
 * (WebSocket) sin perder la conversación. La usan Cocinemos, Sabores del Mundo
 * y Mealprep; cada módulo solo arma sus prompts y su primer mensaje.
 *
 * La voz no se expone entera: entrar pasa siempre por `startVoice`, que aplica
 * el tope de minutos y registra analytics.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGeminiChat } from './useGeminiChat';
import { useGeminiLive } from './useGeminiLive';
import type { VoiceHistory } from './useGeminiLive';
import { acquireNoSleepInGesture, useWakeLock } from './useWakeLock';
import { capReachedMessage, getVoiceUsageSummary, hasReachedCap } from '../utils/voiceUsage';
import { isPremiumUser } from '../utils/membership';
import { track, Events } from '../utils/analytics';
import { showToast } from '../utils/events';
import { markActivityToday } from '../utils/streak';

const VOICE_ONBOARDING_KEY = 'sous_voice_onboarding_seen';

/**
 * Turnos del chat escrito que se le entregan a la voz al entrar en manos
 * libres. Son los últimos: si se manda la conversación entera, una sesión
 * larga no cabe y además diluye por dónde iba la receta.
 */
const VOICE_HANDOVER_TURNS = 12;

interface UseCookingChatSessionOptions {
  storageKey: string;
  textPrompt: string;
  voicePrompt: string;
  analyticsMode: 'cooking' | 'milprep' | 'flavors';
  /**
   * Pantalla encendida mientras haya conversación. `false` la deja apagarse
   * (p. ej. con el chat cerrado). Con voz activa siempre se mantiene.
   */
  keepAwake?: boolean;
}

/** Muestra una sola vez la explicación del modo manos libres. */
function showVoiceOnboardingOnce(): void {
  try {
    if (localStorage.getItem(VOICE_ONBOARDING_KEY)) return;
    localStorage.setItem(VOICE_ONBOARDING_KEY, '1');
  } catch {
    return;
  }
  const { minutesLeft } = getVoiceUsageSummary();
  showToast(
    minutesLeft > 0
      ? `Modo manos libres: habla cuando quieras. Te quedan ${minutesLeft} minutos de voz este mes.`
      : 'Modo manos libres: habla cuando quieras.',
  );
}

export function useCookingChatSession({
  storageKey, textPrompt, voicePrompt, analyticsMode, keepAwake = true,
}: UseCookingChatSessionOptions) {
  const { isLoading, messages, sendMessage, startConversation, clearMessages, appendMessages } = useGeminiChat({
    storageKey,
    systemPrompt: textPrompt,
    analyticsMode,
  });
  const voice = useGeminiLive(voicePrompt);
  /** Los mensajes al día sin que `startVoice` se recree con cada uno. */
  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  const [voiceMode, setVoiceMode] = useState(false);
  const started = messages.length > 0;
  // Referencia a NoSleep tomada dentro del gesto de "hablar".
  const releaseNoSleepRef = useRef<(() => void) | null>(null);

  useWakeLock(voiceMode || (keepAwake && started), {
    mediaSessionTitle: voiceMode ? 'Sous está escuchando' : undefined,
  });

  const releaseNoSleep = useCallback(() => {
    releaseNoSleepRef.current?.();
    releaseNoSleepRef.current = null;
  }, []);

  useEffect(() => releaseNoSleep, [releaseNoSleep]);

  useEffect(() => {
    if (voice.voiceState === 'cap-reached') {
      track(Events.VoiceCapReached, {
        is_premium: isPremiumUser(),
        used_min: Math.round(getVoiceUsageSummary().used / 60),
      });
    }
  }, [voice.voiceState]);

  const { disconnect, startListening, sendTextToVoice, wakeUp, resetTranscript } = voice;

  /**
   * Lo hablado por voz pasa a la conversación. Sin esto vive solo en la
   * pantalla de voz: al salir se perdía, y al volver a entrar Sous no sabía
   * nada de lo que se había hablado.
   *
   * Se deja fuera el último turno mientras la voz sigue activa: la
   * transcripción de lo que dice el usuario llega por partes y ese renglón
   * todavía puede cambiar.
   */
  const mergedVoiceRef = useRef(0);
  useEffect(() => {
    const estables = voiceMode ? voice.transcript.slice(0, -1) : voice.transcript;
    const nuevos = estables.slice(mergedVoiceRef.current);
    if (nuevos.length === 0) return;
    mergedVoiceRef.current = estables.length;
    appendMessages(nuevos.map(e => ({ agent: e.agent, text: e.text })));
  }, [voice.transcript, voiceMode, appendMessages]);

  const startVoice = useCallback(async () => {
    const premium = isPremiumUser();
    if (hasReachedCap()) {
      track(Events.VoiceCapBlocked, { is_premium: premium });
      showToast(capReachedMessage(premium).short, 'warning');
      return;
    }
    // Antes de cualquier await: iOS solo arranca el video de NoSleep dentro del
    // gesto. En un reintento se toma la nueva antes de soltar la anterior para
    // no apagarlo entre medio.
    const previous = releaseNoSleepRef.current;
    releaseNoSleepRef.current = acquireNoSleepInGesture();
    previous?.();

    track(Events.VoiceStarted, { is_premium: premium });
    showVoiceOnboardingOnce();
    setVoiceMode(true);

    // La voz hereda lo hablado por escrito: si no, sabe la receta (va en el
    // prompt) pero no en qué paso quedó la cocción.
    const handover: VoiceHistory = messagesRef.current
      .slice(-VOICE_HANDOVER_TURNS * 2)
      .filter(m => m.text.trim())
      .map(m => ({ role: m.agent === 'user' ? 'user' : 'model', parts: [{ text: m.text }] as [{ text: string }] }));

    await startListening(handover);
  }, [startListening]);

  const exitVoice = useCallback(() => {
    disconnect();
    releaseNoSleep();
    setVoiceMode(false);
  }, [disconnect, releaseNoSleep]);

  /** Corta la voz y borra la conversación. El módulo limpia su propio estado. */
  const end = useCallback(() => {
    exitVoice();
    clearMessages();
    // Sin esto, lo hablado seguiría volviendo como contexto en la sesión siguiente.
    resetTranscript();
    mergedVoiceRef.current = 0;
  }, [exitVoice, clearMessages, resetTranscript]);

  const test = useCallback(() => sendTextToVoice('Hola Sous, ¿me escuchas?'), [sendTextToVoice]);

  const voiceView = useMemo(() => ({
    voiceState: voice.voiceState,
    transcript: voice.transcript,
    currentChefText: voice.currentChefText,
    voiceError: voice.voiceError,
    silenceSeconds: voice.silenceSeconds,
    wakeUp,
    test,
  }), [voice.voiceState, voice.transcript, voice.currentChefText, voice.voiceError, voice.silenceSeconds, wakeUp, test]);

  // Escribirle a Sous cuenta para la racha diaria.
  const sendWithActivity: typeof sendMessage = useCallback((...args: Parameters<typeof sendMessage>) => {
    markActivityToday();
    return sendMessage(...args);
  }, [sendMessage]);

  return {
    messages,
    isLoading,
    /** `messages.length > 0`: hay conversación, nueva o restaurada. */
    started,
    send: sendWithActivity,
    /** Empieza una conversación nueva con `firstMessage`, borrando la anterior. */
    start: startConversation,
    end,
    voiceMode,
    startVoice,
    exitVoice,
    voiceView,
  };
}

export type CookingChatSession = ReturnType<typeof useCookingChatSession>;
