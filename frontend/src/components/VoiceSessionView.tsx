/**
 * Pantalla de voz manos libres, compartida por Cocinemos, Sabores del Mundo y
 * Mealprep. Recibe el estado de `useGeminiLive` y ocupa la pantalla completa
 * (`fixed inset-0`) para que la barra de navegación no quede debajo del pulgar
 * mientras se cocina. Se comporta como capa modal: foco dentro y Escape vuelve
 * al texto.
 */
import { useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Crown, X } from 'lucide-react';
import type { VoiceState, VoiceTranscriptEntry } from '../hooks/useGeminiLive';
import { SILENCE_TIMEOUT_MS } from '../hooks/useGeminiLive';
import { useModal } from '../hooks/useModal';
import { friendlyVoiceError } from '../utils/friendlyError';
import { isPremiumUser } from '../utils/membership';
import { capReachedMessage } from '../utils/voiceUsage';

const SILENCE_LIMIT_S = SILENCE_TIMEOUT_MS / 1000;
// La cuenta atrás solo aparece en los últimos segundos; antes sería ruido.
const COUNTDOWN_FROM_S = 10;
// Alturas de las barras decorativas del indicador de audio.
const BAR_HEIGHTS = [2, 4, 7, 5, 8, 4, 3, 6, 4, 2];

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
          ? 'bg-amber-50 flex items-center justify-center p-6 overflow-y-auto'
          : 'flex flex-col bg-neutral-950 text-white overflow-hidden'
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
    <div className="bg-white rounded-3xl shadow-xl border border-orange-100 max-w-sm w-full p-6 text-center">
      <div className="bg-amber-400 w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center">
        <Crown className="w-8 h-8 text-white" aria-hidden />
      </div>
      <h2 id={titleId} className="text-xl font-black text-neutral-900 mb-2">{copy.title}</h2>
      <p className="text-sm text-neutral-600 mb-5 leading-snug">{copy.detail}</p>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onExitVoice}
          className="w-full min-h-11 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm transition-colors"
        >
          Seguir por texto
        </button>
        {!premium && (
          <Link
            to="/membresia"
            onClick={onExitVoice}
            className="w-full min-h-11 py-3 px-4 rounded-xl bg-amber-400 hover:from-amber-500 hover:to-orange-600 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Crown size={16} aria-hidden /> Ver Premium · $9.99 al mes
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
  const barsActive = isSpeaking || isListening || isReconnecting;

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

  const statusClass =
    isSpeaking ? 'text-orange-400' :
    isListening ? (showCountdown ? 'text-neutral-500' : 'text-green-400') :
    isReconnecting ? 'text-yellow-400 motion-safe:animate-pulse' :
    needsTap ? 'text-blue-400 motion-safe:animate-pulse' :
    isSleeping ? 'text-neutral-600' :
    isConnecting ? 'text-yellow-400 motion-safe:animate-pulse' : 'text-neutral-500';

  const avatarClass =
    isSpeaking ? 'bg-orange-500/20 ring-2 ring-orange-500/50' :
    isListening ? 'bg-green-500/10 ring-2 ring-green-500/30' :
    isReconnecting ? 'bg-yellow-500/10 ring-2 ring-yellow-500/30' :
    needsTap ? 'bg-blue-500/10 ring-2 ring-blue-500/30' :
    isSleeping ? 'bg-neutral-800/50 ring-2 ring-neutral-700/30' :
    'bg-neutral-800';

  const barClass =
    isSpeaking ? 'bg-orange-400' :
    isListening ? 'bg-green-500' :
    isReconnecting ? 'bg-yellow-500' :
    isSleeping ? 'bg-neutral-800' : 'bg-neutral-700';

  return (
    <>
      <h1 id={titleId} className="sr-only">{title}: conversación por voz</h1>

      {onRequestEnd && (
        <button
          type="button"
          onClick={onRequestEnd}
          className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 z-20 min-h-11 px-3 flex items-center bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg backdrop-blur-sm transition-all active:scale-95"
        >
          Terminar sesión
        </button>
      )}

      <main className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center px-6 pt-[calc(4.5rem+env(safe-area-inset-top))] pb-6">
        <div className="relative mb-6" aria-hidden>
          {isSpeaking && (
            <>
              <span className="absolute inset-[-16px] rounded-full border-2 border-orange-500/30 motion-safe:animate-ping" />
              <span className="absolute inset-[-8px] rounded-full border-2 border-orange-500/50 motion-safe:animate-pulse" />
            </>
          )}
          {isListening && (
            <span className="absolute inset-[-8px] rounded-full border-2 border-green-500/40 motion-safe:animate-pulse" />
          )}
          {isReconnecting && (
            <span className="absolute inset-[-8px] rounded-full border-2 border-yellow-500/40 motion-safe:animate-ping" />
          )}
          {showCountdown && (
            <span className="absolute inset-[-12px] rounded-full border-2 border-neutral-600/60 motion-safe:animate-pulse" />
          )}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-colors duration-500 ${avatarClass}`}>
            {isSleeping ? '😴' : '👨‍🍳'}
          </div>
        </div>

        {voiceError ? (
          <div role="alert" className="mb-3 px-4 py-2.5 bg-red-500/20 border border-red-500/40 rounded-2xl max-w-xs text-center">
            <p className="text-red-300 text-sm font-medium">{friendlyVoiceError(voiceError)}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-1 min-h-11 px-3 text-xs text-red-400 underline hover:text-red-300"
            >
              Intentar de nuevo
            </button>
          </div>
        ) : (
          <p
            role="status"
            aria-live="polite"
            className={`text-xs font-bold uppercase tracking-widest mb-1 text-center transition-colors duration-300 ${statusClass}`}
          >
            {status}
          </p>
        )}

        <div className="w-full max-w-sm min-h-[80px] flex flex-col items-center justify-center">
          {caption && (
            <p className={`text-center text-base leading-relaxed transition-all duration-300 ${isSpeaking ? 'text-white' : 'text-neutral-400'}`}>
              {caption}
            </p>
          )}
          {!caption && isListening && !showCountdown && (
            <p className="text-neutral-600 text-sm text-center">
              Habla cuando necesites algo. Si te quedas en silencio, Sous espera.
            </p>
          )}
          {needsTap && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-2xl px-8 py-4 transition-colors"
            >
              <span className="text-3xl" aria-hidden>🎙️</span>
              <span className="text-blue-300 text-sm font-semibold">Continuar la conversación</span>
              <span className="text-blue-400/70 text-xs">La pantalla se bloqueó y el micrófono se detuvo.</span>
            </button>
          )}
          {isSleeping && (
            <button
              type="button"
              onClick={onWakeUp}
              className="mt-2 flex flex-col items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl px-8 py-4 transition-colors"
            >
              <span className="text-3xl" aria-hidden>👆</span>
              <span className="text-neutral-300 text-sm font-semibold">Despertar a Sous</span>
              <span className="text-neutral-500 text-xs">O habla y se despierta solo.</span>
            </button>
          )}
        </div>
      </main>

      <footer className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        {/* Indicador de audio: decorativo, no refleja el volumen real. */}
        <div aria-hidden className="flex items-end justify-center gap-1 h-6 mb-4">
          {BAR_HEIGHTS.map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${barClass}`}
              style={{
                height: barsActive ? `${h * 2}px` : '3px',
                transition: `height ${150 + i * 20}ms ease-in-out`,
              }}
            />
          ))}
        </div>

        <div className="flex items-center justify-end gap-2">
          {isListening && (
            <button
              type="button"
              onClick={onTest}
              className="min-h-11 px-3 text-xs text-yellow-400 border border-yellow-400/30 rounded-full hover:bg-yellow-400/10 transition-colors"
            >
              Probar si me escucha
            </button>
          )}
          <button
            type="button"
            onClick={onExitVoice}
            className="min-h-11 flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold px-4 rounded-full transition-colors"
          >
            <X className="w-4 h-4" aria-hidden />
            Volver al texto
          </button>
        </div>
      </footer>
    </>
  );
};
