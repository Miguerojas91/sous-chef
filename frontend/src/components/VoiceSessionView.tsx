/**
 * Pantalla de voz manos libres, compartida por Cocinemos, Sabores del Mundo y
 * Mealprep. Recibe el estado de `useGeminiLive` y ocupa la pantalla completa
 * (`fixed inset-0`) para que la barra de navegación no quede debajo del pulgar
 * mientras se cocina.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, MessageSquare } from 'lucide-react';
import type { VoiceState, VoiceTranscriptEntry } from '../hooks/useGeminiLive';
import { SILENCE_TIMEOUT_MS } from '../hooks/useGeminiLive';
import { friendlyVoiceError } from '../utils/friendlyError';
import { isPremiumUser } from '../utils/membership';
import { FREE_CAP_SECONDS, PRO_CAP_SECONDS } from '../utils/voiceUsage';
import { ConfirmDialog } from './ui/Dialog';

const SILENCE_LIMIT_S = SILENCE_TIMEOUT_MS / 1000;
// La cuenta atrás solo aparece en los últimos segundos; antes sería ruido.
const COUNTDOWN_FROM_S = 10;

interface VoiceSessionViewProps {
  title: string;
  voiceState: VoiceState;
  transcript: VoiceTranscriptEntry[];
  currentChefText: string;
  voiceError: string | null;
  silenceSeconds: number;
  onRetry: () => void;
  onWakeUp: () => void;
  onTest: () => void;
  /** Vuelve al chat de texto sin borrar la conversación. */
  onExitVoice: () => void;
  /** Termina la sesión completa (borra el historial). Se confirma antes. */
  onEndSession?: () => void;
}

export const VoiceSessionView = ({
  title, voiceState, transcript, currentChefText, voiceError, silenceSeconds,
  onRetry, onWakeUp, onTest, onExitVoice, onEndSession,
}: VoiceSessionViewProps) => {
  const [confirmEnd, setConfirmEnd] = useState(false);

  if (voiceState === 'cap-reached') {
    const premium = isPremiumUser();
    const freeMin = FREE_CAP_SECONDS / 60;
    const premiumMin = PRO_CAP_SECONDS / 60;
    return (
      <div className="fixed inset-0 z-[80] h-dvh bg-neutral-50 flex items-center justify-center p-6 overflow-y-auto">
        <div className="bg-white rounded-card border border-neutral-200 max-w-sm w-full p-6 text-center">
          <Crown className="w-10 h-10 text-brand-700 mx-auto mb-3" aria-hidden />
          <h2 className="text-xl font-extrabold text-neutral-900 mb-2">
            {premium ? `Ya usaste tus ${premiumMin} minutos de este mes` : `Ya usaste tus ${freeMin} minutos de voz gratis`}
          </h2>
          <p className="text-sm text-neutral-600 mb-5 leading-relaxed">
            {premium
              ? 'Los minutos de voz se renuevan el día 1. Mientras tanto puedes seguir por texto, que no tiene límite.'
              : `Puedes seguir por texto, que no tiene límite, o pasarte a Premium para tener ${premiumMin} minutos de voz al mes.`}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onExitVoice}
              className="w-full min-h-11 px-4 rounded-control bg-brand-700 hover:bg-brand-800 text-white font-semibold text-sm transition-colors"
            >
              Seguir por texto
            </button>
            {!premium && (
              <Link
                to="/membresia"
                onClick={onExitVoice}
                className="w-full min-h-11 px-4 rounded-control border border-neutral-300 text-neutral-900 hover:bg-neutral-50 font-semibold text-sm flex items-center justify-center"
              >
                Ver Premium · $9.99 al mes
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  const isConnecting = voiceState === 'connecting';
  const isSpeaking = voiceState === 'speaking';
  const isListening = voiceState === 'listening';
  const isReconnecting = voiceState === 'reconnecting';
  const needsTap = voiceState === 'needs-tap';
  const isSleeping = voiceState === 'sleeping';
  const silenceLeft = Math.max(0, Math.ceil(SILENCE_LIMIT_S - silenceSeconds));
  const showCountdown = isListening && silenceLeft <= COUNTDOWN_FROM_S && silenceLeft > 0;

  const lastChefLine = transcript.length > 0 && transcript[transcript.length - 1].agent === 'chef'
    ? transcript[transcript.length - 1].text
    : '';
  const caption = isSpeaking ? currentChefText : lastChefLine;

  let status = '';
  if (isConnecting) status = 'Conectando con Sous…';
  else if (isListening) status = showCountdown ? `Si no hablas, Sous pasa a reposo en ${silenceLeft} s` : 'Te escucho';
  else if (isSpeaking) status = 'Sous está hablando';
  else if (isReconnecting) status = 'Reconectando…';
  else if (needsTap) status = 'El micrófono se detuvo';
  else if (isSleeping) status = 'Sous está en reposo';

  const ringClass =
    isSpeaking ? 'ring-brand-400' :
    isListening ? 'ring-emerald-400' :
    isReconnecting || isConnecting ? 'ring-amber-400' :
    'ring-neutral-700';

  return (
    <div className="fixed inset-0 z-[80] h-dvh flex flex-col bg-neutral-950 text-white">
      <header className="flex items-center gap-2 min-h-12 px-4 pt-[env(safe-area-inset-top)] border-b border-neutral-800 flex-shrink-0">
        <h1 className="flex-1 min-w-0 truncate text-base font-extrabold">{title}</h1>
        {onEndSession && (
          <button
            type="button"
            onClick={() => setConfirmEnd(true)}
            className="min-h-11 px-3 -mr-2 rounded-control text-sm font-semibold text-neutral-300 hover:bg-neutral-800"
          >
            Terminar sesión
          </button>
        )}
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 py-6">
        <div
          aria-hidden
          className={`w-24 h-24 rounded-full bg-neutral-900 flex items-center justify-center text-5xl ring-4 transition-colors duration-500 ${ringClass} ${
            isSpeaking || isListening ? 'motion-safe:animate-pulse' : ''
          }`}
        >
          {isSleeping ? '😴' : '👨‍🍳'}
        </div>

        {voiceError ? (
          <div role="alert" className="mt-6 px-4 py-3 bg-red-950 border border-red-800 rounded-card max-w-xs text-center">
            <p className="text-red-200 text-sm font-medium">{friendlyVoiceError(voiceError)}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 min-h-11 px-4 rounded-control bg-red-800 hover:bg-red-700 text-white text-sm font-semibold"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : (
          <p
            role="status"
            aria-live="polite"
            className={`mt-6 text-base font-semibold ${showCountdown ? 'text-amber-300' : 'text-neutral-200'}`}
          >
            {status}
          </p>
        )}

        <div className="w-full max-w-sm min-h-[6rem] mt-4 flex flex-col items-center justify-start">
          {caption && (
            <p className={`text-center text-lg leading-relaxed ${isSpeaking ? 'text-white' : 'text-neutral-300'}`}>
              {caption}
            </p>
          )}
          {!caption && isListening && !showCountdown && (
            <p className="text-neutral-400 text-sm text-center">
              Habla cuando necesites algo. Si te quedas en silencio, Sous espera.
            </p>
          )}
          {needsTap && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex flex-col items-center gap-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-card px-8 py-4 transition-colors"
            >
              <span className="text-base font-semibold text-white">Continuar la conversación</span>
              <span className="text-sm text-neutral-300">La pantalla se bloqueó y el micrófono se detuvo.</span>
            </button>
          )}
          {isSleeping && (
            <button
              type="button"
              onClick={onWakeUp}
              className="mt-2 flex flex-col items-center gap-1 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-card px-8 py-4 transition-colors"
            >
              <span className="text-base font-semibold text-white">Despertar a Sous</span>
              <span className="text-sm text-neutral-300">O habla y se despierta solo.</span>
            </button>
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 flex items-center justify-end gap-2 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-neutral-900 border-t border-neutral-800">
        {isListening && (
          <button
            type="button"
            onClick={onTest}
            className="min-h-11 px-4 rounded-full border border-neutral-600 text-sm font-semibold text-neutral-200 hover:bg-neutral-800"
          >
            Probar si me escucha
          </button>
        )}
        <button
          type="button"
          onClick={onExitVoice}
          className="min-h-11 px-4 flex items-center gap-2 rounded-full bg-neutral-800 hover:bg-neutral-700 text-sm font-semibold text-white"
        >
          <MessageSquare size={16} aria-hidden />
          Volver al texto
        </button>
      </footer>

      {confirmEnd && onEndSession && (
        <ConfirmDialog
          tone="dark"
          title="¿Terminar la sesión?"
          description="Se borra toda esta conversación."
          confirmLabel="Terminar"
          destructive
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); onEndSession(); }}
        />
      )}
    </div>
  );
};
