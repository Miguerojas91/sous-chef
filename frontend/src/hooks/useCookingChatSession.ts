/**
 * Sesión de cocina con Sous que alterna texto (SSE) y voz manos libres
 * (WebSocket) sin perder la conversación. La usan Cocinemos, Sabores del Mundo
 * y Mealprep; cada módulo solo arma sus prompts y su primer mensaje.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeminiChat } from './useGeminiChat';
import { useGeminiLive } from './useGeminiLive';
import { useWakeLock } from './useWakeLock';
import { capReachedMessage, getVoiceUsageSummary, hasReachedCap } from '../utils/voiceUsage';
import { isPremiumUser } from '../utils/membership';
import { track, Events } from '../utils/analytics';
import { showToast } from '../utils/events';

const VOICE_ONBOARDING_KEY = 'sous_voice_onboarding_seen';

interface UseCookingChatSessionOptions {
  storageKey: string;
  textPrompt: string;
  voicePrompt: string;
  analyticsMode: 'cooking' | 'milprep' | 'flavors';
  /** Pantalla encendida. Con voz activa siempre se mantiene. */
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
  const { isLoading, messages, sendMessage, clearMessages } = useGeminiChat({
    storageKey,
    systemPrompt: textPrompt,
    analyticsMode,
  });
  const voice = useGeminiLive(voicePrompt);
  const [voiceMode, setVoiceMode] = useState(false);
  // Primer mensaje en espera: se envía después del commit, cuando useGeminiChat
  // ya copió el prompt nuevo a su ref (su efecto corre antes que este) y
  // `sendMessage` ya ve la conversación vacía.
  const pendingFirstRef = useRef<string | null>(null);
  const [startCount, setStartCount] = useState(0);

  useWakeLock(keepAwake || voiceMode);

  useEffect(() => {
    const first = pendingFirstRef.current;
    if (first === null) return;
    pendingFirstRef.current = null;
    sendMessage(first);
  }, [startCount, sendMessage]);

  useEffect(() => {
    if (voice.voiceState === 'cap-reached') {
      track(Events.VoiceCapReached, {
        is_premium: isPremiumUser(),
        used_min: Math.round(getVoiceUsageSummary().used / 60),
      });
    }
  }, [voice.voiceState]);

  /** Empieza una conversación nueva con `firstMessage`. */
  const start = useCallback((firstMessage: string) => {
    clearMessages();
    pendingFirstRef.current = firstMessage;
    setStartCount(c => c + 1);
  }, [clearMessages]);

  const { disconnect, startListening } = voice;

  const startVoice = useCallback(async () => {
    const premium = isPremiumUser();
    if (hasReachedCap()) {
      track(Events.VoiceCapBlocked, { is_premium: premium });
      showToast(capReachedMessage(premium).short, 'warning');
      return;
    }
    track(Events.VoiceStarted, { is_premium: premium });
    showVoiceOnboardingOnce();
    setVoiceMode(true);
    await startListening();
  }, [startListening]);

  const exitVoice = useCallback(() => {
    disconnect();
    setVoiceMode(false);
  }, [disconnect]);

  /** Corta la voz y borra la conversación. El módulo limpia su propio estado. */
  const end = useCallback(() => {
    disconnect();
    setVoiceMode(false);
    pendingFirstRef.current = null;
    clearMessages();
  }, [disconnect, clearMessages]);

  return {
    messages,
    isLoading,
    send: sendMessage,
    start,
    end,
    voiceMode,
    startVoice,
    exitVoice,
    voice,
  };
}

export type CookingChatSession = ReturnType<typeof useCookingChatSession>;
