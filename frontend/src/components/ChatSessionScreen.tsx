/**
 * Pantalla de conversación con Sous: chat de texto o voz manos libres, según
 * `session.voiceMode`, con una sola confirmación para terminar.
 *
 * En móvil el chat ocupa toda la pantalla: sin la barra de la app queda altura
 * para leer la receta con el teclado abierto.
 */
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, ChefHat, RotateCw } from 'lucide-react';
import type { CookingChatSession } from '../hooks/useCookingChatSession';
import { useVisualViewport } from '../hooks/useVisualViewport';
import { ChatBubble, ChatMessage } from './ChatMessage';
import { ChatInputBar } from './ChatInputBar';
import { QuickReplies } from './QuickReplies';
import { VoiceSessionView } from './VoiceSessionView';
import { ConfirmDialog } from './ui/Dialog';

interface ChatSessionScreenProps {
  session: CookingChatSession;
  /** Encabezado del chat y de la pantalla de voz. */
  title: string;
  subtitle?: ReactNode;
  onBack: () => void;
  backLabel: string;
  /** Qué se borra al terminar; cada módulo borra cosas distintas. */
  endDescription: string;
  /** Se llama después de `session.end()` para que el módulo limpie su estado. */
  onEnd?: () => void;
  /** Contenido fijo entre el encabezado y los mensajes. */
  extraTop?: ReactNode;
}

export const ChatSessionScreen = ({
  session, title, subtitle, onBack, backLabel, endDescription, onEnd, extraTop,
}: ChatSessionScreenProps) => {
  const { messages, isLoading, send, voiceView, voiceMode } = session;
  const [confirmEnd, setConfirmEnd] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const { height: viewportHeight, offsetTop, keyboardOpen } = useVisualViewport();

  const scrollToEnd = (smooth: boolean) => {
    const log = logRef.current;
    log?.scrollTo({ top: log.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToEnd(true);
  }, [messages, voiceMode]);

  // Al abrir o cerrar el teclado cambia el alto del chat: el último mensaje
  // tiene que seguir a la vista, y sin animación para no pelear con el teclado.
  useEffect(() => {
    scrollToEnd(false);
  }, [viewportHeight, keyboardOpen]);

  const confirmDialog = confirmEnd && (
    <ConfirmDialog
      tone={voiceMode ? 'dark' : 'light'}
      title="¿Terminar la sesión?"
      description={endDescription}
      confirmLabel="Terminar"
      destructive
      onCancel={() => setConfirmEnd(false)}
      onConfirm={() => {
        setConfirmEnd(false);
        session.end();
        onEnd?.();
      }}
    />
  );

  if (voiceMode) {
    return (
      <>
        <VoiceSessionView
          title={title}
          voiceState={voiceView.voiceState}
          transcript={voiceView.transcript}
          currentChefText={voiceView.currentChefText}
          voiceError={voiceView.voiceError}
          silenceSeconds={voiceView.silenceSeconds}
          onRetry={session.startVoice}
          onWakeUp={voiceView.wakeUp}
          onTest={voiceView.test}
          onExitVoice={session.exitVoice}
          onRequestEnd={() => setConfirmEnd(true)}
        />
        {confirmDialog}
      </>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] h-dvh md:static md:z-auto md:h-full flex flex-col bg-neutral-50"
      // Con el teclado abierto la pantalla ya no mide `100dvh`: el chat se
      // ajusta a lo que queda visible y se mueve con el viewport (iOS).
      style={keyboardOpen && viewportHeight
        ? { height: viewportHeight, transform: `translateY(${offsetTop}px)` }
        : undefined}
    >
      <header className="flex items-center gap-2.5 px-3 pt-[env(safe-area-inset-top)] min-h-[68px] bg-white border-b-2 border-neutral-200 flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label={backLabel}
          className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-[14px] border-2 border-neutral-200 hover:bg-neutral-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-ink" strokeWidth={2.4} aria-hidden />
        </button>
        <span className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 shadow-[0_3px_0_theme(colors.orange.800)]" aria-hidden><ChefHat className="text-white w-5 h-5" strokeWidth={2.4} /></span>
        <div className="flex-1 min-w-0 py-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <h1 className="text-[17px] font-black text-ink leading-tight truncate font-sans tracking-normal">{title}</h1>
            <span
              aria-hidden
              className={`w-2 h-2 rounded-full flex-shrink-0 ${isLoading ? 'bg-amber-500 motion-safe:animate-pulse' : 'bg-emerald-600'}`}
            />
          </div>
          {subtitle && (
            <p className="text-[13px] font-bold text-neutral-500 leading-tight truncate">{subtitle}</p>
          )}
        </div>
        {/* Píldora roja de terminar: va en el encabezado para no tapar mensajes ni la barra de entrada. */}
        <button
          type="button"
          onClick={() => setConfirmEnd(true)}
          className="min-h-11 flex-shrink-0 flex items-center bg-white border-2 border-red-200 hover:bg-red-50 text-red-700 text-sm font-black px-3.5 rounded-full transition-colors"
        >
          Terminar sesión
        </button>
      </header>

      {extraTop}

      <div
        ref={logRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label="Conversación con Sous"
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-3.5"
      >
        {messages.length === 0 && !isLoading && (
          <div className="text-center mt-10 px-4">
            <div className="text-4xl mb-3" aria-hidden>👨‍🍳</div>
            <p className="text-sm font-medium text-neutral-600">
              Escríbele a Sous o toca el micrófono para hablar con las manos libres.
            </p>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className="space-y-1.5">
            <ChatBubble isChef={msg.agent === 'chef'}>
              <ChatMessage text={msg.text} isChef={msg.agent === 'chef'} />
            </ChatBubble>
            {/* Solo en el último: reintentar uno de en medio dejaría la
                conversación descolocada. */}
            {msg.failed && idx === messages.length - 1 && !isLoading && (
              <button
                type="button"
                onClick={session.retry}
                className="min-h-11 flex items-center gap-2 px-4 border-2 border-orange-200 bg-white hover:bg-orange-50 active:translate-y-[2px] text-orange-700 text-sm font-black rounded-full shadow-[0_3px_0_theme(colors.orange.200)] transition-colors"
              >
                <RotateCw className="w-4 h-4" strokeWidth={2.6} aria-hidden />
                Reintentar
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Con el teclado abierto estorban: se llevan dos filas de la poca
          conversación que queda visible. Vuelven al cerrarlo. */}
      {!keyboardOpen && <QuickReplies onSend={send} loading={isLoading} />}
      <ChatInputBar onSend={send} isLoading={isLoading} onStartVoice={session.startVoice} />

      {confirmDialog}
    </div>
  );
};
