/**
 * Pantalla de voz manos libres, compartida por Cocinemos, Sabores del Mundo y
 * Mealprep. Recibe el estado de `useGeminiLive` y ocupa la pantalla completa
 * (`fixed inset-0`) para que la barra de navegación no quede debajo del pulgar
 * mientras se cocina. Se comporta como capa modal: foco dentro y Escape vuelve
 * al texto.
 */
import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Crown, MessageSquare } from 'lucide-react';
import type { VoiceState, VoiceTranscriptEntry } from '../hooks/useGeminiLive';
import { SILENCE_TIMEOUT_MS } from '../hooks/useGeminiLive';
import { useModal } from '../hooks/useModal';
import { friendlyVoiceError } from '../utils/friendlyError';
import { isPremiumUser } from '../utils/membership';
import { capReachedMessage } from '../utils/voiceUsage';

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
  /** Pide terminar la sesión; quien la muestra se encarga de confirmar. */
  onRequestEnd?: () => void;
}

export const VoiceSessionView = (props: VoiceSessionViewProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // El panel es el mismo en todos los estados para que useModal no quede
  // apuntando a un nodo desmontado.
  useModal(panelRef, { onEscape: props.onExitVoice, initialFocusRef: panelRef });
  const capReached = props.voiceState === 'cap-reached';

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`fixed inset-0 z-[80] h-dvh outline-none ${
        capReached
          ? 'bg-neutral-50 flex items-center justify-center p-6 overflow-y-auto'
          : 'flex flex-col bg-neutral-950 text-white'
      }`}
    >
      {capReached
        ? <CapReachedCard titleId={titleId} onExitVoice={props.onExitVoice} />
        : <VoiceSession {...props} titleId={titleId} />}
    </div>
  );
};

const CapReachedCard = ({ titleId, onExitVoice }: { titleId: string; onExitVoice: () => void }) => {
  const premium = isPremiumUser();
  const copy = capReachedMessage(premium);
  return (
    <div className="bg-white rounded-card border border-neutral-200 max-w-sm w-full p-6 text-center">
      <Crown className="w-10 h-10 text-brand-700 mx-auto mb-3" aria-hidden />
      <h2 id={titleId} className="text-xl font-extrabold text-neutral-900 mb-2">{copy.title}</h2>
      <p className="text-sm text-neutral-600 mb-5 leading-relaxed">{copy.detail}</p>
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
  );
};

const VoiceSession = ({
  title, titleId, voiceState, transcript, currentChefText, voiceError, silenceSeconds,
  onRetry, onWakeUp, onTest, onExitVoice, onRequestEnd,
}: VoiceSessionViewProps & { titleId: string }) => {
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
    <>
      <header className="flex items-center gap-2 min-h-12 px-4 pt-[env(safe-area-inset-top)] border-b border-neutral-800 flex-shrink-0">
        <h1 id={titleId} className="flex-1 min-w-0 truncate text-base font-extrabold">{title}</h1>
        {onRequestEnd && (
          <button
            type="button"
            onClick={onRequestEnd}
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
    </>
  );
};
