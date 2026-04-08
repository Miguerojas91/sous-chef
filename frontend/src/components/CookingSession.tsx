import React, { useEffect, useRef, useState } from 'react';
import { useGeminiChat } from '../hooks/useGeminiChat';
import { useGeminiLive } from '../hooks/useGeminiLive';
import { buildCookingSystemPrompt } from '../services/gemini';
import type { CookingIntent } from '../services/gemini';
import { Mic, ChefHat, Send, X, ArrowLeft, Clock, Utensils, Sparkles, RefreshCw } from 'lucide-react';

// ── Persistencia de la sesión activa ─────────────────────────────────────────

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

// ── Tipos ─────────────────────────────────────────────────────────────────────

type Phase = 'landing' | 'discover-sub' | 'time-picker' | 'chatting';

const TIME_OPTIONS = [
  { label: '15 min', value: '15 minutos', emoji: '⚡' },
  { label: '30 min', value: '30 minutos', emoji: '🕐' },
  { label: '45 min', value: '45 minutos', emoji: '🕑' },
  { label: '1 hora', value: '1 hora', emoji: '🕒' },
  { label: 'Sin prisa', value: 'más de 1 hora (sin prisa)', emoji: '☕' },
];

// ── Sub-componente: chat activo ───────────────────────────────────────────────

const CookingChat: React.FC<{
  intent: CookingIntent;
  timeAvailable: string;
  onReset: () => void;
}> = ({ intent, timeAvailable, onReset }) => {
  const textPrompt  = buildCookingSystemPrompt(intent, timeAvailable, 'text');
  const voicePrompt = buildCookingSystemPrompt(intent, timeAvailable, 'voice');

  const { isLoading, messages, sendMessage, clearMessages } = useGeminiChat({
    mode: 'cooking',
    storageKey: CHAT_STORAGE_KEY,
    systemPrompt: textPrompt,
  });
  const { voiceState, transcript, currentChefText, voiceError, silenceSeconds, startListening, disconnect, sendTextToVoice, wakeUp } = useGeminiLive(voicePrompt);

  const [inputText, setInputText] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const textBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { textBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Auto-mensaje inicial solo en sesión nueva (sin historial previo)
  useEffect(() => {
    if (messages.length > 0) return;
    const intentMsg: Record<CookingIntent, string> = {
      'discover-known':    `Hola Sous, tengo ${timeAvailable} disponibles y ya sé lo que quiero cocinar hoy. ¡Ayúdame a prepararlo!`,
      'discover-together': `Hola Sous, tengo ${timeAvailable} disponibles pero no sé qué cocinar. ¡Descubramos juntos qué preparar!`,
      'cook-ingredients':  `Hola Sous, tengo ${timeAvailable} disponibles y quiero cocinar con los ingredientes que tengo en casa. ¿Qué podemos hacer?`,
    };
    const msg = intentMsg[intent];
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      sendMessage(msg);
    }, 50);
    return () => { cancelled = true; clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleReset = () => {
    disconnect();
    clearMessages();
    onReset();
  };

  const handleStartVoice = async () => {
    setVoiceMode(true);
    // startListening usa voiceStateRef internamente — no hay stale closure
    await startListening();
  };

  const handleEndVoice = () => {
    disconnect();
    setVoiceMode(false);
  };

  const intentLabel: Record<CookingIntent, string> = {
    'discover-known':    'Sé qué quiero cocinar',
    'discover-together': 'Descubriendo juntos',
    'cook-ingredients':  'Con lo que tengo',
  };

  // ── Modo voz: pantalla manos libres ──
  if (voiceMode) {
    const isConnecting    = voiceState === 'connecting';
    const isSpeaking      = voiceState === 'speaking';
    const isListening     = voiceState === 'listening';
    const isReconnecting  = voiceState === 'reconnecting';
    const needsTap        = voiceState === 'needs-tap';
    const isSleeping      = voiceState === 'sleeping';
    const silenceLeft     = Math.max(0, 30 - silenceSeconds);

    return (
      <div className="flex flex-col h-full bg-neutral-950 overflow-hidden">

        {/* Zona central: lo que Sous está diciendo */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-0">

          {/* Avatar animado */}
          <div className="relative mb-6">
            {/* Anillos de onda */}
            {isSpeaking && (
              <>
                <span className="absolute inset-[-16px] rounded-full border-2 border-orange-500/30 animate-ping" />
                <span className="absolute inset-[-8px] rounded-full border-2 border-orange-500/50 animate-pulse" />
              </>
            )}
            {isListening && (
              <span className="absolute inset-[-8px] rounded-full border-2 border-green-500/40 animate-pulse" />
            )}
            {isReconnecting && (
              <span className="absolute inset-[-8px] rounded-full border-2 border-yellow-500/40 animate-ping" />
            )}
            {/* Cuenta atrás visual: arco que se va vaciando al acercarse al sleep */}
            {isListening && silenceSeconds > 10 && (
              <span className="absolute inset-[-12px] rounded-full border-2 border-neutral-600/60 animate-pulse" />
            )}
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-colors duration-500 ${
              isSpeaking     ? 'bg-orange-500/20 ring-2 ring-orange-500/50' :
              isListening    ? 'bg-green-500/10 ring-2 ring-green-500/30' :
              isReconnecting ? 'bg-yellow-500/10 ring-2 ring-yellow-500/30' :
              needsTap       ? 'bg-blue-500/10 ring-2 ring-blue-500/30' :
              isSleeping     ? 'bg-neutral-800/50 ring-2 ring-neutral-700/30' :
              'bg-neutral-800'
            }`}>
              {isSleeping ? '😴' : '👨‍🍳'}
            </div>
          </div>

          {/* Error de micrófono */}
          {voiceError && (
            <div className="mb-3 px-4 py-2.5 bg-red-500/20 border border-red-500/40 rounded-2xl max-w-xs text-center">
              <p className="text-red-300 text-sm font-medium">{voiceError}</p>
              <button
                onClick={handleStartVoice}
                className="mt-2 text-xs text-red-400 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Estado */}
          {!voiceError && (
            <p className={`text-xs font-bold uppercase tracking-widest mb-1 transition-colors duration-300 ${
              isSpeaking     ? 'text-orange-400' :
              isListening    ? (silenceSeconds > 10 ? 'text-neutral-500' : 'text-green-400') :
              isReconnecting ? 'text-yellow-400 animate-pulse' :
              needsTap       ? 'text-blue-400 animate-pulse' :
              isSleeping     ? 'text-neutral-600' :
              isConnecting   ? 'text-yellow-400 animate-pulse' : 'text-neutral-500'
            }`}>
              {isConnecting    && 'Conectando con Sous…'}
              {isListening     && (silenceSeconds > 10 ? `Sous descansará en ${silenceLeft}s sin voz` : 'Escuchando · habla cuando quieras')}
              {isSpeaking      && 'Sous está hablando'}
              {isReconnecting  && 'Reconectando…'}
              {needsTap        && 'Toca para continuar la conversación'}
              {isSleeping      && 'Sous está descansando · di algo para despertar'}
            </p>
          )}

          {/* Subtítulo en tiempo real de lo que dice Sous */}
          <div className="w-full max-w-sm min-h-[80px] flex items-center justify-center">
            {(currentChefText || (transcript.length > 0 && !isSpeaking)) && (
              <p className={`text-center text-base leading-relaxed transition-all duration-300 ${
                isSpeaking ? 'text-white' : 'text-neutral-400'
              }`}>
                {isSpeaking
                  ? currentChefText
                  : transcript[transcript.length - 1]?.agent === 'chef'
                    ? transcript[transcript.length - 1].text
                    : ''
                }
              </p>
            )}
            {!currentChefText && transcript.length === 0 && isListening && (
              <p className="text-neutral-600 text-sm text-center">
                Puedes hablar, hacer preguntas o simplemente cocinar en silencio. Sous está contigo.
              </p>
            )}
            {needsTap && (
              <button
                onClick={handleStartVoice}
                className="mt-2 flex flex-col items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 rounded-2xl px-8 py-4 transition-colors"
              >
                <span className="text-3xl">🎙️</span>
                <span className="text-blue-300 text-sm font-semibold">Continuar conversación</span>
                <span className="text-blue-400/70 text-xs">La pantalla se bloqueó y el micrófono se detuvo</span>
              </button>
            )}
            {isSleeping && (
              <button
                onClick={wakeUp}
                className="mt-2 flex flex-col items-center gap-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-2xl px-8 py-4 transition-colors"
              >
                <span className="text-3xl">👆</span>
                <span className="text-neutral-300 text-sm font-semibold">Despertar a Sous</span>
                <span className="text-neutral-500 text-xs">O simplemente habla, te estoy escuchando</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra inferior */}
        <div className="flex-shrink-0 bg-neutral-900 border-t border-neutral-800 px-6 py-4">
          {/* Indicador de audio — barras animadas */}
          <div className="flex items-end justify-center gap-1 h-6 mb-4">
            {[2, 4, 7, 5, 8, 4, 3, 6, 4, 2].map((h, i) => (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-200 ${
                  isSpeaking     ? 'bg-orange-400' :
                  isListening    ? 'bg-green-500' :
                  isReconnecting ? 'bg-yellow-500' :
                  isSleeping     ? 'bg-neutral-800' : 'bg-neutral-700'
                }`}
                style={{
                  height: (isSpeaking || isListening || isReconnecting) ? `${h * 2}px` : '3px',
                  animationDelay: `${i * 60}ms`,
                  transition: `height ${150 + i * 20}ms ease-in-out`,
                }}
              />
            ))}
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleReset}
              className="text-xs text-neutral-500 hover:text-red-400 transition-colors px-3 py-2 rounded-xl hover:bg-neutral-800"
            >
              Terminar sesión
            </button>

            <div className="flex items-center gap-2">
              {/* Botón de prueba — envía texto para verificar que la sesión responde */}
              {isListening && (
                <button
                  onClick={() => sendTextToVoice('Hola Sous, ¿me escuchas?')}
                  className="text-xs text-yellow-400 border border-yellow-400/30 px-3 py-2 rounded-full hover:bg-yellow-400/10 transition-colors"
                >
                  Probar
                </button>
              )}
              <button
                onClick={handleEndVoice}
                className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-sm font-semibold px-4 py-2.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Modo texto ──
  return (
    <div className="flex flex-col h-full bg-neutral-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="text-orange-500 w-4 h-4" />
          <div>
            <span className="text-sm font-bold text-neutral-700 block leading-tight">Chef Sous</span>
            <span className="text-[10px] text-neutral-400 leading-tight">{intentLabel[intent]} · {timeAvailable}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleReset} title="Terminar sesión" className="flex items-center gap-1 text-xs text-neutral-400 hover:text-red-500 transition-colors px-2 py-1 rounded-full hover:bg-red-50">
            <RefreshCw className="w-3 h-3" />
            Terminar sesión
          </button>
        </div>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-0">
        {messages.length === 0 && !isLoading && (
          <div className="text-center mt-10 px-4">
            <div className="text-4xl mb-3">👨‍🍳</div>
            <p className="text-sm font-medium text-neutral-600">Sous está listo para acompañarte.</p>
            <p className="text-xs mt-1 text-neutral-400">Escríbele o activa la conversación de voz para tener las manos libres.</p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.agent === 'chef' ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
              msg.agent === 'chef'
                ? 'bg-white border border-neutral-100 text-neutral-800 rounded-tl-none'
                : 'bg-orange-500 text-white rounded-tr-none'
            }`}>
              {msg.text || (
                <span className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]"/>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]"/>
                  <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]"/>
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={textBottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-2.5 bg-white border-t border-neutral-100">
        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-2xl px-2 py-1.5">
          <button onClick={handleStartVoice} title="Hablar con Sous (manos libres)" className="p-1.5 bg-red-500 hover:bg-red-600 transition-colors rounded-full text-white flex-shrink-0">
            <Mic className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isLoading ? 'Sous está respondiendo…' : 'Escribe tu pregunta…'}
            disabled={isLoading}
            className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-700 placeholder:text-neutral-400 min-w-0 disabled:opacity-60"
          />
          <button onClick={handleSend} disabled={isLoading || !inputText.trim()} className="p-1.5 bg-orange-500 hover:bg-orange-600 rounded-full text-white flex-shrink-0 transition-colors disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ──────────────────────────────────────────────────────

export const CookingSession: React.FC = () => {
  // Revisar si hay sesión activa guardada
  const [phase, setPhase] = useState<Phase>(() => {
    const meta = loadMeta();
    const hasMessages = !!localStorage.getItem(CHAT_STORAGE_KEY);
    return (meta && hasMessages) ? 'chatting' : 'landing';
  });
  const [intent, setIntent] = useState<CookingIntent | null>(() => loadMeta()?.intent ?? null);
  const [timeAvailable, setTimeAvailable] = useState<string | null>(() => loadMeta()?.timeAvailable ?? null);
  // Guardamos el intent temporalmente mientras el usuario elige el tiempo
  const pendingIntentRef = useRef<CookingIntent | null>(null);

  const selectIntent = (i: CookingIntent) => {
    pendingIntentRef.current = i;
    setPhase('time-picker');
  };

  const selectTime = (time: string) => {
    const i = pendingIntentRef.current!;
    setIntent(i);
    setTimeAvailable(time);
    saveMeta({ intent: i, timeAvailable: time });
    setPhase('chatting');
  };

  const handleReset = () => {
    clearSession();
    setIntent(null);
    setTimeAvailable(null);
    pendingIntentRef.current = null;
    setPhase('landing');
  };

  // ── Pantalla: chatting ──
  if (phase === 'chatting' && intent && timeAvailable) {
    return <CookingChat intent={intent} timeAvailable={timeAvailable} onReset={handleReset} />;
  }

  // ── Pantalla: selector de tiempo ──
  if (phase === 'time-picker') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="flex items-center px-4 py-2.5 border-b border-orange-100 bg-white/60 flex-shrink-0">
          <button onClick={() => setPhase(pendingIntentRef.current === 'cook-ingredients' ? 'landing' : 'discover-sub')} className="p-1.5 rounded-full hover:bg-orange-100 transition-colors mr-2">
            <ArrowLeft className="w-4 h-4 text-orange-600" />
          </button>
          <span className="text-sm font-bold text-neutral-700">Antes de empezar…</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3">
          <div className="text-center mb-1">
            <Clock className="w-7 h-7 text-orange-400 mx-auto mb-2" />
            <h2 className="text-lg font-extrabold text-neutral-800 mb-0.5">¿Cuánto tiempo tienes?</h2>
            <p className="text-xs text-neutral-500">Sous ajustará las recetas a tu disponibilidad.</p>
          </div>

          <div className="flex flex-col gap-2 w-full max-w-sm">
            {TIME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => selectTime(opt.value)}
                className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 shadow-sm border border-orange-100 hover:border-orange-300 hover:shadow-md transition-all text-left active:scale-[0.98]"
              >
                <span className="text-xl">{opt.emoji}</span>
                <span className="text-sm font-semibold text-neutral-800">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Pantalla: sub-menú "descubrir" ──
  if (phase === 'discover-sub') {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-rose-50">
        <div className="flex items-center px-4 py-2.5 border-b border-orange-100 bg-white/60 flex-shrink-0">
          <button onClick={() => setPhase('landing')} className="p-1.5 rounded-full hover:bg-orange-100 transition-colors mr-2">
            <ArrowLeft className="w-4 h-4 text-orange-600" />
          </button>
          <span className="text-sm font-bold text-neutral-700">¿Qué quieres comer?</span>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-5 gap-3">
          <div className="text-center mb-1">
            <span className="text-3xl">🍽️</span>
            <p className="text-xs text-neutral-500 mt-2 max-w-xs">Cuéntame un poco más para que Sous te acompañe mejor.</p>
          </div>

          <button
            onClick={() => selectIntent('discover-known')}
            className="w-full max-w-sm bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-4 text-left shadow-md hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Sé de qué tengo ganas</h3>
                <p className="text-xs text-white/75 mt-0.5">Ya tengo algo en mente, ayúdame a prepararlo.</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectIntent('discover-together')}
            className="w-full max-w-sm bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-4 text-left shadow-md hover:shadow-xl hover:scale-[1.02] transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="text-sm font-extrabold text-white">Descubrámoslo juntos</h3>
                <p className="text-xs text-white/75 mt-0.5">No sé qué cocinar, ayúdame a decidir.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ── Pantalla: landing principal ──
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-evenly px-5 py-4 min-h-0">
        {/* Header */}
        <div className="text-center">
          <span className="text-3xl">👨‍🍳</span>
          <h1 className="text-lg font-extrabold text-neutral-800 mt-1 tracking-tight">¿Qué cocinamos hoy?</h1>
          <p className="text-xs text-neutral-500 mt-0.5">Tu sous chef personal está listo para acompañarte.</p>
        </div>

        {/* Botones */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          {/* Botón 1 */}
          <button
            onClick={() => setPhase('discover-sub')}
            className="w-full bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2 flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white leading-tight">Quiero descubrir qué comer</h2>
                <p className="text-xs text-white/75 mt-0.5">No sé bien qué me apetece, que Sous me inspire.</p>
              </div>
            </div>
          </button>

          {/* Botón 2 */}
          <button
            onClick={() => selectIntent('cook-ingredients')}
            className="w-full bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-4 text-left shadow-lg active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white/20 rounded-xl p-2 flex-shrink-0">
                <Utensils className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-white leading-tight">Voy a cocinar con lo que tengo</h2>
                <p className="text-xs text-white/75 mt-0.5">Tengo cosas en casa y no quiero salir a comprar.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
