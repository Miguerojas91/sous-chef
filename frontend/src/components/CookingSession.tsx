/**
 * "Cocinemos": sesión de cocina guiada por Sous.
 *
 * Flujo: inicio → (descubrir) → tiempo disponible → chat. El chat tiene dos
 * modos que se alternan sin perder la conversación: texto por SSE
 * (`useGeminiChat`) y voz manos libres por WebSocket (`useGeminiLive`).
 *
 * La sesión (intención, tiempo y mensajes) se guarda en localStorage para
 * sobrevivir a un F5 o a salir y volver a la pantalla.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { buildCookingSystemPrompt } from '../services/gemini';
import type { CookingIntent } from '../services/gemini';
import { QuickReplies } from './QuickReplies';
import { ChatMessage, ChatBubble } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { VoiceSessionView } from './VoiceSessionView';
import { ScreenHeader } from './ui/ScreenHeader';
import { ConfirmDialog } from './ui/Dialog';
import { useWakeLock } from '../hooks/useWakeLock';
import {
  getUserCountry,
  getUserPreferences,
  getUserAllergies,
  getUserDislikes,
  setUserPreferences,
  setUserAllergies,
  setUserDislikes,
} from '../utils/auth';
import { PreferencesEditor, summarizePreferences } from './PreferencesEditor';
import {
  getVoiceUsageSummary, hasReachedCap as voiceCapReached, FREE_CAP_SECONDS, PRO_CAP_SECONDS,
} from '../utils/voiceUsage';
import { isPremiumUser } from '../utils/membership';
import { track, Events } from '../utils/analytics';

const SESSION_META_KEY = 'sous_cooking_meta';
const CHAT_STORAGE_KEY = 'sous_chat_cooking';

interface SessionMeta {
  intent: CookingIntent;
  timeAvailable: string;
}

function loadMeta(): SessionMeta | null {
  try {
    const raw = localStorage.getItem(SESSION_META_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveMeta(meta: SessionMeta) {
  localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
}

function clearSession() {
  localStorage.removeItem(SESSION_META_KEY);
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

function toast(msg: string, type: 'info' | 'warning' = 'info') {
  window.dispatchEvent(new CustomEvent('sous:toast', { detail: { msg, type } }));
}

type Phase = 'landing' | 'discover-sub' | 'time-picker' | 'chatting';

const TIME_OPTIONS = [
  { label: '15 minutos', value: '15 minutos' },
  { label: '30 minutos', value: '30 minutos' },
  { label: '45 minutos', value: '45 minutos' },
  { label: '1 hora', value: '1 hora' },
  { label: 'Sin prisa', value: 'más de 1 hora (sin prisa)' },
];

const INTENT_LABEL: Record<CookingIntent, string> = {
  'discover-known': 'Sé qué quiero cocinar',
  'discover-together': 'Decidiendo juntos',
  'cook-ingredients': 'Con lo que tengo',
};

/** Fila de opción a pantalla completa: la acción principal de cada paso. */
const OptionRow = ({ title, desc, onClick, primary = false }: {
  title: string; desc?: string; onClick: () => void; primary?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full min-h-14 flex items-center gap-3 px-4 py-3 text-left transition-colors ${
      primary ? 'bg-brand-700 hover:bg-brand-800 text-white rounded-card' : 'bg-white hover:bg-neutral-50 text-neutral-900'
    }`}
  >
    <span className="flex-1 min-w-0">
      <span className="block text-base font-bold leading-snug">{title}</span>
      {desc && (
        <span className={`block text-sm mt-0.5 ${primary ? 'text-white' : 'text-neutral-600'}`}>{desc}</span>
      )}
    </span>
    <ChevronRight size={20} aria-hidden className={primary ? 'text-white' : 'text-neutral-500'} />
  </button>
);

const CookingChat: React.FC<{
  intent: CookingIntent;
  timeAvailable: string;
  onReset: () => void;
}> = ({ intent, timeAvailable, onReset }) => {
  const navigate = useNavigate();
  // Las preferencias se leen una vez al montar: si el usuario las edita a mitad
  // de la conversación, aplican a la próxima sesión y no cambian el prompt.
  const promptOpts = useRef({
    countryCode: getUserCountry(),
    filterIds: getUserPreferences(),
    allergies: getUserAllergies(),
    dislikes: getUserDislikes(),
  }).current;
  const textPrompt = buildCookingSystemPrompt(intent, timeAvailable, 'text', promptOpts);
  const voicePrompt = buildCookingSystemPrompt(intent, timeAvailable, 'voice', promptOpts);

  const { isLoading, messages, sendMessage, clearMessages } = useGeminiChat({
    mode: 'cooking',
    storageKey: CHAT_STORAGE_KEY,
    systemPrompt: textPrompt,
  });
  const voice = useGeminiLive(voicePrompt);

  const [voiceMode, setVoiceMode] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useWakeLock(true);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (voice.voiceState === 'cap-reached') {
      track(Events.VoiceCapReached, {
        is_premium: isPremiumUser(),
        used_min: Math.round(getVoiceUsageSummary().used / 60),
      });
    }
  }, [voice.voiceState]);

  // Primer mensaje automático, solo en una sesión sin historial.
  useEffect(() => {
    if (messages.length > 0) return;
    const intentMsg: Record<CookingIntent, string> = {
      'discover-known': `Hola Sous, tengo ${timeAvailable} y ya sé lo que quiero cocinar hoy. Ayúdame a prepararlo.`,
      'discover-together': `Hola Sous, tengo ${timeAvailable} pero no sé qué cocinar. Ayúdame a decidir.`,
      'cook-ingredients': `Hola Sous, tengo ${timeAvailable} y quiero cocinar con lo que tengo en casa. ¿Qué podemos hacer?`,
    };
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) sendMessage(intentMsg[intent]);
    }, 50);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    voice.disconnect();
    clearMessages();
    onReset();
  };

  const handleStartVoice = async () => {
    const premium = isPremiumUser();
    if (voiceCapReached()) {
      track(Events.VoiceCapBlocked, { is_premium: premium });
      toast(
        premium
          ? `Ya usaste tus ${PRO_CAP_SECONDS / 60} minutos de voz de este mes. Se renuevan el día 1.`
          : `Ya usaste tus ${FREE_CAP_SECONDS / 60} minutos de voz gratis. Con Premium tienes ${PRO_CAP_SECONDS / 60} al mes.`,
        'warning',
      );
      return;
    }
    track(Events.VoiceStarted, { is_premium: premium });
    if (!localStorage.getItem('sous_voice_onboarding_seen')) {
      localStorage.setItem('sous_voice_onboarding_seen', '1');
      const { minutesLeft } = getVoiceUsageSummary();
      toast(
        minutesLeft > 0
          ? `Modo manos libres: habla cuando quieras. Te quedan ${minutesLeft} minutos de voz este mes.`
          : 'Modo manos libres: habla cuando quieras.',
      );
    }
    setVoiceMode(true);
    await voice.startListening();
  };

  const handleExitVoice = () => {
    voice.disconnect();
    setVoiceMode(false);
  };

  if (voiceMode) {
    return (
      <VoiceSessionView
        title="Cocinemos"
        voiceState={voice.voiceState}
        transcript={voice.transcript}
        currentChefText={voice.currentChefText}
        voiceError={voice.voiceError}
        silenceSeconds={voice.silenceSeconds}
        onRetry={handleStartVoice}
        onWakeUp={voice.wakeUp}
        onTest={() => voice.sendTextToVoice('Hola Sous, ¿me escuchas?')}
        onExitVoice={handleExitVoice}
        onEndSession={handleReset}
      />
    );
  }

  // En móvil el chat ocupa toda la pantalla: sin encabezado ni barra de la app
  // queda altura para leer la receta con el teclado abierto.
  return (
    <div className="fixed inset-0 z-[60] h-dvh md:static md:z-auto md:h-full flex flex-col bg-neutral-50">
      <ScreenHeader
        title="Sous"
        subtitle={`${INTENT_LABEL[intent]} · ${timeAvailable}`}
        onBack={() => navigate('/home')}
        backLabel="Salir del chat (se guarda la conversación)"
        className="pt-[env(safe-area-inset-top)]"
        actions={
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="min-h-11 px-3 rounded-control text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Terminar
          </button>
        }
      />

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversación con Sous"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 space-y-3"
      >
        {messages.length === 0 && !isLoading && (
          <p className="text-center mt-10 px-4 text-sm text-neutral-600">
            Escríbele a Sous o toca el micrófono para hablar con las manos libres.
          </p>
        )}
        {messages.map((msg, idx) => (
          <ChatBubble key={idx} isChef={msg.agent === 'chef'}>
            <ChatMessage text={msg.text} isChef={msg.agent === 'chef'} />
          </ChatBubble>
        ))}
        <div ref={bottomRef} />
      </div>

      <QuickReplies onSend={sendMessage} loading={isLoading} />
      <ChatInputBar onSend={sendMessage} isLoading={isLoading} onStartVoice={handleStartVoice} />

      {confirmEnd && (
        <ConfirmDialog
          title="¿Terminar la sesión?"
          description="Se borra toda esta conversación."
          confirmLabel="Terminar"
          destructive
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); handleReset(); }}
        />
      )}
    </div>
  );
};

export const CookingSession: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(() => {
    const meta = loadMeta();
    const hasMessages = !!localStorage.getItem(CHAT_STORAGE_KEY);
    return (meta && hasMessages) ? 'chatting' : 'landing';
  });
  const [intent, setIntent] = useState<CookingIntent | null>(() => loadMeta()?.intent ?? null);
  const [timeAvailable, setTimeAvailable] = useState<string | null>(() => loadMeta()?.timeAvailable ?? null);

  const [showPrefEditor, setShowPrefEditor] = useState(false);
  // Se incrementa al guardar preferencias para volver a leer el resumen.
  const [prefsVersion, setPrefsVersion] = useState(0);

  // La intención elegida mientras el usuario escoge el tiempo. No se persiste.
  const pendingIntentRef = useRef<CookingIntent | null>(null);

  const selectIntent = (i: CookingIntent) => {
    pendingIntentRef.current = i;
    track(Events.CookingIntentPicked, { intent: i });
    setPhase('time-picker');
  };

  const selectTime = (time: string) => {
    // Tras un F5 en el selector de tiempo la intención se pierde: volver al inicio.
    const i = pendingIntentRef.current;
    if (!i) {
      setPhase('landing');
      return;
    }
    setIntent(i);
    setTimeAvailable(time);
    saveMeta({ intent: i, timeAvailable: time });
    track(Events.CookingStarted, { intent: i, time_available: time });
    setPhase('chatting');
  };

  const handleReset = () => {
    clearSession();
    setIntent(null);
    setTimeAvailable(null);
    pendingIntentRef.current = null;
    setPhase('landing');
  };

  if (phase === 'chatting' && intent && timeAvailable) {
    return <CookingChat intent={intent} timeAvailable={timeAvailable} onReset={handleReset} />;
  }

  if (phase === 'time-picker') {
    void prefsVersion;
    const summary = summarizePreferences(getUserPreferences(), getUserAllergies(), getUserDislikes());

    return (
      <div className="flex flex-col h-full bg-neutral-50">
        <ScreenHeader
          title="¿Cuánto tiempo tienes?"
          onBack={() => setPhase(pendingIntentRef.current === 'cook-ingredients' ? 'landing' : 'discover-sub')}
        />

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-5 max-w-md w-full mx-auto">
          <p className="text-sm text-neutral-600">Sous arma la receta según el tiempo que tengas.</p>

          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            {TIME_OPTIONS.map(opt => (
              <li key={opt.value}>
                <OptionRow title={opt.label} onClick={() => selectTime(opt.value)} />
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setShowPrefEditor(true)}
            className="w-full min-h-14 flex items-center gap-3 px-4 py-3 rounded-card border border-neutral-200 bg-white hover:bg-neutral-50 text-left"
          >
            <SlidersHorizontal className="w-5 h-5 text-neutral-600 flex-shrink-0" aria-hidden />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-neutral-900">Tus preferencias</span>
              <span className="block text-sm text-neutral-600 truncate">
                {summary.length === 0 ? 'Sin configurar. Toca para elegir.' : summary.join(' · ')}
              </span>
            </span>
            <ChevronRight size={20} className="text-neutral-500" aria-hidden />
          </button>
        </div>

        {showPrefEditor && (
          <PreferencesEditor
            mode="modal"
            initialFilterIds={getUserPreferences()}
            initialAllergies={getUserAllergies()}
            initialDislikes={getUserDislikes()}
            onClose={() => setShowPrefEditor(false)}
            onSave={({ filterIds, allergies, dislikes }) => {
              setUserPreferences(filterIds);
              setUserAllergies(allergies);
              setUserDislikes(dislikes);
              setShowPrefEditor(false);
              setPrefsVersion(v => v + 1);
            }}
          />
        )}
      </div>
    );
  }

  if (phase === 'discover-sub') {
    return (
      <div className="flex flex-col h-full bg-neutral-50">
        <ScreenHeader title="¿Qué quieres comer?" onBack={() => setPhase('landing')} />
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 max-w-md w-full mx-auto">
          <ul className="bg-white rounded-card border border-neutral-200 divide-y divide-neutral-100 overflow-hidden">
            <li>
              <OptionRow
                title="Ya sé qué quiero"
                desc="Tengo algo en mente, ayúdame a prepararlo."
                onClick={() => selectIntent('discover-known')}
              />
            </li>
            <li>
              <OptionRow
                title="Decidamos juntos"
                desc="No sé qué cocinar."
                onClick={() => selectIntent('discover-together')}
              />
            </li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-y-auto">
      <div className="px-4 pt-8 pb-6 max-w-md w-full mx-auto">
        <h1 className="text-2xl font-extrabold text-neutral-900">¿Qué cocinamos hoy?</h1>
        <p className="text-sm text-neutral-600 mt-1">Elige cómo quieres empezar.</p>

        <div className="mt-6 space-y-3">
          <OptionRow
            primary
            title="Quiero descubrir qué comer"
            desc="No sé bien qué me provoca."
            onClick={() => setPhase('discover-sub')}
          />
          <div className="rounded-card border border-neutral-200 overflow-hidden">
            <OptionRow
              title="Voy a cocinar con lo que tengo"
              desc="Tengo cosas en casa y no quiero salir a comprar."
              onClick={() => selectIntent('cook-ingredients')}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
