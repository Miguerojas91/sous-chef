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
import { ArrowLeft, ChefHat, ChevronRight, Clock, Settings2, ShoppingBasket, Sparkles, Target } from 'lucide-react';
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

/** Encabezado de los pasos previos al chat: volver + título. */
const StepHeader = ({ title, onBack }: { title: string; onBack: () => void }) => (
  <header className="flex items-center gap-2 px-4 min-h-16 flex-shrink-0">
    <button
      type="button"
      onClick={onBack}
      aria-label="Volver"
      className="w-11 h-11 flex items-center justify-center rounded-[14px] bg-white border-2 border-neutral-200 hover:bg-neutral-100 transition-colors"
    >
      <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2.4} aria-hidden />
    </button>
    <h1 className="text-xl font-extrabold text-ink">{title}</h1>
  </header>
);

/** Tarjeta táctil de las opciones de inicio. */
const OptionCard = ({ tone, icon, title, desc, onClick }: {
  tone: string; icon: ReactNode; title: string; desc: string; onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="card-tactile w-full max-w-md p-4 text-left flex items-center gap-3.5 hover:border-neutral-300 active:translate-y-[2px] transition-transform"
  >
    <span className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center flex-shrink-0 ${tone}`} aria-hidden>{icon}</span>
    <span className="flex-1 min-w-0">
      <span className="block text-lg font-black text-ink leading-tight">{title}</span>
      <span className="block text-sm font-bold text-neutral-500 mt-0.5 leading-snug">{desc}</span>
    </span>
    <ChevronRight className="w-6 h-6 text-neutral-500 flex-shrink-0" strokeWidth={2.6} aria-hidden />
  </button>
);

/** Sous "hablando": avatar y globo con el título de la pantalla. */
const SousPrompt = ({ title, sub }: { title: string; sub: string }) => (
  <div className="flex items-end gap-3 w-full max-w-md">
    <span className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_theme(colors.orange.800)]" aria-hidden>
      <ChefHat className="w-8 h-8 text-white" strokeWidth={2.3} />
    </span>
    <div className="card-tactile rounded-[20px_20px_20px_6px] px-4 py-3.5 flex-1">
      <h1 className="text-2xl font-extrabold text-ink leading-tight">{title}</h1>
      <p className="text-[15px] font-bold text-neutral-500 mt-1">{sub}</p>
    </div>
  </div>
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
      <div className="flex flex-col h-full bg-neutral-50">
        <StepHeader
          title="¿Cuánto tiempo tienes?"
          onBack={() => setPhase(pendingIntentRef.current === 'cook-ingredients' ? 'landing' : 'discover-sub')}
        />

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center px-4 py-4 gap-4">
            <button
              type="button"
              onClick={() => setShowPrefEditor(true)}
              className="card-tactile w-full max-w-md flex items-center justify-between gap-3 px-4 py-3.5 hover:border-neutral-300 transition-colors text-left"
            >
              <span className="flex-1 min-w-0">
                <span className={`block text-sm font-black ${prefsSummary.length === 0 ? 'text-ink' : 'text-orange-600'}`}>
                  Tus preferencias
                </span>
                <span className="block text-sm font-bold text-neutral-500 truncate">
                  {prefsSummary.length === 0 ? 'Sin configurar. Toca para elegir.' : prefsSummary.join(' · ')}
                </span>
              </span>
              <Settings2 className="w-5 h-5 text-orange-600 flex-shrink-0" aria-hidden />
            </button>

            <p className="w-full max-w-md text-[15px] font-bold text-neutral-500">Sous arma la receta según el tiempo que tengas.</p>

            <ul className="grid grid-cols-2 gap-3 w-full max-w-md">
              {TIME_OPTIONS.map(opt => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => selectTime(opt.value)}
                    className="card-tactile w-full min-h-[64px] flex items-center gap-2.5 px-4 py-3 hover:border-orange-300 hover:bg-orange-50 transition-colors text-left active:translate-y-[2px]"
                  >
                    <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" strokeWidth={2.4} aria-hidden />
                    <span className="text-base font-black text-ink">{opt.label}</span>
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
      <div className="flex flex-col h-full bg-neutral-50">
        <StepHeader title="¿Qué quieres comer?" onBack={() => setPhase('landing')} />
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="min-h-full flex flex-col items-center px-4 py-4 gap-3">
            <OptionCard
              tone="bg-orange-100 text-orange-600"
              icon={<Target className="w-7 h-7" strokeWidth={2.3} />}
              title="Ya sé qué quiero"
              desc="Tengo algo en mente, ayúdame a prepararlo."
              onClick={() => selectIntent('discover-known')}
            />
            <OptionCard
              tone="bg-amber-100 text-amber-600"
              icon={<Sparkles className="w-7 h-7" strokeWidth={2.3} />}
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
    <div className="flex flex-col h-full bg-neutral-50 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center gap-6 px-4 pt-2 pb-6 md:pt-6">
        <SousPrompt title="¿Qué cocinamos hoy?" sub="Elige cómo quieres empezar." />

        <div className="flex flex-col items-center gap-3 w-full max-w-md">
          <OptionCard
            tone="bg-orange-100 text-orange-600"
            icon={<Sparkles className="w-7 h-7" strokeWidth={2.3} />}
            title="Quiero descubrir qué comer"
            desc="No sé bien qué me provoca."
            onClick={() => setPhase('discover-sub')}
          />
          <OptionCard
            tone="bg-emerald-100 text-emerald-600"
            icon={<ShoppingBasket className="w-7 h-7" strokeWidth={2.3} />}
            title="Voy a cocinar con lo que tengo"
            desc="Tengo cosas en casa y no quiero salir a comprar."
            onClick={() => selectIntent('cook-ingredients')}
          />
        </div>
      </div>
    </div>
  );
};
