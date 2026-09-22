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
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Settings2, Sparkles, Utensils } from 'lucide-react';
import { useCookingChatSession } from '../hooks/useCookingChatSession';
import { buildCookingSystemPrompt } from '../services/gemini';
import type { CookingIntent } from '../services/gemini';
import { ChatSessionScreen } from './ChatSessionScreen';
import {
  getUserCountry,
  getUserPreferences,
  getUserAllergies,
  getUserDislikes,
  setUserPreferences,
  setUserAllergies,
  setUserDislikes,
} from '../utils/auth';
import { PreferencesEditor } from './PreferencesEditor';
import { summarizePreferences } from '../data/recipeFilters';
import {
  COOKING_CHAT_KEY, clearCookingSession, hasCookingInProgress, loadCookingMeta, saveCookingMeta,
} from '../utils/cookingSessionStore';
import { track, Events } from '../utils/analytics';

type Phase = 'landing' | 'discover-sub' | 'time-picker' | 'chatting';

const TIME_OPTIONS = [
  { label: '15 minutos', value: '15 minutos', emoji: '⚡' },
  { label: '30 minutos', value: '30 minutos', emoji: '🕐' },
  { label: '45 minutos', value: '45 minutos', emoji: '🕑' },
  { label: '1 hora', value: '1 hora', emoji: '🕒' },
  { label: 'Sin prisa', value: 'más de 1 hora (sin prisa)', emoji: '☕' },
];

const INTENT_LABEL: Record<CookingIntent, string> = {
  'discover-known': 'Sé qué quiero cocinar',
  'discover-together': 'Decidiendo juntos',
  'cook-ingredients': 'Con lo que tengo',
};

/** Encabezado de los pasos previos al chat: volver + título. */
const StepHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <header className="flex items-center pl-1 pr-4 min-h-12 border-b border-orange-100 bg-white/60 flex-shrink-0">
    <button
      type="button"
      onClick={onBack}
      aria-label="Volver"
      className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-orange-100 transition-colors mr-1"
    >
      <ArrowLeft className="w-4 h-4 text-orange-600" aria-hidden />
    </button>
    <h1 className="text-sm font-bold text-neutral-700">{title}</h1>
  </header>
);

/** Tarjeta con degradado de las opciones de inicio. */
const GradientOption = ({ gradient, icon, title, desc, onClick, hoverGrow = false }: {
  gradient: string; icon: ReactNode; title: string; desc: string; onClick: () => void; hoverGrow?: boolean;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full max-w-sm bg-gradient-to-br ${gradient} rounded-2xl p-4 text-left active:scale-[0.98] ${
      hoverGrow ? 'shadow-md hover:shadow-xl hover:scale-[1.02] transition-all' : 'shadow-lg transition-transform'
    }`}
  >
    <span className="flex items-center gap-3">
      {icon}
      <span className="min-w-0">
        <span className="block text-sm font-extrabold text-white leading-tight">{title}</span>
        <span className="block text-xs text-white/75 mt-0.5">{desc}</span>
      </span>
    </span>
  </button>
);

const IconSquare = ({ children }: { children: ReactNode }) => (
  <span className="bg-white/20 rounded-xl p-2 flex-shrink-0" aria-hidden>{children}</span>
);

const EmojiIcon = ({ children }: { children: string }) => (
  <span className="text-2xl flex-shrink-0" aria-hidden>{children}</span>
);

const CookingChat: React.FC<{
  intent: CookingIntent;
  timeAvailable: string;
  onReset: () => void;
}> = ({ intent, timeAvailable, onReset }) => {
  const navigate = useNavigate();
  // Las preferencias se leen una vez al montar: si el usuario las edita a mitad
  // de la conversación, aplican a la próxima sesión y no cambian el prompt.
  const [promptOpts] = useState(() => ({
    countryCode: getUserCountry(),
    filterIds: getUserPreferences(),
    allergies: getUserAllergies(),
    dislikes: getUserDislikes(),
  }));

  const session = useCookingChatSession({
    analyticsMode: 'cooking',
    storageKey: COOKING_CHAT_KEY,
    textPrompt: buildCookingSystemPrompt(intent, timeAvailable, 'text', promptOpts),
    voicePrompt: buildCookingSystemPrompt(intent, timeAvailable, 'voice', promptOpts),
  });

  // Primer mensaje automático, solo en una sesión sin historial. La ref evita
  // el segundo envío del doble montaje de StrictMode.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (session.started) return;
    const intentMsg: Record<CookingIntent, string> = {
      'discover-known': `Hola Sous, tengo ${timeAvailable} y ya sé lo que quiero cocinar hoy. Ayúdame a prepararlo.`,
      'discover-together': `Hola Sous, tengo ${timeAvailable} pero no sé qué cocinar. Ayúdame a decidir.`,
      'cook-ingredients': `Hola Sous, tengo ${timeAvailable} y quiero cocinar con lo que tengo en casa. ¿Qué podemos hacer?`,
    };
    session.start(intentMsg[intent]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ChatSessionScreen
      session={session}
      title="Cocinemos"
      subtitle={`${INTENT_LABEL[intent]} · ${timeAvailable}`}
      onBack={() => navigate('/home')}
      backLabel="Salir del chat (se guarda la conversación)"
      endDescription="Se borra toda esta conversación."
      onEnd={onReset}
    />
  );
};

export const CookingSession: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(() => (hasCookingInProgress() ? 'chatting' : 'landing'));
  const [intent, setIntent] = useState<CookingIntent | null>(() => loadCookingMeta()?.intent ?? null);
  const [timeAvailable, setTimeAvailable] = useState<string | null>(() => loadCookingMeta()?.timeAvailable ?? null);

  const [showPrefEditor, setShowPrefEditor] = useState(false);
  const [prefsSummary, setPrefsSummary] = useState(
    () => summarizePreferences(getUserPreferences(), getUserAllergies(), getUserDislikes()),
  );

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
    saveCookingMeta({ intent: i, timeAvailable: time });
    track(Events.CookingStarted, { intent: i, time_available: time });
    setPhase('chatting');
  };

  const handleReset = () => {
    clearCookingSession();
    setIntent(null);
    setTimeAvailable(null);
    pendingIntentRef.current = null;
    setPhase('landing');
  };

  if (phase === 'chatting' && intent && timeAvailable) {
    return <CookingChat intent={intent} timeAvailable={timeAvailable} onReset={handleReset} />;
  }

  if (phase === 'time-picker') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-amber-50">
        <StepHeader
          title="¿Cuánto tiempo tienes?"
          onBack={() => setPhase(pendingIntentRef.current === 'cook-ingredients' ? 'landing' : 'discover-sub')}
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-5 py-5 gap-4">
            <button
              type="button"
              onClick={() => setShowPrefEditor(true)}
              className="w-full max-w-sm flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-orange-200 bg-white/80 hover:bg-white hover:border-orange-300 transition-all text-left"
            >
              <span className="flex-1 min-w-0">
                <span className={`block text-xs font-bold ${prefsSummary.length === 0 ? 'text-neutral-400' : 'text-orange-500'}`}>
                  Tus preferencias
                </span>
                <span className="block text-sm text-neutral-700 truncate">
                  {prefsSummary.length === 0 ? 'Sin configurar. Toca para elegir.' : prefsSummary.join(' · ')}
                </span>
              </span>
              <Settings2 className="w-4 h-4 text-orange-500 flex-shrink-0" aria-hidden />
            </button>

            <div className="text-center mb-1">
              <Clock className="w-7 h-7 text-orange-400 mx-auto mb-2" aria-hidden />
              <p className="text-xs text-neutral-500">Sous arma la receta según el tiempo que tengas.</p>
            </div>

            <ul className="flex flex-col gap-2 w-full max-w-sm">
              {TIME_OPTIONS.map(opt => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => selectTime(opt.value)}
                    className="w-full min-h-12 flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-left active:scale-[0.98]"
                  >
                    <span className="text-xl" aria-hidden>{opt.emoji}</span>
                    <span className="text-sm font-semibold text-neutral-800">{opt.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
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
              setPrefsSummary(summarizePreferences(filterIds, allergies, dislikes));
            }}
          />
        )}
      </div>
    );
  }

  if (phase === 'discover-sub') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-rose-50">
        <StepHeader title="¿Qué quieres comer?" onBack={() => setPhase('landing')} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center justify-center px-5 py-5 gap-3">
            <div className="text-center mb-1">
              <span className="text-3xl" aria-hidden>🍽️</span>
            </div>
            <GradientOption
              hoverGrow
              gradient="from-orange-400 to-red-500"
              icon={<EmojiIcon>💡</EmojiIcon>}
              title="Ya sé qué quiero"
              desc="Tengo algo en mente, ayúdame a prepararlo."
              onClick={() => selectIntent('discover-known')}
            />
            <GradientOption
              hoverGrow
              gradient="from-amber-400 to-orange-500"
              icon={<EmojiIcon>✨</EmojiIcon>}
              title="Decidamos juntos"
              desc="No sé qué cocinar."
              onClick={() => selectIntent('discover-together')}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-evenly gap-6 px-5 py-4 min-h-full">
        <div className="text-center">
          <span className="text-3xl" aria-hidden>👨‍🍳</span>
          <h1 className="text-lg font-extrabold text-neutral-800 mt-1 tracking-tight">¿Qué cocinamos hoy?</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Elige cómo quieres empezar.</p>
        </div>

        <div className="flex flex-col items-center gap-3 w-full max-w-sm">
          <GradientOption
            gradient="from-orange-400 to-rose-500"
            icon={<IconSquare><Sparkles className="w-5 h-5 text-white" /></IconSquare>}
            title="Quiero descubrir qué comer"
            desc="No sé bien qué me provoca."
            onClick={() => setPhase('discover-sub')}
          />
          <GradientOption
            gradient="from-emerald-400 to-teal-500"
            icon={<IconSquare><Utensils className="w-5 h-5 text-white" /></IconSquare>}
            title="Voy a cocinar con lo que tengo"
            desc="Tengo cosas en casa y no quiero salir a comprar."
            onClick={() => selectIntent('cook-ingredients')}
          />
        </div>
      </div>
    </div>
  );
};
