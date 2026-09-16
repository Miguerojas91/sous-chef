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
import { useCookingChatSession } from '../hooks/useCookingChatSession';
import { buildCookingSystemPrompt } from '../services/gemini';
import type { CookingIntent } from '../services/gemini';
import { ChatSessionScreen } from './ChatSessionScreen';
import { ScreenHeader } from './ui/ScreenHeader';
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

  // Primer mensaje automático, solo en una sesión sin historial.
  useEffect(() => {
    if (session.messages.length > 0) return;
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
      title="Sous"
      voiceTitle="Cocinemos"
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
                {prefsSummary.length === 0 ? 'Sin configurar. Toca para elegir.' : prefsSummary.join(' · ')}
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
